import { play as playSfx } from '../helpers/audioManager.js';
import { getMissionProgress } from '../helpers/playerProgress.js';
import DomSceneBase from './ui/DomSceneBase.js';
import { elementByKey, elementsNavHTML, energyParticlesHTML } from './ui/elementCatalog.js';
import { MISSIONS } from '../game/missionsCatalog.js';
import { claimMissionReward, fetchMissions, fetchProfile, isAuthenticated } from '../helpers/profileApi.js';
import MissionRewardAnimator from '../helpers/MissionRewardAnimator.js';

export default class MissionsScene extends DomSceneBase {
    constructor() {
        super('MissionsScene');
        this.playerData = null;
        this.listeners = [];
        this.missions = [];
        this.wallet = { gems: 0, coins: 0 };
        this.selectedMissionId = null;
        this.claimingMission = false;
        this.rewardAnimator = new MissionRewardAnimator();
    }

    init(data) {
        this.playerData = data.playerData || data || {};
        this.selectedMissionId = null;
        this.claimingMission = false;
        this.wallet = { gems: 0, coins: 0 };
    }

    create() {
        // Progreso real de las misiones, derivado de las partidas jugadas.
        const username = (this.playerData && this.playerData.username) || 'Jugador';
        const missionProgress = getMissionProgress(username);
        this.missions = MISSIONS.map(mission => ({
            ...mission,
            progress: missionProgress[mission.id] || 0,
            completed: (missionProgress[mission.id] || 0) >= mission.target,
            rewardClaimed: false,
        }));

        // Energía flotante del fondo: motas luminosas posicionadas en JS.
        const particles = energyParticlesHTML();

        const missionsHtml = this.missions.map((mission, index) => {
            const el = elementByKey(mission.element);
            const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
            const completed = mission.progress >= mission.target;

            return `
                <article class="mission-card ${completed ? 'is-done' : ''}" data-mission="${mission.id}" style="--el:${el.color}; --el-soft:${el.soft}; --el-glow:${el.glow}; animation-delay:${index * 0.07}s;">
                    <span class="card-accent"></span>
                    <div class="card-top">
                        <div class="mission-orb">
                            <img src="${el.img}" alt="${el.name}" title="${el.name}">
                        </div>
                        <div class="titles">
                            <span class="element-tag">✦ ${el.name}</span>
                            <h3 class="mission-title">${mission.title}</h3>
                            <span class="mission-state">${completed ? 'Completada' : 'En progreso'}</span>
                        </div>
                    </div>
                    <p class="mission-desc">${mission.desc}</p>
                    <div class="mission-bar">
                        <div class="mission-fill" style="width:${percent}%"></div>
                    </div>
                    <div class="mission-meta">
                        <span class="mission-counter">${Math.min(mission.progress, mission.target)} / ${mission.target}</span>
                        <span class="mission-reward">${this.rewardLabel(mission)}</span>
                    </div>
                    <button class="btn-details" data-id="${mission.id}">Ver detalles</button>
                </article>
            `;
        }).join('');

        const elementsNavHtml = elementsNavHTML();

        const html = `
        <style>
            :host { box-sizing: border-box; }

            .screen {
                position: absolute;
                inset: 0;
                overflow: hidden;
                color: white;
                font-family: Poppins, 'Segoe UI', Arial, sans-serif;
                background:
                    radial-gradient(1200px 640px at 18% -6%, rgba(138, 0, 255, 0.20), transparent 58%),
                    radial-gradient(1000px 560px at 88% 8%, rgba(43, 143, 239, 0.16), transparent 55%),
                    radial-gradient(1400px 900px at 50% 118%, rgba(255, 176, 64, 0.10), transparent 60%),
                    linear-gradient(180deg, rgba(6, 8, 26, 0.72) 0%, rgba(13, 12, 40, 0.66) 46%, rgba(8, 16, 38, 0.78) 100%),
                    url('/assets/images/MISIONES/Misiones.jpeg') center / cover no-repeat;
            }

            /* ---------- FONDO: montañas, islas y energía ---------- */
            .bg-layer { position: absolute; inset: 0; pointer-events: none; }
            .mountains {
                position: absolute;
                left: 0; right: 0; bottom: 74px;
                height: 230px;
                opacity: 0.5;
                background: linear-gradient(180deg, rgba(30, 16, 58, 0) 0%, rgba(24, 14, 58, 0.55) 60%, rgba(60, 24, 96, 0.85) 100%);
                clip-path: polygon(0 58%, 7% 34%, 14% 56%, 24% 18%, 33% 50%, 42% 26%, 51% 54%, 61% 22%, 72% 52%, 82% 30%, 91% 55%, 100% 40%, 100% 100%, 0 100%);
                filter: drop-shadow(0 0 24px rgba(138, 0, 255, 0.25));
            }
            .horizon-glow {
                position: absolute;
                left: 50%; bottom: 70px;
                transform: translateX(-50%);
                width: 78%; height: 120px;
                background: radial-gradient(ellipse at center, rgba(110, 240, 255, 0.20), transparent 70%);
                filter: blur(6px);
            }
            .island {
                position: absolute;
                opacity: 0.42;
                clip-path: polygon(14% 46%, 30% 22%, 52% 30%, 74% 16%, 90% 44%, 82% 76%, 22% 82%);
                background: linear-gradient(180deg, #241457, #0b0a26);
                filter: drop-shadow(0 0 18px rgba(110, 240, 255, 0.22)) drop-shadow(0 14px 22px rgba(0,0,0,0.45));
                animation: floatY 15s ease-in-out infinite;
            }
            .island::after {
                content: "";
                position: absolute;
                left: 20%; right: 20%; bottom: -6px;
                height: 12px;
                background: radial-gradient(ellipse, rgba(110, 240, 255, 0.55), transparent 70%);
                filter: blur(6px);
            }
            .island-1 { width: 230px; height: 90px; top: 62%; left: -40px; animation-delay: -4s; }
            .island-2 { width: 300px; height: 110px; top: 56%; right: -60px; background: linear-gradient(180deg, #3a1158, #0b0a26); animation-delay: -9s; }
            .energy {
                position: absolute;
                border-radius: 50%;
                background: #7fe8ff;
                box-shadow: 0 0 12px 3px rgba(127, 232, 255, 0.65);
                animation: rise 9s ease-in-out infinite alternate;
                opacity: 0.25;
            }

            .screen::before {
                content: "";
                position: absolute; inset: 0;
                background: repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px);
                pointer-events: none;
            }

            /* ---------- TOPBAR ---------- */
            .topbar {
                position: relative;
                z-index: 3;
                display: flex;
                align-items: center;
                gap: 26px;
                padding: 18px 30px 14px;
            }
            .brand { display: flex; align-items: center; gap: 16px; }
            .brand .logo {
                width: 58px; height: 58px;
                border-radius: 14px;
                object-fit: cover;
                border: 2px solid rgba(255, 215, 90, 0.5);
                box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 26px rgba(255, 215, 90, 0.16);
            }
            .brand-block { line-height: 1.15; }
            .brand-kicker {
                font-size: 10px;
                letter-spacing: 0.34em;
                text-transform: uppercase;
                color: #ffd75a;
                opacity: 0.85;
            }
            .brand h1 {
                margin: 0;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 34px;
                font-weight: 800;
                letter-spacing: 0.06em;
                background: linear-gradient(180deg, #fff3cf, #e9b949);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                filter: drop-shadow(0 2px 10px rgba(233, 185, 73, 0.35));
            }
            .brand-block p {
                margin: 4px 0 0;
                font-size: 13.5px;
                color: rgba(255,255,255,0.68);
                max-width: 560px;
            }
            .btn-home {
                display: inline-flex;
                align-items: center;
                gap: 9px;
                appearance: none;
                border: 1px solid rgba(255, 215, 90, 0.45);
                background: linear-gradient(135deg, rgba(255, 215, 90, 0.14), rgba(255, 215, 90, 0.04));
                color: #ffd75a;
                font-family: Poppins, Arial, sans-serif;
                font-size: 14px;
                font-weight: 600;
                padding: 12px 20px;
                border-radius: 14px;
                cursor: pointer;
                box-shadow: 0 0 22px rgba(255, 215, 90, 0.10);
                transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
            }
            .btn-home:hover {
                transform: translateY(-2px);
                background: linear-gradient(135deg, rgba(255, 215, 90, 0.24), rgba(255, 215, 90, 0.08));
                box-shadow: 0 0 30px rgba(255, 215, 90, 0.22);
            }
            .top-actions { display:flex; align-items:center; gap:10px; margin-left:auto; }
            .mission-wallet { display:flex; align-items:center; gap:8px; }
            .wallet-counter { display:inline-flex; align-items:center; gap:7px; padding:10px 12px; border:1px solid rgba(255,255,255,.14); border-radius:12px; background:rgba(7,10,27,.62); color:#fff; font-size:13px; font-weight:700; box-shadow:inset 0 1px rgba(255,255,255,.05); }
            .wallet-counter.gems { color:#a4edff; border-color:rgba(110,220,255,.28); }
            .wallet-counter.coins { color:#ffe39a; border-color:rgba(255,215,90,.28); }

            /* ---------- GRILLA DE MISIONES ---------- */
            .missions {
                position: relative;
                z-index: 3;
                flex: 1;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 22px;
                padding: 6px 30px 18px;
                overflow-y: auto;
                min-height: 0;
            }
            .mission-card {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 20px 18px 16px;
                border-radius: 22px;
                background:
                    linear-gradient(160deg, rgba(255,255,255,0.05), rgba(10, 12, 36, 0.72) 55%);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.10);
                box-shadow: 0 18px 44px rgba(0,0,0,0.35);
                overflow: hidden;
                animation: cardReveal 0.6s cubic-bezier(.2,.8,.2,1) both;
                border-top: 1px solid var(--el-soft);
                transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
            }
            .mission-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 26px 56px rgba(0,0,0,0.45), 0 0 34px var(--el-glow);
                border-color: var(--el-soft);
            }
            .card-accent {
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, var(--el), transparent);
                box-shadow: 0 0 18px var(--el-glow);
                opacity: 0.9;
            }
            .card-top { display: flex; align-items: center; gap: 14px; }
            .mission-orb {
                flex: 0 0 72px;
                width: 72px; height: 72px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: conic-gradient(from 0deg, var(--el), #0b0a26 45%, var(--el) 75%, transparent 100%);
                padding: 3px;
                box-shadow: 0 0 22px var(--el-glow);
                animation: orbPulse 4.5s ease-in-out infinite;
            }
            .mission-orb img {
                width: 100%; height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(0,0,0,0.55);
            }
            .titles { min-width: 0; }
            .element-tag {
                display: inline-block;
                font-size: 10.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: var(--el);
                text-shadow: 0 0 12px var(--el-glow);
            }
            .mission-title {
                margin: 3px 0 2px;
                font-size: 19px;
                font-weight: 700;
                color: #fff;
                letter-spacing: 0.01em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .mission-state {
                font-size: 10.5px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: rgba(255,255,255,0.45);
            }
            .is-done .mission-state { color: #ffd75a; }
            .mission-desc {
                margin: 0;
                font-size: 12.5px;
                line-height: 1.5;
                color: rgba(255,255,255,0.72);
                min-height: 38px;
            }
            .mission-bar {
                width: 100%;
                height: 9px;
                border-radius: 999px;
                background: rgba(255,255,255,0.08);
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.05);
            }
            .mission-fill {
                height: 100%;
                border-radius: 999px;
                background: linear-gradient(90deg, var(--el), #ffffff57);
                box-shadow: 0 0 14px var(--el-glow);
                transition: width 800ms ease;
            }
            .is-done .mission-fill { background: linear-gradient(90deg, #ffd75a, #fff0b8); }
            .mission-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                font-size: 12.5px;
            }
            .mission-counter { color: rgba(255,255,255,0.6); }
            .mission-reward {
                color: #ffd75a;
                font-weight: 700;
                background: rgba(255, 215, 90, 0.10);
                border: 1px solid rgba(255, 215, 90, 0.28);
                padding: 6px 12px;
                border-radius: 999px;
                box-shadow: 0 0 14px rgba(255, 215, 90, 0.12);
                white-space: nowrap;
            }
            .btn-details {
                appearance: none;
                margin-top: auto;
                font-family: Poppins, Arial, sans-serif;
                font-size: 13.5px;
                font-weight: 600;
                letter-spacing: 0.03em;
                color: var(--el);
                background: var(--el-soft);
                border: 1px solid var(--el);
                border-radius: 12px;
                padding: 10px 14px;
                cursor: pointer;
                transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
            }
            .btn-details:hover {
                transform: translateY(-2px);
                box-shadow: 0 0 20px var(--el-glow);
                background: var(--el-soft);
                filter: brightness(1.15);
            }

            /* ---------- BARRA DE NAVEGACIÓN INFERIOR ---------- */
            .bottom-nav {
                position: relative;
                z-index: 4;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 18px;
                padding: 10px 30px;
                background: rgba(6, 8, 22, 0.72);
                backdrop-filter: blur(14px);
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 -12px 40px rgba(0,0,0,0.35);
            }
            .nav-elements { display: flex; align-items: center; gap: 12px; }
            .nav-orb {
                width: 40px; height: 40px;
                border-radius: 50%;
                padding: 2px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: conic-gradient(from 0deg, var(--el), transparent 60%);
                opacity: 0.85;
                transition: transform 160ms ease, opacity 160ms ease;
            }
            .nav-orb img {
                width: 100%; height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid rgba(255,255,255,0.18);
            }
            .nav-orb:hover { transform: translateY(-3px) scale(1.08); opacity: 1; }
            .nav-items { display: flex; align-items: center; gap: 10px; }
            .nav-item {
                appearance: none;
                font-family: Poppins, Arial, sans-serif;
                font-size: 13px;
                font-weight: 600;
                color: rgba(255,255,255,0.72);
                background: transparent;
                border: 1px solid transparent;
                padding: 10px 18px;
                border-radius: 12px;
                cursor: pointer;
                transition: color 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease;
            }
            .nav-item:hover { color: #fff; background: rgba(255,255,255,0.06); }
            .nav-item.active {
                color: #ffd75a;
                background: linear-gradient(135deg, rgba(255, 215, 90, 0.14), rgba(255, 215, 90, 0.04));
                border-color: rgba(255, 215, 90, 0.4);
                box-shadow: 0 0 20px rgba(255, 215, 90, 0.16);
            }

            /* ---------- MODAL ---------- */
            .modal-overlay {
                position: absolute;
                inset: 0;
                z-index: 20;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(3, 5, 16, 0.72);
                backdrop-filter: blur(6px);
                padding: 24px;
            }
            .modal-overlay[hidden] { display: none; }
            .modal-card {
                width: min(480px, 92%);
                border-radius: 24px;
                padding: 28px;
                text-align: center;
                background:
                    radial-gradient(600px 300px at 50% 0%, var(--el-soft), transparent 60%),
                    linear-gradient(165deg, rgba(24, 18, 50, 0.95), rgba(6, 8, 22, 0.98));
                border: 1px solid var(--el-soft);
                box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 44px var(--el-glow);
                animation: modalPop 0.28s cubic-bezier(.2,.9,.3,1.2) both;
            }
            .modal-orb {
                width: 92px; height: 92px;
                margin: 0 auto 14px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: conic-gradient(from 0deg, var(--el), #0b0a26 45%, var(--el) 80%, transparent 100%);
                padding: 4px;
                box-shadow: 0 0 34px var(--el-glow);
            }
            .modal-orb img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid rgba(0,0,0,0.55); }
            .modal-element {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                color: var(--el);
            }
            .modal-title {
                margin: 8px 0 14px;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 27px;
                color: #fff;
                letter-spacing: 0.02em;
            }
            .modal-desc { margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.75); }
            .modal-bar {
                width: 100%; height: 10px;
                background: rgba(255,255,255,0.08);
                border-radius: 999px;
                overflow: hidden;
            }
            .modal-fill {
                height: 100%;
                border-radius: 999px;
                background: linear-gradient(90deg, var(--el), #fff);
                box-shadow: 0 0 16px var(--el-glow);
            }
            .modal-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 16px 0 22px;
                font-size: 14px;
            }
            .modal-counter { color: rgba(255,255,255,0.6); }
            .modal-reward { color: #ffd75a; font-weight: 700; }
            .btn-close {
                appearance: none;
                width: 100%;
                font-family: Poppins, Arial, sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #ffd75a;
                background: linear-gradient(135deg, rgba(255, 215, 90, 0.16), rgba(255, 215, 90, 0.05));
                border: 1px solid rgba(255, 215, 90, 0.45);
                padding: 13px;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 160ms ease, box-shadow 160ms ease;
            }
            .btn-close:hover { transform: translateY(-2px); box-shadow: 0 0 22px rgba(255, 215, 90, 0.2); }
            .btn-close:disabled { opacity:.65; cursor:wait; transform:none; }
            .modal-feedback { min-height:18px; margin:10px 0 0; color:#9deeff; font-size:12px; }

            /* ---------- ANIMACIONES ---------- */
            @keyframes floatY {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-16px); }
            }
            @keyframes rise {
                0% { transform: translateY(0) scale(1); opacity: 0.2; }
                100% { transform: translateY(-70px) scale(1.35); opacity: 0.5; }
            }
            @keyframes orbPulse {
                0%, 100% { filter: drop-shadow(0 0 6px var(--el-glow)); }
                50% { filter: drop-shadow(0 0 16px var(--el-glow)); }
            }
            @keyframes cardReveal {
                from { opacity: 0; transform: translateY(26px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes modalPop {
                from { opacity: 0; transform: scale(0.86) translateY(14px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @media (max-width: 900px) {
                .missions { grid-template-columns: 1fr; }
            }
            @media (max-width: 900px) and (orientation: landscape) and (max-height: 600px) {
                .topbar { padding: 3px 12px; }
                .brand { gap: 8px; }
                .brand .logo { width: 36px; height: 36px; border-radius: 10px; }
                .brand-kicker, .brand-block p { display: none; }
                .brand h1 { font-size: 22px; }
                .top-actions { gap:6px; }
                .mission-wallet { gap:4px; }
                .wallet-counter { padding:6px 8px; font-size:10px; }
                .btn-home { padding: 7px 11px; font-size: 11px; border-radius: 10px; }
                .missions { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 4px 10px 6px; overflow-y: auto; }
                .mission-card { min-height: 0; gap: 5px; padding: 8px 10px; border-radius: 13px; }
                .card-top { gap: 7px; }
                .mission-orb { flex-basis: 36px; width: 36px; height: 36px; }
                .element-tag, .mission-state { font-size: 8px; }
                .mission-title { margin: 1px 0; font-size: 14px; }
                .mission-desc { min-height: 0; font-size: 10px; line-height: 1.25; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
                .mission-bar { height: 5px; flex: 0 0 5px; }
                .mission-meta { gap: 4px; font-size: 10px; }
                .mission-reward { padding: 3px 7px; font-size: 9px; }
                .btn-details { min-height: 34px; padding: 6px 9px; font-size: 11px; border-radius: 9px; }
                .bottom-nav { gap: 6px; padding: 3px 10px; }
                .nav-elements { gap: 5px; }
                .nav-orb { width: 25px; height: 25px; }
                .nav-items { gap: 3px; }
                .nav-item { min-height: 32px; padding: 5px 8px; font-size: 10px; }
            }
        </style>

        <div class="screen">
            <div class="bg-layer">
                <div class="mountains"></div>
                <div class="horizon-glow"></div>
                <div class="island island-1"></div>
                <div class="island island-2"></div>
                ${particles}
            </div>

            <header class="topbar">
                <div class="brand">
                    <img class="logo" src="/assets/images/logotipomenu.jpg" alt="Elemental Battlecards">
                    <div class="brand-block">
                        <span class="brand-kicker">Elemental Battle Cards</span>
                        <h1>Misiones</h1>
                        <p>Completa objetivos elementales y reclama recompensas para reforzar tu colección.</p>
                    </div>
                </div>
                <div class="top-actions">
                    <div class="mission-wallet" aria-label="Saldo de cuenta">
                        <span class="wallet-counter gems" id="wallet-gems" aria-label="Gemas">💎 <b id="wallet-gems-value">—</b></span>
                        <span class="wallet-counter coins" id="wallet-coins" aria-label="Monedas">🪙 <b id="wallet-coins-value">—</b></span>
                    </div>
                    <button class="btn-home" id="btn-home">🏠 Inicio</button>
                </div>
            </header>

            <main class="missions">
                ${missionsHtml}
            </main>

            <nav class="bottom-nav">
                <div class="nav-elements">${elementsNavHtml}</div>
                <div class="nav-items">
                    <button class="nav-item active">Misiones</button>
                    <button class="nav-item" data-nav="settings">⚙️ Configuración</button>
                    <button class="nav-item" data-nav="profile">👤 Perfil</button>
                </div>
            </nav>

            <div class="modal-overlay" id="mission-modal" hidden>
                <div class="modal-card" id="modal-card">
                    <div class="modal-orb"><img id="modal-orb" src="/assets/images/iconos/fuego.jpeg" alt="Icono"></div>
                    <span class="modal-element" id="modal-element">Fuego</span>
                    <h2 class="modal-title" id="modal-title">Misión</h2>
                    <p class="modal-desc" id="modal-desc"></p>
                    <div class="modal-bar"><div class="modal-fill" id="modal-bar" style="width:0%"></div></div>
                    <div class="modal-meta">
                        <span class="modal-counter" id="modal-counter">0 / 1</span>
                        <span class="modal-reward" id="modal-reward">+50 gemas</span>
                    </div>
                    <button class="btn-close" id="btn-mission-action">Cerrar</button>
                    <p class="modal-feedback" id="modal-feedback" role="status" aria-live="polite"></p>
                </div>
            </div>
        </div>`;

        const node = this.mountDOM(html, { flex: true });
        this.renderWallet(node);

        this.bind('#btn-home', () => this.scene.start('HomeScenes', { playerData: this.playerData }));
        this.bind('[data-nav="settings"]', () => this.scene.start('SettingsScene', { playerData: this.playerData }));
        this.bind('[data-nav="profile"]', () => this.scene.start('ProfileScene', { playerData: this.playerData }));

        const modal = node.querySelector('#mission-modal');
        const modalCard = node.querySelector('#modal-card');
        const detailButtons = node.querySelectorAll('.btn-details');

        const openModal = (missionId) => {
            const mission = this.missions.find(m => m.id === missionId);
            if (!mission || !modal) return;
            this.selectedMissionId = missionId;
            const el = elementByKey(mission.element);
            const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
            modalCard.style.setProperty('--el', el.color);
            modalCard.style.setProperty('--el-soft', el.soft);
            modalCard.style.setProperty('--el-glow', el.glow);
            node.querySelector('#modal-orb').src = el.img;
            node.querySelector('#modal-element').textContent = '✦ ' + el.name;
            node.querySelector('#modal-title').textContent = mission.title;
            node.querySelector('#modal-desc').textContent = mission.desc;
            node.querySelector('#modal-bar').style.width = percent + '%';
            node.querySelector('#modal-counter').textContent = `${Math.min(mission.progress, mission.target)} / ${mission.target}`;
            node.querySelector('#modal-reward').textContent = this.rewardLabel(mission);
            node.querySelector('#modal-feedback').textContent = '';
            this.updateMissionAction(node, mission);
            modal.hidden = false;
        };

        const closeModal = () => {
            if (modal) modal.hidden = true;
        };

        detailButtons.forEach(btn => {
            this.track(btn, () => { playSfx('click', this); openModal(btn.getAttribute('data-id')); }, 'click');
        });

        this.bindElement(node.querySelector('#btn-mission-action'), () => {
            this.handleMissionAction(node, closeModal);
        });
        this.bindElement(modal, (ev) => {
            if (ev.target === modal) closeModal();
        });

        this.refreshAccountState(node, openModal);
    }

