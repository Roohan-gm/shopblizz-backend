import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
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
      required: [true, "Product category is required"],
      lowercase: true,
    },

    image: {
      type: String,
      required: [true, "Product image URL is required"],
      validate: {
        validator: (v) => /^https?:\/\/.+/.test(v),
        message: "Image must be a valid URL",
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
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
