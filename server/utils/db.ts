// server/utils/db.ts

import mongoose from "mongoose";

let conn: typeof mongoose | null = null;

export default async function connectDB() {
    if (conn) return conn;
    conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected!");
    return conn;
}
