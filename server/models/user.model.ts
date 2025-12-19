// server/models/user.model.ts

import type { IUserMethods, IUserWithPassword } from "$interfaces/user.interface";
import { comparePassword, generatePasswordHash } from "$utils/auth";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type UserDocument = HydratedDocument<IUserWithPassword, IUserMethods>;

// --------------------
// 使用者
// --------------------

const userSchema = new Schema<UserDocument>(
    {
        name: String,
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["admin", "multi", "banned"],
            default: "multi",
        },
        img: { type: String, default: "" },
        address: { type: String, default: "" },
        phone: { type: String, default: "" },
        // activeRole: { type: String, enum: ["customer", "delivery", null], default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// --------------------
// 密碼雜湊
// --------------------

// Hash password before save if modified
userSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();
        this.password = await generatePasswordHash(this.password);
        next();
    } catch (e) {
        next(e as any);
    }
});

// 驗證密碼
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const isMatch = await comparePassword(candidatePassword, this.password);
    return isMatch;
};

// --------------------
// Model export
// --------------------

export const User = (mongoose.models.User as Model<UserDocument>) || model<UserDocument>("User", userSchema);

export default User;
