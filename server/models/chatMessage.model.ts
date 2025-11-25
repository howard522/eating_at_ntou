import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["customer", "delivery"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
