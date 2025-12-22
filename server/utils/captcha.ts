// server/utils/captcha.ts

import sharp from "sharp";

// 避免混淆，不使用 I, O, l, 0, 1
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * 生成隨機驗證碼
 */
export async function generateCaptcha() {
    let captchaText = "";

    for (let i = 0; i < 4; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return captchaText;
}

/**
 * 生成驗證碼圖片
 */
export async function createCaptchaImage(captchaText: string) {
    const width = 300;
    const height = 100;
    const fontSize = 90;

    const imageBuffer = await sharp({
        create: {
            width: width,
            height: height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }, // 白色背景
        },
    })
        .composite([
            {
                input: Buffer.from(
                    `<svg width="${width}" height="${height}">
                        <text x="50%" y="50%" font-size="${fontSize}" text-anchor="middle"
                         fill="black" dy=".35em" font-family="monospace">${captchaText}</text>
                    </svg>`
                ),
                top: 0,
                left: 0,
            },
        ])
        .png()
        .toBuffer();

    return imageBuffer;
}
