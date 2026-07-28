import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { distributeExpenseAcrossOpenProjects } from "@/lib/expense-distribution";

const schema = z.object({
  category: z.enum([
    "OFFICE_RENT",
    "TRANSPORTATION",
    "WATER",
    "ELECTRICITY",
    "PHONE",
    "EMAIL_INTERNET",
    "BUFFET",
    "OTHER",
  ]),
  amount: z.number().positive(),
  date: z.string().optional(),
  description: z.string().optional(),
  targetProjectId: z.string().optional(), // فاضي = توزيع على كل المشاريع المفتوحة، محدد = تحميل على المشروع ده بس
});

const categoryLabels: Record<string, string> = {
  OFFICE_RENT: "إيجار المكتب",
  TRANSPORTATION: "الانتقالات",
  WATER: "فواتير المياه",
  ELECTRICITY: "فواتير الكهرباء",
  PHONE: "فواتير التليفون",
  EMAIL_INTERNET: "اشتراكات الإيميل والإنترنت",
  BUFFET: "البوفيه",
  OTHER: "أخرى",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await prisma.headOfficeExpense.findMany({
    include: {
      targetProject: { select: { id: true, name: true, code: true } },
      distributedExpenses: { include: { project: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
  const label = categoryLabels[parsed.data.category];
  const description = parsed.data.description || label;

  let headOfficeExpense;
  try {
    headOfficeExpense = await prisma.$transaction(async (tx) => {
      const created = await tx.headOfficeExpense.create({
        data: {
          category: parsed.data.category as any,
          amount: parsed.data.amount,
          description,
          date,
          targetProjectId: parsed.data.targetProjectId || null,
          createdById: (session.user as any).id,
        },
      });

      if (parsed.data.targetProjectId) {
        // تحميل مباشر على مشروع واحد بس — من غير توزيع
        const project = await tx.project.findUnique({ where: { id: parsed.data.targetProjectId } });
        if (!project) throw new Error("المشروع المحدد غير موجود");
        await tx.expense.create({
          data: {
            projectId: parsed.data.targetProjectId,
            category: "ADMINISTRATIVE",
            amount: parsed.data.amount,
            description: `${label} — مُحمَّل مباشرة من مصروفات المكتب الرئيسي`,
            date,
            sourceHeadOfficeExpenseId: created.id,
          },
        });
      } else {
        // توزيع على كل المشاريع المفتوحة حسب نسبة كل مشروع
        await distributeExpenseAcrossOpenProjects(tx, {
          amount: parsed.data.amount,
          category: "ADMINISTRATIVE",
          description: `${label} — موزّع من مصروفات المكتب الرئيسي`,
          date,
          sourceHeadOfficeExpenseId: created.id,
        });
      }

      return tx.headOfficeExpense.findUnique({
        where: { id: created.id },
        include: {
          targetProject: { select: { id: true, name: true, code: true } },
          distributedExpenses: { include: { project: { select: { id: true, name: true, code: true } } } },
        },
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "تعذر تسجيل المصروف" }, { status: 400 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "HEAD_OFFICE_EXPENSE_CREATED",
    entityType: "HeadOfficeExpense",
    entityId: headOfficeExpense!.id,
    after: headOfficeExpense,
  });
  await notifyAdmins(
    "HEAD_OFFICE_EXPENSE_DISTRIBUTED",
    `تم تسجيل مصروف "${label}" بقيمة ${parsed.data.amount} وتوزيعه على المشاريع المفتوحة`
  );

  return NextResponse.json(headOfficeExpense, { status: 201 });
}
