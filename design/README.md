# Handoff: Ledger — Strength-Training Tracker (PWA)

## Overview
Ledger is a mobile-first PWA for logging strength workouts at the gym — fast, glanceable, one-handed. This bundle is the **design system + screen designs**: foundations (color/type/spacing/radius/elevation/motion), a component spec, four built screens, and a ready-to-paste Tailwind v4 token file. The product's point of view: **the number is the interface** — oversized tabular numerals carry every screen while everything else recedes into graphite-on-warm-paper, with a single acid accent ("Volt") used *only* for live/active/record states.

Design at **390px width** (iPhone), bottom-anchored primary actions, ≥44px tap targets, full **light + dark** support.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes that show the intended look, layout, and behavior. **They are not production code to copy directly.** The HTML uses React + Babel + a Tailwind CDN purely so the mock runs in a browser; do not lift that scaffolding.

The task is to **recreate these designs in the target codebase's environment** using its established patterns. The intended target is **Next.js + Tailwind v4 + shadcn/ui** (the token file and component mapping below assume this). If a different stack is already in place, translate the tokens and component intentions into that stack's idioms instead.

Open any `.html` file in a browser to see the live design. Each has a **Volt / Ember** accent toggle in its header — **ship Volt**; Ember is an alternate that was explored and rejected for the default.

## Fidelity
**High-fidelity (hi-fi).** Final colors (OKLCH), typography, spacing, radii, shadows, and interactions are all decided. Recreate the UI pixel-faithfully using the codebase's libraries. Exact values are in `Ledger — Handoff.html` (§01 has a complete, copy-pasteable `globals.css`) and in the Design Tokens section below.

---

## Design Tokens
The **authoritative source is `Ledger — Handoff.html` §01** — it contains a complete Tailwind v4 `app/globals.css` with `:root` + `.dark` OKLCH variables, an `@theme inline` block, radius/font/shadow/motion tokens, and the `.metric` utility. Paste that file first, then build components against the semantic names below.

All color is **OKLCH** `(L C H)`. Names are shadcn-native.

### Color (light → dark)
| Token (shadcn name) | Light | Dark | Usage |
|---|---|---|---|
| `background` | `oklch(.962 .008 85)` | `oklch(.178 .005 80)` | App canvas — warm paper, never pure white |
| `card` | `oklch(.984 .007 85)` | `oklch(.216 .006 80)` | Cards, list rows, working surface |
| `elevated` *(extra)* | `oklch(.998 .004 85)` | `oklch(.258 .007 80)` | Sheets, popovers, focal/active card |
| `muted` / `accent` | `oklch(.945 .008 82)` | `oklch(.150 .005 80)` / `oklch(.258 .007 80)` | Inset fields, chips, hover surface |
| `border` | `oklch(.885 .009 80)` | `oklch(.305 .007 82)` | Hairlines — the primary separator |
| `border-strong` / `input` *(extra)* | `oklch(.800 .011 80)` | `oklch(.400 .009 82)` | Input/stepper borders, secondary button |
| `foreground` | `oklch(.245 .006 75)` | `oklch(.952 .004 85)` | Graphite ink — headings, metrics |
| `secondary-foreground` | `oklch(.455 .007 75)` | `oklch(.722 .006 82)` | Body & supporting copy |
| `muted-foreground` | `oklch(.615 .007 75)` | `oklch(.560 .007 82)` | Labels, captions, units |
| `faint` *(extra)* | `oklch(.740 .007 80)` | `oklch(.440 .008 82)` | "prev" targets, disabled hints, grips |
| `primary` **(Volt)** | `oklch(.815 .190 122)` | `oklch(.855 .200 122)` | Live/active/record ONLY — CTA, ring, live timer, PB |
| `primary-foreground` | `oklch(.255 .040 122)` | `oklch(.205 .040 122)` | Ink on Volt (Volt is light — **never** white text) |
| `success` *(extra)* | `oklch(.605 .140 150)` | `oklch(.745 .150 150)` | Set complete, PB hit, streaks |
| `warning` *(extra)* | `oklch(.760 .150 70)` | `oklch(.820 .140 75)` | Paused timer, caution |
| `destructive` | `oklch(.575 .185 28)` | `oklch(.660 .185 28)` | End session, delete set |

> **Critical mapping note:** the brand color **Volt maps to `--primary`, NOT `--accent`.** In shadcn, `--accent` is the subtle hover/selected surface — keep it pointed at the muted inset. Don't paint buttons with `accent`.

