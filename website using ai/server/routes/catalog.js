import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/category.js";

const r = Router();

/* ======================================================
   GET ALL CATEGORIES
   ====================================================== */
r.get("/categories", async (_req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    return res.json(cats);
  } catch (err) {
    console.error("Categories error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   PRODUCT LIST WITH SEARCH + CATEGORY + SORT + PAGINATION
   ====================================================== */
r.get("/products", async (req, res) => {
  try {
    let {
      q,
      category,
      sort = "newest",   // newest | price-asc | price-desc
      page = 1,
      limit = 20,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    /* ---------- CATEGORY FILTER (supports id or slug) ---------- */
    if (category) {
      // If slug passed → convert to id
      const cat = await Category.findOne({
        $or: [{ _id: category }, { slug: category }],
      });
      if (cat) filter.categoryId = cat._id;
      else return res.json([]); // no matching category → empty list
    }

    /* ---------- SEARCH FILTER ---------- */
    if (q) filter.$text = { $search: q };

    /* ---------- SORT ---------- */
    let sortObj = { createdAt: -1 }; // default newest

    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };
    if (sort === "newest") sortObj = { createdAt: -1 };

    /* ---------- FETCH PRODUCTS ---------- */
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json(products);
  } catch (err) {
    console.error("Products list error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   GET SINGLE PRODUCT BY SLUG
   ====================================================== */
r.get("/products/:slug", async (req, res) => {
  try {
    const p = await Product.findOne({ slug: req.params.slug });
    if (!p) return res.status(404).json({ error: "Not found" });

    return res.json(p);
  } catch (err) {
    console.error("Product detail error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default r;
