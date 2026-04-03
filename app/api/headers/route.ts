import { NextResponse } from "next/server";
import { fetchSecurityHeaders } from "@/lib/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400 },
    );
  }

  try {
    const headers = await fetchSecurityHeaders(domain);
    return NextResponse.json({ headers });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch security headers" },
      { status: 500 },
    );
  }
}
