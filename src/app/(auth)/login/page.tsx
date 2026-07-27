"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/lib/use-locale";

const dict = {
  ar: {
    tagline: "منصة إدارة أعمال المقاولات",
    subtitle: "تسجيل الدخول إلى النظام",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "دخول",
    loading: "جارٍ الدخول...",
    error: "بيانات الدخول غير صحيحة",
    switchTo: "English",
  },
  en: {
    tagline: "Construction Management Platform",
    subtitle: "Sign in to the system",
    email: "Email",
    password: "Password",
    submit: "Sign In",
    loading: "Signing in...",
    error: "Invalid email or password",
    switchTo: "العربية",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = dict[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(t.error);
      return;
    }
    router.push("/dashboard");
  }

  function toggleLocale() {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative">
      <button
        onClick={toggleLocale}
        className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
      >
        {t.switchTo}
      </button>
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="Section" width={64} height={64} className="mx-auto" />
          <div className="text-2xl font-bold text-primary">Section One</div>
          <p className="text-xs text-neutral-400 tracking-wide">CONSTRUCTION MANAGEMENT PLATFORM</p>
          <p className="text-sm text-neutral-500">{t.subtitle}</p>
        </div>

        <div>
          <label className="text-sm text-neutral-600 block mb-1">{t.email}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600 block mb-1">{t.password}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-xl py-2 font-medium hover:bg-primary-dark transition disabled:opacity-60"
        >
          {loading ? t.loading : t.submit}
        </button>
      </form>
    </div>
  );
}
