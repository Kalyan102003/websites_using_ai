import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // SEO-friendly unique slug; auto-generated from title if missing
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // array of image URLs
    images: {
      type: [String],
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr);
        },
        message: "images must be an array of URLs",
      },
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // needed for "newest" sorting
  }
);

// Auto-generate slug from title if not provided or if title changed
ProductSchema.pre("validate", function (next) {
  if ((!this.slug || this.isModified("title")) && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Text index for search
ProductSchema.index({ title: "text", description: "text", tags: "text" });

// Useful indexes for filtering/sorting
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
