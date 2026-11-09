import DomSceneBase from './ui/DomSceneBase.js';
import { energyParticlesHTML } from './ui/elementCatalog.js';
import { cacheShopState, equipShopBackground, fetchShopState, purchaseShopItem } from '../helpers/shopApi.js';

const CATEGORIES = [
    { id: 'background', label: 'Fondos' },
    { id: 'card', label: 'Cartas' },
    { id: 'power', label: 'Poderes' },
];
const POWER_ICONS = { fuego: '🔥', agua: '💧', planta: '🌿', luz: '✨', sombra: '🌑', espiritu: '🌀' };

export default class ShopScene extends DomSceneBase {
    constructor() {
        super('ShopScene');
        this.playerData = {};
        this.state = null;
        this.category = 'background';
        this.busy = false;
    }

    init(data) {
        this.playerData = data.playerData || data || {};
        this.state = null;
        this.category = 'background';
        this.busy = false;
    }

    create() {
        const particles = energyParticlesHTML({ count: 12, delayStep: -1.1 });
        const html = `
        <style>
            :host { box-sizing: border-box; }
            .shop-screen { position:absolute; inset:0; display:flex; flex-direction:column; overflow:hidden; color:#f6f2e8; font-family:Poppins,'Segoe UI',sans-serif; background:radial-gradient(900px 460px at 14% 0%,rgba(86,156,255,.18),transparent 60%),radial-gradient(760px 500px at 96% 100%,rgba(174,91,255,.14),transparent 58%),linear-gradient(155deg,#090d1c,#111329 55%,#080a15); }
            .shop-screen::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.18; background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 5px); }
            .shop-particle { position:absolute; width:4px; height:4px; border-radius:50%; background:#8fe7ff; box-shadow:0 0 14px 4px rgba(143,231,255,.44); opacity:.24; animation:shop-rise 9s ease-in-out infinite alternate; pointer-events:none; }
            @keyframes shop-rise { to { transform:translateY(-45px) scale(1.4); opacity:.6; } }
            .shop-top { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:22px clamp(18px,4vw,52px); border-bottom:1px solid rgba(255,215,90,.16); background:rgba(5,7,18,.38); }
            .shop-brand { display:flex; align-items:center; gap:15px; min-width:0; }
            .shop-logo { width:48px; height:48px; object-fit:cover; border:1px solid rgba(255,215,90,.42); border-radius:13px; box-shadow:0 0 22px rgba(255,215,90,.12); }
            .shop-kicker { display:block; color:#71dff2; font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; }
            .shop-title { margin:2px 0 0; font:800 clamp(25px,3vw,34px)/1.1 Georgia,'Times New Roman',serif; letter-spacing:.02em; color:#fff0bf; text-shadow:0 2px 18px rgba(255,194,87,.16); }
            .shop-subtitle { margin:4px 0 0; color:rgba(241,239,230,.58); font-size:12px; }
            .shop-head-actions { display:flex; align-items:center; gap:12px; }
            .wallet { display:flex; gap:9px; }
            .wallet-pill { display:flex; align-items:center; gap:7px; padding:9px 13px; border:1px solid rgba(255,255,255,.12); border-radius:12px; background:rgba(255,255,255,.045); color:#fff; font-size:13px; font-weight:700; }
            .wallet-pill.gems { border-color:rgba(92,227,255,.23); color:#9deeff; }
            .wallet-pill.coins { border-color:rgba(255,215,90,.23); color:#ffe293; }
            .shop-home { appearance:none; padding:10px 15px; border:1px solid rgba(255,215,90,.32); border-radius:12px; background:rgba(255,215,90,.08); color:#ffe29a; font:600 13px Poppins,'Segoe UI',sans-serif; cursor:pointer; transition:transform .18s,background .18s; }
            .shop-home:hover { transform:translateY(-2px); background:rgba(255,215,90,.15); }
            .shop-main { position:relative; z-index:1; display:flex; flex:1; min-height:0; flex-direction:column; width:min(1320px,100%); margin:0 auto; padding:25px clamp(18px,4vw,46px) 24px; }
            .shop-intro { display:flex; align-items:end; justify-content:space-between; gap:16px; margin-bottom:18px; }
            .shop-intro h2 { margin:0; font:700 21px Georgia,'Times New Roman',serif; color:#fff; }
            .shop-intro p { margin:6px 0 0; color:rgba(238,238,246,.58); font-size:12px; }
            .shop-status { min-height:18px; margin:0; color:#89e5c7; font-size:12px; text-align:right; }
            .shop-tabs { display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,.1); }
            .shop-tab { position:relative; padding:10px 16px 12px; border:0; background:transparent; color:rgba(255,255,255,.56); font:600 13px Poppins,'Segoe UI',sans-serif; cursor:pointer; }
            .shop-tab.active { color:#ffe08c; }
            .shop-tab.active::after { content:''; position:absolute; right:12px; bottom:-1px; left:12px; height:2px; border-radius:2px; background:linear-gradient(90deg,#6eddf3,#ffd75a); box-shadow:0 0 10px rgba(255,215,90,.42); }
            .shop-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; align-content:start; overflow:auto; padding:2px 4px 16px 0; }
            .shop-item { position:relative; display:flex; min-height:250px; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,.11); border-radius:17px; background:linear-gradient(145deg,rgba(29,35,61,.88),rgba(12,15,31,.94)); box-shadow:0 12px 30px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.045); animation:shop-arrive .35s ease both; }
            @keyframes shop-arrive { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
            .shop-item::before { content:''; position:absolute; top:0; right:13%; left:13%; height:1px; background:linear-gradient(90deg,transparent,rgba(111,223,243,.7),transparent); }
            .item-preview { position:relative; display:flex; align-items:center; justify-content:center; height:127px; overflow:hidden; background:radial-gradient(circle at 50% 40%,rgba(93,194,230,.2),transparent 63%),#101426; }
            .item-preview img { width:100%; height:100%; object-fit:cover; }
            .item-preview.card img { width:85px; height:112px; border:1px solid rgba(255,215,90,.34); border-radius:7px; box-shadow:0 7px 22px #0008; }
            .power-icon { display:grid; width:66px; height:66px; place-items:center; border:1px solid rgba(255,215,90,.35); border-radius:50%; background:radial-gradient(circle at 35% 30%,rgba(115,195,255,.28),rgba(18,23,44,.95)); box-shadow:0 0 24px rgba(92,227,255,.16); font-size:34px; }
            .item-preview.background { background-image:linear-gradient(0deg,rgba(10,12,24,.26),rgba(10,12,24,.03)),url('/assets/images/campo%20juego/image258.png'); background-size:cover; background-position:center; }
            .item-preview.background.aurora { filter:hue-rotate(18deg) saturate(.9); }
            .item-preview.background.volcan { filter:hue-rotate(315deg) saturate(1.25); }
            .item-preview.background.abismo { filter:hue-rotate(90deg) saturate(.8); }
            .item-info { display:flex; flex:1; flex-direction:column; padding:14px 15px 13px; }
            .item-category { color:#70d9ed; font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
            .item-name { margin:5px 0 4px; color:#fff; font:700 16px Georgia,'Times New Roman',serif; }
            .item-desc { flex:1; margin:0 0 13px; color:rgba(235,237,244,.58); font-size:11px; line-height:1.5; }
            .item-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; }
            .item-price { color:#ffe193; font-size:12px; font-weight:700; white-space:nowrap; }
            .item-price.gems { color:#93eaff; }
            .item-action { min-width:95px; padding:8px 10px; border:1px solid rgba(255,215,90,.38); border-radius:10px; background:linear-gradient(135deg,rgba(255,215,90,.15),rgba(255,215,90,.045)); color:#ffe29a; font:600 11px Poppins,'Segoe UI',sans-serif; cursor:pointer; transition:background .16s,transform .16s; }
            .item-action:hover:not(:disabled) { transform:translateY(-1px); background:rgba(255,215,90,.22); }
            .item-action:disabled { border-color:rgba(255,255,255,.1); background:rgba(255,255,255,.035); color:rgba(255,255,255,.42); cursor:default; }
            .shop-empty { grid-column:1/-1; padding:38px 18px; border:1px dashed rgba(255,255,255,.16); border-radius:16px; color:rgba(255,255,255,.58); text-align:center; }
            .shop-footnote { margin:10px 0 0; color:rgba(233,234,242,.38); font-size:10px; text-align:center; }
            @media (max-width:900px) { .shop-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
            @media (max-width:620px) { .shop-top { align-items:flex-start; flex-direction:column; padding:17px; } .shop-head-actions { width:100%; justify-content:space-between; } .wallet { gap:6px; } .wallet-pill { padding:8px 9px; font-size:11px; } .shop-main { padding:18px 14px; } .shop-grid { grid-template-columns:1fr; } .shop-item { min-height:225px; } .item-preview { height:112px; } .shop-intro { align-items:flex-start; flex-direction:column; } .shop-status { text-align:left; } }
            @media (max-width:900px) and (orientation:landscape) and (max-height:600px) { .shop-top { align-items:center; flex-direction:row; gap:10px; padding:7px 12px; } .shop-logo { width:36px; height:36px; } .shop-title { font-size:clamp(18px,3vw,24px); } .shop-subtitle { display:none; } .shop-head-actions { width:auto; gap:8px; } .wallet { gap:5px; } .wallet-pill { padding:6px 8px; font-size:10px; } .shop-home { padding:7px 10px; font-size:11px; } .shop-main { padding:8px 12px; } .shop-intro { align-items:center; margin-bottom:6px; } .shop-intro h2 { font-size:18px; } .shop-intro p { margin-top:2px; } .shop-tabs { gap:3px; margin-bottom:6px; } .shop-tab { padding:6px 10px 8px; font-size:11px; } .shop-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; padding:0 2px 8px 0; } .shop-item { min-height:0; } .item-preview { height:clamp(54px,14vh,78px); } .item-info { padding:8px 10px; } .item-name { margin:3px 0; font-size:14px; } .item-desc { margin-bottom:6px; font-size:10px; } .item-footer { flex-wrap:wrap; } .item-action { min-height:36px; } }
        </style>
        <div class="shop-screen">
            ${particles}
            <header class="shop-top">
                <div class="shop-brand">
                    <img class="shop-logo" src="/assets/images/logotipomenu.jpg" alt="">
                    <div><span class="shop-kicker">Armería elemental</span><h1 class="shop-title">Tienda</h1><p class="shop-subtitle">Personaliza tu arena y amplía tu colección.</p></div>
                </div>
                <div class="shop-head-actions">
                    <div class="wallet" aria-label="Saldo"><span class="wallet-pill coins">🪙 <b id="coins-balance">—</b></span><span class="wallet-pill gems">💎 <b id="gems-balance">—</b></span></div>
                    <button class="shop-home" id="shop-home">← Inicio</button>
                </div>
            </header>
            <main class="shop-main">
                <div class="shop-intro"><div><h2>Artículos destacados</h2><p>Las compras se guardan en tu cuenta.</p></div><p class="shop-status" id="shop-status" role="status">Cargando catálogo…</p></div>
                <nav class="shop-tabs" aria-label="Categorías de tienda">
                    ${CATEGORIES.map((category) => `<button class="shop-tab ${category.id === this.category ? 'active' : ''}" data-category="${category.id}">${category.label}</button>`).join('')}
                </nav>
                <section class="shop-grid" id="shop-grid" aria-live="polite"><div class="shop-empty">Cargando artículos…</div></section>
                <p class="shop-footnote">Los poderes comprados se guardan como cargas de uso adicional. Los fondos se pueden equipar para tus batallas.</p>
            </main>
        </div>`;

        const node = this.mountDOM(html);
        this.bind('#shop-home', () => this.scene.start('HomeScenes', { playerData: this.playerData }));
        this.track(node, (event) => this.handleClick(event, node), 'click');
        this.loadState(node);
    }

