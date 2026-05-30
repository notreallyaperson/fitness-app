"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  proposeImportAction,
  commitImportAction,
} from "@/server/actions/import";
import type { ImportProposal } from "@/lib/db/import-workout";
import type { Choice } from "@/lib/exercise-matching";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { cn } from "@/lib/utils";

const SAMPLE = `{
  "name": "Push Day A",
  "notes": "optional note",
  "exercises": [
    {
      "name": "Bench Press",
      "metric_kind": "weight_reps",
      "sets": [
        { "weight": 60, "weight_unit": "kg", "reps": 8, "rpe": 8 },
        { "weight": 62.5, "weight_unit": "kg", "reps": 6 }
      ]
    },
    {
      "name": "Plank",
      "metric_kind": "time_only",
      "sets": [{ "time_seconds": 60 }, { "time_seconds": 60 }]
    }
  ]
}`;

const PROMPT = `You are my strength coach. Output ONLY valid JSON (no markdown, no code fences, no commentary) describing today's workout, in exactly this shape:

${SAMPLE}

Rules:
- One object per exercise; list each working AND warmup set explicitly with its prescribed numbers.
- metric_kind is one of: weight_reps, bodyweight_reps, weighted_bodyweight_reps, time_only, time_weight, distance_only, distance_time, none.
- Weights use "weight" + "weight_unit" ("kg" or "lbs"); timed moves use "time_seconds"; distance uses "distance" + "distance_unit" ("km" or "mi"). "rpe" is 1-10. Mark warmups with "is_warmup": true.`;

export default function ImportWorkoutPage() {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<ImportProposal | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [pending, startTransition] = useTransition();

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const analyse = () => {
    startTransition(async () => {
      const res = await proposeImportAction(text);
      if (res.error || !res.proposal) {
        toast.error(res.error ?? "Couldn't analyse workout");
        return;
      }
      setProposal(res.proposal);
      setChoices(res.proposal.exercises.map((e) => e.defaultChoice));
    });
  };

  const commit = () => {
    if (!proposal) return;
    startTransition(async () => {
      const payload = {
        name: proposal.name,
        notes: proposal.notes,
        exercises: proposal.exercises.map((e, i) => ({
          name: e.name,
          metricKind: e.metricKind,
          notes: e.notes,
          sets: e.sets,
          resolution: choices[i],
        })),
      };
      const res = await commitImportAction(payload);
      // On success the action redirects; only errors return here.
      if (res?.error) toast.error(res.error);
    });
  };

  if (!proposal) {
    return (
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Import workout</h1>
          <p className="text-sm text-muted-foreground">
            Paste a workout as JSON. We&apos;ll match each exercise to your catalog
            so you can confirm before a session is created.
          </p>
        </div>

        <details className="rounded-lg border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            How to generate this with ChatGPT
          </summary>
          <div className="mt-3 space-y-3">
            <pre className="max-h-64 overflow-auto rounded-md bg-background p-2 text-[11px] leading-relaxed">
              {PROMPT}
            </pre>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => copy(PROMPT, "Prompt")}>
                Copy prompt
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => copy(SAMPLE, "Sample JSON")}>
                Copy sample JSON
              </Button>
            </div>
          </div>
        </details>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='{ "name": "Push Day", "exercises": [ ... ] }'
          className="font-mono text-xs"
        />

        <Button onClick={analyse} className="w-full" disabled={pending || !text.trim()}>
          {pending ? "Analysing…" : "Review matches"}
        </Button>
      </div>
    );
  }

  return (
    <ReviewStep
      proposal={proposal}
      choices={choices}
      setChoices={setChoices}
      pending={pending}
      onBack={() => setProposal(null)}
      onConfirm={commit}
    />
  );
}

function ReviewStep({
  proposal,
  choices,
  setChoices,
  pending,
  onBack,
  onConfirm,
}: {
  proposal: ImportProposal;
  choices: Choice[];
  setChoices: React.Dispatch<React.SetStateAction<Choice[]>>;
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const idToName = useMemo(
    () => new Map(proposal.catalog.map((c) => [c.id, c.name])),
    [proposal.catalog],
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Review matches</h1>
        <p className="text-sm text-muted-foreground">{proposal.name}</p>
      </div>

      <ul className="space-y-2">
        {proposal.exercises.map((ex, i) => {
          const choice = choices[i];
          const hasSuggestion = ex.suggestion.matchId != null;
          const isSuggested =
            choice?.kind === "match" && choice.exerciseId === ex.suggestion.matchId;
          const selectedName =
            choice?.kind === "match"
              ? (idToName.get(choice.exerciseId) ?? ex.suggestion.matchName ?? "Existing exercise")
              : "New exercise";
          const setChoice = (c: Choice) =>
            setChoices((prev) => prev.map((p, j) => (j === i ? c : p)));

          const suggestionLabel = hasSuggestion
            ? ex.suggestion.source === "exact"
              ? `Use ${ex.suggestion.matchName} (exact)`
              : `Use ${ex.suggestion.matchName} (${Math.round(ex.suggestion.confidence * 100)}% similar)`
            : "No close match";

          return (
            <li key={i} className="rounded-lg border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{ex.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {ex.sets.length} set{ex.sets.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                → <span className="text-foreground">{selectedName}</span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={!hasSuggestion}
                  aria-pressed={isSuggested}
                  onClick={() =>
                    hasSuggestion &&
                    setChoice({ kind: "match", exerciseId: ex.suggestion.matchId! })
                  }
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                    isSuggested
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                    !hasSuggestion && "cursor-not-allowed opacity-40",
                  )}
                >
                  {suggestionLabel}
                </button>
                <button
                  type="button"
                  aria-pressed={choice?.kind === "new"}
                  onClick={() => setChoice({ kind: "new" })}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                    choice?.kind === "new"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  Create new exercise
                </button>
              </div>

              <div className="mt-1.5">
                <AddExerciseSheet
                  triggerNode={
                    <button
                      type="button"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {choice?.kind === "match" && !isSuggested
                        ? "Match to a different exercise…"
                        : "Match to an existing exercise…"}
                    </button>
                  }
                  onPick={(exerciseId) => setChoice({ kind: "match", exerciseId })}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1" disabled={pending}>
          {pending ? "Creating…" : "Confirm & start session"}
        </Button>
      </div>
    </div>
  );
}
