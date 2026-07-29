import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 2 }, // انتهاء الجلسة بعد ساعتين من عدم النشاط
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // البريد الإلكتروني بيتخزّن ويتقارن دايمًا بحروف صغيرة — منعًا لمشكلة "Ahmed@X.com" تسجّل بيها ومش تقدر تدخل بيها تاني
        const normalizedEmail = credentials.email.trim().toLowerCase();

        // قفل مؤقت بعد 5 محاولات فاشلة خلال آخر 15 دقيقة — من غير مسح أي سجل قديم (الأدلة تفضل موجودة للمراجعة)
        const LOCKOUT_WINDOW_MINUTES = 15;
        const LOCKOUT_THRESHOLD = 5;
        const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
        const recentFailures = await prisma.loginAttempt.count({
          where: { email: normalizedEmail, success: false, createdAt: { gte: windowStart } },
        });
        if (recentFailures >= LOCKOUT_THRESHOLD) {
          // بنسجّل المحاولة دي كمان (حتى وهي مرفوضة بسبب القفل) عشان السجل يفضل كامل ودقيق
          await prisma.loginAttempt.create({ data: { email: normalizedEmail, success: false } });
          throw new Error("الحساب مقفول مؤقتًا بسبب محاولات دخول فاشلة متكررة. حاول تاني بعد 15 دقيقة.");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        const valid =
          user && (await bcrypt.compare(credentials.password, user.passwordHash));

        // تسجيل كل محاولات الدخول (Security requirement)
        await prisma.loginAttempt.create({
          data: {
            userId: user?.id,
            email: normalizedEmail,
            success: !!valid,
          },
        });

        if (!valid || !user.isActive) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
      }
      return token;
    },
    // ⚠️ نقطة الأمان الأهم في الملف ده: بترجع من غير ما تعتمد على role/isActive المُخزّنين في الـ JWT نفسه.
    // بتتنفّذ مع كل استدعاء لـ getServerSession() في أي API route في النظام كله — يعني أي تعديل على
    // صلاحية مستخدم أو تعطيل حسابه أو تغيير كلمة سره بيسري فورًا في الطلب اللي بعده مباشرة،
    // مش لازم ننتظر انتهاء صلاحية الـ JWT (كانت 12 ساعة، دلوقتي حتى ساعتين برضو خطر كبير من غير الفحص ده).
    async session({ session, token }) {
      const uid = token?.uid as string | undefined;
      if (!uid) return null as any;

      const dbUser = await prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, name: true, email: true, role: true, isActive: true, passwordChangedAt: true },
      });

      // الحساب اتحذف أو اتعطّل — نرفض الجلسة فورًا (getServerSession هيرجع null، وكل الراوتس بترفض تلقائيًا)
      if (!dbUser || !dbUser.isActive) return null as any;

      // كلمة السر اتغيّرت بعد ما التوكن ده اتصدر — نرفض الجلسة القديمة (بتحمي من حساب مسروق حتى لو الجلسة القديمة لسه "صالحة" وقتيًا)
      if (dbUser.passwordChangedAt && token.iat && dbUser.passwordChangedAt.getTime() / 1000 > (token.iat as number)) {
        return null as any;
      }

      if (session.user) {
        (session.user as any).id = dbUser.id;
        (session.user as any).role = dbUser.role; // الدور دايمًا حي من القاعدة، مش من التوكن المجمّد
        session.user.name = dbUser.name;
        session.user.email = dbUser.email;
      }
      return session;
    },
  },
};