    async loadState(node) {
        try {
            this.state = await fetchShopState(this.playerData.username);
            this.render(node);
            this.setStatus(node, 'Tu tienda está lista.');
        } catch (error) {
            this.setStatus(node, error.message || 'No se pudo cargar la tienda.', true);
            const grid = node.querySelector('#shop-grid');
            if (grid) grid.innerHTML = '<div class="shop-empty">Inicia sesión y conecta con el servidor para consultar tus compras y tu saldo.</div>';
        }
    }

    render(node) {
        if (!this.state) return;
        node.querySelector('#coins-balance').textContent = String(this.state.wallet.coins || 0);
        node.querySelector('#gems-balance').textContent = String(this.state.wallet.gems || 0);
        node.querySelectorAll('.shop-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.category === this.category));

        const items = this.state.catalog.filter((item) => item.category === this.category);
        if (this.category === 'background') {
            items.unshift({ id: 'fondo-base', name: 'Arena original', description: 'El campo elemental clásico.', category: 'background', price: 0, currency: 'gems', owned: true, equipped: this.state.equippedBackground === 'fondo-base', style: 'base' });
        }
        const grid = node.querySelector('#shop-grid');
        grid.innerHTML = items.length ? items.map((item, index) => this.itemHtml(item, index)).join('') : '<div class="shop-empty">No hay artículos disponibles en esta categoría.</div>';
    }

    itemHtml(item, index) {
        const categoryLabel = { background: 'Fondo de combate', card: 'Carta coleccionable', power: 'Poder · carga extra' }[item.category];
        const preview = item.category === 'card'
            ? `<div class="item-preview card"><img src="/assets/images/cartas/carta-${item.type}-${item.level}.jpeg" alt="${item.name}" loading="lazy"></div>`
            : item.category === 'power'
                ? `<div class="item-preview"><span class="power-icon" aria-hidden="true">${POWER_ICONS[item.type] || '✦'}</span></div>`
                : `<div class="item-preview background ${item.style || ''}"></div>`;
        let action;
        if (item.category === 'background' && item.owned) {
            action = `<button class="item-action" data-action="equip" data-item="${item.id}" ${item.equipped ? 'disabled' : ''}>${item.equipped ? 'Equipado' : 'Equipar'}</button>`;
        } else if (item.category === 'card' && item.owned) {
            action = '<button class="item-action" disabled>En colección</button>';
        } else if (item.category === 'power') {
            action = `<button class="item-action" data-action="purchase" data-item="${item.id}">Comprar carga</button>`;
        } else {
            action = `<button class="item-action" data-action="purchase" data-item="${item.id}">Comprar</button>`;
        }
        const price = item.price === 0 ? 'Gratis' : `💠 ${item.price} ${item.currency === 'coins' ? 'monedas' : 'gemas'}`;
        return `<article class="shop-item" style="animation-delay:${index * 45}ms">${preview}<div class="item-info"><span class="item-category">${categoryLabel}</span><h3 class="item-name">${item.name}</h3><p class="item-desc">${item.description}</p><div class="item-footer"><span class="item-price ${item.currency === 'gems' ? 'gems' : ''}">${price}</span>${action}</div></div></article>`;
    }

    async handleClick(event, node) {
        const tab = event.target.closest('[data-category]');
        if (tab) {
            this.category = tab.dataset.category;
            this.render(node);
            return;
        }
        const action = event.target.closest('[data-action]');
        if (!action || this.busy || !this.state) return;
        this.busy = true;
        action.disabled = true;
        try {
            if (action.dataset.action === 'purchase') {
                this.state = await purchaseShopItem(this.playerData.username, action.dataset.item);
                this.render(node);
                this.setStatus(node, 'Compra añadida a tu cuenta.');
            } else if (action.dataset.action === 'equip') {
                this.state = await equipShopBackground(this.playerData.username, action.dataset.item);
                this.render(node);
                this.setStatus(node, 'Fondo equipado para tus batallas.');
            }
        } catch (error) {
            action.disabled = false;
            this.setStatus(node, error.message || 'No se pudo completar la compra.', true);
        } finally {
            this.busy = false;
        }
    }

    setStatus(node, message, isError = false) {
        const status = node.querySelector('#shop-status');
        if (status) {
            status.textContent = message;
            status.style.color = isError ? '#ff9c98' : '#89e5c7';
        }
    }
}
