import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "multi"], default: "multi" },
    img: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    activeRole: { type: String, enum: ['customer', 'delivery', null], default: null }
  },
  { timestamps: true }
);

// Hash password before save if modified
userSchema.pre("save", async function (next) {
  try {
    // `this` is the mongoose document
    const user: any = this;
    if (!user.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    return next();
  } catch (err) {
    return next(err as any);
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