### Radius
`sm 4px` (chips/tags) · `md 8px` (buttons, inputs, set rows) · `lg 14px` (cards, lists) · `xl 22px` (sheets, modals) · `full 9999px` (pills, avatars, FAB). Deliberately 14/22 — not shadcn defaults.

### Elevation
One workhorse shadow, warm-tinted, **light mode only**:
- `shadow-soft`: `0 2px 10px oklch(.245 .04 75 / .07), 0 1px 2px oklch(.245 .04 75 / .05)`
- `shadow-cta`: `0 6px 22px oklch(.245 .04 75 / .10)` (primary CTA + FAB lift)
In dark mode depth comes from `border` + `elevated` surfaces, not shadow. No glows, no stacked shadows.

### Typography
Font: **Inter** (UI), **JetBrains Mono** (countdowns/code). Body runs `font-feature-settings: "tnum" 1, "zero" 1` (tabular, slashed zero) globally.

| Role | Size / Weight / LH / Tracking |
|---|---|
| Display | 36px / 700 / 1.02 / −0.03em |
| Title | 25px / 700 / 1.12 / −0.022em |
| Headline | 19px / 600 / 1.25 / −0.012em |
| Body | 16px / 400 / 1.55 / 0 |
| Label | 12px / 600 / 1.1 / 0.07em UPPERCASE |
| Caption | 12px / 500 / 1.35 / 0.005em |
| **Metric (hero)** | **tabular-nums slashed-zero, −0.04em, 600, lh 0.92.** Sizes: ~104 (hero) / 56 / 34–40 (set results) / 26–30 (inline). This is the brand — used for every weight, rep count, and timer. |

`.metric` is shipped as a Tailwind `@utility` in the token file.

### Motion
| Name | Duration | Easing | Use |
|---|---|---|---|
| `ease-tap` | 120ms | `cubic-bezier(0.2,0,0,1)` | Press: scale `0.97` in, settle out |
| `ease-sheet` | 360ms | `cubic-bezier(0.32,0.72,0,1)` | Bottom-sheet / drawer slide |
| timer tick | 1000ms | `linear` | Rest countdown; ring/bar depletes |
| metric / PB | ~460–520ms | `cubic-bezier(0.16,1,0.3,1)` | New set "stamps" in; PB count-up |

Theme switching: add/remove `.dark` on `<html>` (e.g. `next-themes`).

---

## Screens / Views

> Source prototypes listed per screen. Open them to confirm exact spacing/behavior. All screens sit in a 390×844 frame.

### 1. Dashboard — "Today"  · `Ledger — Dashboard.html`
- **Purpose:** Landing screen — see weekly progress, resume an in-progress session, or start a new one.
- **Layout (top→bottom):** status bar → scrollable body (`px-5`) → bottom-anchored CTA → tab bar.
- **Components:**
  - **Header:** date caption (`muted-foreground`, 13px) + "Good morning" (Display 27px). Right side: a success-tinted **streak chip** (flame icon + `12`, `bg-success/14 text-success`, pill, 34px tall) and a **38px initials avatar** (`bg-card`, hairline).
  - **Weekly summary:** a *shadow-less* `card` strip with 3 hairline-divided stats (Workouts `3` / Volume `48.3k lb` / Time `3:21`). Numerals are **medium (26px metric)**, intentionally NOT hero-size — this block stays understated. Labels 11px `muted-foreground`.
  - **Continue card (focal content):** `bg-elevated`, `rounded-lg`, `shadow-soft`. Top row: a **pulsing 8px `primary` live dot** (`pulse` 1.6s) + "IN PROGRESS" label + "Started 9:17". Body: session name (Headline 17px) + "3 of 5 exercises · 9 sets logged" + a big **`24:18` timer (34px metric, ink)**. A 5-segment progress track (3 filled `foreground`, 2 `border`). A **"Resume →" button** = `primary` outline, full-width 44px.
  - **Recent list:** `card` with 3 session rows (name + stats + `clock`+duration metric + day). One row shows a small `primary` **award** icon (PB earned).
  - **Start Session CTA:** the *single* `primary`-filled action — full-width 54px `rounded-[15px]` `shadow-cta`, plus-icon + "Start Session". Sits above the tab bar over a `background`→transparent gradient.
  - **Tab bar:** 5 slots — Home (active, `primary`) / Library / center **Start** (`primary` filled 52px circle, `-mt-4`) / History / Settings. Icon (23px) + 10px label.
- **Hierarchy rule:** exactly one `primary` fill on screen (Start). The Continue card signals "live" only via the dot + outline button so the two never compete.

