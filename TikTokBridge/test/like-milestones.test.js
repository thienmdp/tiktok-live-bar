const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createLikeTracker,
    applyLikeMilestones,
    resetLikeTracker
} = require('../src/likes/milestones');

test('10 consecutive like events trigger camera zoom', () => {
    const tracker = createLikeTracker();
    const user = { type: 'like', userId: 'u1', nickname: 'Fan A', likeCount: 15 };
    let event = user;
    for (let index = 0; index < 9; index += 1) {
        event = applyLikeMilestones({ ...user, eventId: `like-${index}` }, tracker, {});
        assert.equal(event.action, undefined);
    }
    event = applyLikeMilestones({ ...user, eventId: 'like-10' }, tracker, {});
    assert.equal(event.action, 'camera');
    assert.equal(event.likeMilestone, 'streak');
});

test('500 total likes show nickname banner once', () => {
    const tracker = createLikeTracker();
    const user = { type: 'like', userId: 'u2', nickname: 'Super Fan', likeCount: 50 };
    let event = { action: undefined };
    for (let total = 0; total < 500; total += 50) {
        event = applyLikeMilestones({ ...user, eventId: `bulk-${total}` }, tracker, {});
    }
    assert.equal(event.action, 'medal');
    assert.equal(event.label, 'Super Fan');
    assert.equal(event.likeMilestone, 'title');
    event = applyLikeMilestones({ ...user, eventId: 'after-title' }, tracker, {});
    assert.equal(event.action, undefined);
});

test('1000 total likes grant wings boost once', () => {
    const tracker = createLikeTracker();
    const user = { type: 'like', userId: 'u3', nickname: 'Mega Fan', likeCount: 100 };
    let event = { action: undefined };
    for (let total = 0; total < 1000; total += 100) {
        event = applyLikeMilestones({ ...user, eventId: `mega-${total}` }, tracker, {});
    }
    assert.equal(event.action, 'medal');
    assert.equal(event.likeMilestone, 'wings');
    assert.equal(event.giftPower, 10);
    assert.equal(event.fireworkBursts, 2);
});

test('streak resets after inactivity window', () => {
    const tracker = createLikeTracker();
    const config = { streakWindowMs: 1000, streakZoom: 10 };
    const user = { type: 'like', userId: 'u4', nickname: 'Gap Fan', likeCount: 1 };
    for (let index = 0; index < 5; index += 1) {
        applyLikeMilestones({ ...user, eventId: `warm-${index}` }, tracker, config);
    }
    const stats = tracker.get('u4');
    stats.lastLikeAt = Date.now() - 5000;
    const event = applyLikeMilestones({ ...user, eventId: 'after-gap' }, tracker, config);
    assert.equal(event.action, undefined);
    assert.equal(stats.streak, 1);
});

test('resetLikeTracker clears progress', () => {
    const tracker = createLikeTracker();
    applyLikeMilestones({ type: 'like', userId: 'u5', likeCount: 100 }, tracker, {});
    resetLikeTracker(tracker);
    assert.equal(tracker.size, 0);
});
