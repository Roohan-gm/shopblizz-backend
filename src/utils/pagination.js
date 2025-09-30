import { Product } from "../models/product.model.js";

export const getPaginatedProducts = async (filter, page, limit) => {
  const skip = (page - 1) * limit;
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
  return {
    products,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
};