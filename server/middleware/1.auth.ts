// server/middleware/1.auth.ts

import { getUserById } from "@server/services/user.service";
import { verifyJwt } from "@server/utils/auth";

function isNeedAuth(path: string) {
    const needAuthPaths = ["/api/admin/", "/api/auth/me", "/api/cart/", "/api/orders/"];
    for (const p of needAuthPaths) {
        if (path.startsWith(p)) {
            return true;
        }
    }
    return false;
}

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event).pathname;

    // 只處理需要驗證的路徑
    if (!isNeedAuth(url)) {
        return;
    }

    const authHeader = getHeader(event, "Authorization") ?? getHeader(event, "authorization") ?? "";

    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "Authentication required. Please log in." });
    }

    // 解析 Bearer 格式
    let m = authHeader.match(/^Bearer\s+((?:\.?[0-9A-Za-z\-_=]+){3})$/);
    if (!m || !m[1]) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "Invalid token format" });
    }

    const payload = verifyJwt(m[1]);

    if (!payload || !payload.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "Invalid token" });
    }

    const user = await getUserById(payload.id);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "User not found" });
    }

    if (user.role === "banned") {
        throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "Account has been banned" });
    }

    // 將使用者資訊附加到 event 上，供後續處理使用
    event.context.user = user;
});
