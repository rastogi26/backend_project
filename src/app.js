import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// .use is used to set config & middleware
// and in cors we can also used options as it accepts object

app.use(
  cors({
    //origin helps to specify from which we are accepting requests from frontend
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

/*To set a limit on json data , to avoid the unlimited json data incoming as server might crash  (STARTS)*/

//accepts json data from form with a limit of 16kb
app.use(express.json({ limit: "16kb" }));
//accpects data from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//static is used to store the files,folders,pdfs,images on our server , in this it is stored in public folder
app.use(express.static("public"));

app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"

//routes declaration

// https://localhost:8000/api/v1/users/
app.use("/api/v1/users", userRouter); // when hit on /users -> userRouter file -> performs function
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos",videoRouter)

export { app };
