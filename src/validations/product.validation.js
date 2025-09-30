import z from "zod";

const allowedCategories = [
  "mobile batteries",
  "beauty cosmetics",
  "team sports",
  "fashion and wearables",
  "18+",
];

export const addProductSchema = z.object({
  productName: z.string().min(1).max(100),
  description: z.string().min(10),
  category: z.enum(allowedCategories),
  price: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
});

export const updateProductSchema = z
  .object({
    productName: z.string().min(1).max(100).optional(),
    description: z.string().min(10).optional(),
    category: z.enum(allowedCategories).optional(),
    price: z.number().positive().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateStockSchema = z.object({
  stockQuantity: z.number().int().nonnegative(),
});
