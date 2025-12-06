import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtAdd: {
      type: Number,
      required: true,
    }
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true },
    city:  { type: String, required: true, trim: true },
    pin:   { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod"],
      default: "cod",
    },
    status: {
      type: String,
      enum: ["PENDING_COLLECTION", "PAID"],
      default: "PENDING_COLLECTION",
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,     // Faster "my orders" queries
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: AddressSchema,
      required: true,
    },

    payment: {
      type: PaymentSchema,
      default: () => ({})
    },

    status: {
      type: String,
      enum: ["PLACED", "PACKED", "SHIPPED", "DELIVERED"],
      default: "PLACED",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
