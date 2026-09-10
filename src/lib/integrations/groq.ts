import { z } from "zod";
import type { SiteJournalEntryRow, SiteJournalRow } from "@/lib/domain/site-journal";

const groqResponseSchema = z.object({
  summary: z.string().trim().min(1).max(3500),
  insights: z
    .array(
      z.object({
        entry_id: z.uuid(),
        insight: z.string().trim().min(1).max(1000),
      }),
    )
    .max(50),
});

export type GroqJournalContent = {
  summary: string;
  insights: Map<string, string>;
};

function modelName() {
  return process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
}

export async function generateGroqJournalContent(
  journal: SiteJournalRow,
  entries: SiteJournalEntryRow[],
): Promise<GroqJournalContent | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const source = {
    journal: {
      title: journal.title,
      description: journal.description,
      project_type: journal.project_type,
      city: journal.city,
      region: journal.region,
      budget_range: journal.budget_range,
      health_status: journal.health_status,
      tags: journal.tags ?? [],
    },
    entries: entries.slice(0, 20).map((entry) => ({
      entry_id: entry.id,
      week_number: entry.week_number,
      entry_type: entry.entry_type,
      title: entry.title,
      content: entry.content.slice(0, 700),
      risk_level: entry.risk_level,
      tags: entry.tags ?? [],
    })),
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write concise construction site journal summaries. Use only the supplied facts. Never invent dates, costs, progress, people, materials, outcomes, or risks. Return JSON with summary and insights. Summary must be 2-4 sentences. Insights must contain only entry IDs supplied and one short evidence-based observation per entry. Clearly say when evidence is limited.",
          },
          {
            role: "user",
            content: JSON.stringify(source),
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = groqResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return null;
    const validIds = new Set(entries.map((entry) => entry.id));
    return {
      summary: `AI-assisted summary · Groq · evidence-only: ${parsed.data.summary}`,
      insights: new Map(
        parsed.data.insights
          .filter((item) => validIds.has(item.entry_id))
          .map((item) => [item.entry_id, `AI-assisted insight · Groq · evidence-only: ${item.insight}`]),
      ),
    };
  } catch {
    return null;
  }
}
