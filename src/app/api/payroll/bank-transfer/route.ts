import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "الشهر مطلوب" }, { status: 400 });

  const records = await prisma.payrollRecord.findMany({
    where: { month, status: { in: ["APPROVED", "PAID"] } },
    include: { employee: true },
    orderBy: { employee: { name: "asc" } },
  });

  const rows = [
    ["اسم الموظف", "اسم البنك", "رقم الحساب", "صافي الراتب"],
    ...records.map((r) => [
      r.employee.name,
      r.employee.bankName ?? "",
      r.employee.bankAccountNumber ?? "",
      Number(r.netSalary).toFixed(2),
    ]),
  ];

  const csv = "\uFEFF" + rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bank-transfer-${month}.csv"`,
    },
  });
}
