import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { formatMoney } from "@/lib/format";
import { readLinkSale, verifySale } from "@/lib/orders/sale-link";
import { getCheckoutProduct } from "@/lib/products/queries";

// Public page: no sign-in. Product, price and stock are read per request.
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/checkout/[id]">): Promise<Metadata> {
  const product = await getCheckoutProduct((await params).id);
  return {
    title: product
      ? `${product.title} | ${product.tenantName}`
      : "Էջը չի գտնվել",
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps<"/checkout/[id]">) {
  const product = await getCheckoutProduct((await params).id);
  if (!product) notFound();

  // A sale only applies when the link's signature matches; otherwise full price.
  const query = await searchParams;
  const claimed = readLinkSale(query);
  const terms = verifySale(product.id, claimed);
  const sale = terms ? claimed : null;
  // Opaque id of the admin's private note; the note itself stays on the server.
  const ref =
    typeof query.ref === "string" && /^[\w-]{6,32}$/.test(query.ref)
      ? query.ref
      : null;
  // The link may set its own delivery fee (e.g. free delivery); otherwise the product's.
  const deliveryFee = terms?.delivery ?? product.deliveryFee;
  const salePrice =
    sale && sale.percent > 0
      ? Math.round(product.price * (100 - sale.percent)) / 100
      : product.price;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid w-full overflow-hidden rounded-3xl bg-card shadow-soft md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center bg-muted text-muted-foreground md:aspect-auto md:min-h-[32rem]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              priority
              sizes="(min-width: 768px) 448px, 100vw"
              className="object-cover"
            />
          ) : (
            <ImageOff className="size-10" strokeWidth={1.5} aria-hidden />
          )}
        </div>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <header>
            <p className="text-sm text-muted-foreground">
              {product.tenantName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
              {product.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-semibold tabular-nums">
              {formatMoney(salePrice)}
              {sale && sale.percent > 0 && (
                <>
                  <s className="text-lg font-normal text-muted-foreground">
                    {formatMoney(product.price)}
                  </s>
                  <span className="rounded-full bg-apricot px-2.5 py-0.5 text-sm font-semibold text-primary">
                    −{sale.percent}%
                  </span>
                </>
              )}
            </p>
          </header>

          <CheckoutForm
            product={{ ...product, deliveryFee }}
            sale={sale}
            linkRef={ref}
          />
        </div>
      </div>
    </main>
  );
}
