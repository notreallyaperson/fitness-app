-- 20260530000003_muscle_group_add_hip_values.sql
-- Add hip/groin muscle groups. These must be committed before any later
-- migration can reference them (Postgres forbids using a newly added enum
-- value in the same transaction), so applying them lives in a later migration.

alter type muscle_group add value if not exists 'adductors';
alter type muscle_group add value if not exists 'abductors';
alter type muscle_group add value if not exists 'groin';
