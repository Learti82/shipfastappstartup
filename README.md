# Plotline

**AI Series Bible & Continuity Checker for serial fiction authors.**

Plotline ingests your manuscripts, builds a living encyclopedia of every character, location, item, organization, event, and concept in your series, and surfaces continuity errors before your readers do.

Built for the underserved niche of Kindle Unlimited and trad-published serial authors running 6–14+ book universes who currently juggle Word docs, Notion pages, and spreadsheets.

## Why this exists

- 100k+ active serial fiction authors on KU alone, releasing 6–12 books/year.
- A single continuity error (eye color, dead character speaking, town renamed) tanks Amazon reviews.
- No tool today extracts a structured series bible directly from manuscripts and cross-references claims across books.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS, shadcn-style primitives, Lucide
- Postgres + Prisma
- Anthropic Claude (`claude-sonnet-4-6`) for fact extraction
- JOSE-based session auth (cookie + JWT)
- Stripe-ready

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, ANTHROPIC_API_KEY, AUTH_SECRET
pnpm db:push
pnpm dev
```

## Core flow

1. Sign up → create a series.
2. Add a book (paste manuscript).
3. Run extraction — Claude pulls atomic `(entity, attribute, value)` facts with excerpts.
4. Series Bible auto-populates with characters / locations / items.
5. Continuity Scanner flags every contradicting claim across books, with severity + sources.

## Pricing

- Starter: free, 1 series · 3 books
- Author: $19/mo, 3 series · unlimited books · scanner + search
- Pro: $49/mo, unlimited series + co-author seats + API

## Status

MVP scaffolding. Built on branch `claude/fullstack-startup-builder-F5tke`.
