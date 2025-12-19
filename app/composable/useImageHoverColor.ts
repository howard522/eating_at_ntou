import { ref, watch, onMounted, type Ref } from 'vue';

export function useImageHoverColor(imageUrl: Ref<string | undefined | null>) {
    const hoverBgColor = ref('#FFFFFF');

    const updateHoverColor = () => {
        if (!imageUrl.value) {
            hoverBgColor.value = '#FFFFFF';
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl.value;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const size = 50;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            try {
                const data = ctx.getImageData(0, 0, size, size).data;

                const buckets: { r: number; g: number; b: number; count: number }[] = Array.from({ length: 12 }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
                let totalR = 0, totalG = 0, totalB = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    totalR += r;
                    totalG += g;
                    totalB += b;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const d = max - min;
                    const l = (max + min) / 2;

                    if (d < 20 || l < 20 || l > 235) continue;

                    let h = 0;
                    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                    else if (max === g) h = (b - r) / d + 2;
                    else h = (r - g) / d + 4;

                    const bucketIndex = Math.floor(h * 2) % 12;
                    buckets[bucketIndex].r += r;
                    buckets[bucketIndex].g += g;
                    buckets[bucketIndex].b += b;
                    buckets[bucketIndex].count++;
                }

                const bestBucket = buckets.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), buckets[0]);

                let finalR, finalG, finalB;

                if (bestBucket.count > 0) {
                    finalR = bestBucket.r / bestBucket.count;
                    finalG = bestBucket.g / bestBucket.count;
                    finalB = bestBucket.b / bestBucket.count;
                } else {
                    const pixelCount = size * size;
                    finalR = totalR / pixelCount;
                    finalG = totalG / pixelCount;
                    finalB = totalB / pixelCount;
                }

                const mix = 0.8;
                const newR = Math.round(finalR + (255 - finalR) * mix);
                const newG = Math.round(finalG + (255 - finalG) * mix);
                const newB = Math.round(finalB + (255 - finalB) * mix);

                hoverBgColor.value = `rgb(${newR}, ${newG}, ${newB})`;
            } catch (e) {
                console.warn('無法提取圖片顏色', e);
                hoverBgColor.value = '#FFFFFF';
            }
        };
        img.onerror = () => {
            hoverBgColor.value = '#FFFFFF';
        }
    };

    onMounted(() => {
        updateHoverColor();
    });

    watch(imageUrl, updateHoverColor);

    return { hoverBgColor };
}
