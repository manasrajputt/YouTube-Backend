import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.js";
import subscriptionRouter from "./routes/subscription.js";
import videoRouter from "./routes/video.js";
import likeRouter from "./routes/like.js";
import commentRouter from "./routes/comment.js";
import tweetRouter from "./routes/tweet.js";
import dashboardRouter from "./routes/dashboard.js";
import playlistRouter from "./routes/playlist.js";
import healthChecktRouter from "./routes/healthCheck.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/healthCheck", healthChecktRouter);

export { app };
