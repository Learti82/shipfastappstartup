import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

async function signup(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  if (!email || password.length < 8) throw new Error("Invalid email or password");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const user = await db.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-3xl font-semibold">Start your series bible</h1>
        <p className="mt-1 text-sm text-ink-900/60">Free forever for 1 series and 3 books.</p>
        <form action={signup} className="mt-6 space-y-4">
          <div>
            <label className="label">Pen name</label>
            <input name="name" className="input" placeholder="J. R. R. Mockler" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required minLength={8} className="input" />
          </div>
          <button className="btn-accent w-full">Create account</button>
        </form>
        <p className="mt-4 text-sm text-ink-900/60">
          Have an account? <Link href="/login" className="text-accent">Log in</Link>
        </p>
      </div>
    </div>
  );
}
