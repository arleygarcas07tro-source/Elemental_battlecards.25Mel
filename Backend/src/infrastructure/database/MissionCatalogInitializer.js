'use strict';

const MISSIONS = [
  { id: 'primera-victoria', element: 'fuego', title: 'Primera victoria', description: 'Gana tu primera batalla contra cualquier oponente.', target: 1, rewardGems: 50 },
  { id: 'coleccionista', element: 'agua', title: 'Coleccionista', description: 'Coloca los 6 tipos elementales en tu campo en una misma partida.', target: 1, rewardGems: 100 },
  { id: 'fusionador', element: 'planta', title: 'Fusionador', description: 'Realiza 5 fusiones de cartas iguales.', target: 5, rewardGems: 150 },
  { id: 'racha-victorias', element: 'sombra', title: 'Racha de victorias', description: 'Gana 3 partidas consecutivas contra la IA.', target: 3, rewardGems: 200 },
  { id: 'aprendiz-elemental', element: 'luz', title: 'Aprendiz elemental', description: 'Ataca al menos una vez con cada uno de los 6 tipos elementales.', target: 6, rewardGems: 120 },
  { id: 'estratega', element: 'espiritu', title: 'Estratega', description: 'Gana una partida manteniendo una carta de nivel 3 en tu campo.', target: 1, rewardGems: 250 },
];

class MissionCatalogInitializer {
  constructor(missionModel) {
    if (!missionModel || typeof missionModel.findOrCreate !== 'function') {
      throw new TypeError('[MissionCatalogInitializer] Se requiere el modelo de misiones.');
    }
    this.missionModel = missionModel;
  }

  async initialize() {
    for (const mission of MISSIONS) {
      await this.missionModel.findOrCreate({
        where: { id: mission.id },
        defaults: mission,
      });
    }
  }
}

module.exports = MissionCatalogInitializer;
