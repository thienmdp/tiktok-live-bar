'use strict';

const DEFAULT_LIKE_MILESTONES = {
    streakWindowMs: 4000,
    streakZoom: 10,
    totalTitle: 500,
    totalWings: 1000,
    streak: {
        action: 'camera',
        durationMs: 4000,
        label: 'TIM LIÊN TỤC',
        variant: 'neon',
        fireworkBursts: 0,
        giftPowerBoost: 0
    },
    title: {
        action: 'medal',
        durationMs: 12000,
        label: '',
        useNickname: true,
        variant: 'neon',
        fireworkBursts: 0,
        giftPowerBoost: 0
    },
    wings: {
        action: 'medal',
        durationMs: 90000,
        label: 'FAN 1000 TIM',
        variant: 'fire',
        fireworkBursts: 2,
        giftPowerBoost: 10
    }
};

function createLikeTracker() {
    return new Map();
}

function getLikeStats(tracker, userId) {
    if (!tracker.has(userId)) {
        tracker.set(userId, {
            streak: 0,
            lastLikeAt: 0,
            total: 0,
            awarded: new Set()
        });
    }
    return tracker.get(userId);
}

function applyLikeMilestones(event, tracker, config = {}) {
    if (event.type !== 'like' || !event.userId) return event;

    const settings = { ...DEFAULT_LIKE_MILESTONES, ...config };
    const stats = getLikeStats(tracker, event.userId);
    const totalIncrement = Math.max(1, Number(event.likeCount) || 1);
    const now = Date.now();
    const streakWindowMs = Math.max(1000, Number(settings.streakWindowMs) || 4000);

    if (!stats.lastLikeAt || now - stats.lastLikeAt > streakWindowMs) stats.streak = 0;
    stats.lastLikeAt = now;
    stats.streak += 1;
    stats.total += totalIncrement;

    let reward = null;
    if (stats.total >= settings.totalWings && !stats.awarded.has('wings')) {
        if (stats.total >= settings.totalTitle) stats.awarded.add('title');
        stats.awarded.add('wings');
        reward = { ...settings.wings, milestone: 'wings' };
    } else if (stats.total >= settings.totalTitle && !stats.awarded.has('title')) {
        stats.awarded.add('title');
        reward = { ...settings.title, milestone: 'title' };
    } else if (stats.streak >= settings.streakZoom) {
        reward = { ...settings.streak, milestone: 'streak' };
    }

    if (!reward) return event;

    if (reward.milestone === 'streak') stats.streak %= settings.streakZoom;
    else stats.streak = 0;

    const label = reward.useNickname
        ? String(event.nickname || event.uniqueId || 'FAN VIP').trim().slice(0, 16)
        : String(reward.label || '').trim();

    return {
        ...event,
        action: reward.action,
        durationMs: Math.max(0, Number(reward.durationMs) || 0),
        label,
        variant: reward.variant || '',
        fireworkBursts: Math.max(0, Number(reward.fireworkBursts) || 0),
        giftPower: Math.max(0, Number(reward.giftPowerBoost) || 0),
        likeMilestone: reward.milestone
    };
}

function resetLikeTracker(tracker) {
    tracker.clear();
}

module.exports = {
    DEFAULT_LIKE_MILESTONES,
    createLikeTracker,
    applyLikeMilestones,
    resetLikeTracker
};
