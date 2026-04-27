# TaskFlow

A polished collaborative Kanban task management web app — drag-and-drop board, calendar view, reports dashboard, and an activity timeline. Dark theme by default.

## Tech stack

- **Monorepo:** pnpm workspaces
- **Frontend:** React + Vite + Tailwind v4 + wouter + TanStack Query + framer-motion + recharts
- **Backend:** Express 5 + Drizzle ORM + PostgreSQL
- **Shared API contract:** OpenAPI 3.1 → React Query hooks + Zod schemas (Orval codegen)

## Run it locally

### 1. Prerequisites

- Node.js 20+
- `pnpm` 9+ (`npm install -g pnpm`)
- A PostgreSQL database (local install, Docker, or a free hosted one such as [Neon](https://neon.tech))

### 2. Install dependencies

```bash
git clone https://github.com/Gdev-ux/taskflow-kanban.git
cd taskflow-kanban
pnpm install
```

### 3. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
SESSION_SECRET=replace-with-a-long-random-string
PORT=3000
```

### 4. Create the tables

```bash
pnpm db:push
```

### 5. Seed sample data (optional but recommended)

```bash
pnpm seed
```

This loads 5 team members, 13 sample tasks across the 4 columns, plus comments and activity.

### 6. Start the API and the web app

In two terminals:

```bash
# Terminal 1
pnpm dev:api
```

```bash
# Terminal 2
pnpm dev:web
```

Open the URL Vite prints (usually <http://localhost:5173>).

## Project layout

```
artifacts/
  taskflow/        React + Vite frontend
  api-server/      Express API
lib/
  api-spec/        OpenAPI 3.1 contract
  api-client-react/ Generated React Query hooks
  api-zod/         Generated Zod schemas
  db/              Drizzle schema and client
db/
  seed.sql         Sample data
scripts/
  seed.mjs         Loader for seed.sql
```

## Useful scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `pnpm dev:api`     | Start the Express API in watch mode           |
| `pnpm dev:web`     | Start the Vite frontend                       |
| `pnpm db:push`     | Sync the Drizzle schema with your database    |
| `pnpm seed`        | Populate the database with sample content     |
| `pnpm build`       | Type-check then build all workspaces          |
| `pnpm typecheck`   | Type-check the entire monorepo                |

## License

MIT
