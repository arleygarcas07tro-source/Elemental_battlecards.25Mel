/** Devuelve el perfil aunque una transición haya anidado varias veces playerData. */
export function resolvePlayerData(payload) {
    let playerData = payload;
    const visited = new Set();

    while (
        playerData
        && typeof playerData === 'object'
        && !Array.isArray(playerData)
        && !playerData.username
        && playerData.playerData
        && typeof playerData.playerData === 'object'
        && !visited.has(playerData)
    ) {
        visited.add(playerData);
        playerData = playerData.playerData;
    }

    return playerData && typeof playerData === 'object' && !Array.isArray(playerData)
        ? playerData
        : {};
}