    rewardLabel(mission) {
        const isCoinReward = String(mission.unit || '').toLowerCase().includes('moned')
            || mission.rewardCurrency === 'coins';
        const icon = isCoinReward ? '🪙' : '💎';
        const unit = isCoinReward ? 'monedas' : 'gemas';
        return `${icon} +${mission.reward} ${unit}`;
    }

    updateMissionAction(node, mission) {
        const button = node.querySelector('#btn-mission-action');
        if (!button) return;
        const canClaim = mission.completed && !mission.rewardClaimed;
        button.textContent = canClaim ? 'Obtener' : 'Cerrar';
        button.disabled = this.claimingMission;
        button.setAttribute('aria-label', canClaim ? 'Obtener recompensa de misión' : 'Cerrar detalles de misión');
    }

    refreshMissionCard(node, mission) {
        const card = Array.from(node.querySelectorAll('.mission-card'))
            .find((item) => item.dataset.mission === mission.id);
        if (!card) return;
        const completed = Boolean(mission.completed);
        const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
        card.classList.toggle('is-done', completed);
        card.querySelector('.mission-state').textContent = mission.rewardClaimed
            ? 'Recompensa obtenida'
            : completed ? 'Recompensa disponible' : 'En progreso';
        card.querySelector('.mission-counter').textContent = `${Math.min(mission.progress, mission.target)} / ${mission.target}`;
        card.querySelector('.mission-fill').style.width = `${percent}%`;
        card.querySelector('.mission-reward').textContent = this.rewardLabel(mission);
    }

