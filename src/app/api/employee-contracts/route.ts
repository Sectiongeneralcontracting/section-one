import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  employeeId: z.string(),
  contractType: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  salary: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = await prisma.employeeContract.findMany({
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contracts);
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

  const contract = await prisma.employeeContract.create({
    data: {
      employeeId: parsed.data.employeeId,
      contractType: parsed.data.contractType,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      salary: parsed.data.salary,
      notes: parsed.data.notes,
    },
    include: { employee: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EMPLOYEE_CONTRACT_CREATED",
    entityType: "EmployeeContract",
    entityId: contract.id,
    after: contract,
  });

  return NextResponse.json(contract, { status: 201 });
}
