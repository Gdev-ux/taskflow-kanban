# TaskFlow

Polished collaborative Kanban task management web app with a dark, focused workspace aesthetic.

## Architecture
- **Monorepo:** pnpm workspaces
- **Frontend:** React + Vite + Tailwind v4 + wouter + TanStack Query + framer-motion + recharts (artifact `taskflow` at `/`)
- **Backend:** Express 5 + Drizzle ORM + Postgres (artifact `api-server`)
- **API contract:** OpenAPI 3.1 in `lib/api-spec/openapi.yaml` → Orval codegen produces shared React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`)
- **Database:** Replit Postgres via `DATABASE_URL`

## Data model
- `members` — team members (name, initials, color, role, online)
- `tasks` — title, description, priority (high/medium/low), status (todo/inprogress/review/done), assignee, due date, tags, position
- `comments` — author + text per task
- `activity` — created / moved / commented / completed events

## Pages
- `/` Board — drag-and-drop Kanban across 4 status columns with stats strip and task detail modal
- `/calendar` — monthly grid showing tasks by due date
- `/reports` — completion rate, workload bars, status pie, recent activity
- `/activity` — timeline of board events grouped by day

## Notes
- Dark theme by default; no emojis (lucide-react icons throughout).
- Run `pnpm --filter @workspace/api-spec run codegen` after editing the OpenAPI spec.
- Run `pnpm --filter @workspace/db run db:push` after editing Drizzle schemas.
