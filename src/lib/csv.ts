import { CAPITALS, LEVEL_LABEL, ORG_TYPE_LABEL, RING_LABEL, noteField, ratingField } from "./capitals";
import type { ProfileRow } from "./types";

type Col = { header: string; get: (p: ProfileRow) => string };

const cols = (withAuthor: (id: string) => string | undefined): Col[] => {
  const base: Col[] = [
    { header: "Profile ID", get: (p) => p.id },
    { header: "Status", get: (p) => (p.status === "submitted" ? "Submitted" : "Draft") },
    { header: "Submitted at", get: (p) => p.submitted_at ?? "" },
    { header: "Name", get: (p) => p.name ?? "" },
    { header: "Type", get: (p) => (p.org_type ? ORG_TYPE_LABEL[p.org_type] : "") },
    { header: "Type (other)", get: (p) => p.org_type_other ?? "" },
    { header: "Who they are", get: (p) => p.description ?? "" },
    { header: "Ring", get: (p) => (p.ring ? RING_LABEL[p.ring] : "") },
  ];
  for (const c of CAPITALS) {
    base.push({ header: `${c.label} capital`, get: (p) => { const v = p[ratingField(c.key)]; return v ? LEVEL_LABEL[v] : ""; } });
    base.push({ header: `${c.label} capital note`, get: (p) => p[noteField(c.key)] ?? "" });
  }
  base.push(
    { header: "What they need", get: (p) => p.needs ?? "" },
    { header: "What they value", get: (p) => p.values_held ?? "" },
    { header: "What they fear or want to avoid", get: (p) => p.fears ?? "" },
    { header: "Influence", get: (p) => (p.influence_level ? LEVEL_LABEL[p.influence_level] : "") },
    { header: "Influence note", get: (p) => p.influence_note ?? "" },
    { header: "Stake", get: (p) => p.stake ?? "" },
    { header: "How they could connect to The Labs", get: (p) => p.connection_to_labs ?? "" },
  );
  base.push({ header: "Author", get: (p) => withAuthor(p.author_id) ?? "" });
  return base;
};

function cell(v: string): string {
  // Guard against spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(rows: ProfileRow[], authorName?: (id: string) => string | undefined): string {
  let c = cols(authorName ?? (() => undefined));
  if (!authorName) c = c.filter((x) => x.header !== "Author");
  const lines = [c.map((x) => cell(x.header)).join(",")];
  for (const r of rows) lines.push(c.map((x) => cell(x.get(r))).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
