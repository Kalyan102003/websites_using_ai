import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Extract token safely
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)                 // remove "Bearer "
      : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request
    req.userId = payload.sub || payload.id;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
