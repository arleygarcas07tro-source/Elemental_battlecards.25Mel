// Responsabilidad: mantener una sesión de invitado únicamente en memoria,
// junto con el progreso temporal de esa sesión.
class GuestSession {
    constructor() {
        this.active = false;
        this.progress = null;
    }

    start() {
        this.active = true;
        this.progress = null;

        // Evita que una sesión anterior se use accidentalmente durante el juego invitado.
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch {
            // El modo invitado también funciona si el navegador bloquea localStorage.
        }

        return { username: 'Invitado', isGuest: true };
    }

    end() {
        this.active = false;
        this.progress = null;
    }

    isActive() {
        return this.active;
    }

    getProgress() {
        return this.progress;
    }

    setProgress(progress) {
        if (this.active) this.progress = progress;
    }
}

const guestSession = new GuestSession();

export default guestSession;
