-- 20260512000008_seed_exercises.sql
-- System exercise library (owner_user_id IS NULL). Curated starter set
-- covering every metric_kind so volume formulas have real-world coverage.

-- BARBELL COMPOUNDS -------------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Back Squat',            'weight_reps','quads',     '{glutes,hamstrings,lower_back,abs}'::muscle_group[],  '{barbell,squat_rack,plates}'::equipment_type[],            180),
('Front Squat',           'weight_reps','quads',     '{glutes,abs}'::muscle_group[],                        '{barbell,squat_rack,plates}'::equipment_type[],            180),
('Conventional Deadlift', 'weight_reps','hamstrings','{glutes,lower_back,lats,traps,forearms}'::muscle_group[], '{barbell,plates}'::equipment_type[],                   240),
('Romanian Deadlift',     'weight_reps','hamstrings','{glutes,lower_back,forearms}'::muscle_group[],        '{barbell,plates}'::equipment_type[],                       150),
('Bench Press',           'weight_reps','chest',     '{triceps,shoulders}'::muscle_group[],                 '{barbell,bench,plates}'::equipment_type[],                 150),
('Incline Bench Press',   'weight_reps','chest',     '{shoulders,triceps}'::muscle_group[],                 '{barbell,incline_bench,plates}'::equipment_type[],         150),
('Overhead Press',        'weight_reps','shoulders', '{triceps,abs}'::muscle_group[],                       '{barbell,plates}'::equipment_type[],                       150),
('Bent-over Row',         'weight_reps','back',      '{lats,biceps,lower_back}'::muscle_group[],            '{barbell,plates}'::equipment_type[],                       120),
('Pendlay Row',           'weight_reps','back',      '{lats,biceps,lower_back}'::muscle_group[],            '{barbell,plates}'::equipment_type[],                       120),
('Hip Thrust',            'weight_reps','glutes',    '{hamstrings}'::muscle_group[],                        '{barbell,bench,plates}'::equipment_type[],                 120);

-- DUMBBELL ----------------------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Dumbbell Bench Press',                'weight_reps','chest',     '{triceps,shoulders}'::muscle_group[],  '{dumbbell,bench}'::equipment_type[],                  120),
('Incline Dumbbell Press',              'weight_reps','chest',     '{shoulders,triceps}'::muscle_group[],  '{dumbbell,incline_bench}'::equipment_type[],          120),
('Dumbbell Shoulder Press',             'weight_reps','shoulders', '{triceps}'::muscle_group[],            '{dumbbell,bench}'::equipment_type[],                  120),
('Lateral Raise',                       'weight_reps','shoulders', '{}'::muscle_group[],                   '{dumbbell}'::equipment_type[],                        60),
('Rear Delt Fly',                       'weight_reps','shoulders', '{back}'::muscle_group[],               '{dumbbell}'::equipment_type[],                        60),
('Dumbbell Row',                        'weight_reps','back',      '{lats,biceps}'::muscle_group[],        '{dumbbell,bench}'::equipment_type[],                  90),
('Dumbbell RDL',                        'weight_reps','hamstrings','{glutes,lower_back}'::muscle_group[],  '{dumbbell}'::equipment_type[],                        90),
('Dumbbell Bicep Curl',                 'weight_reps','biceps',    '{forearms}'::muscle_group[],           '{dumbbell}'::equipment_type[],                        60),
('Hammer Curl',                         'weight_reps','biceps',    '{forearms}'::muscle_group[],           '{dumbbell}'::equipment_type[],                        60),
('Dumbbell Overhead Tricep Extension',  'weight_reps','triceps',   '{}'::muscle_group[],                   '{dumbbell}'::equipment_type[],                        60),
('Goblet Squat',                        'weight_reps','quads',     '{glutes,abs}'::muscle_group[],         '{dumbbell}'::equipment_type[],                        90),
('Bulgarian Split Squat',               'weight_reps','quads',     '{glutes,hamstrings}'::muscle_group[],  '{dumbbell,bench}'::equipment_type[],                  90);

-- BODYWEIGHT --------------------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Push-up',           'bodyweight_reps','chest',     '{triceps,shoulders}'::muscle_group[],  '{bodyweight}'::equipment_type[],            60),
('Diamond Push-up',   'bodyweight_reps','triceps',   '{chest,shoulders}'::muscle_group[],    '{bodyweight}'::equipment_type[],            60),
('Pull-up',           'bodyweight_reps','lats',      '{biceps,back}'::muscle_group[],        '{pull_up_bar}'::equipment_type[],           120),
('Chin-up',           'bodyweight_reps','biceps',    '{lats,back}'::muscle_group[],          '{pull_up_bar}'::equipment_type[],           120),
('Inverted Row',      'bodyweight_reps','back',      '{biceps,lats}'::muscle_group[],        '{barbell,squat_rack}'::equipment_type[],    90),
('Bodyweight Squat',  'bodyweight_reps','quads',     '{glutes}'::muscle_group[],             '{bodyweight}'::equipment_type[],            45),
('Lunge',             'bodyweight_reps','quads',     '{glutes,hamstrings}'::muscle_group[],  '{bodyweight}'::equipment_type[],            60),
('Pistol Squat',      'bodyweight_reps','quads',     '{glutes,abs}'::muscle_group[],         '{bodyweight}'::equipment_type[],            90),
('Dip',               'bodyweight_reps','triceps',   '{chest,shoulders}'::muscle_group[],    '{dip_bar}'::equipment_type[],               90),
('Hanging Leg Raise', 'bodyweight_reps','abs',       '{obliques}'::muscle_group[],           '{pull_up_bar}'::equipment_type[],           60);

