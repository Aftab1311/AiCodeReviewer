import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().cuid(),
  role: z.enum(["ADMIN", "DEVELOPER", "VIEWER"]).default("DEVELOPER"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = inviteSchema.parse(await req.json());
  const requesterMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, teamId: payload.teamId },
  });

  if (!requesterMembership || requesterMembership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let invitedUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!invitedUser) {
    invitedUser = await prisma.user.create({ data: { email: payload.email, name: payload.email.split("@")[0] } });
  }

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: invitedUser.id, teamId: payload.teamId } },
    update: { role: payload.role },
    create: { userId: invitedUser.id, teamId: payload.teamId, role: payload.role },
  });

  await prisma.notification.create({
    data: {
      userId: invitedUser.id,
      title: "You were invited to a CodePilot workspace",
      body: `Role: ${payload.role}`,
      type: "team_invite",
    },
  });

  return NextResponse.json({ success: true });
}
