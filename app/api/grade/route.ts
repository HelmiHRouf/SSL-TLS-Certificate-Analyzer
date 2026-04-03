import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Phase 4b — SSL Labs polling
  return NextResponse.json({ message: "grade endpoint" });
}
