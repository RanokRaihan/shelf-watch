import { ScanBarcode } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function ScanLink() {
  return (
    <Link
      href="/scan"
      className={buttonVariants({
        size: "lg",
        className: "h-16 w-full gap-3 text-lg [&_svg:not([class*='size-'])]:size-6",
      })}
    >
      <ScanBarcode aria-hidden="true" />
      Scan product
    </Link>
  );
}
