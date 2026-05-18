import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const { name, email } = parsed.data;

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (emailOwner && emailOwner.id !== session.user.id) {
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user: updatedUser });
}
