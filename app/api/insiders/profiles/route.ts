import { NextRequest } from "next/server";
import {
  listInsiderProfiles,
  searchInsiderProfiles,
} from "@/lib/server/insidersCache";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "12", 10);
  try {
    const items = q
      ? await searchInsiderProfiles(q, limit)
      : await listInsiderProfiles();
    return jsonOk({ items });
  } catch {
    return jsonError("insider profiles fetch failed", 500);
  }
}
