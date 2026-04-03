import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Phase 1b — tls.connect() cert extraction
  return NextResponse.json({ message: "cert endpoint" });
}
