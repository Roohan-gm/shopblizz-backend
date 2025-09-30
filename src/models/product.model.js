import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: {
        values: [
          "mobile batteries",
          "beauty cosmetics",
          "team sports",
          "fashion and wearables",
          "18+",
        ],
        message: "{VALUE} is not a supported category",
      },
      index: true,
      required: [true, "Product category is required"],
      lowercase: true,
    },
    image: {
      url: {
        type: String,
        required: [true, "Product image URL is required"],
        validate: {
          validator: (v) => /^https?:\/\/.+/.test(v),
          message: "Image must be a valid URL",
        },
      },
      public_id: {
        type: String,
        required: [true, "Cloudinary public ID is required"],
      },
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price must be positive"],
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isAvailable: { type: Boolean, index: true },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

productSchema.index({ isDeleted: 1, isAvailable: 1, category: 1 });
productSchema.index({ isDeleted: 1, createdAt: -1 });

export const Product = model("Product", productSchema);