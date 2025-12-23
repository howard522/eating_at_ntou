import { onBeforeUnmount, ref, type Ref } from 'vue';

export function createCartImageAnimator(cartIconEl: Ref<HTMLElement | null>) {
    const floatingImages = ref<HTMLImageElement[]>([]);

    const createFloatingImage = (imageSrc: string) => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.position = 'fixed';
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
        img.style.borderRadius = '12px';
        img.style.zIndex = '9999';
        img.style.pointerEvents = 'none';
        img.style.opacity = '0.85';
        img.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';

        // 隨機位置，避免貼邊
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const left = Math.random() * (vw - 100) + 10;
        const top = Math.random() * (vh - 220) + 80;
        img.style.left = `${left}px`;
        img.style.top = `${top}px`;

        document.body.appendChild(img);
        floatingImages.value.push(img);
    };

    const removeOneFloatingImage = () => {
        const img = floatingImages.value.pop();
        if (img) img.remove();
    };

    const flyAllImagesToCart = () => {
        const cartEl = cartIconEl.value;
        if (!cartEl || floatingImages.value.length === 0) return;

        const cartRect = cartEl.getBoundingClientRect();
        const cartCenterX = cartRect.left + cartRect.width / 2;
        const cartCenterY = cartRect.top + cartRect.height / 2;

        floatingImages.value.forEach(img => {
            const imgRect = img.getBoundingClientRect();
            const imgCenterX = imgRect.left + imgRect.width / 2;
            const imgCenterY = imgRect.top + imgRect.height / 2;
            const translateX = cartCenterX - imgCenterX;
            const translateY = cartCenterY - imgCenterY;
            const finalScale = Math.max(20 / imgRect.width, 20 / imgRect.height);

            requestAnimationFrame(() => {
                img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${finalScale}) rotate(720deg)`;
                img.style.opacity = '0.2';
            });
        });

        setTimeout(() => {
            floatingImages.value.forEach(img => img.remove());
            floatingImages.value = [];
            cartEl.classList.add('cart-shake');
            setTimeout(() => cartEl.classList.remove('cart-shake'), 400);
        }, 650);
    };

    const clearFloatingImages = () => {
        floatingImages.value.forEach(img => img.remove());
        floatingImages.value = [];
    };

    // 只買一個時的動畫
    const flyOneImageToCartFrom = (imageSrc: string, origin: HTMLElement | DOMRect) => {
        const cartEl = cartIconEl.value;
        if (!cartEl) return;

        const originRect = origin instanceof HTMLElement ? origin.getBoundingClientRect() : origin;
        const cartRect = cartEl.getBoundingClientRect();

        const preload = new Image();
        preload.src = imageSrc;

        const run = (naturalW: number, naturalH: number) => {
            const scale0 = Math.min(originRect.width / naturalW, originRect.height / naturalH);
            const w0 = naturalW * scale0;
            const h0 = naturalH * scale0;
            const left0 = originRect.left + (originRect.width - w0) / 2;
            const top0 = originRect.top + (originRect.height - h0) / 2;

            const imgEl = document.createElement('img');
            imgEl.src = imageSrc;
            imgEl.style.position = 'fixed';
            imgEl.style.left = `${left0}px`;
            imgEl.style.top = `${top0}px`;
            imgEl.style.width = `${w0}px`;
            imgEl.style.height = `${h0}px`;
            imgEl.style.objectFit = 'contain';
            imgEl.style.objectPosition = 'center';
            imgEl.style.borderRadius = '0';
            imgEl.style.zIndex = '9999';
            imgEl.style.pointerEvents = 'none';
            imgEl.style.transform = 'translate3d(0,0,0) scale(1)';
            imgEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';
            document.body.appendChild(imgEl);

            const imgCenterX = left0 + w0 / 2;
            const imgCenterY = top0 + h0 / 2;
            const cartCenterX = cartRect.left + cartRect.width / 2;
            const cartCenterY = cartRect.top + cartRect.height / 2;
            const translateX = cartCenterX - imgCenterX;
            const translateY = cartCenterY - imgCenterY;
            const finalScale = Math.max(20 / w0, 20 / h0);

            requestAnimationFrame(() => {
                imgEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${finalScale}) rotate(720deg)`;
                imgEl.style.opacity = '0.2';
            });

            setTimeout(() => {
                imgEl.remove();
                cartEl.classList.add('cart-shake');
                setTimeout(() => cartEl.classList.remove('cart-shake'), 400);
            }, 650);
        };

        preload.onload = () => run(preload.naturalWidth, preload.naturalHeight);
        preload.onerror = () => run(originRect.width, originRect.height);
    };

    onBeforeUnmount(() => {
        clearFloatingImages();
    });

    return {
        floatingImages,
        createFloatingImage,
        removeOneFloatingImage,
        flyAllImagesToCart,
        clearFloatingImages,
        flyOneImageToCartFrom,
    };
}
