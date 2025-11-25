// FILE: server/api/auth/register.post.ts
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     description: 建立新帳號（email 唯一），成功回傳 JWT 與使用者資料（不回傳密碼）。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             sample:
 *               summary: 註冊範例
 *               value:
 *                 name: 郭浩
 *                 email: howhow@example.com
 *                 password: howhowissohandsome
 *     responses:
 *       201:
 *         description: 註冊成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: 成功範例
 *                 value:
 *                   success: true
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   user:
 *                     id: 68eba49d636458deb1664302
 *                     name: 郭浩
 *                     email: howhow@example.com
 *                     role: multi
 *                     img: ""
 *                     address: ""
 *                     phone: ""
 *       400:
 *         description: 請求不正確或 email 已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 400 }
 *                 statusMessage: { type: string, example: email already in use }
 */
import { defineEventHandler, readBody, createError } from "h3";
import connectDB from "@server/utils/db";
import User from "@server/models/user.model";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@server/utils/auth";

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody(event);
  const name = (body.name || "這個人很懶，不想取暱稱") as string;
  const email = (body.email || "") as string;
  const password = (body.password || "") as string;
  const role = (body.role || "multi") as string;

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
    role,
    // 預設不指定 img/address/phone
  });
  await u.save();

  const token = jwt.sign({ id: u._id, role: u.role }, JWT_SECRET, {
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
    },
  };
});
