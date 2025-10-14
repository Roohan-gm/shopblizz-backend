import { Schema, model } from "mongoose";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";

const SHIPPING_RATES = Object.freeze({
  fast: 200,
  standard: 100,
});

// Order Item Subdocument
const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // Snapshot of price at time of order (critical for accuracy)
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Main Order Schema
const orderSchema = new Schema(
  {
    orderNo: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    // Customer info (no user account)
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+92\d{10,12}$/, "Phone must be in +923001234567 format"],
    },
    address: {
      type: String,
      required: [true, "Delivery address is required"],
      maxlength: [2000, "Address cannot exceed 2000 characters"],
    },

    // Payment: COD only
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
      required: true,
    },

    // Order details
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    // Optional tracking & delivery info
    trackingCode: {
      type: String,
      trim: true, 
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "fast"],
      required: [true, "Shipping method is required"],
    },
    shippingCost: {
      type: Number,
      min: 0,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Pre-save middleware
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Generate unique order number (with collision check)
    const prefix = "ORD";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.orderNo = `${prefix}-${datePart}-${randomPart}`;

    const rate = SHIPPING_RATES[this.shippingMethod];
    if (rate === undefined) {
      return next(
        new ApiError(400, `Invalid shipping method: ${this.shippingMethod}`)
      );
    }
    this.shippingCost = rate;

    // calculate total amount
    const itemsTotal = this.orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    this.totalAmount = itemsTotal + this.shippingCost;
  } else if (this.isModified("totalAmount")) {
    return next(new ApiError(400, "totalAmount is read-only after creation"));
  }
  next();
});

// Indexes
orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.statics.populateOrderDetails = function (query = {}) {
  return this.find(query).populate({
    path: "orderItems.product",
    select: "productName price image category isAvailable",
  });
};

orderSchema.statics.populateOrderById = function (id) {
  return this.findById(id)
    .orFail(new ApiError(404, "Order not found."))
    .populate({
      path: "orderItems.product",
      select: "productName price image category isAvailable",
    });
};

export const Order = model("Order", orderSchema);
