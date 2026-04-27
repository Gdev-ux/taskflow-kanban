import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  tasksTable,
  activityTable,
  membersTable,
} from "@workspace/db";
import {
  GetBoardSummaryResponse,
  GetBoardActivityQueryParams,
  GetBoardActivityResponse,
  GetBoardWorkloadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get(
  "/board/summary",
  async (_req: Request, res: Response): Promise<void> => {
    const allTasks = await db.select().from(tasksTable);

    const byStatus = { todo: 0, inprogress: 0, review: 0, done: 0 };
    const byPriority = { high: 0, medium: 0, low: 0 };
    const today = todayIso();
    let overdue = 0;
    let dueSoon = 0;
    let completedThisWeek = 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysIso = sevenDays.toISOString().slice(0, 10);

    for (const t of allTasks) {
      if (t.status in byStatus) {
        byStatus[t.status as keyof typeof byStatus]++;
      }
      if (t.priority in byPriority) {
        byPriority[t.priority as keyof typeof byPriority]++;
      }
      if (t.dueDate && t.status !== "done") {
        if (t.dueDate < today) overdue++;
        else if (t.dueDate <= sevenDaysIso) dueSoon++;
      }
      if (t.status === "done" && t.updatedAt >= weekAgo) {
        completedThisWeek++;
      }
    }

    const total = allTasks.length;
    const completionRate = total > 0 ? byStatus.done / total : 0;

    res.json(
      GetBoardSummaryResponse.parse({
        total,
        completionRate,
        overdue,
        dueSoon,
        completedThisWeek,
        byStatus,
        byPriority,
      }),
    );
  },
);

router.get(
  "/board/activity",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetBoardActivityQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const limit = params.data.limit ?? 10;
    const rows = await db
      .select()
      .from(activityTable)
      .orderBy(desc(activityTable.createdAt))
      .limit(limit);
    res.json(
      GetBoardActivityResponse.parse(
        rows.map((a) => ({
          ...a,
          id: String(a.id),
          createdAt: a.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.get(
  "/board/workload",
  async (_req: Request, res: Response): Promise<void> => {
    const members = await db.select().from(membersTable).orderBy(membersTable.id);
    const today = todayIso();

    const result = [];
    for (const m of members) {
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(eq(tasksTable.assigneeId, m.id));

      const [{ done }] = await db
        .select({ done: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(and(eq(tasksTable.assigneeId, m.id), eq(tasksTable.status, "done")));

      const [{ overdue }] = await db
        .select({ overdue: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.assigneeId, m.id),
            lte(tasksTable.dueDate, today),
            // not done
            sql`${tasksTable.status} <> 'done'`,
            // has due date
            sql`${tasksTable.dueDate} is not null`,
            gte(sql`1`, sql`1`),
          ),
        );

      result.push({
        member: m,
        total,
        active: total - done,
        done,
        overdue,
      });
    }

    res.json(GetBoardWorkloadResponse.parse(result));
  },
);

export default router;
