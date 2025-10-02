import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByStatus,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();




// Admin routes (require authentication)
router.route("/customer").get(verifyJWT, verifyAdmin, getOrdersByCustomer);
router.route("/").get(verifyJWT, verifyAdmin, getAllOrders);
router.route("/:id/status").patch(verifyJWT, verifyAdmin, updateOrderStatus);
router.route("/status").get(verifyJWT, verifyAdmin, getOrdersByStatus);

// Public routes (no authentication required)
router.route("/").post(createOrder);
router.route("/:id").get(getOrderById);
// Cancel order - this can be done by both customer AND admin
// So we only need verifyJWT, not verifyAdmin
router.route("/:id/cancel").post(verifyJWT, cancelOrder);

export default router;
