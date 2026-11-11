import "server-only";

import { headers } from "next/headers";

/**
 * The app's public origin, like `https://shelfwatch.app`, for links that
 * leave the browser (printed join QR codes). Uses `APP_URL` when set, which
 * production should do. Otherwise it's taken from the request, so a phone
 * testing over LAN gets a link to the same host it opened.
 */
export async function appOrigin(): Promise<string> {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}
