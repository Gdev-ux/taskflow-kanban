import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import tasksRouter from "./tasks";
import commentsRouter from "./comments";
import boardRouter from "./board";

const router: IRouter = Router();

router.use(healthRouter);
router.use(membersRouter);
router.use(tasksRouter);
router.use(commentsRouter);
router.use(boardRouter);

export default router;
