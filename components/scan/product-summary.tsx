type ProductSummaryProps = {
  name: string;
  brand: string | null;
  size: string | null;
  barcodeValue: string;
};

export function ProductSummary({ name, brand, size, barcodeValue }: ProductSummaryProps) {
  const details = [brand, size].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2">
      <p className="text-base font-medium break-words">{name}</p>
      {details && <p className="text-sm text-muted-foreground break-words">{details}</p>}
      <p className="font-mono text-sm tracking-wider text-muted-foreground">{barcodeValue}</p>
    </div>
  );
}
