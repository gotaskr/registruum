import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const rateWindowMs = 60_000;
const rateMaxPerWindow = 45;
const rateBuckets = new Map<string, number[]>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function allowRate(ip: string) {
  const now = Date.now();
  const windowStart = now - rateWindowMs;
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= rateMaxPerWindow) {
    return false;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();

  if (!email || email.length > 320) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json({ verified: false }, { status: 429 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("email_verification_status", {
      p_email: email,
    });

    if (error) {
      return NextResponse.json({ verified: false });
    }

    return NextResponse.json({ verified: Boolean(data) });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
