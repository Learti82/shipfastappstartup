import { anthropic, MODEL } from "./anthropic";
import { db } from "./db";

// Pairwise contradiction detection over (entity, attribute) facts.
// Heuristic first (cheap), then ask Claude only for ambiguous string-vs-string mismatches.

export async function recomputeContinuity(seriesId: string) {
  await db.continuityIssue.deleteMany({ where: { seriesId } });

  const facts = await db.fact.findMany({
    where: { seriesId },
    include: { book: true, entity: true },
    orderBy: [{ entityId: "asc" }, { attribute: "asc" }],
  });

  const groups = new Map<string, typeof facts>();
  for (const f of facts) {
    const key = `${f.entityId}::${f.attribute}`;
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }

  const issues: {
    seriesId: string;
    entityId: string;
    attribute: string;
    factAId: string;
    factBId: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  }[] = [];

  for (const [, group] of groups) {
    if (group.length < 2) continue;

    const distinct = new Map<string, (typeof group)[number]>();
    for (const f of group) {
      const norm = f.value.trim().toLowerCase();
      if (!distinct.has(norm)) distinct.set(norm, f);
    }
    if (distinct.size < 2) continue;

    const list = Array.from(distinct.values());
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const severity = severityFor(a.attribute);
        issues.push({
          seriesId,
          entityId: a.entityId,
          attribute: a.attribute,
          factAId: a.id,
          factBId: b.id,
          severity,
        });
      }
    }
  }

  if (issues.length) {
    await db.continuityIssue.createMany({ data: issues });
  }
  return issues.length;
}

function severityFor(attribute: string): "LOW" | "MEDIUM" | "HIGH" {
  const high = ["eye_color", "hair_color", "age", "name", "gender", "death", "birthplace"];
  const med = ["occupation", "hometown", "scar", "accent", "weapon_of_choice", "allegiance"];
  if (high.some((h) => attribute.includes(h))) return "HIGH";
  if (med.some((m) => attribute.includes(m))) return "MEDIUM";
  return "LOW";
}

export async function explainContinuityIssue(opts: {
  entityName: string;
  attribute: string;
  valueA: string;
  bookA: string;
  valueB: string;
  bookB: string;
  excerptA?: string | null;
  excerptB?: string | null;
}): Promise<string> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system:
      "You are a continuity editor. Given two conflicting facts about the same character/location/etc across books in a series, explain in 2 sentences whether this is a real continuity error or a plausible in-story change (aging, dye, lying narrator, retcon). Be direct.",
    messages: [
      {
        role: "user",
        content: `Entity: ${opts.entityName}\nAttribute: ${opts.attribute}\n\n[${opts.bookA}] ${opts.valueA}\nExcerpt: ${opts.excerptA ?? "n/a"}\n\n[${opts.bookB}] ${opts.valueB}\nExcerpt: ${opts.excerptB ?? "n/a"}`,
      },
    ],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");
}
