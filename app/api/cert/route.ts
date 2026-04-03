import { NextResponse } from "next/server";
import { fetchCertChain } from "@/lib/tls";

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
    const chain = await fetchCertChain(domain);
    return NextResponse.json({ chain });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch certificate chain" },
      { status: 500 },
    );
  }
}
