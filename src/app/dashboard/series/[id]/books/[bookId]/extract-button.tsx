"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExtractButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMsg("Reading manuscript… this may take a minute.");
    try {
      const res = await fetch(`/api/books/${bookId}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setMsg(`Extracted ${data.factCount} facts across ${data.entityCount} entities.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button onClick={run} disabled={loading} className="btn-accent">
        {loading ? "Extracting…" : "Run extraction"}
      </button>
      {msg && <div className="mt-2 text-xs text-ink-900/60">{msg}</div>}
    </div>
  );
}
