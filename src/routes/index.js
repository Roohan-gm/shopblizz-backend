import { Router } from "express";
import userRoutes from "../routes/user.route.js";
import productRoutes from "../routes/product.route.js";
import orderRoutes from "../routes/order.route.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

export default router;
