import _Phaser from 'phaser';
import { play as _playSfx } from '../helpers/audioManager.js';
import DomSceneBase from './ui/DomSceneBase.js';
import { elementsNavHTML, energyParticlesHTML } from './ui/elementCatalog.js';
import { GAME_RULES_HTML as RULES_HTML, GAME_TUTORIAL_HTML as TUTORIAL_HTML } from '../content/mechanicsContent.js';

export default class MechanicsScene extends DomSceneBase {
    constructor() {
        super('MechanicsScene');
        this.playerData = {};
        this.listeners = [];
    }

    init(data) {
        this.playerData = data.playerData || data || {};
    }

    create() {
        const particles = energyParticlesHTML();

        const elementsNavHtml = elementsNavHTML();

        const html = `
        <style>
            :host { box-sizing: border-box; }
            .screen {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: white;
                font-family: Poppins, 'Segoe UI', Arial, sans-serif;
                background:
                    radial-gradient(1200px 640px at 18% -6%, rgba(138, 0, 255, 0.20), transparent 58%),
                    radial-gradient(1000px 560px at 88% 8%, rgba(43, 143, 239, 0.16), transparent 55%),
                    radial-gradient(1400px 900px at 50% 118%, rgba(255, 176, 64, 0.10), transparent 60%),
                    linear-gradient(180deg, rgba(6, 8, 26, 0.72) 0%, rgba(13, 12, 40, 0.66) 46%, rgba(8, 16, 38, 0.78) 100%),
                    url('/assets/images/Mecanicas/Mecanicas.jpeg') center / cover no-repeat;
            }

            /* ---------- FONDO: montañas, castillo, islas y energía ---------- */
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
            .castle-glow {
                position: absolute;
                left: 50%; bottom: 150px;
                transform: translateX(-50%);
                width: 520px; height: 200px;
                background: radial-gradient(ellipse at center, rgba(110, 240, 255, 0.22), rgba(138, 0, 255, 0.10) 45%, transparent 72%);
                filter: blur(8px);
            }
            .castle {
                position: absolute;
                left: 50%; bottom: 120px;
                transform: translateX(-50%);
                width: 440px; height: 280px;
                opacity: 0.8;
                background: linear-gradient(180deg, #241457 0%, #120b38 55%, #0a0a26 100%);
                clip-path: polygon(
                    0 100%, 0 44%, 6% 44%, 6% 28%, 12% 28%, 12% 44%,
                    20% 44%, 20% 22%, 25% 22%, 25% 40%, 32% 40%, 32% 30%,
                    39% 30%, 39% 14%, 46% 14%, 46% 0%, 54% 0%, 54% 14%,
                    61% 14%, 61% 30%, 68% 30%, 68% 40%, 75% 40%, 75% 22%,
                    80% 22%, 80% 44%, 88% 44%, 88% 28%, 94% 28%, 94% 44%,
                    100% 44%, 100% 100%
                );
                filter: drop-shadow(0 0 28px rgba(138, 0, 255, 0.4));
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
            .island-1 { width: 230px; height: 90px; top: 56%; left: -40px; animation-delay: -4s; }
            .island-2 { width: 300px; height: 110px; top: 50%; right: -60px; background: linear-gradient(180deg, #3a1158, #0b0a26); animation-delay: -9s; }
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

            /* ---------- CORNER BRACKETS ---------- */
            .hud { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
            .hud::before, .hud::after {
                content: "";
                position: absolute;
                width: 46px; height: 46px;
                border: 2px solid rgba(255, 215, 90, 0.35);
                border-radius: 6px;
                filter: drop-shadow(0 0 8px rgba(255, 215, 90, 0.3));
            }
            .hud::before { top: 58px; left: 14px; border-right: none; border-bottom: none; }
            .hud::after { bottom: 58px; right: 14px; border-left: none; border-top: none; }

            /* ---------- TOPBAR ---------- */
            .topbar {
                position: relative;
                z-index: 3;
                display: flex;
                align-items: center;
                gap: 26px;
                padding: 16px 30px 12px;
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
            .brand-block p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.68); max-width: 560px; }

            .top-nav {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px;
                background: rgba(6, 8, 22, 0.55);
                border: 1px solid rgba(255, 215, 90, 0.22);
                border-radius: 16px;
                box-shadow: 0 0 24px rgba(0,0,0,0.3);
            }
            .tn {
                appearance: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-family: Poppins, Arial, sans-serif;
                font-size: 13px;
                font-weight: 600;
                color: rgba(255,255,255,0.75);
                background: transparent;
                border: 1px solid transparent;
                padding: 10px 16px;
                border-radius: 12px;
                cursor: pointer;
                transition: color 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease;
            }
            .tn:hover { color: #fff; background: rgba(255,255,255,0.06); }
            .tn.active {
                color: #ffd75a;
                background: linear-gradient(135deg, rgba(255, 215, 90, 0.14), rgba(255, 215, 90, 0.04));
                border-color: rgba(255, 215, 90, 0.4);
                box-shadow: 0 0 20px rgba(255, 215, 90, 0.16);
            }

            /* ---------- PANEL PRINCIPAL ---------- */
            .mech-body {
                position: relative;
                z-index: 3;
                flex: 1;
                min-height: 0;
                padding: 6px 30px 18px;
            }
            .mech-panel {
                position: relative;
                width: min(1400px, 100%);
                margin: 0 auto;
                height: 100%;
                background: rgba(6, 8, 22, 0.72);
                backdrop-filter: blur(14px);
                border: 1px solid rgba(255, 215, 90, 0.22);
                box-shadow: 0 22px 56px rgba(0,0,0,0.42), inset 0 0 26px rgba(92, 227, 255, 0.04);
                border-radius: 24px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                padding: 26px;
                animation: panelReveal 0.55s cubic-bezier(.2,.8,.2,1) both;
            }
            .mech-panel::before {
                content: "";
                position: absolute;
                top: 0; left: 8%; right: 8%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #ffd75a, transparent);
                filter: drop-shadow(0 0 12px rgba(255, 215, 90, 0.6));
            }
            .panel-kicker {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                color: #ffd75a;
                opacity: 0.85;
            }
            .panel-title {
                margin: 6px 0 2px;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 27px;
                color: #fff;
                letter-spacing: 0.02em;
            }
            .panel-sub { margin: 0 0 18px; font-size: 13px; color: rgba(255,255,255,0.6); }
            .panel-glow {
                height: 1px;
                margin-bottom: 18px;
                background: linear-gradient(90deg, #5ce3ff, transparent);
                box-shadow: 0 0 10px rgba(92, 227, 255, 0.4);
            }

            /* ---------- LISTA DE REGLAS (siempre visibles) ---------- */
            .rules-wrap {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                padding-right: 10px;
                border-radius: 14px;
            }
            .rules-wrap::-webkit-scrollbar { width: 10px; }
            .rules-wrap::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
            .rules-wrap::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #ffd75a, #5ce3ff);
                border-radius: 999px;
                box-shadow: 0 0 8px rgba(255, 215, 90, 0.4);
            }

            .rules {
                counter-reset: rule;
                list-style: none;
                margin: 0;
                padding: 2px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .rules > li {
                counter-increment: rule;
                position: relative;
                padding: 20px 22px 18px 68px;
                border-radius: 16px;
                background: linear-gradient(160deg, rgba(255,255,255,0.055), rgba(10, 12, 36, 0.62) 60%);
                border: 1px solid rgba(255,255,255,0.11);
                box-shadow: inset 0 0 18px rgba(255,255,255,0.02);
                font-size: 14.5px;
                line-height: 1.75;
                color: rgba(255,255,255,0.9);
                transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
            }
            .rules > li:hover {
                border-color: rgba(92, 227, 255, 0.35);
                box-shadow: 0 0 22px rgba(92, 227, 255, 0.10);
                transform: translateY(-1px);
            }
            .rules > li::before {
                content: counter(rule);
                position: absolute;
                left: 18px; top: 18px;
                width: 38px; height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 18px;
                font-weight: 800;
                color: #ffd75a;
                background: rgba(255, 215, 90, 0.12);
                border: 1px solid rgba(255, 215, 90, 0.35);
                box-shadow: 0 0 14px rgba(255, 215, 90, 0.16);
                text-shadow: 0 0 10px rgba(255, 215, 90, 0.35);
            }
            .rules > li > strong {
                display: block;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 17px;
                letter-spacing: 0.02em;
                color: #ffd75a;
                margin-bottom: 8px;
                text-shadow: 0 0 14px rgba(255, 215, 90, 0.25);
            }
            .rules p { margin: 8px 0; }
            .rules p:first-child { margin-top: 0; }
            .rules p:last-child { margin-bottom: 0; }
            .rules ul {
                list-style: none;
                margin: 8px 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .rules ul:first-child { margin-top: 0; }
            .rules ul:last-child { margin-bottom: 0; }
            .rules h3 {
                margin: 10px 0 2px;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: #5ce3ff;
                text-shadow: 0 0 10px rgba(92, 227, 255, 0.45);
            }
            .rules li ul li { position: relative; padding-left: 18px; }
            .rules li ul li::before {
                content: "▸";
                position: absolute;
                left: 0;
                color: #5ce3ff;
                text-shadow: 0 0 8px rgba(92, 227, 255, 0.6);
            }
            .rules strong { color: #fff; }

            /* ---------- TUTORIAL ILUSTRADO ---------- */
            .tutorial { margin: 0 0 28px; padding: 22px; border-radius: 20px; background: linear-gradient(145deg, rgba(15, 27, 52, .94), rgba(12, 13, 37, .82)); border: 1px solid rgba(92, 227, 255, .22); box-shadow: inset 0 1px rgba(255,255,255,.045), 0 16px 36px rgba(0,0,0,.22); }
            .tutorial-heading { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 16px; }
            .tutorial-kicker { color: #5ce3ff; font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
            .tutorial-heading h3 { margin: 3px 0 0; color: #fff0c2; font: 700 24px Georgia, 'Times New Roman', serif; }
            .tutorial-caption { color: rgba(255,255,255,.55); font-size: 11px; }
            .tutorial-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
            .tutorial-step { min-width: 0; position: relative; overflow: hidden; padding: 14px; border-radius: 15px; background: linear-gradient(155deg, rgba(255,255,255,.065), rgba(5,9,25,.42)); border: 1px solid rgba(255,255,255,.09); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
            .tutorial-step:hover { transform: translateY(-3px); border-color: rgba(92,227,255,.35); box-shadow: 0 10px 28px rgba(0,0,0,.28), 0 0 18px rgba(92,227,255,.07); }
            .step-number { position: absolute; right: 12px; top: 10px; z-index: 1; color: rgba(255,215,90,.66); font: 700 12px Georgia,serif; letter-spacing: .08em; }
            .step-art { height: 112px; margin: 2px 0 12px; border-radius: 11px; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; gap: 9px; background: radial-gradient(ellipse at 50% 120%, rgba(92,227,255,.14), transparent 68%), rgba(2,6,20,.4); }
            .step-art::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgba(255,255,255,.04), transparent 44%, rgba(255,215,90,.025)); }
            .tutorial-step h4 { margin: 0 0 6px; color: #ffd75a; font: 700 15px Georgia,'Times New Roman',serif; }
            .tutorial-step p { margin: 0; color: rgba(255,255,255,.75); font-size: 11.5px; line-height: 1.55; }
            .mini-deck { width: 44px; height: 62px; display: grid; place-content: center; text-align: center; border-radius: 7px; border: 1px solid rgba(92,227,255,.6); background: repeating-linear-gradient(135deg, #13274c 0 5px, #0a1530 5px 10px); box-shadow: 0 0 14px rgba(92,227,255,.16); }
            .mini-deck span { font: 700 17px Georgia,serif; color: #fff; }.mini-deck i { color: #9beeff; font-size: 8px; font-style: normal; }
            .opening-arrow,.fusion-arrow,.gem-arrow { color: #ffd75a; font-size: 21px; text-shadow: 0 0 10px rgba(255,215,90,.5); }
            .mini-hand { display: flex; align-items: center; position: relative; padding-bottom: 20px; }
            .mini-hand b { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); color: #fff0c2; font: 700 11px Georgia,serif; }
            .mini-hand span { width: 18px; height: 28px; margin-left: -5px; display: grid; place-items: center; border-radius: 4px; color: #9beeff; font-size: 11px; background: linear-gradient(145deg,#26365a,#10152d); border: 1px solid rgba(255,255,255,.25); }
            .field-slots { position: absolute; bottom: 9px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; }
            .field-slots i { width: 17px; height: 20px; border: 1px dashed rgba(255,215,90,.48); border-radius: 4px; background: rgba(255,215,90,.04); }
            .turn-art { justify-content: space-evenly; }
            .action-token { width: 56px; height: 56px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #5ce3ff; box-shadow: 0 0 18px rgba(92,227,255,.17), inset 0 0 12px rgba(92,227,255,.1); color: #fff; }
            .action-token b { font: 700 20px Georgia,serif; line-height: 1; }.action-token span { font-size: 8px; color: #9beeff; }
            .action-token.second { border-color: #ffd75a; box-shadow: 0 0 18px rgba(255,215,90,.13), inset 0 0 12px rgba(255,215,90,.08); }.action-token.second span { color: #ffe9a1; }
            .turn-path { display: flex; align-items: center; gap: 4px; }.turn-path i { width: 5px; height: 5px; border-radius: 50%; background: #a38aff; box-shadow: 0 0 8px #a38aff; }
            .cycle-art { flex-direction: column; align-items: stretch; padding: 10px 12px; gap: 5px; }
            .cycle-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; font-size: 8px; }.cycle-row b { color: rgba(255,255,255,.46); font-size: 8px; font-weight: 500; }
            .element-chip { padding: 4px 6px; border-radius: 20px; border: 1px solid rgba(255,255,255,.13); white-space: nowrap; font-size: 9px; }.element-chip.fire { color: #ffc09f; background: rgba(237,87,43,.13); }.element-chip.plant { color: #b9f0ad; background: rgba(72,175,86,.13); }.element-chip.water { color: #9cecff; background: rgba(49,151,220,.13); }
            .fusion-art { gap: 5px; }.rank-card { position: relative; width: 39px; height: 57px; overflow: hidden; border: 1px solid rgba(255,215,90,.42); border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,.35); }.rank-card img { width: 100%; height: 100%; object-fit: cover; }.rank-card span { position: absolute; bottom: 2px; left: 0; right: 0; text-align: center; color: #fff2bd; font-size: 8px; text-shadow: 0 1px 3px #000; }.fusion-plus { color: rgba(255,255,255,.65); }.rank-card.upgraded { width: 47px; height: 68px; border-color: #5ce3ff; box-shadow: 0 0 14px rgba(92,227,255,.25); }
            .gem-art { gap: 13px; }.rank-card.level-three { width: 48px; height: 69px; }.gem-orb,.essence-orb { width: 37px; height: 37px; display: grid; place-items: center; position: relative; border-radius: 50%; font-size: 18px; border: 1px solid rgba(92,227,255,.55); background: radial-gradient(circle at 35% 30%,rgba(92,227,255,.35),rgba(13,20,48,.9)); box-shadow: 0 0 14px rgba(92,227,255,.2); }.gem-orb small,.essence-orb small { position: absolute; top: 38px; width: max-content; color: rgba(255,255,255,.65); font-size: 7px; }.gem-orb small { color: #9beeff; }.essence-orb { border-color: rgba(255,215,90,.45); background: radial-gradient(circle at 35% 30%,rgba(255,215,90,.27),rgba(35,19,48,.9)); }
            .victory-art { flex-direction: column; gap: 10px; }.victory-elements { display: flex; gap: 4px; }.victory-elements i { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(255,215,90,.48); background: rgba(255,215,90,.09); font-size: 12px; font-style: normal; box-shadow: 0 0 10px rgba(255,215,90,.1); }.victory-line { width: 72%; height: 1px; background: linear-gradient(90deg,transparent,#ffd75a,transparent); }.victory-art strong { color: #ffe6a0; font: 800 12px Georgia,serif; letter-spacing: .22em; text-shadow: 0 0 12px rgba(255,215,90,.6); }
            .tutorial-note { margin: 12px 2px 0; padding: 10px 12px; border-left: 2px solid rgba(92,227,255,.55); color: rgba(255,255,255,.56); font-size: 10.5px; line-height: 1.55; background: rgba(92,227,255,.035); }
            .rules-section-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; margin: 28px 2px 12px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.1); }
            .rules-section-heading h3 { margin: 0; color: #fff0c2; font: 700 21px Georgia,'Times New Roman',serif; }
            .rules-section-heading span { color: rgba(255,255,255,.5); font-size: 10px; }

            /* ---------- NAV INFERIOR ---------- */
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
            .nav-orb img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.18); }
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

            /* ---------- ANIMACIONES ---------- */
            @keyframes floatY {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-16px); }
            }
            @keyframes rise {
                0% { transform: translateY(0) scale(1); opacity: 0.2; }
                100% { transform: translateY(-70px) scale(1.35); opacity: 0.5; }
            }
            @keyframes panelReveal {
                from { opacity: 0; transform: translateY(18px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            @media (max-width: 1000px) { .tutorial-steps { grid-template-columns: repeat(2,minmax(0,1fr)); } }
            @media (max-width: 600px) { .tutorial { padding: 15px; } .tutorial-steps { grid-template-columns: 1fr; } .tutorial-heading { align-items: start; flex-direction: column; gap: 5px; } .tutorial-caption { font-size: 10px; } .step-art { height: 100px; } }
            @media (prefers-reduced-motion: reduce) { .tutorial-step { transition: none; } .tutorial-step:hover { transform: none; } }
            @media (max-width: 900px) {
                .rules > li { padding: 18px 16px 16px 60px; }
                .rules > li::before { left: 12px; width: 34px; height: 34px; font-size: 16px; }
            }
            @media (max-width: 900px) and (orientation: landscape) and (max-height: 600px) {
                .topbar { padding-block: 6px; }
                .brand-block p { display: none; }
                .mech-body { padding: 4px 12px 8px; }
                .mech-panel { padding: 12px 16px; border-radius: 16px; }
                .panel-title { margin-top: 2px; font-size: 20px; }
                .panel-sub { margin-bottom: 7px; font-size: 11px; }
                .panel-glow { margin-bottom: 8px; }
                .rules-wrap { padding-right: 5px; }
                .tutorial { margin-bottom: 12px; padding: 12px; }
                .tutorial-heading { margin-bottom: 8px; }
                .tutorial-heading h3 { font-size: 19px; }
                .tutorial-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
                .step-art { height: 78px; }
                .bottom-nav { padding-block: 4px; }
            }
        </style>

        <div class="screen">
            <div class="bg-layer">
                <div class="mountains"></div>
                <div class="castle-glow"></div>
                <div class="castle"></div>
                <div class="horizon-glow"></div>
                <div class="island island-1"></div>
                <div class="island island-2"></div>
                ${particles}
            </div>

            <div class="hud"></div>

            <header class="topbar">
                <div class="brand">
                    <img class="logo" src="/assets/images/logotipomenu.jpg" alt="Elemental Battlecards">
                    <div class="brand-block">
                        <span class="brand-kicker">Elemental Battle Cards</span>
                        <h1>Mecánicas</h1>
                        <p>Domina las reglas, los triángulos elementales y el arte de la fusión.</p>
                    </div>
                </div>
                <nav class="top-nav">
                    <button class="tn" data-nav="home">Inicio</button>
                    <button class="tn active">Mecánicas</button>
                </nav>
            </header>

            <main class="mech-body">
                <section class="mech-panel">
                    <span class="panel-kicker">✦ Manual elemental</span>
                    <h2 class="panel-title">Reglas del juego</h2>
                    <p class="panel-sub">Aprende con ilustraciones y consulta debajo el reglamento completo.</p>
                    <div class="panel-glow"></div>
                    <div class="rules-wrap">
                        ${TUTORIAL_HTML}
                        <div class="rules-section-heading"><h3>Reglamento completo</h3><span>17 reglas detalladas</span></div>
                        ${RULES_HTML}
                    </div>
                </section>
            </main>

            <nav class="bottom-nav">
                <div class="nav-elements">${elementsNavHtml}</div>
            </nav>
        </div>`;

        this.mountDOM(html, { flex: true });

        this.bind('[data-nav="home"]', () => this.scene.start('HomeScenes', { playerData: this.playerData }));
    }
}
