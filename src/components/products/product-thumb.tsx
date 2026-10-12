import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground">
      {src ? (
        <Image src={src} alt={alt} fill sizes="44px" className="object-cover" />
      ) : (
        <ImageOff className="size-4" aria-hidden />
      )}
    </span>
  );
}
