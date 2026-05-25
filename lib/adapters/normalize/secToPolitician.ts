import type { Politician } from "@/lib/types";
import type { SecFiling, SecReportingOwner } from "@/lib/server/secApi";

export function insiderIdFromCik(cik: string): string {
  return `ins_${cik.replace(/\D/g, "")}`;
}

function relationshipLabels(owner: SecReportingOwner): string[] {
  const labels: string[] = [];
  if (owner.director) labels.push("Director");
  if (owner.officer) {
    labels.push(owner.officerTitle ? `Officer: ${owner.officerTitle}` : "Officer");
  }
  if (owner.tenPercentOwner) labels.push("10% Owner");
  if (owner.otherText) labels.push(owner.otherText);
  return labels.length > 0 ? labels : ["Insider"];
}

export function secOwnerToPolitician(
  owner: SecReportingOwner,
  filing?: SecFiling,
): Politician {
  const cik = owner.cik ?? filing?.reportingOwner?.cik ?? "unknown";
  const id = insiderIdFromCik(cik);
  const state = owner.address?.state?.toUpperCase().slice(0, 2) ?? "—";
  return {
    id,
    name: owner.name ?? "Unknown insider",
    party: "I",
    chamber: "House",
    state: state.length === 2 ? state : "—",
    committees: relationshipLabels(owner),
    avatarSeed: id,
  };
}

export function mergePoliticiansFromFilings(filings: SecFiling[]): Politician[] {
  const byId = new Map<string, Politician>();
  for (const f of filings) {
    const owner = f.reportingOwner;
    if (!owner?.cik) continue;
    const p = secOwnerToPolitician(owner, f);
    const existing = byId.get(p.id);
    if (!existing) {
      byId.set(p.id, p);
      continue;
    }
    const mergedCommittees = new Set([...existing.committees, ...p.committees]);
    byId.set(p.id, { ...existing, committees: [...mergedCommittees] });
  }
  return [...byId.values()];
}
