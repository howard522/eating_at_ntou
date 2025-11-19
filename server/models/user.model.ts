// server/models/user.model.ts

import mongoose from "mongoose";
import { genSalt, hash } from "bcryptjs";
import type { Model } from "mongoose";
import type { IUser } from "@server/interfaces/user.interface";

const { Schema, model } = mongoose;

const userSchema = new Schema<IUser>(
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
    { timestamps: true }
);

// Hash password before save if modified
userSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();
        const salt = await genSalt(10);
        this.password = await hash(this.password, salt);
        next();
    } catch (e) {
        next(e as any);
    }
});

export default (mongoose.models.User as Model<IUser>) || model<IUser>("User", userSchema);
