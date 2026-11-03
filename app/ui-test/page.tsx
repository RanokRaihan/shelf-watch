// Temporary page for checking touch sizes on a phone. Delete when done.
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const sizes = ["sm", "default", "lg"] as const;

export default function UiTest() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">UI test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Should be 48px tall, 16px text.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" inputMode="numeric" placeholder="Scan or type a barcode" />
        </CardContent>
      </Card>

      {variants.map((variant) => (
        <Card key={variant}>
          <CardHeader>
            <CardTitle>{variant}</CardTitle>
            <CardDescription>sm (40px) · default (48px) · lg (56px)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sizes.map((size) => (
              <Button key={size} variant={variant} size={size} className="w-full">
                {variant} / {size}
              </Button>
            ))}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
