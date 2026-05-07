import Link from "next/link";
import { BookOpen, Sparkles, AlertTriangle, Layers, Search, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          Plotline<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-accent">Start free</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-white/80 px-3 py-1 text-xs font-medium text-ink-900/80">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Built for serial fiction authors
          </span>
          <h1 className="font-display mt-6 text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
            Your series bible,
            <br />
            <span className="italic text-accent">written by your books.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-900/70">
            Plotline reads your manuscripts and builds a living encyclopedia of every
            character, location, and lore detail — then flags continuity errors before
            your readers do.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className="btn-accent text-base px-6 py-3">
              Start free — 1 series, 3 books
            </Link>
            <Link href="#how" className="btn-ghost text-base px-6 py-3">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-900/50">No credit card. Your manuscripts stay private.</p>
        </section>

        <section id="how" className="bg-ink-900 text-ink-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-4xl font-semibold">A first reader for your own canon.</h2>
            <p className="mt-4 max-w-2xl text-ink-50/70">
              Upload Book 1 through Book 14. Plotline indexes every claim about every entity,
              cross-references it against the rest of your series, and surfaces contradictions
              with the exact passages.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Feature icon={<BookOpen />} title="Drop in your manuscript" body="DOCX, EPUB, or paste. Plotline ingests chapters and remembers them forever." />
              <Feature icon={<Layers />} title="Auto-built series bible" body="Characters, locations, factions, magic systems, items — extracted, deduped, editable." />
              <Feature icon={<AlertTriangle />} title="Continuity scanner" body="Eye color shifted? Town renamed? Dead character speaking? Flagged with sources." />
              <Feature icon={<Search />} title="Series-wide search" body="Find every mention of a sword, an oath, a side character — across 14 books in 200ms." />
              <Feature icon={<Sparkles />} title="Ghost continuity editor" body="Ask Plotline: 'Was Joren ever in Vael before Book 5?' Get cited answers." />
              <Feature icon={<Zap />} title="Built for KU pace" body="Designed for authors releasing 6–12 books a year. Re-index in minutes, not days." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-display text-4xl font-semibold">Pricing that respects working authors.</h2>
              <p className="mt-4 text-ink-900/70">
                One bad review citing a continuity error costs more than a year of Plotline.
              </p>
            </div>
            <div className="grid gap-4">
              <Plan name="Starter" price="$0" desc="1 series · 3 books · core bible" />
              <Plan name="Author" price="$19/mo" desc="3 series · unlimited books · continuity scanner · search" highlight />
              <Plan name="Pro" price="$49/mo" desc="Unlimited series · co-author seats · timeline view · API" />
            </div>
          </div>
        </section>

        <footer className="border-t border-ink-900/10 py-10 text-center text-sm text-ink-900/50">
          © {new Date().getFullYear()} Plotline. Made for storytellers who refuse to forget.
        </footer>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-ink-50/15 bg-ink-950/40 p-6">
      <div className="text-accent">{icon}</div>
      <h3 className="font-display mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ink-50/70">{body}</p>
    </div>
  );
}

function Plan({ name, price, desc, highlight }: { name: string; price: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`card flex items-center justify-between ${highlight ? "border-accent/40 ring-1 ring-accent/30" : ""}`}>
      <div>
        <div className="font-display text-xl font-semibold">{name}</div>
        <div className="text-sm text-ink-900/60">{desc}</div>
      </div>
      <div className="font-display text-2xl">{price}</div>
    </div>
  );
}
