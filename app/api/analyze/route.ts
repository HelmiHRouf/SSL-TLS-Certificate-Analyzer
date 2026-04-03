import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // TODO: Phase 1b-1e — orchestrate full scan
  return NextResponse.json({ message: "analyze endpoint" });
}
