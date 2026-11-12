import Link from "next/link";
import { CandidateForm } from "@/components/CandidateForm";
import { cardClass } from "@/components/ui";

export default function NewCandidatePage() {
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-blue-700 hover:underline">← Back to candidates</Link>
      <h1 className="text-2xl font-semibold">Add candidate</h1>
      <div className={cardClass}>
        <CandidateForm />
      </div>
    </div>
  );
}
