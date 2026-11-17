import { CalendarPlus } from "lucide-react";

import { ProductSummary } from "@/components/scan/product-summary";
import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format/calendar-day";
import type { StoreProductDetails } from "@/lib/products/products";
import type { PendingPullItem } from "@/lib/pulls/pull-items";

type AlreadyTrackedScreenProps = {
  product: StoreProductDetails;
  barcodeValue: string;
  pendingItems: PendingPullItem[];
  onCancel: () => void;
  onAddDate: () => void;
};

export function AlreadyTrackedScreen({
  product,
  barcodeValue,
  pendingItems,
  onCancel,
  onAddDate,
}: AlreadyTrackedScreenProps) {
  return (
    <ScanScreen
      title="Already tracked"
      description="This product already has pull dates waiting."
      actions={
        <>
          <Button onClick={onAddDate} className={SCREEN_BUTTON_CLASS}>
            <CalendarPlus aria-hidden="true" />
            Add another date
          </Button>
          <Button variant="outline" onClick={onCancel} className={SCREEN_BUTTON_CLASS}>
            Cancel
          </Button>
        </>
      }
    >
      <ProductSummary
        name={product.name}
        brand={product.brand}
        size={product.size}
        barcodeValue={barcodeValue}
      />
      <ul className="flex flex-col divide-y rounded-lg border">
        {pendingItems.map((item) => (
          <li key={item.id} className="grid grid-cols-2 gap-2 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-base">
                {item.expiryDate ? formatDay(item.expiryDate) : "Not set"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Pull on</span>
              <span className="text-base font-medium">{formatDay(item.pullDate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </ScanScreen>
  );
}
