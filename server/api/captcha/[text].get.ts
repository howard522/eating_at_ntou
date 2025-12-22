// server/api/captcha/[text].get.ts

import { createCaptchaImage } from "@server/utils/captcha";

/**
 * @openapi
 * /api/captcha/{text}:
 *   get:
 *     summary: 生成驗證碼圖片
 *     description: 根據提供的驗證碼文字生成對應的圖片
 *     tags:
 *       - Auth - Captcha
 *     parameters:
 *       - in: path
 *         name: text
 *         required: true
 *         schema:
 *           type: string
 *         description: 驗證碼文字，長度必須為 4
 *     responses:
 *       200:
 *         description: 驗證碼圖片
 *         content:
 *           image/png:
 *             schema:
 *              type: string
 *              format: binary
 *              example: "image/png;base64,a_cool_image_data_here"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const text = getRouterParam(event, "text");

    console.log("Generating captcha for text:", text);

    if (!text) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: captcha text",
        });
    }

    if (text.length !== 4) {
        throw createError({
            statusCode: 422,
            statusMessage: "Unprocessable Entity",
            message: "Captcha text must be 4 characters long",
        });
    }

    const imageBuffer = await createCaptchaImage(text);

    setHeader(event, "Content-Type", "image/png");
    setHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return imageBuffer;
});
