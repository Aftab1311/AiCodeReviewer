import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST() {
  const repos = await prisma.repository.findMany({ where: { isActive: true }, take: 20 });

  return NextResponse.json({
    ok: true,
    synced: repos.length,
    at: new Date().toISOString(),
  });
}