    async refreshAccountState(node, openModal) {
        const [missionsResult, profileResult] = await Promise.allSettled([fetchMissions(), fetchProfile()]);
        if (!node.isConnected) return;

        if (missionsResult.status === 'fulfilled' && Array.isArray(missionsResult.value)) {
            missionsResult.value.forEach((remote) => {
                const mission = this.missions.find((item) => item.id === remote.id);
                if (!mission) return;
                mission.progress = Number(remote.progress) || 0;
                mission.completed = Boolean(remote.completed);
                mission.rewardClaimed = Boolean(remote.rewardClaimed);
                mission.rewardCurrency = remote.rewardCurrency || 'gems';
                mission.reward = String(remote.rewardAmount ?? remote.rewardGems ?? mission.reward);
                mission.unit = mission.rewardCurrency === 'coins' ? 'monedas' : 'gemas';
                this.refreshMissionCard(node, mission);
            });
        }

        if (profileResult.status === 'fulfilled' && profileResult.value) {
            this.wallet = {
                gems: Number(profileResult.value.gems) || 0,
                coins: Number(profileResult.value.coins) || 0,
            };
            this.renderWallet(node);
        }

        if (this.selectedMissionId && !node.querySelector('#mission-modal').hidden) {
            openModal(this.selectedMissionId);
        }
    }

