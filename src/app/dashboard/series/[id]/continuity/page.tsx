import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlertTriangle } from "lucide-react";

async function resolveIssue(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id"));
  const issue = await db.continuityIssue.findFirst({
    where: { id, series: { userId: user.id } },
  });
  if (!issue) return;
  await db.continuityIssue.update({
    where: { id },
    data: { resolved: !issue.resolved },
  });
}

const SEV_COLOR: Record<string, string> = {
  HIGH: "text-red-700 bg-red-50 border-red-200",
  MEDIUM: "text-amber-800 bg-amber-50 border-amber-200",
  LOW: "text-ink-900/60 bg-ink-100 border-ink-900/10",
};

export default async function ContinuityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const series = await db.series.findFirst({ where: { id, userId: user.id } });
  if (!series) notFound();

  const issues = await db.continuityIssue.findMany({
    where: { seriesId: id },
    orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });

  const factIds = Array.from(new Set(issues.flatMap((i) => [i.factAId, i.factBId])));
  const facts = await db.fact.findMany({
    where: { id: { in: factIds } },
    include: { book: true, entity: true },
  });
  const factMap = new Map(facts.map((f) => [f.id, f]));

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard/series/${id}`} className="text-sm text-ink-900/60 hover:text-accent">
          ← {series.title}
        </Link>
        <h1 className="font-display mt-2 text-4xl font-semibold">Continuity Scanner</h1>
        <p className="text-ink-900/60">
          Conflicting claims about the same entity across your books. Resolve or annotate.
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="card text-center text-ink-900/60">
          No continuity issues detected. Run extraction on more books to keep the bible honest.
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((iss) => {
            const a = factMap.get(iss.factAId);
            const b = factMap.get(iss.factBId);
            if (!a || !b) return null;
            return (
              <div
                key={iss.id}
                className={`card ${iss.resolved ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-accent mt-1" />
                    <div>
                      <div className="font-display text-lg font-semibold">
                        {a.entity.name}
                        <span className={`ml-2 inline-block rounded border px-2 py-0.5 text-xs ${SEV_COLOR[iss.severity]}`}>
                          {iss.severity}
                        </span>
                      </div>
                      <div className="text-xs uppercase tracking-wider text-ink-900/50">
                        {iss.attribute}
                      </div>
                    </div>
                  </div>
                  <form action={resolveIssue}>
                    <input type="hidden" name="id" value={iss.id} />
                    <button className="btn-ghost text-xs">
                      {iss.resolved ? "Reopen" : "Mark resolved"}
                    </button>
                  </form>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <FactCard fact={a} />
                  <FactCard fact={b} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FactCard({ fact }: { fact: { value: string; book: { title: string }; excerpt: string | null } }) {
  return (
    <div className="rounded-lg border border-ink-900/10 bg-ink-50 p-3">
      <div className="text-xs text-ink-900/50">{fact.book.title}</div>
      <div className="font-medium mt-1">{fact.value}</div>
      {fact.excerpt && (
        <blockquote className="mt-2 border-l-2 border-accent/40 pl-2 text-xs italic text-ink-900/70">
          “{fact.excerpt}”
        </blockquote>
      )}
    </div>
  );
}
