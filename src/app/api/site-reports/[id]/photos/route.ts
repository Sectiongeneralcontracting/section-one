import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  url: z.string().min(1), // data URL (base64)
  caption: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await prisma.siteDailyReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });

  const photo = await prisma.sitePhoto.create({
    data: { reportId: params.id, url: parsed.data.url, caption: parsed.data.caption },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_PHOTO_ADDED",
    entityType: "SitePhoto",
    entityId: photo.id,
    after: { reportId: params.id, caption: photo.caption },
  });

  return NextResponse.json(photo, { status: 201 });
}
