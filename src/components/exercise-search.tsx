"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function ExerciseSearchBox() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Input
      type="search"
      placeholder="Search exercises…"
      defaultValue={params.get("q") ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value) next.set("q", e.target.value);
        else next.delete("q");
        startTransition(() => router.replace(`${pathname}?${next.toString()}`));
      }}
    />
  );
}
