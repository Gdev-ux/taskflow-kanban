import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  tasksTable,
  commentsTable,
  activityTable,
  membersTable,
} from "@workspace/db";
import {
  ListTasksQueryParams,
  ListTasksResponse,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  MoveTaskParams,
  MoveTaskBody,
  MoveTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function serializeTask(taskRow: typeof tasksTable.$inferSelect) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commentsTable)
    .where(eq(commentsTable.taskId, taskRow.id));
  return {
    ...taskRow,
    dueDate: taskRow.dueDate ?? null,
    commentCount: count,
    createdAt: taskRow.createdAt.toISOString(),
    updatedAt: taskRow.updatedAt.toISOString(),
  };
}

async function serializeMany(rows: (typeof tasksTable.$inferSelect)[]) {
  if (rows.length === 0) return [];
  const counts = await db
    .select({
      taskId: commentsTable.taskId,
      count: sql<number>`count(*)::int`,
    })
    .from(commentsTable)
    .groupBy(commentsTable.taskId);
  const map = new Map(counts.map((c) => [c.taskId, c.count]));
  return rows.map((r) => ({
    ...r,
    dueDate: r.dueDate ?? null,
    commentCount: map.get(r.id) ?? 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

async function logActivity(
  kind: "created" | "moved" | "commented" | "completed",
  task: typeof tasksTable.$inferSelect,
  actorName: string,
  actorColor: string,
  message: string,
): Promise<void> {
  await db.insert(activityTable).values({
    kind,
    taskId: task.id,
    taskTitle: task.title,
    actorName,
    actorColor,
    message,
  });
}

async function actorContext(assigneeId: number | null | undefined) {
  if (assigneeId == null) {
    return { name: "You", color: "#6c63ff" };
  }
  const [m] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.id, assigneeId));
  if (!m) return { name: "You", color: "#6c63ff" };
  return { name: m.name, color: m.color };
}

router.get("/tasks", async (req: Request, res: Response): Promise<void> => {
  const params = ListTasksQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, status, assigneeId } = params.data;
  const filters = [];
  if (status) filters.push(eq(tasksTable.status, status));
  if (assigneeId != null) filters.push(eq(tasksTable.assigneeId, assigneeId));
  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    filters.push(
      or(ilike(tasksTable.title, term), ilike(tasksTable.description, term))!,
    );
  }

  const rows = await db
    .select()
    .from(tasksTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(tasksTable.position), desc(tasksTable.createdAt));

  const data = await serializeMany(rows);
  res.json(ListTasksResponse.parse(data));
});

router.post("/tasks", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [{ maxPos }] = await db
    .select({
      maxPos: sql<number>`coalesce(max(${tasksTable.position}), 0)::int`,
    })
    .from(tasksTable)
    .where(eq(tasksTable.status, parsed.data.status));

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      priority: parsed.data.priority,
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId ?? null,
      dueDate: parsed.data.dueDate ?? null,
      tags: parsed.data.tags ?? [],
      position: maxPos + 1,
    })
    .returning();

  const actor = await actorContext(task.assigneeId);
  await logActivity(
    "created",
    task,
    actor.name,
    actor.color,
    `created "${task.title}"`,
  );

  const data = await serializeTask(task);
  res.status(201).json(GetTaskResponse.parse({ ...data, comments: [] }));
});

router.get("/tasks/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.taskId, task.id))
    .orderBy(asc(commentsTable.createdAt));

  const data = await serializeTask(task);
  res.json(
    GetTaskResponse.parse({
      ...data,
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    }),
  );
});

router.patch(
  "/tasks/:id",
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const update: Partial<typeof tasksTable.$inferInsert> = {};
    if (parsed.data.title !== undefined) update.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      update.description = parsed.data.description;
    if (parsed.data.priority !== undefined)
      update.priority = parsed.data.priority;
    if (parsed.data.status !== undefined) update.status = parsed.data.status;
    if (parsed.data.assigneeId !== undefined)
      update.assigneeId = parsed.data.assigneeId;
    if (parsed.data.dueDate !== undefined) update.dueDate = parsed.data.dueDate;
    if (parsed.data.tags !== undefined) update.tags = parsed.data.tags;

    const [task] = await db
      .update(tasksTable)
      .set(update)
      .where(eq(tasksTable.id, params.data.id))
      .returning();

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const data = await serializeTask(task);
    res.json(UpdateTaskResponse.parse(data));
  },
);

router.patch(
  "/tasks/:id/move",
  async (req: Request, res: Response): Promise<void> => {
    const params = MoveTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = MoveTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    let position = parsed.data.position;
    if (position == null) {
      const [{ maxPos }] = await db
        .select({
          maxPos: sql<number>`coalesce(max(${tasksTable.position}), 0)::int`,
        })
        .from(tasksTable)
        .where(eq(tasksTable.status, parsed.data.status));
      position = maxPos + 1;
    }

    const [task] = await db
      .update(tasksTable)
      .set({ status: parsed.data.status, position })
      .where(eq(tasksTable.id, params.data.id))
      .returning();

    if (existing.status !== parsed.data.status) {
      const actor = await actorContext(task.assigneeId);
      const labels: Record<string, string> = {
        todo: "To Do",
        inprogress: "In Progress",
        review: "Review",
        done: "Done",
      };
      const kind: "moved" | "completed" =
        parsed.data.status === "done" ? "completed" : "moved";
      const message =
        parsed.data.status === "done"
          ? `completed "${task.title}"`
          : `moved "${task.title}" to ${labels[parsed.data.status] ?? parsed.data.status}`;
      await logActivity(kind, task, actor.name, actor.color, message);
    }

    const data = await serializeTask(task);
    res.json(MoveTaskResponse.parse(data));
  },
);

router.delete(
  "/tasks/:id",
  async (req: Request, res: Response): Promise<void> => {
    const params = DeleteTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    await db
      .delete(commentsTable)
      .where(eq(commentsTable.taskId, params.data.id));
    const [task] = await db
      .delete(tasksTable)
      .where(eq(tasksTable.id, params.data.id))
      .returning();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
