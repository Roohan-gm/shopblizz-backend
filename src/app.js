import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

import routes from "./routes/index.js";

app.use("/api/v1", routes);

export default app;
