import dotenv from "dotenv";
import app from "./app.js";
import connectToDatabase from "./database/index.js";
import cron from "node-cron";
import { cleanupDeleteProduct } from "./jobs/cleanupDeletedProducts.js";
import { buildAdminRouter } from "./admin/admin.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connectToDatabase()
  .then(() => {
    const { adminRouter, admin } = buildAdminRouter();
    app.use(admin.options.rootPath, adminRouter);

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
      console.log(
        `Admin available at http://localhost:${port}${admin.options.rootPath}`
      );
    });

    app.on("error", (error) => {
      console.error("Server error:", error);
      throw error;
    });
  })
  .catch((error) => {
    console.error("Failed to connect the database", error);
  });
