import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
    priceAtAdd: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // Prevents extra IDs inside items[]
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,      // Faster lookups + ensures uniqueness
    },

    items: {
      type: [CartItemSchema],
      default: [],
    },

    total: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure each product appears only once in the cart
CartSchema.pre("save", function () {
  const seen = new Set();
  this.items = this.items.filter((item) => {
    if (seen.has(String(item.productId))) return false;
    seen.add(String(item.productId));
    return true;
  });
 
});

export default mongoose.model("Cart", CartSchema);
