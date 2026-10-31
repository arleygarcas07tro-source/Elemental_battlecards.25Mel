/** Chat LAN temporal. La vista vive sobre el juego y reutiliza el socket de la sala. */
export default class LANChatWidget {
    static attach({ socket, username, roomReady = false }) {
        if (!socket || typeof document === 'undefined') return null;
        const current = window.__elementalLanChatWidget;
        if (current && current.socket === socket) return current;
        current?.destroy();
        const widget = new LANChatWidget(socket, username, roomReady);
        window.__elementalLanChatWidget = widget;
        return widget;
    }

    constructor(socket, username, roomReady = false) {
        this.socket = socket;
        this.username = String(username || 'Jugador').slice(0, 24);
        this.roomReady = Boolean(socket.roomCode || roomReady);
        this.messages = [];
        this.root = document.createElement('div');
        this.root.id = 'elemental-lan-chat';
        this.shadow = this.root.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = `
            <style>
                :host { all: initial; font-family: Poppins,'Segoe UI',sans-serif; color:#f4f2ea; }
                * { box-sizing:border-box; }
                .launcher { position:fixed; right:22px; bottom:22px; z-index:9998; border:1px solid rgba(112,210,255,.52); border-radius:999px; padding:12px 17px; cursor:pointer; color:#effaff; font:700 13px Poppins,'Segoe UI',sans-serif; letter-spacing:.03em; background:linear-gradient(145deg,rgba(24,67,103,.97),rgba(10,21,47,.98)); box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 18px rgba(80,190,255,.17); transition:transform .18s ease,box-shadow .18s ease; }
                .launcher:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,0,0,.5),0 0 25px rgba(80,190,255,.3); }
                .panel { position:fixed; right:22px; bottom:78px; z-index:9999; width:min(340px,calc(100vw - 28px)); height:min(440px,calc(100vh - 112px)); display:none; flex-direction:column; overflow:hidden; border-radius:18px; border:1px solid rgba(112,210,255,.4); background:linear-gradient(155deg,rgba(12,26,52,.98),rgba(7,12,30,.99)); box-shadow:0 24px 70px rgba(0,0,0,.62),0 0 25px rgba(80,190,255,.12); }
                .panel.open { display:flex; }
                .head { display:flex; align-items:center; justify-content:space-between; padding:13px 15px; border-bottom:1px solid rgba(255,255,255,.1); background:linear-gradient(90deg,rgba(64,167,219,.12),transparent); }
                .title { margin:0; color:#fff0c2; font:700 18px Georgia,serif; }.subtitle { margin-top:3px; color:rgba(255,255,255,.48); font:10px Poppins,'Segoe UI',sans-serif; }
                .close { width:30px; height:30px; border:1px solid rgba(255,255,255,.15); border-radius:9px; color:#fff; background:rgba(255,255,255,.05); cursor:pointer; font-size:18px; }
                .log { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:9px; padding:13px; }
                .empty { margin:auto; max-width:230px; color:rgba(255,255,255,.43); text-align:center; font:12px/1.5 Poppins,'Segoe UI',sans-serif; }
                .message { max-width:88%; align-self:flex-start; padding:8px 10px; border-radius:12px 12px 12px 4px; border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.055); }
                .message.mine { align-self:flex-end; border-radius:12px 12px 4px 12px; border-color:rgba(92,205,255,.21); background:rgba(42,139,188,.17); }
                .meta { display:flex; gap:8px; margin-bottom:4px; color:#8ddfff; font:700 10px Poppins,'Segoe UI',sans-serif; }.time { color:rgba(255,255,255,.38); font-weight:400; }
                .text { white-space:pre-wrap; overflow-wrap:anywhere; color:rgba(255,255,255,.91); font:12px/1.45 Poppins,'Segoe UI',sans-serif; }
                .status { min-height:18px; padding:0 13px 6px; color:rgba(255,255,255,.44); font:10px Poppins,'Segoe UI',sans-serif; }
                .form { display:flex; gap:7px; padding:10px; border-top:1px solid rgba(255,255,255,.09); background:rgba(0,0,0,.16); }
                .input { flex:1; min-width:0; border:1px solid rgba(255,255,255,.13); border-radius:10px; outline:none; padding:10px 11px; color:white; background:rgba(3,8,21,.7); font:12px Poppins,'Segoe UI',sans-serif; }
                .input:focus { border-color:rgba(92,205,255,.65); box-shadow:0 0 0 2px rgba(92,205,255,.1); }
                .send { border:1px solid rgba(92,205,255,.46); border-radius:10px; padding:0 13px; color:#eafaff; background:rgba(36,129,177,.25); font:700 12px Poppins,'Segoe UI',sans-serif; cursor:pointer; }.send:disabled,.input:disabled { opacity:.42; cursor:not-allowed; }
                @media(max-width:520px) { .launcher { right:12px; bottom:12px; padding:11px 14px; }.panel { right:10px; bottom:67px; width:calc(100vw - 20px); height:min(420px,calc(100vh - 90px)); } }
            </style>
            <button class="launcher" type="button" aria-expanded="false">💬 Chat LAN</button>
            <section class="panel" aria-label="Chat de la sala">
                <header class="head"><div><h2 class="title">Chat LAN</h2><div class="subtitle">Mensajes solo para esta sala</div></div><button class="close" type="button" aria-label="Cerrar chat">×</button></header>
                <div class="log" role="log" aria-live="polite"><div class="empty">Los mensajes de la sala aparecerán aquí.</div></div>
                <div class="status"></div>
                <form class="form"><input class="input" type="text" maxlength="240" autocomplete="off" placeholder="Escribe un mensaje…"><button class="send" type="submit">Enviar</button></form>
            </section>`;
        document.body.appendChild(this.root);

        this.launcher = this.shadow.querySelector('.launcher');
        this.panel = this.shadow.querySelector('.panel');
        this.log = this.shadow.querySelector('.log');
        this.status = this.shadow.querySelector('.status');
        this.input = this.shadow.querySelector('.input');
        this.sendButton = this.shadow.querySelector('.send');
        this.launcher.addEventListener('click', () => this.toggle());
        this.shadow.querySelector('.close').addEventListener('click', () => this.toggle(false));
        this.shadow.querySelector('.form').addEventListener('submit', (event) => this.send(event));

        this.onChatMessage = (message) => this.appendMessage(message);
        this.onChatHistory = (messages) => {
            this.messages = [];
            this.log.replaceChildren();
            (Array.isArray(messages) ? messages : []).forEach((message) => this.appendMessage(message));
            if (!this.messages.length) this.showEmpty();
        };
        this.onRoomCreated = () => { this.roomReady = true; this.updateAvailability(); };
        this.onPlayerJoined = () => {
            this.roomReady = true;
            this.updateAvailability();
            socket.emit('request_chat_history', (messages) => this.onChatHistory(messages));
        };
        this.onConnect = () => this.updateAvailability();
        this.onDisconnect = () => this.destroy();
        socket.on('chat_message', this.onChatMessage);
        socket.on('chat_history', this.onChatHistory);
        socket.on('room_created', this.onRoomCreated);
        socket.on('player_joined', this.onPlayerJoined);
        socket.on('connect', this.onConnect);
        socket.on('disconnect', this.onDisconnect);
        if (socket.roomCode || roomReady) socket.emit('request_chat_history', (messages) => this.onChatHistory(messages));
        this.updateAvailability();
    }

