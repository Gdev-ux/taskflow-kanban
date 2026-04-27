import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { ListMembersResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/members", async (_req, res): Promise<void> => {
  const rows = await db.select().from(membersTable).orderBy(membersTable.id);
  res.json(ListMembersResponse.parse(rows));
});

export default router;
