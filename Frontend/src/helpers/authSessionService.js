import { fetchProfile } from './profileApi.js';
import { hydrateProgressFromServer } from './playerProgress.js';

/** Restaura una sesión de cuenta guardada y valida su token antes de entrar al menú. */
export default class AuthSessionService {
    static readStoredAccount() {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return token && user?.username ? { token, user } : null;
        } catch {
            return null;
        }
    }

    static clearStoredAccount() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch {
            // El almacenamiento local puede estar deshabilitado por el navegador.
        }
    }

    static async restore() {
        const storedAccount = this.readStoredAccount();
        if (!storedAccount) return { status: 'anonymous', playerData: null };

        try {
            const profile = await fetchProfile();
            if (!profile) {
                this.clearStoredAccount();
                return { status: 'invalid', playerData: null };
            }

            await hydrateProgressFromServer(storedAccount.user.username, profile);
            return { status: 'authenticated', playerData: storedAccount.user };
        } catch (error) {
            // Si falla la conexión temporalmente, conserva el token para poder reintentar.
            console.warn('[AuthSessionService] No se pudo validar la sesión:', error.message || error);
            return { status: 'unavailable', playerData: null };
        }
    }
}
