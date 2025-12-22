import sharp from "sharp";
import path from "path";

const generateImage = async () => {
    try {
        // 創建一個白色背景，文字 "ABCD" 置中的圖片
        const imageBuffer = await sharp({
            create: {
                width: 300,
                height: 100,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }, // 白色背景
            },
        })
            .composite([
                {
                    input: Buffer.from(
                        `<svg width="300" height="100">
                            <text x="50%" y="50%" font-size="90" text-anchor="middle"
                             fill="black" dy=".35em" font-family="monospace">0aBC</text>
                        </svg>`
                    ),
                    top: 0,
                    left: 0,
                },
            ])
            .png()
            .toBuffer();

        // 保存圖片到本地
        const outputPath = path.join(__dirname, "../output.png");
        await sharp(imageBuffer).toFile(outputPath);
    } catch (error) {
        console.error("Error generating image:", error);
    }
};

generateImage();
