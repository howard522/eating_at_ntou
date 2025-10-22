// FILE: server/api/auth/register.post.ts  (更新回傳欄位，初始化 activeRole=null)
// ============================================================================
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     tags: [Auth]
 */
import { defineEventHandler, readBody, createError } from "h3";
import connectDB from "../../utils/db";
import User from "../../models/user.model";
import jwt from "jsonwebtoken";
const JWT_SECRET_2 = process.env.JWT_SECRET || "supersecret";

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody(event);
  const name = (body.name || "") as string;
  const email = (body.email || "") as string;
  const password = (body.password || "") as string;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少電子信箱或密碼",
    });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: "電子信箱已經註冊",
    });
  }

  const u = new User({
    name,
    email,
    password,
    // 預設不指定 img/address/phone，activeRole 預設 null
  });
  await u.save();

  const token = jwt.sign({ id: u._id, role: u.role }, JWT_SECRET_2, {
    expiresIn: "7d",
  });

  return {
    success: true,
    token,
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      img: u.img || "",
      address: u.address || "",
      phone: u.phone || "",
      activeRole: u.activeRole ?? null,
    },
  };
});