-- WEIGHTED BODYWEIGHT ----------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Weighted Pull-up', 'weighted_bodyweight_reps','lats',    '{biceps,back}'::muscle_group[],       '{pull_up_bar,plates}'::equipment_type[],   150),
('Weighted Dip',     'weighted_bodyweight_reps','triceps', '{chest,shoulders}'::muscle_group[],   '{dip_bar,plates}'::equipment_type[],       120);

-- MACHINES & CABLES (weight_reps) ----------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Lat Pulldown',          'weight_reps','lats',      '{biceps,back}'::muscle_group[],         '{pulldown_machine,cable_machine}'::equipment_type[], 90),
('Cable Row',             'weight_reps','back',      '{lats,biceps}'::muscle_group[],         '{cable_machine}'::equipment_type[],                  90),
('Cable Tricep Pushdown', 'weight_reps','triceps',   '{}'::muscle_group[],                    '{cable_machine}'::equipment_type[],                  60),
('Cable Bicep Curl',      'weight_reps','biceps',    '{forearms}'::muscle_group[],            '{cable_machine}'::equipment_type[],                  60),
('Face Pull',             'weight_reps','shoulders', '{back}'::muscle_group[],                '{cable_machine}'::equipment_type[],                  60),
('Leg Press',             'weight_reps','quads',     '{glutes,hamstrings}'::muscle_group[],   '{leg_press,plates}'::equipment_type[],               120),
('Leg Extension',         'weight_reps','quads',     '{}'::muscle_group[],                    '{leg_extension}'::equipment_type[],                  60),
('Lying Leg Curl',        'weight_reps','hamstrings','{}'::muscle_group[],                    '{leg_curl}'::equipment_type[],                       60),
('Standing Calf Raise',   'weight_reps','calves',    '{}'::muscle_group[],                    '{plates,bodyweight}'::equipment_type[],              45),
('Hack Squat',            'weight_reps','quads',     '{glutes}'::muscle_group[],              '{hack_squat,plates}'::equipment_type[],              120);

-- TIME-BASED --------------------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Plank',         'time_only',   'abs',       '{obliques,lower_back}'::muscle_group[],     '{bodyweight}'::equipment_type[],  60),
('Side Plank',    'time_only',   'obliques',  '{abs}'::muscle_group[],                     '{bodyweight}'::equipment_type[],  60),
('Wall Sit',      'time_only',   'quads',     '{}'::muscle_group[],                        '{bodyweight}'::equipment_type[],  60),
('Dead Hang',     'time_only',   'forearms',  '{lats,back}'::muscle_group[],               '{pull_up_bar}'::equipment_type[], 60),
('Farmers Carry', 'time_weight', 'full_body', '{forearms,traps}'::muscle_group[],          '{dumbbell}'::equipment_type[],    90);

-- DISTANCE / CARDIO -------------------------------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Run',             'distance_only', 'cardio', '{quads,hamstrings,glutes}'::muscle_group[],     '{bodyweight}'::equipment_type[],     120),
('Treadmill Run',   'distance_only', 'cardio', '{quads,hamstrings,glutes}'::muscle_group[],     '{treadmill}'::equipment_type[],      120),
('Stationary Bike', 'distance_time', 'cardio', '{quads,hamstrings,glutes}'::muscle_group[],     '{stationary_bike}'::equipment_type[], 120),
('Rowing Machine',  'distance_time', 'cardio', '{back,lats,quads,hamstrings}'::muscle_group[],  '{rowing_machine}'::equipment_type[], 120),
('Elliptical',      'distance_time', 'cardio', '{quads,hamstrings,glutes}'::muscle_group[],     '{elliptical}'::equipment_type[],     120),
('Swimming',        'distance_time', 'cardio', '{full_body}'::muscle_group[],                   '{swimming_pool}'::equipment_type[],  120),
('Jump Rope',       'time_only',     'cardio', '{calves,shoulders,forearms}'::muscle_group[],   '{jump_rope}'::equipment_type[],      60);

-- NONE (stretching, foam rolling, etc.) ----------------------------
insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds) values
('Foam Roll Quads',       'none', 'quads',     '{}'::muscle_group[], '{foam_roller}'::equipment_type[], 0),
('Foam Roll Upper Back',  'none', 'back',      '{}'::muscle_group[], '{foam_roller}'::equipment_type[], 0),
('Hip Flexor Stretch',    'none', 'full_body', '{}'::muscle_group[], '{bodyweight}'::equipment_type[],  0);
