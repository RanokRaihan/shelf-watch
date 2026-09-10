import { BarcodeScanner } from "@/components/barcode-scanner";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-4">
      <BarcodeScanner />
    </main>
  );
}