### 2. Live Session  · `Ledger — Live Session.html`  *(core screen)*
- **Purpose:** Log sets mid-workout. Immersive (no tab bar).
- **Session header card** (`bg-elevated`, `shadow-soft`): inline-editable **session name** (transparent input + pencil hint) + **End** button (`destructive` text on `bg-destructive/10`). A duration block (`bg-muted` inset): live **H:MM:SS** (28px metric). **Two states** — *running* (ink numerals + pulsing `primary` dot + "ELAPSED" + Pause button) and *paused* (`warning` numerals + `warning` dot + "PAUSED" + `primary` Resume button). Below: date chip + bodyweight chip, an auto-derived equipment badge row, and a quiet "Add session note…" line.
- **Exercise card** (`bg-elevated`, `rounded-lg`, `shadow-soft`), reorderable:
  - Header: **drag handle** (grip, `faint`), exercise name (16px bold) + "kind · N sets", collapse chevron, **⋮ menu** → Replace… / View exercise / Remove (popover, `bg-elevated shadow-cta`).
  - **Logged sets** (inner `card`): each row = set-number circle (or dimmed "W" for warmup), optional dimmed **Warmup** tag, the **big result numeral** (`80` 27px + `kg` muted + `× 8`; all ink — quiet), optional `primary` **PB** badge, muted **RPE x** text, delete `×`.
  - **Rest timer**, 3 states: *idle* (`bg-muted` row: clock + "Rest" + `1:30` + −15/+15 steppers + `primary` play) → *running* (big **`primary` countdown 34px** + Skip + depleting `primary` bar, 1s linear) → *done* (success pulse: "Rest complete — go!").
  - **Set-log form** (`bg-card`, dashed `border-strong`): metric inputs that adapt by exercise kind — **weight+reps** = two stepper field-boxes (Weight ±2.5kg, Reps ±1); **time-only** = one duration box (±5s). Each box carries a greyed **"prev N"** target (`faint`) — a planned reference, design for it now. Then a **Warmup switch**, an **RPE `ToggleGroup`** (Easy/Moderate/Hard/Max — tap to select, **tap again to clear**, selected = `primary`) with helper "Easy = reps left · Max = failure", an optional note line, and a full-width `primary` **Log set** button.
- **Add exercise:** full-width secondary button opens a **bottom sheet** (`Drawer`): grabber + "Add Exercise" + close, a search field, result rows (name, primary muscle, equipment badges, `primary` **Add** button). Below the list: a quiet `faint` **Delete session** affordance.
- **8 metric kinds:** all map onto the same field-box row — weight+reps, reps-only, weighted-bodyweight, time, time+weight, distance, distance+time, none (none = no inputs, just Log). Only weight+reps and time-only are drawn; the rest swap which boxes appear.

### 3. Exercise Library — List  · `Ledger — Library & Templates.html` (block A1)
- Title "Library" (Display 27px) + a `+` icon button. **Search field** (`bg-muted`, search icon, 44px). A **horizontally-scrolling filter-chip row** (Filters / Chest / Back / Legs / Barbell / Dumbbell) — one active in `primary`. **Alphabetised sections** (letter headers in `faint`) of `card`-grouped rows: equipment glyph in a `bg-muted` 36px tile, name (14px), muscle **Badge** (`secondary`), chevron. Library tab active in bottom nav.

