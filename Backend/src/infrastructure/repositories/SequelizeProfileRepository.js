'use strict';

const REQUIRED_MODELS = [
  'User',
  'Card',
  'PlayerStats',
  'Battle',
  'Mission',
  'PlayerMission',
  'Achievement',
  'PlayerAchievement',
  'PlayerCard',
  'PlayerAttackType',
];

class SequelizeProfileRepository {
  constructor(models) {
    const missing = REQUIRED_MODELS.filter((name) => !models || !models[name]);
    if (missing.length > 0) {
      throw new TypeError(`[SequelizeProfileRepository] Faltan modelos: ${missing.join(', ')}.`);
    }
    this.models = models;
  }

  async findStats(userId) {
    return this.models.PlayerStats.findByPk(userId);
  }

  async listLanRanking() {
    const { QueryTypes } = require('sequelize');
    const rows = await this.models.Battle.sequelize.query(`
      SELECT u.id AS "userId", u.username AS username,
        COUNT(b.id) AS played,
        SUM(CASE WHEN b.result = 'victoria' THEN 1 ELSE 0 END) AS wins
      FROM battles b
      INNER JOIN users u ON u.id = b.user_id
      WHERE b.opponent = 'lan'
      GROUP BY u.id, u.username
      ORDER BY wins DESC, (wins * 1.0 / COUNT(b.id)) DESC, played DESC, u.username ASC
    `, { type: QueryTypes.SELECT });
    return rows;
  }

  async saveStats(userId, values) {
    const [row] = await this.models.PlayerStats.upsert({ userId, ...values, updatedAt: new Date() });
    return row;
  }

  async createBattle(values) {
    return this.models.Battle.create(values);
  }

  async listMissions(userId) {
    const missions = await this.models.Mission.findAll({ order: [['id', 'ASC']] });
    const progress = await this.models.PlayerMission.findAll({ where: { userId } });
    const byId = new Map(progress.map((row) => [row.missionId, row]));

    return missions.map((mission) => {
      const row = byId.get(mission.id);
      return {
        id: mission.id,
        element: mission.element,
        title: mission.title,
        description: mission.description,
        target: mission.target,
        rewardGems: mission.rewardGems,
        rewardCoins: mission.rewardCoins,
        rewardAmount: Number(mission.rewardCoins) > 0 ? mission.rewardCoins : mission.rewardGems,
        rewardCurrency: Number(mission.rewardCoins) > 0 ? 'coins' : 'gems',
        progress: row ? row.progress : 0,
        completed: row ? row.completed : false,
        rewardClaimed: row ? Boolean(row.rewardClaimed) : false,
      };
    });
  }

  async saveMissionProgress(userId, missionId, { progress, completed }) {
    const defaults = { userId, missionId, progress, completed };
    if (completed) defaults.completedAt = new Date();
    const [row] = await this.models.PlayerMission.findOrCreate({
      where: { userId, missionId },
      defaults,
    });
    await row.update({
      progress,
      completed,
      ...(completed ? { completedAt: row.completedAt || new Date() } : {}),
    });
    return row;
  }

  async claimMissionReward(userId, missionId) {
    const sequelize = this.models.PlayerStats.sequelize;
    return sequelize.transaction(async (transaction) => {
      const mission = await this.models.Mission.findByPk(missionId, { transaction });
      if (!mission) return { ok: false, reason: 'not-found' };

      const playerMission = await this.models.PlayerMission.findOne({
        where: { userId, missionId },
        transaction,
        lock: transaction.LOCK && transaction.LOCK.UPDATE,
      });
      if (!playerMission || !playerMission.completed) {
        return { ok: false, reason: 'not-completed' };
      }
      if (playerMission.rewardClaimed) {
        return { ok: false, reason: 'already-claimed' };
      }

      const rewardCoins = Number(mission.rewardCoins) || 0;
      const rewardGems = Number(mission.rewardGems) || 0;
      const currency = rewardCoins > 0 ? 'coins' : 'gems';
      const amount = rewardCoins > 0 ? rewardCoins : rewardGems;
      if (amount <= 0) return { ok: false, reason: 'no-reward' };

      // El cambio condicional garantiza una sola reclamación incluso si llegan
      // dos solicitudes simultáneas para la misma misión.
      const [claimed] = await this.models.PlayerMission.update({
        rewardClaimed: true,
        rewardClaimedAt: new Date(),
      }, {
        where: { userId, missionId, completed: true, rewardClaimed: false },
        transaction,
      });
      if (!claimed) return { ok: false, reason: 'already-claimed' };

      const [stats] = await this.models.PlayerStats.findOrCreate({
        where: { userId },
        defaults: { userId },
        transaction,
      });
      await stats.increment(currency, { by: amount, transaction });
      await stats.reload({ transaction });

      return {
        ok: true,
        missionId,
        currency,
        amount,
        wallet: { gems: Number(stats.gems) || 0, coins: Number(stats.coins) || 0 },
      };
    });
  }

  async listAchievements(userId) {
    const achievements = await this.models.Achievement.findAll({ order: [['id', 'ASC']] });
    const unlocked = await this.models.PlayerAchievement.findAll({ where: { userId } });
    const unlockedIds = new Set(unlocked.map((row) => row.achievementId));

    return achievements.map((achievement) => ({
      id: achievement.id,
      element: achievement.element,
      title: achievement.title,
      description: achievement.description,
      unlocked: unlockedIds.has(achievement.id),
    }));
  }

  async unlockAchievement(userId, achievementId) {
    const [row] = await this.models.PlayerAchievement.findOrCreate({
      where: { userId, achievementId },
      defaults: { userId, achievementId, unlockedAt: new Date() },
    });
    return row;
  }

  async countCollectedCards(userId) {
    return this.models.PlayerCard.count({ where: { userId } });
  }

  async addCollectedCard(userId, cardId) {
    const [row] = await this.models.PlayerCard.findOrCreate({
      where: { userId, cardId },
      defaults: { userId, cardId, collectedAt: new Date() },
    });
    return row;
  }

  async findCardByElementLevel(element, level) {
    return this.models.Card.findOne({ where: { element, level } });
  }

  async listCollectedCards(userId) {
    const rows = await this.models.PlayerCard.findAll({
      where: { userId },
      include: [{ model: this.models.Card, as: 'card', attributes: ['element', 'level'] }],
    });
    return rows.map((row) => `${row.card.element}-${row.card.level}`);
  }

  async addAttackType(userId, element) {
    const [row] = await this.models.PlayerAttackType.findOrCreate({
      where: { userId, element },
      defaults: { userId, element },
    });
    return row;
  }

  async countAttackTypes(userId) {
    return this.models.PlayerAttackType.count({ where: { userId } });
  }
}

module.exports = SequelizeProfileRepository;
