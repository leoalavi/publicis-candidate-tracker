import type { Stage } from "@/lib/types";

const stageColours: Record<Stage, string> = {
  Applied: "bg-slate-100 text-slate-800",
  Screening: "bg-amber-100 text-amber-900",
  Interview: "bg-blue-100 text-blue-900",
  Offer: "bg-green-100 text-green-900",
  Rejected: "bg-red-100 text-red-900",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColours[stage]}`}>
      {stage}
    </span>
  );
}
