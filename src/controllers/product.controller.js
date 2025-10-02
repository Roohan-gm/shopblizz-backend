import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Product } from "../models/product.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import {
  addProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../validations/product.validation.js";
import { getPaginatedProducts } from "../utils/pagination.js";

const addProduct = asyncHandler(async (req, res) => {
  // Convert string numbers to actual numbers
  const body = { ...req.body };
  if (typeof body.price === "string") {
    body.price = parseFloat(body.price);
  }
  if (typeof body.stockQuantity === "string") {
    body.stockQuantity = parseInt(body.stockQuantity, 10);
  }

  const result = addProductSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error?.errors?.[0]?.message || "Invalid input";
    throw new ApiError(400, errorMessage);
  }

  const { productName, description, category, price, stockQuantity } =
    result.data;

  const localProductImagePath = req.file?.path;
  if (!localProductImagePath) {
    throw new ApiError(400, "Product image is required");
  }

  const productImage = await uploadOnCloudinary(
    localProductImagePath,
    "productImage"
  );

  if (!productImage) {
    throw new ApiError(500, "Failed to upload product image on cloudinary");
  }

  const existingName = await Product.findOne({
    productName: productName.trim().toLowerCase(),
  });

  if (existingName) {
    throw new ApiError(409, "Product with this name already exists.");
  }

  const createdProduct = await Product.create({
    productName: productName.trim().toLowerCase(),
    description: description.trim(),
    category: category,
    price,
    stockQuantity,
    image: { url: productImage.url, public_id: productImage.public_id },
    isAvailable: true,
  });

  if (!createdProduct) {
    throw new ApiError(500, "Failed to create product.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdProduct, "product created successfully"));
});

const removeProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  const deletedProduct = await Product.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    }
  );

  if (!deletedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product was deleted successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const result = updateProductSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }
  const { productName, description, category, price, stockQuantity } =
    result.data;

  const updateFields = {};
  if (productName !== undefined)
    updateFields.productName = productName.trim().toLowerCase();
  if (description !== undefined) updateFields.description = description.trim();
  if (category !== undefined) updateFields.category = category;
  if (price !== undefined) updateFields.price = price;
  if (stockQuantity !== undefined) updateFields.stockQuantity = stockQuantity;

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: updateFields,
    },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const updateProductImage = asyncHandler(async (req, res) => {
  const localProductImagePath = req.file?.path;
  if (!localProductImagePath) {
    throw new ApiError(400, "Image is required");
  }

  const newProductImage = await uploadOnCloudinary(localProductImagePath);

  if (!newProductImage?.url || !newProductImage?.public_id) {
    throw new ApiError(500, "Failed while uploading product image");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  if (existingProduct.image?.public_id) {
    await deleteFromCloudinary(existingProduct.image.public_id);
  }

  const product = await Product.findByIdAndUpdate(
    id,
    {
      $set: {
        image: {
          url: newProductImage.url,
          public_id: newProductImage.public_id,
        },
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product image updated successfully"));
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const searchTerm = req.query.search?.trim();
  const categoryFilter = req.query.category?.trim();

  const filter = { isDeleted: false };
  if (searchTerm && searchTerm.length > 0) {
    filter.$or = [
      {
        productName: { $regex: searchTerm, $options: "i" },
      },
      {
        description: { $regex: searchTerm, $options: "i" },
      },
    ];
  }
  if (categoryFilter && categoryFilter.length > 0) {
    filter.category = categoryFilter.toLowerCase();
  }
  // Use pagination utility
  const { products, pagination } = await getPaginatedProducts(
    filter,
    page,
    limit
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination,
      },
      "Fetched all products successfully"
    )
  );
});

const getAllProductsWithAdminAccess = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const searchTerm = req.query.search?.trim();
  const categoryFilter = req.query.category?.trim();
  const showDeleted = req.query.showDeleted === "true";
  const showUnavailable = req.query.showUnavailable === "true";

  const filter = {
    ...(showDeleted ? {} : { isDeleted: false }),
    ...(showUnavailable ? {} : { isAvailable: true }),
  };

  if (searchTerm && searchTerm.length > 0) {
    filter.$or = [
      {
        productName: { $regex: searchTerm, $options: "i" },
      },
      {
        description: { $regex: searchTerm, $options: "i" },
      },
    ];
  }
  if (categoryFilter && categoryFilter.length > 0) {
    filter.category = categoryFilter.toLowerCase();
  }
  // Use pagination utility
  const { products, pagination } = await getPaginatedProducts(
    filter,
    page,
    limit
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination,
      },
      "Fetched all products successfully"
    )
  );
});

const getAllAvailableProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const searchTerm = req.query.search?.trim();
  const categoryFilter = req.query.category?.trim();

  const filter = { isAvailable: true, isDeleted: false };

  if (searchTerm && searchTerm.length > 0) {
    filter.$or = [
      {
        productName: { $regex: searchTerm, $options: "i" },
      },
      {
        description: { $regex: searchTerm, $options: "i" },
      },
    ];
  }

  if (categoryFilter && categoryFilter.length > 0) {
    filter.category = categoryFilter.toLowerCase();
  }

  // Use pagination utility
  const { products, pagination } = await getPaginatedProducts(
    filter,
    page,
    limit
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination,
      },
      "Available products fetched successfully"
    )
  );
});

const toggleProductAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const updateProduct = await Product.findByIdAndUpdate(
    id,
    [
      {
        $set: {
          isAvailable: { $not: "$isAvailable" },
        },
      },
    ],
    {
      new: true,
      runValidators: true,
    }
  ).select("isAvailable productName");
  if (!updateProduct) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        productName: updateProduct.productName,
        isAvailable: updateProduct.isAvailable,
      },
      `Product availability toggled to ${updateProduct.isAvailable}`
    )
  );
});

const updateStock = asyncHandler(async (req, res) => {
  const result = updateStockSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }

  const { stockQuantity } = result.data;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findByIdAndUpdate(
    id,
    {
      $set: {
        stockQuantity,
      },
    },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ApiError(404, "product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Stock quantity updated successfully"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  if (!category || typeof category !== "string") {
    throw new ApiError(400, "Valid category field is a required.");
  }
  const products = await Product.find({
    category: category.trim().toLowerCase(),
    isDeleted: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        products,
        "Products in the category fetched successfully"
      )
    );
});

const restoreDeletedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }
  const restored = await Product.findByIdAndUpdate(
    { _id: id, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
    },
    { new: true }
  );
  if (!restored) {
    throw new ApiError(404, "No deleted products found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, restored, "Products restored successfully."));
});

export {
  addProduct,
  removeProduct,
  updateProduct,
  getProduct,
  getAllProducts,
  toggleProductAvailability,
  updateStock,
  getProductsByCategory,
  updateProductImage,
  restoreDeletedProducts,
  getAllAvailableProducts,
  getAllProductsWithAdminAccess,
};
