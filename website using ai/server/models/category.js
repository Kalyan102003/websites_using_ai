import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,         // ← avoid duplicate category names
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,         // ← unique URL slug
    },
  },
  { timestamps: true }
);

// Auto-generate slug when name is created/changed
CategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")   // replace spaces & symbols with -
      .replace(/(^-|-$)/g, "");      // trim hyphens
  }
  next();
});

// Add index for faster access
CategorySchema.index({ slug: 1 });

export default mongoose.model("Category", CategorySchema);
