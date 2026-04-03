import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Phase 1c — security header check
  return NextResponse.json({ message: "headers endpoint" });
}
