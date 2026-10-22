import Link from "next/link";
import { Search, X } from "lucide-react";

/**
 * Search the catalog by name. A plain GET form, so the query lives in the
 * URL and a new search always starts from the first page.
 */
export function CatalogSearch({
  search,
  placeholder,
}: {
  search: string;
  placeholder: string;
}) {
  return (
    <form
      action="/catalog"
      role="search"
      className="flex h-11 w-full max-w-xl min-w-64 flex-1 items-center rounded-2xl border border-input bg-card pl-3 shadow-soft transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 sm:w-auto dark:bg-input/30"
    >
      <label htmlFor="catalog-search" className="sr-only">
        Որոնել անունով
      </label>
      <input
        id="catalog-search"
        name="q"
        type="search"
        defaultValue={search}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {search && (
        <Link
          href="/catalog"
          aria-label="Մաքրել որոնումը"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </Link>
      )}
      <button
        type="submit"
        aria-label="Որոնել"
        className="mx-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
