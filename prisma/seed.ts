import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PERMISSIONS, MODULES } from "../src/lib/modules";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@section-eg.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@section-eg.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  await prisma.companyProfile.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", name: "Section General Contracting" },
  });

  // تعبئة الصلاحيات الافتراضية — upsert آمن، بيحترم أي تعديل عمله الأدمن قبل كده من الإعدادات
  for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const m of MODULES) {
      await prisma.permission.upsert({
        where: { role_module: { role: role as any, module: m.key } },
        update: {},
        create: {
          role: role as any,
          module: m.key,
          canView: perms.view.includes(m.key),
          canEdit: perms.edit.includes(m.key),
        },
      });
    }
  }

  console.log("✅ Seed done. Login: admin@section-eg.com / ChangeMe123!  — غيّرها فورًا");
}

main().finally(() => prisma.$disconnect());
