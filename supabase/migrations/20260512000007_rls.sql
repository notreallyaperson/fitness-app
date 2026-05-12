-- 20260512000007_rls.sql
-- Row-level security: every user-owned table is scoped to auth.uid().
-- The exercises table additionally exposes system rows (owner_user_id IS NULL) to all signed-in users.

alter table profiles                   enable row level security;
alter table exercises                  enable row level security;
alter table workout_templates          enable row level security;
alter table workout_template_exercises enable row level security;
alter table sessions                   enable row level security;
alter table session_exercises          enable row level security;
alter table sets                       enable row level security;

-- profiles ---------------------------------------------------------
create policy profiles_self_select on profiles
  for select using (id = auth.uid());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- exercises --------------------------------------------------------
create policy exercises_visible on exercises
  for select using (owner_user_id is null or owner_user_id = auth.uid());
create policy exercises_owner_insert on exercises
  for insert with check (owner_user_id = auth.uid());
create policy exercises_owner_update on exercises
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy exercises_owner_delete on exercises
  for delete using (owner_user_id = auth.uid());

-- workout_templates -----------------------------------------------
create policy templates_owner_all on workout_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workout_template_exercises (scoped via parent template) ----------
create policy template_exercises_owner_all on workout_template_exercises
  for all using (
    exists (select 1 from workout_templates t
            where t.id = template_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from workout_templates t
            where t.id = template_id and t.user_id = auth.uid())
  );

-- sessions ---------------------------------------------------------
create policy sessions_owner_all on sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- session_exercises (scoped via parent session) --------------------
create policy session_exercises_owner_all on session_exercises
  for all using (
    exists (select 1 from sessions s
            where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );

-- sets (scoped via session_exercise -> session) --------------------
create policy sets_owner_all on sets
  for all using (
    exists (select 1 from session_exercises se
            join sessions s on s.id = se.session_id
            where se.id = session_exercise_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from session_exercises se
            join sessions s on s.id = se.session_id
            where se.id = session_exercise_id and s.user_id = auth.uid())
  );
