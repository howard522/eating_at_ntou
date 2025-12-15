// server/middleware/1.auth.ts

import { getCurrentUser } from "@server/utils/getCurrentUser";

export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname;

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
