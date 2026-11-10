import "server-only";

import QRCode from "qrcode";

/**
 * A QR code as an SVG string, rendered on the server (no client JS).
 * Error correction M and a 4-module quiet zone, so phone cameras read it
 * reliably from arm's length and on paper. The SVG has a viewBox but no
 * width, so it fills its container. Always dark on light: some scanners
 * can't read an inverted code, so it doesn't follow dark mode.
 */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
  });
}
