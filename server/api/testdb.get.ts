// server/api/testdb.get.ts

import connectDB from "@server/utils/db";

export default defineEventHandler(async () => {
    await connectDB();
    return {
        success: true,
        message: "Connected to test database successfully.",
    };
});
