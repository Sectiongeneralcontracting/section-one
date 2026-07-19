import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  console.log("✅ Seed done. Login: admin@section-eg.com / ChangeMe123!  — غيّرها فورًا");
}

main().finally(() => prisma.$disconnect());