    renderWallet(node) {
        const gems = node.querySelector('#wallet-gems-value');
        const coins = node.querySelector('#wallet-coins-value');
        if (gems) gems.textContent = String(this.wallet.gems);
        if (coins) coins.textContent = String(this.wallet.coins);
    }

    async handleMissionAction(node, closeModal) {
        const mission = this.missions.find((item) => item.id === this.selectedMissionId);
        if (!mission || !mission.completed || mission.rewardClaimed) {
            closeModal();
            return;
        }
        if (!isAuthenticated()) {
            node.querySelector('#modal-feedback').textContent = 'Inicia sesión para reclamar y guardar esta recompensa.';
            return;
        }
        if (this.claimingMission) return;

        this.claimingMission = true;
        this.updateMissionAction(node, mission);
        const feedback = node.querySelector('#modal-feedback');
        feedback.textContent = 'Preparando tu recompensa…';
        try {
            const result = await claimMissionReward(mission.id);
            if (!result || !result.ok) throw new Error('No se pudo confirmar la recompensa. Inténtalo de nuevo.');

            const currency = result.currency === 'coins' ? 'coins' : 'gems';
            const target = node.querySelector(currency === 'coins' ? '#wallet-coins' : '#wallet-gems');
            await this.rewardAnimator.animate({
                source: node.querySelector('#modal-reward'),
                target,
                currency,
                amount: result.amount,
            });

            mission.rewardClaimed = true;
            this.wallet = {
                gems: Number(result.wallet?.gems) || 0,
                coins: Number(result.wallet?.coins) || 0,
            };
            this.renderWallet(node);
            this.refreshMissionCard(node, mission);
            feedback.textContent = `${currency === 'coins' ? 'Monedas' : 'Gemas'} añadidas a tu saldo.`;
        } catch (error) {
            feedback.textContent = error.message || 'No se pudo reclamar la recompensa.';
        } finally {
            this.claimingMission = false;
            this.updateMissionAction(node, mission);
        }
    }
}
