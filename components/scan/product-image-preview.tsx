import { X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

export function ProductImagePreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={src}
        alt="Product photo from the product database"
        width={96}
        height={96}
        className="size-24 rounded-lg border bg-muted object-contain"
      />
      <Button type="button" variant="outline" onClick={onRemove} className="h-12 gap-2 text-base">
        <X aria-hidden="true" />
        Remove
      </Button>
    </div>
  );
}