    toggle(force) {
        const open = typeof force === 'boolean' ? force : !this.panel.classList.contains('open');
        this.panel.classList.toggle('open', open);
        this.launcher.setAttribute('aria-expanded', String(open));
        if (open) this.input.focus();
    }

    updateAvailability() {
        const enabled = this.roomReady && this.socket.connected;
        this.input.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        this.status.textContent = !this.socket.connected
            ? 'Conectando al servidor…'
            : (this.roomReady ? 'Chat activo mientras esta sala exista.' : 'Crea o únete a una sala para chatear.');
    }

    async send(event) {
        event.preventDefault();
        const text = this.input.value.trim();
        if (!text || !this.roomReady || !this.socket.connected) return;
        this.sendButton.disabled = true;
        this.socket.timeout(4000).emit('chat_message', { text, senderName: this.username }, (error, response) => {
            this.sendButton.disabled = false;
            if (error || !response?.success) {
                this.status.textContent = response?.message || 'No se pudo enviar el mensaje.';
                return;
            }
            this.input.value = '';
            this.appendMessage(response.message);
        });
    }

    showEmpty() {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Los mensajes de la sala aparecerán aquí.';
        this.log.appendChild(empty);
    }

    appendMessage(message) {
        if (!message || !message.text) return;
        this.log.querySelector('.empty')?.remove();
        this.messages.push(message);
        if (this.messages.length > 50) this.messages.shift();
        const row = document.createElement('article');
        row.className = `message${message.senderId === this.socket.id ? ' mine' : ''}`;
        const meta = document.createElement('div');
        meta.className = 'meta';
        const name = document.createElement('span');
        name.textContent = message.senderId === this.socket.id ? 'Tú' : (message.senderName || 'Jugador');
        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = new Date(message.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const body = document.createElement('div');
        body.className = 'text';
        body.textContent = message.text;
        meta.append(name, time);
        row.append(meta, body);
        this.log.appendChild(row);
        this.log.scrollTop = this.log.scrollHeight;
    }

    destroy() {
        if (this.socket) {
            this.socket.off('chat_message', this.onChatMessage);
            this.socket.off('chat_history', this.onChatHistory);
            this.socket.off('room_created', this.onRoomCreated);
            this.socket.off('player_joined', this.onPlayerJoined);
            this.socket.off('connect', this.onConnect);
            this.socket.off('disconnect', this.onDisconnect);
        }
        this.root?.remove();
        if (typeof window !== 'undefined' && window.__elementalLanChatWidget === this) {
            delete window.__elementalLanChatWidget;
        }
    }
}
