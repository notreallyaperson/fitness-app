"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateMyProfile } from "@/lib/db/profiles";
import { EQUIPMENT_TYPES } from "@/lib/enums";

const EquipmentEnum = z.enum(EQUIPMENT_TYPES as unknown as [string, ...string[]]);

const Patch = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  units_weight: z.enum(["kg", "lbs"]).optional(),
  units_distance: z.enum(["km", "mi"]).optional(),
  default_bodyweight: z
    .preprocess(
      (v) => (v === "" || v == null ? null : Number(v)),
      z.number().positive().max(500).nullable(),
    )
    .optional(),
  available_equipment: z.array(EquipmentEnum).optional(),
});

export async function saveProfile(formData: FormData) {
  const raw = {
    display_name: formData.get("display_name") ?? undefined,
    units_weight: formData.get("units_weight") ?? undefined,
    units_distance: formData.get("units_distance") ?? undefined,
    default_bodyweight: formData.get("default_bodyweight") ?? undefined,
    available_equipment: formData.getAll("available_equipment"),
  };
  const parsed = Patch.parse(raw);
  // Cast available_equipment back to the typed enum array; zod's runtime check
  // already guarantees each value is a valid EquipmentType.
  await updateMyProfile(parsed as never);
  revalidatePath("/settings");
}
