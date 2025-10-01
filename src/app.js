import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import routes from "./routes/index.js";

app.get("/api/v1", (req, res) => {
  res.json({ message: "API is running!", version: "v1" });
});

app.use("/api/v1", routes);

export default app;
