import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Invalid credentials");
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required className="input" />
          </div>
          <button className="btn-accent w-full">Log in</button>
        </form>
        <p className="mt-4 text-sm text-ink-900/60">
          New here? <Link href="/signup" className="text-accent">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
