import { Router } from "express";
import auth from "../middleware/auth.js";
import Cart from "../models/cart.js";
import Product from "../models/Product.js";

const r = Router();

/* ======================================================
   GET CART
   ====================================================== */
r.get("/", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId })
      .populate("items.productId");

    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [], total: 0 });
    }

    return res.json(cart);
  } catch (err) {
    console.error("Cart GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   ADD TO CART
   ====================================================== */
r.post("/add", auth, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    if (qty < 1) {
      return res.status(400).json({ error: "qty must be at least 1" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ error: "Out of stock" });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [], total: 0 });
    }

    // Find item in cart
    const index = cart.items.findIndex(
      (x) => String(x.productId) === String(productId)
    );

    if (index > -1) {
      // Update qty (but ensure not exceeding stock)
      const newQty = cart.items[index].qty + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ error: "Not enough stock available" });
      }
      cart.items[index].qty = newQty;
    } else {
      // Add new item
      cart.items.push({
        productId,
        qty,
        priceAtAdd: product.price,
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.qty * item.priceAtAdd,
      0
    );

    await cart.save();

    const populated = await cart.populate("items.productId");

    return res.json(populated);
  } catch (err) {
    console.error("Cart ADD error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   UPDATE QTY
   ====================================================== */
r.post("/update", auth, async (req, res) => {
  try {
    const { productId, qty } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    if (qty < 0) {
      return res.status(400).json({ error: "qty must be 0 or greater" });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.status(404).json({ error: "No cart found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (qty > product.stock) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    // Update the item
    cart.items = cart.items
      .map((item) =>
        String(item.productId) === String(productId)
          ? { ...item.toObject(), qty }
          : item
      )
      .filter((item) => item.qty > 0);

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.qty * item.priceAtAdd,
      0
    );

    await cart.save();

    const populated = await cart.populate("items.productId");

    return res.json(populated);
  } catch (err) {
    console.error("Cart UPDATE error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default r;
