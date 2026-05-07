import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractFactsFromManuscript } from "@/lib/extract";
import { recomputeContinuity } from "@/lib/continuity";

export const maxDuration = 300;

export async function POST(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const user = await requireUser();

  const book = await db.book.findFirst({
    where: { id: bookId, series: { userId: user.id } },
    include: { series: { include: { entities: true } } },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.book.update({ where: { id: book.id }, data: { status: "EXTRACTING" } });

  try {
    const known = book.series.entities.map((e) => ({
      name: e.name,
      type: e.type,
      aliases: e.aliases,
    }));

    const facts = await extractFactsFromManuscript({
      manuscript: book.manuscript,
      bookTitle: book.title,
      knownEntities: known,
    });

    await db.fact.deleteMany({ where: { bookId: book.id } });

    const entityCache = new Map<string, string>();
    for (const e of book.series.entities) {
      entityCache.set(`${e.type}::${e.name.toLowerCase()}`, e.id);
      for (const a of e.aliases) entityCache.set(`${e.type}::${a.toLowerCase()}`, e.id);
    }

    let createdEntities = 0;
    for (const f of facts) {
      const key = `${f.entity_type}::${f.entity_name.toLowerCase()}`;
      let entityId = entityCache.get(key);
      if (!entityId) {
        const created = await db.entity.upsert({
          where: {
            seriesId_type_name: {
              seriesId: book.seriesId,
              type: f.entity_type,
              name: f.entity_name,
            },
          },
          update: {
            aliases: { set: Array.from(new Set([...(f.aliases ?? [])])) },
          },
          create: {
            seriesId: book.seriesId,
            type: f.entity_type,
            name: f.entity_name,
            aliases: f.aliases ?? [],
            firstBookId: book.id,
          },
        });
        entityId = created.id;
        entityCache.set(key, entityId);
        createdEntities++;
      }

      await db.fact.create({
        data: {
          seriesId: book.seriesId,
          entityId,
          bookId: book.id,
          attribute: f.attribute,
          value: f.value,
          excerpt: f.excerpt,
          chapterRef: f.chapter_ref,
        },
      });
    }

    await db.book.update({
      where: { id: book.id },
      data: { status: "READY", extractedAt: new Date() },
    });

    await recomputeContinuity(book.seriesId);

    return NextResponse.json({
      ok: true,
      factCount: facts.length,
      entityCount: createdEntities,
    });
  } catch (e) {
    await db.book.update({ where: { id: book.id }, data: { status: "FAILED" } });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Extraction failed" },
      { status: 500 },
    );
  }
}
