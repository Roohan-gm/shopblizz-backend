import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addProduct,
  getAllAvailableProducts,
  getAllProducts,
  getAllProductsWithAdminAccess,
  getCategories,
  getProduct,
  getProductsByCategory,
  removeProduct,
  restoreDeletedProducts,
  toggleProductAvailability,
  updateProductImage,
  updateStock,
} from "../controllers/product.controller.js";

const router = Router();

//public routes
router.route("/").get(getAllAvailableProducts);
router.route("/all").get(getAllProducts);
router.route("/category/:category").get(getProductsByCategory);
router.route("/categories").get(getCategories);
router.route("/:id").get(getProduct);

//admin routes
router
  .route("/")
  .post(verifyJWT, verifyAdmin, upload.single("images"), addProduct);
router
  .route("/:id/image")
  .patch(verifyJWT, verifyAdmin, upload.single("images"), updateProductImage);
router
  .route("/:id/toggle-availability")
  .patch(verifyJWT, verifyAdmin, toggleProductAvailability);
router.route("/:id/stock").patch(verifyJWT, verifyAdmin, updateStock);
router.route("/:id").delete(verifyJWT, verifyAdmin, removeProduct);
router
  .route("/:id/restore")
  .patch(verifyJWT, verifyAdmin, restoreDeletedProducts);
router
  .route("/admin/all")
  .get(verifyJWT, verifyAdmin, getAllProductsWithAdminAccess);

export default router;
