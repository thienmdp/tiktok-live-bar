const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeMasterConfig, resolveMasterRule, applyRule, applyBuiltInChatCommand } = require('../src/master/rules');

const master = sanitizeMasterConfig({
    joinMode: 'keyword_only',
    giftAlwaysJoins: true,
    rules: [
        { id: 'hey', source: 'chat', trigger: 'hey', action: 'join' },
        { id: 'rose', source: 'gift', trigger: 'Rose, Hoa hồng', action: 'camera', durationMs: 4000 },
        { id: 'rosa', source: 'gift', giftId: '777', trigger: 'Rosa', action: 'medal', label: 'CÁNH VIP' }
    ]
});

test('matches Vietnamese aliases without accents or case sensitivity', () => {
    const rule = resolveMasterRule(master, { type: 'gift', giftName: 'HOA HỒNG' });
    assert.equal(rule.id, 'rose');
    const event = applyRule({ type: 'gift', giftName: 'HOA HỒNG' }, rule);
    assert.equal(event.action, 'camera');
    assert.equal(event.durationMs, 4000);
});

test('gift id wins even when localized gift name changes', () => {
    const rule = resolveMasterRule(master, { type: 'gift', giftId: '777', giftName: 'Localized name' });
    assert.equal(rule.id, 'rosa');
    assert.equal(applyRule({ type: 'gift' }, rule).label, 'CÁNH VIP');
});

test('gift id rule wins over an earlier matching name rule', () => {
    const config = sanitizeMasterConfig({
        rules: [
            { id: 'generic-name', source: 'gift', trigger: 'Rose', action: 'dance' },
            { id: 'learned-id', source: 'gift', trigger: 'Rose', giftId: '5655', action: 'camera' }
        ]
    });
    assert.equal(resolveMasterRule(config, { type: 'gift', giftId: '5655', giftName: 'Rose' }).id, 'learned-id');
});

test('chat hey maps to join', () => {
    const rule = resolveMasterRule(master, { type: 'chat', comment: 'hey' });
    assert.equal(rule.action, 'join');
});

test('contains match works inside longer chat messages', () => {
    const config = sanitizeMasterConfig({
        rules: [
            { id: 'dance', source: 'chat', trigger: 'nhay, nhảy, dance', match: 'contains', action: 'dance' }
        ]
    });
    const rule = resolveMasterRule(config, { type: 'chat', comment: 'Em muốn nhảy cùng DJ nha' });
    assert.equal(rule.id, 'dance');
    assert.equal(applyRule({ type: 'chat', comment: 'Em muốn nhảy cùng DJ nha' }, rule).action, 'dance');
});

test('chat thienmdp maps to vip spotlight', () => {
    const config = sanitizeMasterConfig(require('../config/master.json'));
    const rule = resolveMasterRule(config, { type: 'chat', comment: 'Yeu thienmdp qua di' });
    assert.equal(rule.id, 'chat-thienmdp-vip');
    const event = applyRule({ type: 'chat', comment: 'Yeu thienmdp qua di' }, rule);
    assert.equal(event.action, 'vip');
    assert.equal(event.label, 'THIENMDP VIP');
});

test('chat no longer triggers exclusive gift-only effects', () => {
    const config = sanitizeMasterConfig(require('../config/master.json'));
    assert.equal(resolveMasterRule(config, { type: 'chat', comment: 'cho zoom camera di' }), null);
    assert.equal(resolveMasterRule(config, { type: 'chat', comment: 'ban phao hoa di' }), null);
    assert.equal(resolveMasterRule(config, { type: 'chat', comment: 'top dj king' }), null);
    assert.equal(resolveMasterRule(config, { type: 'chat', comment: 'vip pro dinh' }), null);
});

test('simple gift rules still resolve exclusive effects', () => {
    const config = sanitizeMasterConfig(require('../config/master.json'));
    const rose = resolveMasterRule(config, { type: 'gift', giftId: '5655', giftName: 'Rose' });
    assert.equal(rose.id, 'gift-rose-camera');
    assert.equal(applyRule({ type: 'gift' }, rose).action, 'camera');
});

test('jump and nhảy comments trigger a short built-in jump without a gift rule', () => {
    assert.equal(applyBuiltInChatCommand({ type: 'chat', comment: 'jump' }).action, 'jump');
    const event = applyBuiltInChatCommand({ type: 'chat', comment: 'NHẢY' });
    assert.equal(event.action, 'jump');
    assert.equal(event.durationMs, 950);
    assert.equal(applyBuiltInChatCommand({ type: 'gift', giftName: 'Jump' }).action, undefined);
});
