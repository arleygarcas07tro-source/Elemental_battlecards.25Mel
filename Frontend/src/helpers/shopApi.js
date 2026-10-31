import { buildApiUrl } from './networkConfig.js';
import guestSession from './guestSession.js';

const CACHE_PREFIX = 'ebc_shop_';

function token() {
    if (guestSession.isActive()) return null;
    try { return localStorage.getItem('token'); } catch { return null; }
}

function cacheKey(username) {
    const normalized = String(username || 'jugador').trim().toLowerCase() || 'jugador';
    return CACHE_PREFIX + normalized;
}

export function getCachedShopState(username) {
    if (guestSession.isActive()) return null;
    try { return JSON.parse(localStorage.getItem(cacheKey(username)) || 'null'); }
    catch { return null; }
}

export function cacheShopState(username, state) {
    if (guestSession.isActive()) return;
    if (!state) return;
    try { localStorage.setItem(cacheKey(username), JSON.stringify(state)); }
    catch (error) { console.warn('[shopApi] No se pudo guardar la tienda local:', error); }
}

export function getBattleBackgroundTint(username) {
    const state = getCachedShopState(username);
    const tints = {
        'fondo-aurora': 0xd6e7ff,
        'fondo-volcan': 0xffd7c5,
        'fondo-abismo': 0xe3d2ff,
    };
    return tints[state && state.equippedBackground] || 0xffffff;
}

export function getPurchasedPowerCharges(username) {
    const state = getCachedShopState(username);
    const charges = {};
    (state && state.catalog || []).filter((item) => item.category === 'power').forEach((item) => {
        if (item.quantity > 0) charges[item.type] = item.quantity;
    });
    return charges;
}

async function request(path = '', options = {}) {
    const authToken = token();
    if (!authToken) {
        const message = guestSession.isActive()
            ? 'La tienda requiere una cuenta; las compras no están disponibles como invitado.'
            : 'Inicia sesión para usar la tienda.';
        throw new Error(message);
    }

    const response = await fetch(buildApiUrl(`shop${path}`), {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            ...(options.headers || {}),
        },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'No se pudo completar la operación.');
    return body;
}

export async function fetchShopState(username) {
    const state = await request();
    cacheShopState(username, state);
    return state;
}

export async function purchaseShopItem(username, itemId) {
    const state = await request('/purchase', { method: 'POST', body: JSON.stringify({ itemId }) });
    cacheShopState(username, state);
    return state;
}

export async function equipShopBackground(username, itemId) {
    const state = await request('/equip', { method: 'POST', body: JSON.stringify({ itemId }) });
    cacheShopState(username, state);
    return state;
}

export async function consumeShopPower(username, type) {
    const state = await request('/consume-power', { method: 'POST', body: JSON.stringify({ type }) });
    cacheShopState(username, state);
    return state;
}
