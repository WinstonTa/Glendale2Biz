import { NextResponse } from "next/server";
import { apiError, handleSiteCheck } from "@/lib/gis/siteCheck";
import { getProvider } from "@/lib/gis/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const r = apiError("BAD_REQUEST", "Request body must be JSON.");
    return NextResponse.json(r.body, { status: r.status });
  }
  const result = await handleSiteCheck(body, { provider: getProvider() });
  return NextResponse.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
}
