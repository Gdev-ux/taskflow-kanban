import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  commentsTable,
  tasksTable,
  membersTable,
  activityTable,
} from "@workspace/db";
import {
  ListCommentsParams,
  ListCommentsResponse,
  CreateCommentParams,
  CreateCommentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get(
  "/tasks/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    const params = ListCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.taskId, params.data.id))
      .orderBy(asc(commentsTable.createdAt));
    res.json(
      ListCommentsResponse.parse(
        rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      ),
    );
  },
);

router.post(
  "/tasks/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    const params = CreateCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
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

    let authorName = "You";
    let actorColor = "#6c63ff";
    if (parsed.data.authorId != null) {
      const [m] = await db
        .select()
        .from(membersTable)
        .where(eq(membersTable.id, parsed.data.authorId));
      if (m) {
        authorName = m.name;
        actorColor = m.color;
      }
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({
        taskId: task.id,
        authorId: parsed.data.authorId ?? null,
        authorName,
        text: parsed.data.text,
      })
      .returning();

    await db.insert(activityTable).values({
      kind: "commented",
      taskId: task.id,
      taskTitle: task.title,
      actorName: authorName,
      actorColor,
      message: `commented on "${task.title}"`,
    });

    res.status(201).json({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    });
  },
);

export default router;
