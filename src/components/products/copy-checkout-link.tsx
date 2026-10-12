"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyCheckoutLink({ productId }: { productId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/checkout/${productId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; let the user copy it by hand.
      window.prompt("Պատճենեք հղումը", url);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <LinkIcon />}
        {copied ? "Պատճենվեց" : "Պատճենել հղումը"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Հղումը պատճենվեց" : ""}
      </span>
    </>
  );
}
