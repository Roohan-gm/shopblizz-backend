import dotenv from "dotenv";
import app from "./app.js";
import connectToDatabase from "./database/index.js";

dotenv.config({
  path: "./env",
});

const port = process.env.PORT || 8000;

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log("Server is running on port: ", port);
    });
    app.on("error", (error) => {
      console.error("Server error:", error);
      throw error;
    });
  })
  .catch((error) => {
    console.error("Failed to connect the database", error);
  });
