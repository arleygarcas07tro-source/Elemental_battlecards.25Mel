import { test } from 'node:test';
import assert from 'node:assert/strict';

import CardHealthService from '../src/game/CardHealthService.js';

test('CardHealthService: inicia cartas sin valor de vida al máximo de su nivel', () => {
    const card = {};

    assert.equal(CardHealthService.ensure(card), 100);
    assert.equal(card.health, 100);
    assert.equal(card.maxHealth, 100);
});

test('CardHealthService: todos los niveles tienen 100 puntos de vida', () => {
    const level1 = CardHealthService.ensure({ level: 1 });
    const level2 = CardHealthService.ensure({ level: 2 });
    const level3 = CardHealthService.ensure({ level: 3 });

    assert.equal(level1, 100);
    assert.equal(level2, 100);
    assert.equal(level3, 100);
    assert.equal(level1, level2);
    assert.equal(level2, level3);
});

test('CardHealthService: el daño porcentual se aplica sobre la vida real', () => {
    const card = { level: 2, health: 100, maxHealth: 100 };

    const result = CardHealthService.applyDamage(card, 10);

    assert.equal(result.damage, 10);
    assert.equal(result.health, 90);
    assert.equal(result.percent, 90);
    assert.equal(card.health, 90);
});

test('CardHealthService: suma el porcentaje al fusionar y limita el resultado a 100%', () => {
    assert.equal(CardHealthService.fusionHealth({ health: 35 }, { health: 40 }), 75);
    assert.equal(CardHealthService.fusionHealth({ health: 70 }, { health: 60 }), 100);
    assert.equal(CardHealthService.setPercent({ level: 3 }, 50), 50);
});
