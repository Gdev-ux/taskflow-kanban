-- TaskFlow seed data
-- Run with: pnpm seed
-- (Requires DATABASE_URL in your environment and tables created via `pnpm --filter @workspace/db run push`)

TRUNCATE TABLE comments, activity, tasks, members RESTART IDENTITY CASCADE;

INSERT INTO members (name, initials, color, role, online) VALUES
  ('Alex Kim', 'AK', '#a78bfa', 'Engineering Lead', true),
  ('Sara Mendez', 'SM', '#f472b6', 'Product Designer', true),
  ('John Diaz', 'JD', '#60a5fa', 'Backend Engineer', true),
  ('Priya Rao', 'PR', '#34d399', 'QA Lead', true),
  ('Noah Park', 'NP', '#fbbf24', 'Frontend Engineer', false);

INSERT INTO tasks (title, description, priority, status, assignee_id, due_date, tags, position) VALUES
  ('Design database schema', 'Entity-relationship diagram for users, tasks, teams, and comments. Decide on UUID vs serial keys.', 'high', 'todo', 1, '2026-05-08', ARRAY['Backend','DB'], 1),
  ('Setup CI/CD pipeline', 'GitHub Actions for build, test, and Docker deploy. Cache pnpm dependencies.', 'medium', 'todo', 3, '2026-05-15', ARRAY['DevOps'], 2),
  ('OAuth integration', 'Google + GitHub sign-in with JWT refresh tokens and PKCE.', 'high', 'todo', 4, '2026-05-04', ARRAY['Auth','Backend'], 3),
  ('Email notifications service', 'Daily digest + assignment notifications via Resend.', 'low', 'todo', 5, '2026-05-22', ARRAY['Backend','Email'], 4),

  ('Kanban board UI', 'Drag-and-drop columns with optimistic updates and motion polish.', 'high', 'inprogress', 2, '2026-05-02', ARRAY['Frontend'], 1),
  ('Real-time activity feed', 'Server-sent events to push moves and comments to all connected clients.', 'medium', 'inprogress', 1, '2026-05-12', ARRAY['Backend','Realtime'], 2),
  ('Mobile responsive pass', 'Audit board, calendar, and reports on phone widths.', 'medium', 'inprogress', 5, '2026-05-09', ARRAY['Frontend','Mobile'], 3),

  ('User registration API', 'POST /auth/register with bcrypt and rate limiting on signup endpoint.', 'low', 'review', 3, '2026-04-28', ARRAY['Backend','Auth'], 1),
  ('Reports analytics page', 'Workload bars, status breakdown, completion trends.', 'medium', 'review', 2, '2026-04-30', ARRAY['Frontend','Analytics'], 2),

  ('Project scaffolding', 'pnpm monorepo with frontend + backend workspaces and shared schema.', 'low', 'done', 2, '2026-04-10', ARRAY['Setup'], 1),
  ('Docker Compose stack', 'Node + Postgres + Redis services for local dev.', 'medium', 'done', 4, '2026-04-14', ARRAY['DevOps'], 2),
  ('Tailwind v4 migration', 'Move tokens to CSS variables; ship dark theme.', 'low', 'done', 5, '2026-04-19', ARRAY['Frontend','Design'], 3),
  ('Kickoff & sprint plan', 'Two-week sprint cadence agreed with the team.', 'medium', 'done', 1, '2026-04-08', ARRAY['Planning'], 4);

INSERT INTO comments (task_id, author_id, author_name, text, created_at) VALUES
  (1, 2, 'Sara Mendez', 'Use PostgreSQL with UUID keys — easier when we shard later.', NOW() - interval '2 hours'),
  (1, 1, 'Alex Kim', 'Agreed on UUID. Let me draft the ERD by EOD.', NOW() - interval '1 hour'),
  (5, 1, 'Alex Kim', 'Use dnd-kit for drag support. Optimistic updates required.', NOW() - interval '90 minutes'),
  (5, 2, 'Sara Mendez', 'Cards should lift slightly on hover before drag — feels nicer.', NOW() - interval '40 minutes'),
  (8, 4, 'Priya Rao', 'Looks good — just add rate limiting on the signup endpoint.', NOW() - interval '30 minutes'),
  (9, 1, 'Alex Kim', 'Recharts is in the bundle, go for stacked bars on workload.', NOW() - interval '20 minutes');

INSERT INTO activity (kind, task_id, task_title, actor_name, actor_color, message, created_at) VALUES
  ('created', 1, 'Design database schema', 'Alex Kim', '#a78bfa', 'created "Design database schema"', NOW() - interval '5 hours'),
  ('moved', 5, 'Kanban board UI', 'Sara Mendez', '#f472b6', 'moved "Kanban board UI" to In Progress', NOW() - interval '3 hours'),
  ('commented', 1, 'Design database schema', 'Sara Mendez', '#f472b6', 'commented on "Design database schema"', NOW() - interval '2 hours'),
  ('moved', 8, 'User registration API', 'Priya Rao', '#34d399', 'moved "User registration API" to Review', NOW() - interval '90 minutes'),
  ('completed', 12, 'Tailwind v4 migration', 'Noah Park', '#fbbf24', 'completed "Tailwind v4 migration"', NOW() - interval '70 minutes'),
  ('commented', 5, 'Kanban board UI', 'Alex Kim', '#a78bfa', 'commented on "Kanban board UI"', NOW() - interval '40 minutes'),
  ('created', 4, 'Email notifications service', 'Noah Park', '#fbbf24', 'created "Email notifications service"', NOW() - interval '25 minutes'),
  ('commented', 9, 'Reports analytics page', 'Alex Kim', '#a78bfa', 'commented on "Reports analytics page"', NOW() - interval '20 minutes');
