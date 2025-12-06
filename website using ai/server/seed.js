import dotenv from "dotenv"; dotenv.config();
import mongoose from "mongoose";
import Category from "./models/category.js";
import Product from "./models/Product.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shop_app";

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log("DB connected for seed");

  await Category.deleteMany({});
  await Product.deleteMany({});

  // ---- Categories (add more) ----
  const cats = await Category.insertMany([
    { name:"Electronics", slug:"electronics" },
    { name:"Fashion", slug:"fashion" },
    { name:"Home & Kitchen", slug:"home-kitchen" },
    { name:"Books", slug:"books" },
    { name:"Beauty", slug:"beauty" },
    { name:"Sports", slug:"sports" }
  ]);

  const bySlug = Object.fromEntries(cats.map(c=>[c.slug,c]));

  // Helper for quick make
  const P = (obj) => ({ stock: 50, images: [], tags: [], ...obj });

  // All image links are free-to-use placeholders (picsum/unsplash)
  await Product.insertMany([
    // Electronics
    P({ title:"Wireless Mouse", slug:"wireless-mouse",
        description:"2.4G ergonomic mouse with silent clicks.",
        price:599, categoryId: bySlug["electronics"]._id,
        images:["https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Bluetooth Headphones", slug:"bluetooth-headphones",
        description:"Over-ear, 20h battery, BT 5.0.",
        price:1999, categoryId: bySlug["electronics"]._id,
        images:["https://m.media-amazon.com/images/I/61RbNdlNWIL.jpg"] }),
    P({ title:"USB-C Charger 25W", slug:"usb-c-charger-25w",
        description:"Fast charger with PD.",
        price:899, categoryId: bySlug["electronics"]._id,
        images:["https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Communication/Mobile%20Accessories/Images/268135_0_anxw0a.png?tr=w-640"] }),
    P({ title:"Smartwatch Series S", slug:"smartwatch-series-s",
        description:"Fitness tracking, heart rate, notifications.",
        price:3499, categoryId: bySlug["electronics"]._id,
        images:["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxmfIcMc25roiFkGmi9ofa0zT7tCdHwHbLZw&s"] }),

    // Fashion
    P({ title:"Men's Cotton T-Shirt", slug:"mens-cotton-tshirt",
        description:"100% cotton, regular fit.",
        price:499, categoryId: bySlug["fashion"]._id,
        images:["https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Women's Denim Jacket", slug:"womens-denim-jacket",
        description:"Classic blue denim jacket.",
        price:1899, categoryId: bySlug["fashion"]._id,
        images:["https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop"] }),

    // Home & Kitchen
    P({ title:"Stainless Steel Water Bottle", slug:"steel-bottle-1l",
        description:"1L vacuum insulated.",
        price:799, categoryId: bySlug["home-kitchen"]._id,
        images:["https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Non-stick Frying Pan 28cm", slug:"nonstick-pan-28",
        description:"PFOA free, induction friendly.",
        price:1299, categoryId: bySlug["home-kitchen"]._id,
        images:["https://judge.ttkprestige.com/media/catalog/product/6/6/6629-37258-IMG1.jpg?optimize=medium&fit=bounds&height=500&width=500"] }),

    // Books
    P({ title:"Learn JavaScript Quickly", slug:"learn-javascript-quickly",
        description:"Beginner to advanced, hands-on projects.",
        price:699, categoryId: bySlug["books"]._id,
        images:["https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Design Patterns Illustrated", slug:"design-patterns-illustrated",
        description:"Classic patterns with visuals.",
        price:999, categoryId: bySlug["books"]._id,
        images:["https://m.media-amazon.com/images/I/51dIcbLdfiL._SX342_SY445_FMwebp_.jpg"] }),

    // Beauty
    P({ title:"Vitamin C Face Serum", slug:"vitamin-c-serum",
        description:"Brightening formula with hyaluronic acid.",
        price:799, categoryId: bySlug["beauty"]._id,
        images:["https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Aloe Vera Moisturizer", slug:"aloe-vera-moisturizer",
        description:"Lightweight daily gel cream.",
        price:499, categoryId: bySlug["beauty"]._id,
        images:["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5fbFAvgzYL8aoKEeLIe6U752fmjtbCgRgMg&s"] }),

    // Sports
    P({ title:"Yoga Mat (6mm)", slug:"yoga-mat-6mm",
        description:"Non-slip, high-density.",
        price:899, categoryId: bySlug["sports"]._id,
        images:["https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1200&auto=format&fit=crop"] }),
    P({ title:"Adjustable Dumbbells (2×5kg)", slug:"dumbbells-5kg",
        description:"Rubber coated, grip handle.",
        price:2499, categoryId: bySlug["sports"]._id,
        images:["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScAWzMptWRDrlYLEfHKUlTRXFbCIjIOsRx5g&s"] }),
  ]);

  console.log("Seed complete");
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
