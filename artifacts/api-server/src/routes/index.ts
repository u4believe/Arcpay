import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usernameRouter from "./username";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usernameRouter);

export default router;
