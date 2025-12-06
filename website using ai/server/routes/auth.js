import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const r = Router();

/* ---------------------- Helpers ---------------------- */
const isEmail = (s = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).toLowerCase());

const clean = (s = "") => String(s || "").trim();

/* ======================================================
   REGISTER
   ====================================================== */
r.post("/register", async (req, res) => {
  try {
    const email = clean(req.body.email);
    const password = req.body.password || "";
    const name = clean(req.body.name || "");

    const errors = {};

    if (!email) errors.email = "Email is required";
    else if (!isEmail(email)) errors.email = "Enter a valid email";

    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Minimum 6 characters";

    if (name && name.length < 2) errors.name = "Name looks too short";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ errors: { email: "Email already registered" } });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const u = await User.create({
      email,
      passwordHash,
      name,
    });

    return res.json({
      id: u._id,
      email: u.email,
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   LOGIN
   ====================================================== */
r.post("/login", async (req, res) => {
  try {
    const email = clean(req.body.email);
    const password = req.body.password || "";

    const errors = {};

    if (!email) errors.email = "Email is required";
    else if (!isEmail(email)) errors.email = "Enter a valid email";

    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const u = await User.findOne({ email });
    if (!u) {
      return res
        .status(401)
        .json({ errors: { email: "Email or password is incorrect" } });
    }

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) {
      return res
        .status(401)
        .json({ errors: { email: "Email or password is incorrect" } });
    }

    const token = jwt.sign(
      { sub: u._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,
      message: "Logged in successfully",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default r;
