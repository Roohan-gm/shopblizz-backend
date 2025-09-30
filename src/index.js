import dotenv from "dotenv";
import app from "./app.js";
import connectToDatabase from "./database/index.js";
import cron from "node-cron";
import { cleanupDeleteProduct } from "./jobs/cleanupDeletedProducts.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connectToDatabase()
  .then(() => {
    cron.schedule("0 2 * * *", async () => {
      console.log("Running daily cleanup job from soft-deleted products...");
      try {
        await cleanupDeleteProduct();
      } catch (error) {
        console.log("Error while performing daily clean up");
      }
    });

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