### 4. Exercise Library — Detail  · same file (block A2)
- Back / title / star header. **Hero:** 56px `bg-muted` equipment tile + name (Title 24px) + "Weight × Reps · Barbell". **Worked muscles** card: Primary (bold value) over a hairline, Secondary as `secondary` Badges. *(Muscle "map" is a tag taxonomy, not an anatomy drawing — if a visual body map is wanted, wire a real image asset, don't SVG it.)* **Last 3 sessions** card: date + "top set" + result numeral (20px metric) per row, with a `primary` **PB 82.5 × 6** marker in the section header. Bottom-anchored actions: `primary` **Add to Session** + outline **Add to Template**.

### 5. Template Editor  · same file (block B)
- Cancel / "Edit Template" / Done header. Big **name field** (`bg-card`, 52px, 18px bold) + "N exercises · ~52 min" line. **Reorderable exercise rows** (`bg-elevated`, `shadow-soft`): drag handle, name, and a compact target readout — **Sets×Reps** (`4×8` 17px metric) | **Target** (`80kg`) | **Rest** (`90s`), hairline-separated, each with a 9.5px uppercase label; a ⋮ to edit. Bottom-anchored: outline **Add exercise** + `primary` **Save Template**.

---

## Interactions & Behavior
- **Press feedback:** every button scales to `0.97` over 120ms (`ease-tap`).
- **Log set → rest handoff (signature):** pressing **Log set** appends the new set row with a `stamp` animation (scale 1.08→1, opacity in) AND restarts the rest timer into its running state. Logging flows straight into resting.
- **Rest timer:** counts down 1s/linear; bar/ring width = `remaining/total`; at 0 → "done" success pulse for ~1.9s → auto-reset to idle. Skip → idle. ±15 adjusts total. (Design implies a beep/haptic at zero.)
- **Duration timer:** counts up while running; Pause → `warning` "Paused" state; Resume → `primary`.
- **RPE:** single-select, **deselectable** (tap selected again to clear).
- **Bottom sheet:** slides up 360ms `ease-sheet`, dim backdrop, tap-out or close to dismiss.
- **PB moment (signature):** when a logged set beats the record, the numeral count-ups and turns `primary`, and a small "NEW PB" tag snaps in (`pbpop` 420ms).
- **Set complete (signature):** row tints `success`/low-alpha + a hairline check draws + numeral stamps.
- **Exercise cards:** collapse/expand via chevron; drag handle implies reorder (implement with the codebase's DnD lib, e.g. dnd-kit).

## State Management
- **Session:** `{ id, name, startedAt, status: live|paused|done, performedOn, bodyweight, note, exercises[] }`; derived `elapsed` (tick 1s while live).
- **Exercise-in-session:** `{ exerciseId, name, kind, sets[] }`; `kind` ∈ the 8 metric types and drives which form inputs render.
- **Set:** `{ weight?, reps?, time?, distance?, rpe?, warmup: bool, note?, isPB?: bool }`.
- **Rest timer (per exercise card):** `{ mode: idle|running|done, total, remaining }`; `logSet()` pushes a set and sets `mode=running, remaining=total`.
- **Library:** exercise list + active filter chips + search query. **Template:** `{ name, items: [{exerciseId, targetSets, targetReps, targetWeight, restSec}] }` (reorderable).
- "Previous performance" (`prev N` greyed targets) is a **planned enhancement** — the layout already reserves space; wire it to the user's last logged set for that exercise when available.

## Component → shadcn/ui Mapping
Full version with class overrides is in **`Ledger — Handoff.html` §03**. Summary:
- **Button** → `Button`. Primary CTA = `variant="default"` `bg-primary` full-width `h-[52px] rounded-lg shadow-cta`; Secondary = `variant="outline"` `border-border-strong`; Ghost/Destructive 1:1; Icon = `size="icon"` 44×44. Add `active:scale-[0.97]` globally.
- **Card** → `Card` (`bg-card border rounded-lg shadow-soft`); focal/sheet = `bg-elevated`.
- **Input / Switch** → `Input` (`bg-muted rounded-md h-12 ring-ring`), `Switch` (checked `bg-primary`). **Number stepper is composed** (two icon Buttons + a `.metric` value), not stock.
- **RPE** → `ToggleGroup type="single"` (deselectable).
- **Bottom sheet** → `Drawer` (vaul): `DrawerContent bg-elevated rounded-t-xl` + grabber. `Dialog` only for destructive confirms.
- **Segmented controls** → `Tabs` (pill `TabsList bg-muted`, active trigger `bg-card shadow-soft`). **Bottom nav is NOT Tabs — build a custom fixed bar.**
- **Badge** → muscle/equipment = `variant="secondary"` (`bg-muted`); PB = `default` (`bg-primary`); add a `success` variant for streaks.
- **Build custom (the brand, no substitute):** set-logging row, rest timer, live duration timer, and the oversized metric numerals (`.metric` + `font-mono` for countdowns).

## Assets
- **No raster/vector brand assets required.** Icons are **Lucide** (24px, stroke ~1.85, `currentColor`) — install `lucide-react` rather than copying the inline SVGs in the prototypes. Avatar is initials text.
- Fonts: **Inter** + **JetBrains Mono** (Google Fonts, or `next/font`).
- There is **no muscle-map image**; if you decide to add a visual body map later, source a licensed anatomical asset.

## Files
All in this folder — open in a browser to view the live design (each has a Volt/Ember accent toggle; ship **Volt**):
- `Ledger — Handoff.html` — **start here.** Tailwind v4 `globals.css` (copy §01), full tokens table, shadcn mapping.
- `Ledger — Style Guide.html` — foundations rationale: color, type, spacing, radius, elevation, motion (with live demos).
- `Ledger — Components.html` — every core component in light + dark with live controls.
- `Ledger — Dashboard.html` — Today screen.
- `Ledger — Live Session.html` — core logging screen (interactive timers, log→rest handoff).
- `Ledger — Library & Templates.html` — Library list + detail and Template Editor.
