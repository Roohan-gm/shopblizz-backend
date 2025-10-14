import z, { email } from "zod";

const allowedShippingMethod = ["standard", "fast"];

const orderItemSchema = z.object({
  product: z.string().min(1, "Product ID is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative."),
});

export const createOrderSchema = z.object({
  fullName: z.string().min(1, "Full name is required.").max(2000),
  email: z.email("Invalid email format."),
  phone: z.string().regex(/^\+92\d{10,12}$/, "Phone must be in +923001234567 format"),
  address: z.string().min(1, "Address is required.").max(2000),
  shippingMethod: z.enum(allowedShippingMethod, {
    required_error: "Shipping method is required",
    invalid_enum_value: "Invalid shipping method",
  }),
  orderItems: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
});
