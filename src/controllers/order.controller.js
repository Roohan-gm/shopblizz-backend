import { Order } from "../models/order.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { createOrderSchema } from "../validations/order.validation.js";
import mongoose from "mongoose";

const createOrder = asyncHandler(async (req, res) => {
  const result = createOrderSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err) => err.message)
      .join("; ");
    throw new ApiError(400, errorMessage);
  }

  const { fullName, email, phone, address, shippingMethod, orderItems } =
    result.data;

  let saveOrder;
  const maxAttempt = 3;
  let attempts = 0;

  while (attempts < maxAttempt) {
    try {
      saveOrder = await Order.create({
        fullName,
        email,
        phone,
        address,
        shippingMethod,
        orderItems,
      });
      break;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.orderNo) {
        attempts++;
        continue;
      }

      throw new ApiError(400, "Failed to create order. Please try again.");
    }
  }

  if (!saveOrder) {
    throw new ApiError(
      500,
      "Failed to generate unique order number. Please try again."
    );
  }

  const populateOrder = await Order.populateOrderById(saveOrder._id);
  res
    .status(201)
    .json(new ApiResponse(201, populateOrder, "Order created successfully."));
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID.");
  }

  const order = await Order.populateOrderById(id);

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully."));
});

const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { fullName, email } = req.query;
  if (!fullName && !email) {
    throw new ApiError(
      400,
      "Either 'email' or 'fullName' query parameter is required."
    );
  }

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (email) query.email = email;
  if (fullName) query.fullName = { $regex: new RegExp(fullName, "i") };

  const totalOrders = await Order.countDocuments(query);

  const customerOrders = await Order.populateOrderDetails(query)
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders: customerOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1,
        },
      },
      "Orders fetched successfully."
    )
  );
});

const getAllOrders = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const totalOrders = await Order.countDocuments();
  const orders = await Order.populateOrderDetails().skip(skip).limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1,
        },
      },
      "Orders fetched successfully."
    )
  );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID.");
  }
  if (!status) {
    throw new ApiError(400, "Status is required.");
  }

  const validStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be one of: " + validStatuses.join(", ")
    );
  }
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      status,
    },
    { new: true, runValidators: true }
  ).populate({
    path: "orderItems.product",
    select: "productName price image category isAvailable",
  });
  if (!updatedOrder) {
    throw new ApiError(404, "Order not found.");
  }

  if (status === "delivered" && !updatedOrder.deliveredAt) {
    updatedOrder.deliveredAt = new Date();
    await updatedOrder.save();
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedOrder, "Changed order status successfully")
    );
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID format.");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  const nonCancellableStatuses = ["delivered", "cancelled"];
  if (nonCancellableStatuses.includes(order.status)) {
    throw new ApiError(
      400,
      `Cannot cancel order with status: "${order.status}"`
    );
  }

  order.status = "cancelled";
  const canceledOrder = await order.save({ validateBeforeSave: true });

  const populatedOrder = await Order.populateOrderById(canceledOrder._id);

  res
    .status(200)
    .json(
      new ApiResponse(200, populatedOrder, "Order cancelled successfully.")
    );
});

const getOrdersByStatus = asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (!status) {
    throw new ApiError(400, "Status is required.");
  }
  const validStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be one of: " + validStatuses.join(", ")
    );
  }
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { status };
  const totalOrders = await Order.countDocuments(query);
  const orders = await Order.populateOrderDetails(query)
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1,
        },
      },
      "Orders fetched successfully."
    )
  );
});

export {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrdersByStatus,
};
