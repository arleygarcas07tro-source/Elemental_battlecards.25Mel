import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveCombat } from '../src/helpers/combat.js';

test('combat: nivel 1 contra nivel 1 causa el daño base neutral', () => {
    const defender = { type: 'luz', level: 1, health: 100 };
    const result = resolveCombat({ type: 'fuego', level: 1 }, defender);

    assert.equal(result.damage, 12);
    assert.equal(result.defenderHealth, 88);
    assert.equal(result.destroyed, false);
    assert.equal(defender.health, 88);
});

test('combat: el nivel de la carta no cambia su vida máxima', () => {
    const defender = { type: 'luz', level: 2, health: 100, maxHealth: 100 };
    const result = resolveCombat({ type: 'fuego', level: 1 }, defender);

    assert.equal(result.damage, 9);
    assert.equal(result.defenderHealth, 91);
    assert.equal(defender.health, 91);
});

test('combat: la ventaja elemental suma 5 puntos al daño base', () => {
    const result = resolveCombat(
        { type: 'fuego', level: 1 },
        { type: 'planta', level: 1, health: 100 }
    );

    assert.equal(result.damage, 17);
    assert.equal(result.defenderHealth, 83);
});

test('combat: la desventaja elemental resta 5 puntos al daño base', () => {
    const result = resolveCombat(
        { type: 'planta', level: 1 },
        { type: 'fuego', level: 1, health: 100 }
    );

    assert.equal(result.damage, 7);
    assert.equal(result.defenderHealth, 93);
});

test('combat: aplica la tabla de daño por nivel del atacante y defensor', () => {
    const expected = [
        [12, 9, 6],
        [28, 24, 18],
        [48, 42, 36]
    ];

    expected.forEach((row, attackerIndex) => {
        row.forEach((damage, defenderIndex) => {
            const result = resolveCombat(
                { type: 'fuego', level: attackerIndex + 1 },
                { type: 'luz', level: defenderIndex + 1, health: 100 }
            );
            assert.equal(result.damage, damage, `nivel ${attackerIndex + 1} contra ${defenderIndex + 1}`);
        });
    });
});

test('combat: el daño queda entre 0% y 100%, incluyendo bonus', () => {
    const minimum = resolveCombat(
        { type: 'planta', level: 1 },
        { type: 'fuego', level: 1, health: 100 },
        { bonusDamage: -20 }
    );
    const maximum = resolveCombat(
        { type: 'fuego', level: 3 },
        { type: 'planta', level: 1, health: 100 },
        { bonusDamage: 100 }
    );

    assert.equal(minimum.damage, 0);
    assert.equal(maximum.damage, 100);
    assert.equal(maximum.defenderHealth, 0);
    assert.equal(maximum.destroyed, true);
    assert.equal(maximum.loser, 'defender');
});

test('combat: la carta se destruye cuando su vida llega a cero', () => {
    const defender = { type: 'planta', level: 1, health: 10 };
    const result = resolveCombat({ type: 'fuego', level: 1 }, defender);

    assert.equal(result.damage, 17);
    assert.equal(result.defenderHealth, 0);
    assert.equal(result.destroyed, true);
    assert.equal(result.winner, 'attacker');
    assert.equal(defender.health, 0);
});
