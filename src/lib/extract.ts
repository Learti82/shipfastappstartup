import { anthropic, MODEL } from "./anthropic";
import { chunkText } from "./utils";
import { z } from "zod";

const FactSchema = z.object({
  entity_type: z.enum([
    "CHARACTER",
    "LOCATION",
    "ITEM",
    "ORGANIZATION",
    "EVENT",
    "CONCEPT",
  ]),
  entity_name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  attribute: z.string().min(1),
  value: z.string().min(1),
  excerpt: z.string().optional(),
  chapter_ref: z.string().optional(),
});

export type ExtractedFact = z.infer<typeof FactSchema>;

const ExtractionSchema = z.object({ facts: z.array(FactSchema) });

const SYSTEM_PROMPT = `You are Plotline's continuity engine. You read manuscript text from a serial fiction novel and extract atomic, verifiable FACTS about story entities (characters, locations, items, organizations, events, concepts).

Rules:
- Extract ONLY facts explicitly stated or strongly implied in the text.
- Each fact = (entity, attribute, value). Atomic. One claim per fact.
- Use stable, lowercase snake_case attributes: eye_color, hair_color, age, height, occupation, hometown, weapon_of_choice, relationship:spouse, relationship:parent, allegiance, scar, accent, etc.
- Normalize values (e.g. "blue" not "Bright Blue Like the Aegean").
- Aliases: include nicknames and titles you observe.
- Include a short verbatim excerpt (<=180 chars) supporting the fact.
- Skip facts that are clearly metaphorical/dream/lying-narrator unless flagged in text.
- Output STRICT JSON only matching the schema. No prose.`;

const SCHEMA_HINT = `{"facts":[{"entity_type":"CHARACTER|LOCATION|ITEM|ORGANIZATION|EVENT|CONCEPT","entity_name":"string","aliases":["string"],"attribute":"string","value":"string","excerpt":"string","chapter_ref":"string"}]}`;

export async function extractFactsFromManuscript(opts: {
  manuscript: string;
  bookTitle: string;
  knownEntities?: { name: string; type: string; aliases: string[] }[];
}): Promise<ExtractedFact[]> {
  const chunks = chunkText(opts.manuscript, 12000);
  const all: ExtractedFact[] = [];

  const knownBlock = opts.knownEntities?.length
    ? `Known entities so far (reuse exact names when matching):\n${opts.knownEntities
        .map((e) => `- [${e.type}] ${e.name}${e.aliases.length ? " (aka " + e.aliases.join(", ") + ")" : ""}`)
        .join("\n")}\n\n`
    : "";

  for (let i = 0; i < chunks.length; i++) {
    const userMsg = `${knownBlock}Book: ${opts.bookTitle}\nChunk ${i + 1}/${chunks.length}\n\nReturn JSON matching: ${SCHEMA_HINT}\n\n---MANUSCRIPT---\n${chunks[i]}`;

    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    const json = safeParseJson(text);
    if (!json) continue;
    const parsed = ExtractionSchema.safeParse(json);
    if (parsed.success) all.push(...parsed.data.facts);
  }

  return all;
}

function safeParseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
