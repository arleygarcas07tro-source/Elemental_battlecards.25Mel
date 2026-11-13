const STORAGE_PREFIX = 'elemental-battlecards-notifications:';

/** Persistencia de mensajes y estado leído por jugador. */
export default class NotificationCenter {
    static key(username) {
        return `${STORAGE_PREFIX}${encodeURIComponent(username || 'Jugador')}`;
    }

    static list(username) {
        try {
            const value = JSON.parse(localStorage.getItem(this.key(username)) || '[]');
            return Array.isArray(value) ? value.filter((item) => item && item.id && item.message) : [];
        } catch {
            return [];
        }
    }

    static add(username, title, message) {
        const items = this.list(username);
        items.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, message, createdAt: Date.now(), read: false });
        try { localStorage.setItem(this.key(username), JSON.stringify(items.slice(0, 30))); } catch { /* storage opcional */ }
    }

    static markAllRead(username) {
        const items = this.list(username).map((item) => ({ ...item, read: true }));
        try { localStorage.setItem(this.key(username), JSON.stringify(items)); } catch { /* storage opcional */ }
        return items;
    }

    static unreadCount(username) {
        return this.list(username).filter((item) => !item.read).length;
    }
}
