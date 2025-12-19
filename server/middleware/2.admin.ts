// server/middleware/1.auth.ts

import { getCurrentUser } from "$utils/getCurrentUser";

export default defineEventHandler(async (event) => {
    const path = event.path;

    // 只處理 /api/admin/ 開頭的請求
    if (!path.startsWith("/api/admin/")) {
        return;
    }

    const user = getCurrentUser(event);

    if (user.role !== "admin") {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
            message: "Permission denied.",
        });
    }
});
