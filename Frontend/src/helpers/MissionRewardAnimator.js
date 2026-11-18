/**
 * Presenta el cobro de una recompensa de misión como partículas que viajan
 * desde el modal hasta el contador de la moneda correspondiente.
 */
export default class MissionRewardAnimator {
    async animate({ source, target, currency = 'gems', amount = 0 } = {}) {
        if (!source || !target || !source.isConnected || !target.isConnected) return;

        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const start = {
            x: sourceRect.left + sourceRect.width / 2,
            y: sourceRect.top + sourceRect.height / 2,
        };
        const end = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2,
        };
        const glyph = currency === 'coins' ? '🪙' : '💎';
        const particleCount = Math.min(7, Math.max(3, Math.ceil(Number(amount) / 60)));

        await Promise.all(Array.from({ length: particleCount }, (_, index) => new Promise((resolve) => {
            const particle = document.createElement('span');
            const offset = index - (particleCount - 1) / 2;
            const delay = index * 55;
            particle.textContent = glyph;
            Object.assign(particle.style, {
                position: 'fixed',
                zIndex: '2147483647',
                left: `${start.x + offset * 9}px`,
                top: `${start.y + Math.abs(offset) * 5}px`,
                fontSize: `${22 + (index % 2) * 4}px`,
                lineHeight: '1',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 9px rgba(255, 218, 105, .95))',
                opacity: '1',
                transform: 'translate(-50%, -50%) scale(.55)',
                transition: `left 640ms cubic-bezier(.18,.72,.28,1) ${delay}ms, top 640ms cubic-bezier(.18,.72,.28,1) ${delay}ms, transform 640ms ease ${delay}ms, opacity 640ms ease ${delay}ms`,
            });
            document.body.appendChild(particle);

            requestAnimationFrame(() => requestAnimationFrame(() => {
                particle.style.left = `${end.x + offset * 3}px`;
                particle.style.top = `${end.y}px`;
                particle.style.transform = 'translate(-50%, -50%) scale(.28) rotate(18deg)';
                particle.style.opacity = '0';
            }));

            window.setTimeout(() => {
                particle.remove();
                resolve();
            }, 760 + delay);
        })));

        if (typeof target.animate === 'function') {
            target.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
                { duration: 360, easing: 'ease-out' }
            );
        }
    }
}
