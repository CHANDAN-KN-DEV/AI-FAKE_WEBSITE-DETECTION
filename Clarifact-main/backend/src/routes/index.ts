import { Router } from "express";
import { authRouter } from "./auth";
import { claimsRouter } from "./claims";
import { aiRouter } from "./ai";
import { communityRouter } from "./community";
import { expertsRouter } from "./experts";
import { adminRouter } from "./admin";
import { consensusRouter } from "./consensus";
import { correctionsRouter } from "./corrections";
import { dashboardRouter } from "./dashboard";
import { featuredRouter } from "./featured";
import { i18nRouter } from "./i18n";
import { communityPostsRouter } from "./communityPosts";
import { authorityRouter } from "./authority";

export const apiRouter = Router();

// Route modules are mounted here as they are implemented.
apiRouter.get("/", (_req, res) => {
  res.json({ name: "Clarifact API", status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/claims", claimsRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/experts", expertsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/consensus", consensusRouter);
apiRouter.use("/corrections", correctionsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/featured", featuredRouter);
apiRouter.use("/i18n", i18nRouter);
apiRouter.use("/community-posts", communityPostsRouter);
apiRouter.use("/authority", authorityRouter);

