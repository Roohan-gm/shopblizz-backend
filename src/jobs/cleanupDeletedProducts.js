import { Product } from "../models/product.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const cleanupDeleteProduct = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);

    const oldDeletedProduct = await Product.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });
    if (oldDeletedProduct.length === 0) {
      console.log("No deleted products to cleanup");
      return;
    }

    console.log(
      `Found ${oldDeletedProduct.length} products to permanently delete.`
    );

    for (const product of oldDeletedProduct) {
      if (product.image?.public_id) {
        await deleteFromCloudinary(product.image.public_id);
        console.log(`Deleted image ${product.image.public_id}`);
      }

      await Product.deleteOne({ _id: product._id });
      console.log(`Permanently deleted product: ${product._id}`);
    }
    console.log("Cleanup job completed successfully.");
  } catch (error) {
    console.error("Error while doing daily cleanup", error);
  }
};
