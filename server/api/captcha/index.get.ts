// server/api/captcha/index.get.ts

import { generateCaptcha } from "@server/utils/captcha";

/**
 * @openapi
 * /api/captcha:
 *   get:
 *     summary: 取得驗證碼
 *     description: 產生一組新的驗證碼，並將其存到 cookie 中。
 *     tags:
 *       - Auth - Captcha
 *     responses:
 *       200:
 *         description: 成功取得驗證碼
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 captcha:
 *                   type: string
 *                   example: "aB3d"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const captchaText = await generateCaptcha();

    // 將驗證碼存到 cookie
    setCookie(event, "captcha", captchaText, {
        httpOnly: true,
        maxAge: 5 * 60, // 5 分鐘
    });

    return {
        success: true,
        captcha: captchaText,
    };
});
