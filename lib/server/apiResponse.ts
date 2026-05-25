import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function jsonError(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  return NextResponse.json({ error: message, code } satisfies ApiErrorBody, {
    status,
  });
}
