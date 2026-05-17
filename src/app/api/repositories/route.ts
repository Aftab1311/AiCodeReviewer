import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(3),
  githubRepoId: z.string().min(1),
  teamId: z.string().min(1).optional(),
  installationId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repos = await prisma.repository.findMany({
    where: { ownerId: session.user.id },
    include: { pullRequests: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ repos });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid repository payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    let teamId = data.teamId;
    if (!teamId) {
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        select: { teamId: true },
      });
      if (existingMembership) {
        teamId = existingMembership.teamId;
      } else {
        const personalTeam = await prisma.team.create({
          data: {
            name: "Personal Workspace",
            slug: `personal-${session.user.id.slice(0, 8)}`,
            members: { create: { userId: session.user.id, role: "ADMIN" } },
          },
        });
        teamId = personalTeam.id;
      }
    }

    const repo = await prisma.repository.create({
      data: {
        fullName: data.fullName,
        githubRepoId: data.githubRepoId,
        installationId: data.installationId,
        teamId,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ repo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 });
  }
}
