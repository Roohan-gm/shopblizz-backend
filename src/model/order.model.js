import { Schema, model } from "mongoose";
import ApiError from "../utils/ApiError";

const SHIPPING_RATES = {
  fast: 200,
  standard: 100,
};

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
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        message: "{VALUE} is not a valid order status",
      },
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
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Delivery address is required"],
      maxlength: [2000, "Address cannot exceed 2000 characters"],
    },

    // Payment: COD only
    paymentMethod: {
      type: String,
      enum: {
        values: ["cash_on_delivery"],
        message: "Only cash on delivery is supported",
      },
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
      required: true,
      min: 0,
    },
    // Optional tracking & delivery info
    trackingCode: {
      type: String,
      trim: true,
    },
    shippingMethod: {
      type: String,
      enum: {
        values: ["standard", "fast"],
        message: "{VALUE} is not a supported shipping method",
      },
      required: [true, "Shipping method is required"],
    },
    shippingCost: {
      type: Number,
      required: true,
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

// Auto-generate order number before save (only if new)
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    // ORD-YYYYMMDD-RANDOM6
    const prefix = "ORD";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g., 20240515
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
      .padEnd(6, "X");
    this.orderNo = `${prefix}-${datePart}-${randomPart}`;
  }
  const rate = SHIPPING_RATES[this.shippingMethod];
  if (rate === undefined) {
    return next(new Error(`Invalid shipping method: ${this.shippingMethod}`));
  }
  this.shippingCost = rate;

  // Recalculate total amount
  const itemsTotal = (this.totalAmount = this.orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  ));
  this.totalAmount = itemsTotal + this.shippingCost;

  next();
});

export const Order = model("Order", orderSchema);
