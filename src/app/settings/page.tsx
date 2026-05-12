import { getMyProfile } from "@/lib/db/profiles";
import { saveProfile } from "@/server/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EquipmentMultiselect } from "@/components/equipment-multiselect";

export default async function SettingsPage() {
  const profile = await getMyProfile();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form action={saveProfile} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Weight unit</legend>
          <div className="flex gap-4 text-sm">
            {(["kg", "lbs"] as const).map((u) => (
              <label key={u} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="units_weight"
                  value={u}
                  defaultChecked={profile.units_weight === u}
                />
                {u}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Distance unit</legend>
          <div className="flex gap-4 text-sm">
            {(["km", "mi"] as const).map((u) => (
              <label key={u} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="units_distance"
                  value={u}
                  defaultChecked={profile.units_distance === u}
                />
                {u}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="default_bodyweight">
            Default bodyweight ({profile.units_weight})
          </Label>
          <Input
            id="default_bodyweight"
            name="default_bodyweight"
            type="number"
            inputMode="decimal"
            step="0.1"
            defaultValue={profile.default_bodyweight ?? ""}
            placeholder="e.g. 80"
          />
        </div>

        <div className="space-y-2">
          <Label>What equipment do you have access to?</Label>
          <p className="text-xs text-muted-foreground">
            Used to filter exercise search by default.
          </p>
          <EquipmentMultiselect
            name="available_equipment"
            defaultValue={profile.available_equipment ?? []}
          />
        </div>

        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
