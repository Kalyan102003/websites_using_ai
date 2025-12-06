import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Cart from "../models/cart.js";
import Order from "../models/order.js";
import Product from "../models/Product.js";

const r = Router();

/* ======================================================
   CREATE ORDER (COD)
   ====================================================== */
r.post("/create", auth, async (req, res) => {
  const { address } = req.body || {};
  // Basic address validation
  if (
    !address ||
    !address.line1?.trim() ||
    !address.city?.trim() ||
    !address.pin?.trim()
  ) {
    return res.status(400).json({ error: "Valid address is required" });
  }

  // Load cart
  const cart = await Cart.findOne({ userId: req.userId });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart empty" });
  }

  // Fetch all products in one go
  const ids = cart.items.map((it) => it.productId);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Verify stock for every item
  for (const it of cart.items) {
    const p = byId.get(String(it.productId));
    if (!p) {
      return res.status(400).json({ error: "Item not found" });
    }
    if ((p.stock ?? 0) < it.qty) {
      return res.status(400).json({ error: `Out of stock: ${p.title}` });
    }
  }

  // Start transaction (if replica set; on standalone it will gracefully no-op)
  const session = await mongoose.startSession();
  try {
    let createdOrder;

    await session.withTransaction(async () => {
      // Decrement stock atomically with conditions
      const ops = cart.items.map((it) => ({
        updateOne: {
          filter: { _id: it.productId, stock: { $gte: it.qty } },
          update: { $inc: { stock: -it.qty } },
        },
      }));

      const bulk = await Product.bulkWrite(ops, { session });
      // Ensure every intended update matched (stock still sufficient)
      const matched = bulk.matchedCount ?? Object.values(bulk).reduce((s, v) => s + (v?.matchedCount || 0), 0);
      if (matched !== cart.items.length) {
        // someone else bought meanwhile
        throw new Error("STOCK_CHANGED");
      }

      // Snapshot items (qty + priceAtAdd already in cart)
      const snapshotItems = cart.items.map((it) => ({
        productId: it.productId,
        qty: it.qty,
        priceAtAdd: it.priceAtAdd,
      }));

      // Create order
      createdOrder = await Order.create(
        [
          {
            userId: req.userId,
            items: snapshotItems,
            subtotal: cart.total,
            address: {
              line1: address.line1.trim(),
              city: address.city.trim(),
              pin: address.pin.trim(),
            },
            payment: { method: "cod", status: "PENDING_COLLECTION" },
            status: "PLACED",
          },
        ],
        { session }
      );

      // Clear cart
      cart.items = [];
      cart.total = 0;
      await cart.save({ session });
    });

    // `create` with array returns array
    const orderDoc = createdOrder?.[0];

    // Return populated order
    const populated = await Order.findById(orderDoc._id).populate(
      "items.productId"
    );

    return res.json(populated);
  } catch (err) {
    if (err?.message === "STOCK_CHANGED") {
      return res
        .status(400)
        .json({ error: "Stock changed while ordering. Please try again." });
    }
    console.error("Order create error:", err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    session.endSession();
  }
});

/* ======================================================
   LIST MY ORDERS
   ====================================================== */
r.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("items.productId");
    return res.json(orders);
  } catch (err) {
    console.error("Orders list error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default r;
