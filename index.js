import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import { connectDB } from "./db/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { actorRouter } from "./routes/actor.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { movieRouter } from "./routes/movie.routes.js";
import { pagesRouter } from "./routes/pages.routes.js";
import { reviewRouter } from "./routes/review.routes.js";

try {
  process.loadEnvFile();
} catch {

}

const app = express();

app.use((req, res, next) => {
  console.log(new Date().toLocaleString(), req.method, req.url);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(import.meta.dirname, "uploads")));

app.use("/auth", authRouter);
app.use("/api/movies", movieRouter);
app.use("/api/actors", actorRouter);
app.use("/api/reviews", reviewRouter);

app.use(pagesRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

await connectDB();

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
