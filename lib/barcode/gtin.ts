// Pure barcode helpers, safe on the client and the server.

export const BARCODE_FORMATS = ["UPC_A", "UPC_E", "EAN_13", "EAN_8"] as const;
export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

const FORMAT_LENGTH: Record<BarcodeFormat, number> = {
  UPC_A: 12,
  UPC_E: 8,
  EAN_13: 13,
  EAN_8: 8,
};

export type ParsedBarcode = {
  gtin: string;
  barcodeFormat: BarcodeFormat;
  barcodeValue: string;
};

export type BarcodeProblem = "not-digits" | "wrong-length" | "bad-check-digit";

export type BarcodeParseResult =
  | { ok: true; barcode: ParsedBarcode }
  | { ok: false; problem: BarcodeProblem };

export const BARCODE_PROBLEM_MESSAGES: Record<BarcodeProblem, string> = {
  "not-digits": "Use digits only",
  "wrong-length": "A barcode number has 8, 12 or 13 digits",
  "bad-check-digit": "That number doesn't add up. Check it for a typo.",
};

// GS1 mod-10: weights 3,1,3,… from the digit left of the check digit.
function checkDigitFor(body: string): number {
  let sum = 0;
  for (let index = 0; index < body.length; index++) {
    const digit = Number(body[body.length - 1 - index]);
    sum += index % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

function hasValidCheckDigit(digits: string): boolean {
  return checkDigitFor(digits.slice(0, -1)) === Number(digits.at(-1));
}

// UPC-E drops zeros from a UPC-A; the last body digit says where they were.
function expandUpcE(upcE: string): string {
  const numberSystem = upcE[0];
  const [d1, d2, d3, d4, d5, d6] = upcE.slice(1, 7);
  const check = upcE[7];
  let body: string;
  if (d6 === "0" || d6 === "1" || d6 === "2") body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  else if (d6 === "3") body = `${d1}${d2}${d3}00000${d4}${d5}`;
  else if (d6 === "4") body = `${d1}${d2}${d3}${d4}00000${d5}`;
  else body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  return `${numberSystem}${body}${check}`;
}

function toGtin14(digits: string, format: BarcodeFormat): string {
  const full = format === "UPC_E" ? expandUpcE(digits) : digits;
  return full.padStart(14, "0");
}

function isUpcE(digits: string): boolean {
  return (
    digits.length === 8 &&
    (digits[0] === "0" || digits[0] === "1") &&
    hasValidCheckDigit(expandUpcE(digits))
  );
}

// Typed numbers carry no format. US stores see UPC-E far more than EAN-8, so it wins a tie.
function inferFormat(digits: string): BarcodeFormat | null {
  if (digits.length === 12) return "UPC_A";
  if (digits.length === 13) return "EAN_13";
  if (digits.length === 8) return isUpcE(digits) ? "UPC_E" : "EAN_8";
  return null;
}

export function parseBarcode(raw: string, format?: BarcodeFormat): BarcodeParseResult {
  const digits = raw.trim();
  if (!/^\d+$/.test(digits)) return { ok: false, problem: "not-digits" };

  const barcodeFormat = format ?? inferFormat(digits);
  if (!barcodeFormat || digits.length !== FORMAT_LENGTH[barcodeFormat]) {
    return { ok: false, problem: "wrong-length" };
  }

  const valid = barcodeFormat === "UPC_E" ? isUpcE(digits) : hasValidCheckDigit(digits);
  if (!valid) return { ok: false, problem: "bad-check-digit" };

  return {
    ok: true,
    barcode: { gtin: toGtin14(digits, barcodeFormat), barcodeFormat, barcodeValue: digits },
  };
}

export function isValidGtin14(value: string): boolean {
  return /^\d{14}$/.test(value) && hasValidCheckDigit(value);
}
