import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
    AvatarMini,
    accentPalettes,
    applySkillBoostMaterialTint,
    normalizeAvatar,
    useModelViewerReady
} from './AvatarStudio';
import { Icon } from './Icon';

const STORAGE_KEY = 'skillboost.skillcity.local-progress';

const DISTRICTS = [
    {
        id: 'foundation',
        title: 'Harbor Gate',
        subtitle: 'Vstop v mesto',
        description: 'Prva četrt odklene osnovno komunikacijo: povej jasno, poslušaj aktivno in napiši odgovor brez zmede.',
        emoji: '🌉',
        theme: 'violet',
        landmark: 'Training Harbor',
        unlockCopy: 'Začni tukaj in postavi temelje mesta.',
        rect: { left: 6, top: 56, width: 32, height: 34 },
        model: '/models/skillboost-roadmap/foundation-city.glb'
    },
    {
        id: 'social-core',
        title: 'Social Plaza',
        subtitle: 'Ljudje in odnosi',
        description: 'Trg odnosov odklene pomoč, empatijo, meje in networking brez nepotrebne drame.',
        emoji: '🤝',
        theme: 'green',
        landmark: 'Connection Square',
        unlockCopy: 'Odpre se, ko obvladaš osnove komunikacije.',
        rect: { left: 6, top: 22, width: 32, height: 30 },
        model: '/models/skillboost-roadmap/practice-city.glb'
    },
    {
        id: 'work-arena',
        title: 'Office District',
        subtitle: 'Delo in sestanki',
        description: 'Delovna četrt vodi skozi sestanke, feedback, prioritete in upravljanje časa.',
        emoji: '🏢',
        theme: 'amber',
        landmark: 'Productivity Hub',
        unlockCopy: 'Odpre se po socialnem boss checkpointu.',
        rect: { left: 35, top: 42, width: 31, height: 28 },
        model: '/models/skillboost-roadmap/battle-city.glb'
    },
    {
        id: 'focus-engine',
        title: 'Focus Park',
        subtitle: 'Mir, fokus, odločitve',
        description: 'Park fokusa gradi disciplino, stresno odpornost, čustveno regulacijo in odločanje pod pritiskom.',
        emoji: '🌿',
        theme: 'blue',
        landmark: 'Calm Engine',
        unlockCopy: 'Odpre se, ko stabiliziraš delovni ritem.',
        rect: { left: 49, top: 10, width: 38, height: 28 },
        model: '/models/skillboost-roadmap/ai-lab.glb'
    },
    {
        id: 'career-league',
        title: 'Career Heights',
        subtitle: 'Karierni vzpon',
        description: 'Stolpnice kariere odklenejo intervjuje, samozavest, pogajanja in osnovno vodenje.',
        emoji: '🚀',
        theme: 'pink',
        landmark: 'Opportunity Towers',
        unlockCopy: 'Odpre se po Focus Park bossu.',
        rect: { left: 61, top: 61, width: 34, height: 31 },
        model: '/models/skillboost-roadmap/career-city.glb'
    },
    {
        id: 'boss-tower',
        title: 'Citadel Tower',
        subtitle: 'Finalni izzivi',
        description: 'Citadela je finalna četrt: konflikti, težki pogovori, odpornost in finančni pogovori.',
        emoji: '🏰',
        theme: 'teal',
        landmark: 'Boss Citadel',
        unlockCopy: 'Odpre se šele po kariernem bossu.',
        rect: { left: 72, top: 30, width: 24, height: 25 },
        model: '/models/skillboost-roadmap/mastery-castle.glb'
    }
];

const ROADMAP = [
    ['public-speaking', 'foundation', 1, 12, 75, 58, false],
    ['active-listening', 'foundation', 2, 24, 68, 58, false],
    ['clear-writing', 'foundation', 3, 36, 76, 60, false],
    ['digital-communication', 'foundation', 4, 50, 68, 65, true],
    ['asking-for-help', 'social-core', 5, 50, 39, 60, false],
    ['empathy', 'social-core', 6, 36, 31, 62, false],
    ['boundaries', 'social-core', 7, 22, 40, 66, false],
    ['networking', 'social-core', 8, 10, 32, 68, true],
    ['meeting-facilitation', 'work-arena', 9, 27, 54, 62, false],
    ['feedback-giving', 'work-arena', 10, 42, 48, 68, false],
    ['prioritization', 'work-arena', 11, 58, 55, 66, false],
    ['time-management', 'work-arena', 12, 73, 48, 70, true],
    ['focus-discipline', 'focus-engine', 13, 78, 29, 64, false],
    ['stress-management', 'focus-engine', 14, 65, 19, 66, false],
    ['emotional-regulation', 'focus-engine', 15, 53, 28, 70, false],
    ['decision-making', 'focus-engine', 16, 42, 20, 72, true],
    ['job-interview', 'career-league', 17, 64, 72, 70, false],
    ['self-confidence', 'career-league', 18, 75, 82, 68, false],
    ['negotiation', 'career-league', 19, 86, 73, 74, false],
    ['leadership-basics', 'career-league', 20, 94, 83, 76, true],
    ['conflict-resolution', 'boss-tower', 21, 90, 47, 76, false],
    ['difficult-conversations', 'boss-tower', 22, 80, 38, 78, false],
    ['resilience', 'boss-tower', 23, 70, 47, 76, false],
    ['personal-finance', 'boss-tower', 24, 60, 38, 78, true]
];


const DISTRICT_CITY_LAYOUT = {
    foundation: {
        hubX: 18,
        hubY: 58,
        offsets: [[-9, 4], [-2, -7], [8, 3], [15, -5]]
    },
    'social-core': {
        hubX: 19,
        hubY: 30,
        offsets: [[14, 3], [4, -7], [-6, 3], [-15, -5]]
    },
    'work-arena': {
        hubX: 44,
        hubY: 52,
        offsets: [[-12, 4], [-1, -7], [10, 4], [19, -5]]
    },
    'focus-engine': {
        hubX: 57,
        hubY: 22,
        offsets: [[15, 4], [5, -7], [-6, 4], [-17, -5]]
    },
    'career-league': {
        hubX: 78,
        hubY: 58,
        offsets: [[-13, 2], [-3, 8], [9, 2], [16, 7]]
    },
    'boss-tower': {
        hubX: 80,
        hubY: 35,
        offsets: [[12, 4], [3, -8], [-8, 4], [-18, -6]]
    }
};

function groupedCityPosition(phaseId, slot = 0, boss = false) {
    const layout = DISTRICT_CITY_LAYOUT[phaseId] || DISTRICT_CITY_LAYOUT.foundation;
    const offsets = layout.offsets || [];
    const [dx, dy] = offsets[slot % offsets.length] || [0, 0];
    const scale = boss ? 1.08 : 1;
    return {
        x: clamp(layout.hubX + dx * scale, 8, 94),
        y: clamp(layout.hubY + dy * scale, 10, 90),
        hubX: layout.hubX,
        hubY: layout.hubY
    };
}

function phaseSlotForNode(skillKey, phaseId, explicitSlot, order) {
    if (typeof explicitSlot === 'number' && Number.isFinite(explicitSlot)) return explicitSlot;
    const roadmapPhase = ROADMAP.filter((item) => item[1] === phaseId).map((item) => item[0]);
    const found = roadmapPhase.findIndex((value) => value === skillKey);
    if (found >= 0) return found;
    return Math.max(0, ((order || 1) - 1) % 4);
}

const SKILL_ICONS = {
    'public-speaking': '🎤',
    'active-listening': '👂',
    'clear-writing': '✍️',
    'digital-communication': '💻',
    'asking-for-help': '🙋',
    empathy: '💛',
    boundaries: '🛡️',
    networking: '🌐',
    'meeting-facilitation': '🧭',
    'feedback-giving': '💬',
    prioritization: '📌',
    'time-management': '⏱️',
    'focus-discipline': '🎯',
    'stress-management': '🌬️',
    'emotional-regulation': '🧠',
    'decision-making': '⚖️',
    'job-interview': '👔',
    'self-confidence': '🔥',
    negotiation: '🤝',
    'leadership-basics': '👑',
    'conflict-resolution': '⚔️',
    'difficult-conversations': '🗣️',
    resilience: '💪',
    'personal-finance': '🪙'
};

const STATUS_COPY = {
    COMPLETED: 'Zgrajeno',
    READY_TO_CLAIM: 'Nagrada čaka',
    IN_PROGRESS: 'V gradnji',
    AVAILABLE: 'Odprto',
    LOCKED: 'Zaklenjeno'
};

const ROADMAP_MODEL_ROOT = '/models/skillboost-roadmap';

const ROADMAP_MODELS = {
    nodeHouse: `${ROADMAP_MODEL_ROOT}/node-house.glb`,
    foundation: `${ROADMAP_MODEL_ROOT}/foundation-city.glb`,
    socialCore: `${ROADMAP_MODEL_ROOT}/practice-city.glb`,
    practiceCity: `${ROADMAP_MODEL_ROOT}/practice-city.glb`,
    workArena: `${ROADMAP_MODEL_ROOT}/battle-city.glb`,
    battleCity: `${ROADMAP_MODEL_ROOT}/battle-city.glb`,
    focusEngine: `${ROADMAP_MODEL_ROOT}/ai-lab.glb`,
    aiLab: `${ROADMAP_MODEL_ROOT}/ai-lab.glb`,
    careerLeague: `${ROADMAP_MODEL_ROOT}/career-city.glb`,
    careerCity: `${ROADMAP_MODEL_ROOT}/career-city.glb`,
    rewardHub: `${ROADMAP_MODEL_ROOT}/reward-hub.glb`,
    bossTower: `${ROADMAP_MODEL_ROOT}/boss-tower.glb`,
    masteryCastle: `${ROADMAP_MODEL_ROOT}/mastery-castle.glb`
};

const DISTRICT_MODEL_BY_ID = {
    foundation: ROADMAP_MODELS.foundation,
    'social-core': ROADMAP_MODELS.socialCore,
    'work-arena': ROADMAP_MODELS.workArena,
    'focus-engine': ROADMAP_MODELS.focusEngine,
    'career-league': ROADMAP_MODELS.careerLeague,
    'boss-tower': ROADMAP_MODELS.masteryCastle
};

const ROADMAP_MODEL_BY_SKILL = {
    'public-speaking': ROADMAP_MODELS.foundation,
    'active-listening': ROADMAP_MODELS.nodeHouse,
    'clear-writing': ROADMAP_MODELS.aiLab,
    'digital-communication': ROADMAP_MODELS.rewardHub,

    'asking-for-help': ROADMAP_MODELS.practiceCity,
    empathy: ROADMAP_MODELS.nodeHouse,
    boundaries: ROADMAP_MODELS.battleCity,
    networking: ROADMAP_MODELS.rewardHub,

    'meeting-facilitation': ROADMAP_MODELS.careerCity,
    'feedback-giving': ROADMAP_MODELS.battleCity,
    prioritization: ROADMAP_MODELS.aiLab,
    'time-management': ROADMAP_MODELS.rewardHub,

    'focus-discipline': ROADMAP_MODELS.aiLab,
    'stress-management': ROADMAP_MODELS.nodeHouse,
    'emotional-regulation': ROADMAP_MODELS.practiceCity,
    'decision-making': ROADMAP_MODELS.battleCity,

    'job-interview': ROADMAP_MODELS.careerCity,
    'self-confidence': ROADMAP_MODELS.foundation,
    negotiation: ROADMAP_MODELS.battleCity,
    'leadership-basics': ROADMAP_MODELS.masteryCastle,

    'conflict-resolution': ROADMAP_MODELS.bossTower,
    'difficult-conversations': ROADMAP_MODELS.battleCity,
    resilience: ROADMAP_MODELS.practiceCity,
    'personal-finance': ROADMAP_MODELS.masteryCastle
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
}

function clampPercent(value) {
    return clamp(Math.round(value || 0), 0, 100);
}

function readLocalProgress(userId) {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return all[userId || 'guest'] || {};
    } catch {
        return {};
    }
}

function writeLocalProgress(userId, progress) {
    try {
        const key = userId || 'guest';
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        all[key] = progress;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // local roadmap progress is best-effort fallback only
    }
}

function districtById(id) {
    return DISTRICTS.find((district) => district.id === id) || DISTRICTS[0];
}

function fallbackTitle(skillKey) {
    return String(skillKey || 'Quest')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function scoreForSkill(report, skillKey) {
    return report?.skillProgress?.find((item) => item.skillKey === skillKey)?.averageScore || 0;
}

function sessionsForSkill(report, skillKey) {
    return report?.skillProgress?.find((item) => item.skillKey === skillKey)?.sessions || 0;
}

function nodeProgress(node) {
    return clampPercent(((node?.bestScore || 0) / Math.max(node?.requiredScore || 1, 1)) * 100);
}

function nodeStatusSlug(node) {
    return String(node?.status || 'AVAILABLE').toLowerCase().replaceAll('_', '-');
}

function missingScoreFor(node) {
    if (!node?.unlocked || node.completed || node.claimable) return 0;
    return Math.max(0, (node.requiredScore || 0) - (node.bestScore || 0));
}

function shardRewardForNode(node) {
    if (node?.boss) return { count: 4, label: 'Boss shard' };
    if (node?.completed) return { count: 3, label: 'Mastery shard' };
    if (node?.claimable || node?.status === 'READY_TO_CLAIM') return { count: 2, label: 'Reward shard' };
    return { count: 1, label: 'Practice shard' };
}

function modelForNode(node) {
    if (node?.boss) return ROADMAP_MODELS.bossTower;
    if (node?.claimable || node?.status === 'READY_TO_CLAIM') return ROADMAP_MODELS.rewardHub;
    return ROADMAP_MODELS.nodeHouse;
}

function avatarCityPaletteVars(config) {
    const avatar = normalizeAvatar(config);
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    return {
        '--city-main': palette.main,
        '--city-blue': palette.blue,
        '--city-cyan': palette.cyan,
        '--city-purple': palette.purple,
        '--city-pale': palette.pale,
        '--city-dark': palette.materialDark || '#07153f'
    };
}

function decorateNode(node, index = 0) {
    const district = districtById(node.phaseId || node.phase);
    const phaseOrder = node.phaseOrder || DISTRICTS.findIndex((phase) => phase.id === district.id) + 1;
    const skillKey = node.skillKey || node.nodeKey || node.id;
    const order = node.order || index + 1;
    const fallback = ROADMAP.find((item) => item[0] === skillKey);
    const phaseNodeSlot = phaseSlotForNode(skillKey, district.id, node.phaseNodeSlot, order);
    const groupedPosition = groupedCityPosition(district.id, phaseNodeSlot, Boolean(node.boss || fallback?.[6]));
    const x = groupedPosition.x;
    const y = groupedPosition.y;
    const status = node.status || (node.completed ? 'COMPLETED' : node.unlocked ? 'AVAILABLE' : 'LOCKED');
    const completed = Boolean(node.completed || status === 'COMPLETED');
    const unlocked = Boolean(node.unlocked || completed || status !== 'LOCKED');
    const claimable = Boolean(node.claimable || status === 'READY_TO_CLAIM');
    const inProgress = Boolean(node.inProgress || status === 'IN_PROGRESS' || claimable);
    const boss = Boolean(node.boss || fallback?.[6]);
    const reward = shardRewardForNode({ ...node, boss, completed, claimable });

    return {
        ...node,
        id: node.id || skillKey,
        nodeKey: node.nodeKey || skillKey,
        skillKey,
        skillName: node.skillName || node.title || fallbackTitle(skillKey),
        category: node.category || district.title,
        phaseId: district.id,
        phaseTitle: node.phaseTitle || district.title,
        theme: node.theme || district.theme,
        emoji: node.emoji || SKILL_ICONS[skillKey] || district.emoji,
        challengeId: node.challengeId,
        challengeTitle: node.challengeTitle || 'Mini trening',
        scenario: node.scenario || node.description || 'Odgovori kot v realni situaciji.',
        expectedOutcome: node.expectedOutcome || 'Oddaj kratek, konkreten odgovor in zaključi z naslednjim korakom.',
        evaluationCriteria: node.evaluationCriteria || [],
        outcomes: node.outcomes || [],
        status,
        unlocked,
        completed,
        inProgress,
        claimable,
        boss,
        order,
        phaseOrder,
        phaseNodeSlot,
        x,
        y,
        districtHubX: groupedPosition.hubX,
        districtHubY: groupedPosition.hubY,
        requiredScore: node.requiredScore || fallback?.[5] || 60,
        bestScore: Math.round(node.bestScore || 0),
        sessions: node.sessions || 0,
        rewardXp: node.rewardXp || 60 + (boss ? 80 : 25),
        rewardStars: node.rewardStars || (boss ? 4 : 2),
        estimatedMinutes: node.estimatedMinutes || 10,
        lockReason: node.lockReason || 'Najprej zgradi prejšnjo stavbo.',
        nextUnlockText: node.nextUnlockText || (boss ? `${district.title} boss odpre novo mestno območje.` : 'Zaključi misijo, da odpreš naslednjo ulico.'),
        districtLandmark: district.landmark,
        districtSubtitle: district.subtitle,
        rewardShardCount: reward.count,
        rewardShardLabel: reward.label,
        modelSource: modelForNode({ ...node, boss, phaseOrder })
    };
}

function decoratePhase(phase, nodes = []) {
    const meta = districtById(phase.id);
    const phaseNodes = nodes.filter((node) => node.phaseId === meta.id);
    const totalNodes = phase.totalNodes ?? phaseNodes.length;
    const completedNodes = phase.completedNodes ?? phaseNodes.filter((node) => node.completed).length;
    const unlockedNodes = phase.unlockedNodes ?? phaseNodes.filter((node) => node.unlocked).length;
    return {
        ...meta,
        ...phase,
        id: meta.id,
        order: phase.order || DISTRICTS.findIndex((item) => item.id === meta.id) + 1,
        totalNodes,
        completedNodes,
        unlockedNodes,
        progressPercent: phase.progressPercent ?? (totalNodes ? Math.round((completedNodes / totalNodes) * 100) : 0),
        unlocked: phase.unlocked ?? unlockedNodes > 0,
        bossNodeKey: phase.bossNodeKey || phaseNodes.find((node) => node.boss)?.nodeKey,
        model: phase.model || meta.model || DISTRICT_MODEL_BY_ID[meta.id],
        hubX: phase.hubX ?? phaseNodes[0]?.districtHubX ?? DISTRICT_CITY_LAYOUT[meta.id]?.hubX ?? meta.rect?.left,
        hubY: phase.hubY ?? phaseNodes[0]?.districtHubY ?? DISTRICT_CITY_LAYOUT[meta.id]?.hubY ?? meta.rect?.top
    };
}

function buildFallbackMap({ userId, skills = [], challenges = [], report, localProgress = {} }) {
    const skillByKey = new Map(skills.map((skill) => [skill.key, skill]));
    const challengeBySkill = new Map(challenges.map((challenge) => [challenge.skillKey, challenge]));
    const completedSet = new Set();

    const nodes = ROADMAP.map(([skillKey, phaseId, order, x, y, requiredScore, boss], index) => {
        const skill = skillByKey.get(skillKey);
        const challenge = challengeBySkill.get(skillKey);
        const localStatus = localProgress[skillKey]?.status;
        const sessions = sessionsForSkill(report, skillKey);
        const bestScore = Math.round(scoreForSkill(report, skillKey));
        const previousKey = ROADMAP.find((item) => item[2] === order - 1)?.[0];
        const previousCompleted = order === 1 || completedSet.has(previousKey);
        const completed = localStatus === 'COMPLETED';
        const unlocked = completed || previousCompleted;
        const claimable = !completed && unlocked && bestScore >= requiredScore;
        const inProgress = !completed && unlocked && (claimable || localStatus === 'IN_PROGRESS' || localStatus === 'READY_TO_CLAIM' || sessions > 0 || bestScore > 0);
        const status = completed ? 'COMPLETED' : claimable ? 'READY_TO_CLAIM' : inProgress ? 'IN_PROGRESS' : unlocked ? 'AVAILABLE' : 'LOCKED';
        const district = districtById(phaseId);

        if (completed) completedSet.add(skillKey);

        return decorateNode({
            id: skillKey,
            nodeKey: skillKey,
            skillKey,
            skillName: skill?.name || fallbackTitle(skillKey),
            category: skill?.category || district.title,
            phaseId,
            phaseTitle: district.title,
            theme: district.theme,
            emoji: SKILL_ICONS[skillKey] || district.emoji,
            challengeId: challenge?.id,
            challengeTitle: challenge?.title || 'Mini trening',
            scenario: challenge?.scenario || skill?.description || 'Odgovori kot v realni situaciji.',
            expectedOutcome: challenge?.expectedOutcome || 'Oddaj kratek, konkreten odgovor in zaključi z naslednjim korakom.',
            evaluationCriteria: challenge?.evaluationCriteria || [],
            outcomes: skill?.outcomes || [],
            status,
            unlocked,
            completed,
            inProgress,
            claimable,
            boss,
            order,
            phaseOrder: DISTRICTS.findIndex((item) => item.id === phaseId) + 1,
            x,
            y,
            requiredScore,
            bestScore,
            sessions,
            rewardXp: 60 + (boss ? 80 : 25),
            rewardStars: boss ? 4 : 2,
            estimatedMinutes: challenge?.estimatedMinutes || skill?.estimatedMinutes || 10,
            lockReason: unlocked ? '' : `Najprej zgradi prejšnjo stavbo: ${fallbackTitle(previousKey)}.`,
            nextUnlockText: boss ? `${district.title} boss odklene naslednjo mestno četrt.` : 'Zaključi to stavbo, da odpreš naslednjo ulico.'
        }, index);
    });

    const phases = DISTRICTS.map((district) => decoratePhase(district, nodes));
    const completedNodes = nodes.filter((node) => node.completed).length;
    const currentNode = nodes.find((node) => node.unlocked && !node.completed) || nodes[nodes.length - 1];
    const nextBoss = nodes.find((node) => node.boss && !node.completed);

    return {
        userId,
        roadmapTitle: 'SkillCity Roadmap',
        roadmapSubtitle: 'City path roadmap: ena jasna pot, odprta naslednja misija in zaklenjena območja naprej.',
        nodes,
        phases,
        summary: {
            totalNodes: nodes.length,
            completedNodes,
            unlockedNodes: nodes.filter((node) => node.unlocked).length,
            inProgressNodes: nodes.filter((node) => node.inProgress).length,
            progressPercent: Math.round((completedNodes / Math.max(nodes.length, 1)) * 100),
            totalEarnedXp: nodes.filter((node) => node.completed).reduce((sum, node) => sum + node.rewardXp, 0),
            currentNodeKey: currentNode?.nodeKey,
            nextBossNodeKey: nextBoss?.nodeKey,
            currentPhaseId: currentNode?.phaseId || 'foundation'
        },
        focusRecommendations: [
            currentNode ? `Next best step: ${currentNode.skillName}.` : 'Mesto je trenutno v celoti odklenjeno.',
            nextBoss ? `Naslednji boss gate: ${nextBoss.skillName}.` : 'Vsi boss checkpointi so zaključeni.',
            'MVP flow: klik hiško → odpri misijo → trening → complete → naslednja hiška.'
        ]
    };
}

function normalizeQuestMap(rawMap, fallbackMap) {
    if (!rawMap?.nodes?.length) return fallbackMap;
    const nodes = rawMap.nodes.map((node, index) => decorateNode(node, index)).sort((a, b) => a.order - b.order);
    const phases = (rawMap.phases?.length ? rawMap.phases : DISTRICTS).map((phase) => decoratePhase(phase, nodes));
    const completedNodes = nodes.filter((node) => node.completed).length;
    const nextNode = nodes.find((node) => node.unlocked && !node.completed) || nodes[nodes.length - 1];
    const nextBoss = nodes.find((node) => node.boss && !node.completed);

    return {
        ...rawMap,
        roadmapTitle: rawMap.roadmapTitle || 'SkillCity Roadmap',
        roadmapSubtitle: rawMap.roadmapSubtitle || fallbackMap.roadmapSubtitle,
        nodes,
        phases,
        summary: {
            totalNodes: nodes.length,
            completedNodes,
            unlockedNodes: nodes.filter((node) => node.unlocked).length,
            inProgressNodes: nodes.filter((node) => node.inProgress).length,
            progressPercent: Math.round((completedNodes / Math.max(nodes.length, 1)) * 100),
            totalEarnedXp: nodes.filter((node) => node.completed).reduce((sum, node) => sum + node.rewardXp, 0),
            currentNodeKey: nextNode?.nodeKey,
            nextBossNodeKey: nextBoss?.nodeKey,
            currentPhaseId: nextNode?.phaseId || rawMap.summary?.currentPhaseId || 'foundation',
            ...rawMap.summary
        },
        focusRecommendations: rawMap.focusRecommendations?.length ? rawMap.focusRecommendations : fallbackMap.focusRecommendations
    };
}

function phaseStatus(phase, activePhaseId) {
    if (!phase.unlocked) return 'locked';
    if (phase.totalNodes && phase.completedNodes >= phase.totalNodes) return 'completed';
    if (phase.id === activePhaseId) return 'active';
    return 'open';
}

function routePoints(nodes = []) {
    return nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => `${node.x},${node.y}`)
        .join(' ');
}

function activeRoutePoints(nodes = [], currentNodeKey) {
    const ordered = [...nodes].sort((a, b) => a.order - b.order);
    const currentIndex = Math.max(0, ordered.findIndex((node) => node.nodeKey === currentNodeKey));
    return ordered
        .slice(0, currentIndex + 1)
        .map((node) => `${node.x},${node.y}`)
        .join(' ');
}

function nodeByKey(nodes = [], key = '') {
    return nodes.find((node) => node.nodeKey === key) || null;
}

function orderedWalkNodes(nodes = [], fromKey = '', toKey = '') {
    const ordered = [...nodes].sort((a, b) => a.order - b.order);
    const fromIndex = Math.max(0, ordered.findIndex((node) => node.nodeKey === fromKey));
    const toIndex = Math.max(0, ordered.findIndex((node) => node.nodeKey === toKey));

    if (!ordered.length) return [];
    if (fromIndex === toIndex) return [ordered[toIndex]].filter(Boolean);

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex) + 1;
    const path = ordered.slice(start, end);

    return fromIndex <= toIndex ? path : path.reverse();
}

function phaseClusterRoutes(nodes = [], phases = [], activePhaseId = '') {
    return phases
        .map((phase) => {
            const phaseNodes = nodes
                .filter((node) => node.phaseId === phase.id)
                .sort((a, b) => a.order - b.order);

            if (!phaseNodes.length) return null;

            const xs = phaseNodes.map((node) => node.x);
            const ys = phaseNodes.map((node) => node.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const centerX = phase.hubX ?? DISTRICT_CITY_LAYOUT[phase.id]?.hubX ?? clamp((minX + maxX) / 2, 8, 92);
            const centerY = phase.hubY ?? DISTRICT_CITY_LAYOUT[phase.id]?.hubY ?? clamp(minY - 9, 8, 86);

            return {
                id: phase.id,
                phase,
                theme: phase.theme,
                status: phaseStatus(phase, activePhaseId),
                active: phase.id === activePhaseId,
                points: phaseNodes.map((node) => `${node.x},${node.y}`).join(' '),
                centerX,
                centerY,
                nodeCount: phaseNodes.length,
                completedNodes: phaseNodes.filter((node) => node.completed).length
            };
        })
        .filter(Boolean);
}

const ModelHouse = memo(function ModelHouse({ node, modelReady, avatarConfig, performanceMode }) {
    const viewerRef = useRef(null);
    const avatar = normalizeAvatar(avatarConfig);
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    const shouldShowModel = modelReady && !performanceMode;

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !shouldShowModel) return undefined;

        const tint = () => applySkillBoostMaterialTint(viewer, palette, avatar.energy || 'balanced');
        tint();
        viewer.addEventListener?.('load', tint);
        viewer.addEventListener?.('model-visibility', tint);
        return () => {
            viewer.removeEventListener?.('load', tint);
            viewer.removeEventListener?.('model-visibility', tint);
        };
    }, [avatar.energy, palette.blue, palette.cyan, palette.main, palette.materialAccent, palette.materialBase, palette.materialDark, palette.materialMid, palette.purple, shouldShowModel]);

    if (!shouldShowModel) {
        return (
            <span className="skillcity-mvp-house__css" aria-hidden="true">
                <span className="skillcity-mvp-house__roof" />
                <span className="skillcity-mvp-house__body" />
                <span className="skillcity-mvp-house__door" />
            </span>
        );
    }

    return (
        <model-viewer
            ref={viewerRef}
            src={node.modelSource}
            alt={`${node.skillName} GLB building`}
            camera-orbit="20deg 68deg 7.6m"
            camera-target="0m 0.04m 0m"
            field-of-view="21deg"
            exposure={node.completed ? '0.98' : node.unlocked ? '0.9' : '0.58'}
            shadow-intensity="0.75"
            interaction-prompt="none"
            disable-zoom
            loading="lazy"
        />
    );
});

const DistrictLandmark = memo(function DistrictLandmark({ phase, modelReady, avatarConfig, performanceMode }) {
    const viewerRef = useRef(null);
    const avatar = normalizeAvatar(avatarConfig);
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    const shouldShowModel = modelReady && !performanceMode && phase?.model;

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !shouldShowModel) return undefined;

        const tint = () => applySkillBoostMaterialTint(viewer, palette, avatar.energy || 'balanced');
        tint();
        viewer.addEventListener?.('load', tint);
        viewer.addEventListener?.('model-visibility', tint);
        return () => {
            viewer.removeEventListener?.('load', tint);
            viewer.removeEventListener?.('model-visibility', tint);
        };
    }, [avatar.energy, palette.blue, palette.cyan, palette.main, palette.materialAccent, palette.materialBase, palette.materialDark, palette.materialMid, palette.purple, phase?.model, shouldShowModel]);

    if (!shouldShowModel) return null;

    return (
        <span className="skillcity-mvp-cluster-hub__model" aria-hidden="true">
            <model-viewer
                ref={viewerRef}
                src={phase.model}
                alt={`${phase.title} GLB hub`}
                camera-orbit="18deg 72deg 13m"
                camera-target="0m -0.04m 0m"
                field-of-view="28deg"
                exposure="0.94"
                shadow-intensity="0.48"
                interaction-prompt="none"
                disable-zoom
                loading="lazy"
            />
        </span>
    );
});

function ProgressBar({ value = 0 }) {
    return <span className="skillcity-mvp-progress"><em style={{ width: `${clampPercent(value)}%` }} /></span>;
}

function RewardShards({ node, compact = false }) {
    const reward = shardRewardForNode(node);
    return (
        <span className={`skillcity-mvp-shards ${compact ? 'compact' : ''}`} aria-label={`${reward.count} ${reward.label}`}>
            {Array.from({ length: Math.min(4, reward.count) }, (_, index) => <i key={index} />)}
            {!compact && <b>{reward.count}x</b>}
        </span>
    );
}

function CommandCenter({ map, nextNode, nextBoss, activePhase, questLoading, user, onStartNext, onShowBoss, onReset }) {
    const summary = map.summary || {};
    return (
        <section className="skillcity-mvp-command skillcity-mvp-command--pathable">
            <div className="skillcity-mvp-command__copy">
                <span className="eyebrow">SkillCity pot</span>
                <h2>{nextNode?.skillName || 'Roadmap complete'}</h2>
                <p>{activePhase?.title || 'SkillCity'} · sledi poti, odklepaj skupine in gradi mesto po vrsti.</p>
                <ProgressBar value={nodeProgress(nextNode)} />
            </div>

            <div className="skillcity-mvp-next-card skillcity-mvp-next-card--compact">
                <div className="skillcity-mvp-next-card__icon">{nextNode?.emoji || '🏁'}</div>
                <div>
                    <span>Naslednja najboljša dejanja</span>
                    <strong>{nextNode?.skillName || 'Roadmap complete'}</strong>
                    <small>{nextNode ? `${nextNode.bestScore || 0}/${nextNode.requiredScore || 0} točk` : 'Vsa vozlišča dokončana'}</small>
                </div>
                <div className="skillcity-mvp-next-card__actions">
                    <button type="button" className="primary" disabled={!nextNode?.unlocked || questLoading} onClick={onStartNext}>
                        <Icon name="bolt" size={15} /> Začni
                    </button>
                    <button type="button" className="secondary" disabled={!nextBoss} onClick={onShowBoss}>
                        Boss
                    </button>
                </div>
            </div>

            <div className="skillcity-mvp-stats skillcity-mvp-stats--compact">
                <article>
                    <strong>{summary.progressPercent || 0}%</strong>
                    <span>zgrajeno mesto</span>
                </article>
                <article>
                    <strong>{summary.completedNodes || 0}/{summary.totalNodes || 0}</strong>
                    <span>vozlišč</span>
                </article>
                <article>
                    <strong>{summary.totalEarnedXp || 0}</strong>
                    <span>XP</span>
                </article>
                <button type="button" className="secondary" disabled={questLoading} onClick={onReset}>
                    Resetiraj
                </button>
            </div>

            <div className="skillcity-mvp-hero-character" aria-label="Roadmap character preview">
                <div className="skillcity-mvp-hero-character__copy">
                    <span>Vodič mape</span>
                    <strong>{user?.displayName || user?.name || 'Your character'}</strong>
                </div>
                <div className="skillcity-mvp-hero-character__stage">
                    <span className="skillcity-mvp-hero-character__glow" />
                    <span className="avatar avatar--model avatar--roadmap-hero"><AvatarMini config={user?.avatarConfig} /></span>
                </div>
            </div>
        </section>
    );
}

function DistrictRail({ phases, activePhaseId, onSelectPhase }) {
    return (
        <aside className="skillcity-mvp-districts" aria-label="SkillCity districts">
            {phases.map((phase) => {
                const status = phaseStatus(phase, activePhaseId);
                return (
                    <button
                        key={phase.id}
                        type="button"
                        className={`skillcity-mvp-district skillquest-node--${phase.theme} ${status}`}
                        onClick={() => onSelectPhase(phase.id)}
                    >
                        <span>{status === 'locked' ? '🔒' : phase.emoji}</span>
                        <strong>{phase.title}</strong>
                        <small>{phase.completedNodes}/{phase.totalNodes} zgrajeno</small>
                        <ProgressBar value={phase.progressPercent} />
                    </button>
                );
            })}
        </aside>
    );
}

function DistrictChips({ phases, activePhaseId, onSelectPhase }) {
    const chipsRef = useRef(null);

    const handleWheel = (event) => {
        const nav = chipsRef.current;
        if (!nav) return;

        const canScroll = nav.scrollWidth > nav.clientWidth;
        if (!canScroll) return;

        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;

        event.preventDefault();
        nav.scrollLeft += delta;
    };

    return (
        <div className="skillcity-mvp-district-nav">
            <nav
                ref={chipsRef}
                className="skillcity-mvp-district-chips"
                aria-label="SkillCity districts"
                tabIndex={0}
                onWheel={handleWheel}
            >
                {phases.map((phase) => {
                    const status = phaseStatus(phase, activePhaseId);
                    return (
                        <button
                            key={phase.id}
                            type="button"
                            className={`skillcity-mvp-district-chip skillquest-node--${phase.theme} ${status}`}
                            onClick={() => onSelectPhase(phase.id)}
                            title={`${phase.title}: ${phase.completedNodes}/${phase.totalNodes} built`}
                        >
                            <span>{status === 'locked' ? '🔒' : phase.emoji}</span>
                            <strong>{phase.title}</strong>
                            <small>{phase.completedNodes}/{phase.totalNodes}</small>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

function RoadmapNode({ node, active, current, selected, modelReady, user, performanceMode, onSelect, onPreview, onPreviewEnd }) {
    const missing = missingScoreFor(node);
    const isLocked = !node.unlocked;

    return (
        <button
            type="button"
            className={`skillcity-mvp-node skillquest-node--${node.theme} ${nodeStatusSlug(node)} ${node.boss ? 'boss' : ''} ${active ? 'active' : ''} ${current ? 'current' : ''} ${selected ? 'selected-skill' : ''}`}
            style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                '--node-progress': `${nodeProgress(node)}%`,
                '--node-scale': node.boss ? 1.18 : 1
            }}
            onMouseEnter={() => node.unlocked && onPreview?.(node.nodeKey)}
            onMouseLeave={() => onPreviewEnd?.()}
            onFocus={() => node.unlocked && onPreview?.(node.nodeKey)}
            onBlur={() => onPreviewEnd?.()}
            onClick={(event) => {
                event.stopPropagation();
                onSelect(node.nodeKey);
            }}
            aria-label={`${node.skillName}. ${STATUS_COPY[node.status] || node.status}.`}
        >
            <span className="skillcity-mvp-node__glow" aria-hidden="true" />
            <span className="skillcity-mvp-node__plot" aria-hidden="true">
                <ModelHouse node={node} modelReady={modelReady} avatarConfig={user?.avatarConfig} performanceMode={performanceMode} />
            </span>
            <span className="skillcity-mvp-node__badge" aria-hidden="true">
                {node.completed ? '✓' : isLocked ? '🔒' : node.emoji}
            </span>
            <span className="skillcity-mvp-node__label">
                <strong>{node.skillName}</strong>
                <small>{node.completed ? 'Zgrajeno' : isLocked ? 'Zaklenjeno' : missing ? `${missing} score manjka` : 'Pripravljeno'}</small>
            </span>
            <span className="skillcity-mvp-node__meter" aria-hidden="true"><em /></span>
            {(node.completed || node.claimable) && <RewardShards node={node} compact />}
            {node.boss && <span className="skillcity-mvp-node__boss">Boss</span>}
            {current && <span className="skillcity-mvp-node__next">Next</span>}
        </button>
    );
}

function CityWorld({ nodes, phases, activeNode, currentNodeKey, selectedSkillKeys, activePhaseId, user, modelReady, performanceMode, onSelectNode, onSelectPhase }) {
    const [previewNodeKey, setPreviewNodeKey] = useState('');
    const [avatarNodeKey, setAvatarNodeKey] = useState('');
    const walkTimerRef = useRef(null);
    const orderedNodes = useMemo(() => [...nodes].sort((a, b) => a.order - b.order), [nodes]);
    const selectedSkills = Array.isArray(selectedSkillKeys) ? selectedSkillKeys : [];
    const walkTargetNodeKey = activeNode?.unlocked ? activeNode.nodeKey : currentNodeKey;
    const targetNodeKey = previewNodeKey || walkTargetNodeKey || currentNodeKey;
    const fullRoute = useMemo(() => routePoints(orderedNodes), [orderedNodes]);
    const activeRoute = useMemo(() => activeRoutePoints(orderedNodes, targetNodeKey), [orderedNodes, targetNodeKey]);
    const clusterRoutes = useMemo(() => phaseClusterRoutes(orderedNodes, phases, activePhaseId), [orderedNodes, phases, activePhaseId]);
    const avatarNode = nodeByKey(orderedNodes, avatarNodeKey) || nodeByKey(orderedNodes, currentNodeKey) || orderedNodes[0];

    useEffect(() => {
        if (!orderedNodes.length) return undefined;
        if (!avatarNodeKey) {
            setAvatarNodeKey(currentNodeKey || orderedNodes[0]?.nodeKey || '');
            return undefined;
        }
        return undefined;
    }, [avatarNodeKey, currentNodeKey, orderedNodes]);

    useEffect(() => {
        if (!walkTargetNodeKey || !orderedNodes.length) return undefined;

        window.clearInterval(walkTimerRef.current);

        const currentAvatarKey = avatarNodeKey || currentNodeKey || orderedNodes[0]?.nodeKey;
        const route = orderedWalkNodes(orderedNodes, currentAvatarKey, walkTargetNodeKey)
            .filter((node) => node?.unlocked || node?.nodeKey === currentAvatarKey);

        if (route.length <= 1) {
            setAvatarNodeKey(walkTargetNodeKey);
            return undefined;
        }

        let index = 0;
        setAvatarNodeKey(route[index].nodeKey);

        walkTimerRef.current = window.setInterval(() => {
            index += 1;
            const next = route[index];

            if (!next) {
                window.clearInterval(walkTimerRef.current);
                return;
            }

            setAvatarNodeKey(next.nodeKey);

            if (index >= route.length - 1) {
                window.clearInterval(walkTimerRef.current);
            }
        }, 300);

        return () => window.clearInterval(walkTimerRef.current);
    }, [walkTargetNodeKey, orderedNodes, currentNodeKey]);

    return (
        <section className={`skillcity-mvp-world ${performanceMode ? 'eco-mode' : ''}`}>
            <div className="skillcity-mvp-world__skyline" aria-hidden="true" />
            <div className="skillcity-mvp-world__depth" aria-hidden="true" />
            <div className="skillcity-mvp-world__surface" aria-hidden="true" />
            <div className="skillcity-mvp-world__blocks" aria-hidden="true" />
            <div className="skillcity-mvp-world__grid" aria-hidden="true" />
            <div className="skillcity-mvp-world__water" aria-hidden="true" />

            <svg className="skillcity-mvp-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {clusterRoutes.map((cluster) => (
                    <g key={cluster.id} className={`skillcity-mvp-road__cluster skillquest-node--${cluster.theme} ${cluster.status} ${cluster.active ? 'active' : ''}`}>
                        <polyline className="skillcity-mvp-road__cluster-shadow" points={cluster.points} />
                        <polyline className="skillcity-mvp-road__cluster-band" points={cluster.points} />
                        <polyline className="skillcity-mvp-road__cluster-core" points={cluster.points} />
                    </g>
                ))}
                <polyline className="skillcity-mvp-road__shadow" points={fullRoute} />
                <polyline className="skillcity-mvp-road__base" points={fullRoute} />
                <polyline className="skillcity-mvp-road__line" points={fullRoute} />
                <polyline className="skillcity-mvp-road__active" points={activeRoute} />
                {orderedNodes.map((node) => (
                    <circle
                        key={`stop-${node.nodeKey}`}
                        className={`skillcity-mvp-road__stop ${nodeStatusSlug(node)} ${node.nodeKey === targetNodeKey ? 'target' : ''}`}
                        cx={node.x}
                        cy={node.y}
                        r={node.boss ? 1.55 : 1.16}
                    />
                ))}
            </svg>

            {clusterRoutes.map((cluster) => (
                <button
                    key={`hub-${cluster.id}`}
                    type="button"
                    className={`skillcity-mvp-cluster-hub skillquest-node--${cluster.theme} ${cluster.status} ${cluster.active ? 'active' : ''}`}
                    style={{ left: `${cluster.centerX}%`, top: `${cluster.centerY}%` }}
                    onClick={() => onSelectPhase(cluster.id)}
                    aria-label={`${cluster.phase.title}: ${cluster.completedNodes}/${cluster.nodeCount} zgrajenih stavb`}
                    title={`${cluster.phase.title}: ${cluster.completedNodes}/${cluster.nodeCount} built`}
                >
                    <DistrictLandmark phase={cluster.phase} modelReady={modelReady} avatarConfig={user?.avatarConfig} performanceMode={performanceMode} />
                    <span className="skillcity-mvp-cluster-hub__icon" aria-hidden="true">{cluster.status === 'locked' ? '🔒' : cluster.phase.emoji}</span>
                </button>
            ))}

            {orderedNodes.map((node) => (
                <RoadmapNode
                    key={node.nodeKey}
                    node={node}
                    active={activeNode?.nodeKey === node.nodeKey}
                    current={currentNodeKey === node.nodeKey}
                    selected={selectedSkills.includes(node.skillKey)}
                    modelReady={modelReady}
                    user={user}
                    performanceMode={performanceMode}
                    onSelect={onSelectNode}
                    onPreview={setPreviewNodeKey}
                    onPreviewEnd={() => setPreviewNodeKey('')}
                />
            ))}

            {avatarNode && (
                <div
                    className="skillcity-mvp-avatar"
                    style={{ left: `${avatarNode.x}%`, top: `${avatarNode.y}%` }}
                    aria-hidden="true"
                >
                    <span className="skillcity-mvp-avatar__trail" />
                    <span className="skillcity-mvp-avatar__model avatar avatar--model avatar--roadmap"><AvatarMini config={user?.avatarConfig} /></span>
                    <span className="skillcity-mvp-avatar__tag">YOU</span>
                </div>
            )}
        </section>
    );
}

function MissionPanel({ node, questLoading, optimisticAction, onStart, onComplete }) {
    if (!node) {
        return (
            <aside className="skillcity-mvp-panel">
                <span className="eyebrow">Mission</span>
                <h3>Izberi stavbo</h3>
                <p>Klikni GLB hiško na mapi, da vidiš trening in akcije.</p>
            </aside>
        );
    }

    const reward = shardRewardForNode(node);
    const startBusy = optimisticAction === `${node.nodeKey}:START`;
    const completeBusy = optimisticAction === `${node.nodeKey}:COMPLETE`;
    const isLocked = !node.unlocked;

    return (
        <aside className={`skillcity-mvp-panel skillquest-node--${node.theme}`}>
            <div className="skillcity-mvp-panel__head">
                <span className="eyebrow">Selected building</span>
                <strong>{STATUS_COPY[node.status] || node.status}</strong>
            </div>
            <div className="skillcity-mvp-panel__title">
                <span>{node.completed ? '✓' : isLocked ? '🔒' : node.emoji}</span>
                <div>
                    <h3>{node.skillName}</h3>
                    <p>{node.phaseTitle} · {node.challengeTitle}</p>
                </div>
            </div>
            <ProgressBar value={nodeProgress(node)} />
            <div className="skillcity-mvp-panel__metrics">
                <span><b>{node.bestScore || 0}</b>score</span>
                <span><b>{node.requiredScore || 0}</b>target</span>
                <span><b>{node.estimatedMinutes || 10}</b>min</span>
                <span><b>{node.rewardXp || 0}</b>XP</span>
            </div>
            <div className="skillcity-mvp-panel__body">
                <h4>Scenario</h4>
                <p>{node.scenario}</p>
                <h4>Expected outcome</h4>
                <p>{node.expectedOutcome}</p>
                {isLocked && <p className="skillcity-mvp-lock-copy">{node.lockReason}</p>}
            </div>
            <div className="skillcity-mvp-panel__reward">
                <RewardShards node={node} />
                <span>{reward.label}</span>
            </div>
            <div className="skillcity-mvp-panel__actions">
                <button type="button" className="primary" disabled={isLocked || questLoading || startBusy} onClick={() => onStart(node)}>
                    <Icon name="bolt" size={15} /> {startBusy ? 'Opening...' : 'Odpri trening'}
                </button>
                <button type="button" className="secondary" disabled={isLocked || node.completed || questLoading || completeBusy} onClick={() => onComplete(node)}>
                    {completeBusy ? 'Saving...' : 'Complete MVP'}
                </button>
            </div>
        </aside>
    );
}

function JourneyStrip({ nodes, activeNodeKey, currentNodeKey, onSelectNode }) {
    return (
        <section className="skillcity-mvp-journey" aria-label="Roadmap journey">
            {nodes.map((node) => (
                <button
                    key={node.nodeKey}
                    type="button"
                    className={`skillcity-mvp-journey__step ${nodeStatusSlug(node)} ${activeNodeKey === node.nodeKey ? 'active' : ''} ${currentNodeKey === node.nodeKey ? 'current' : ''}`}
                    onClick={() => onSelectNode(node.nodeKey)}
                >
                    <span>{node.completed ? '✓' : node.unlocked ? node.emoji : '🔒'}</span>
                    <strong>{node.order}</strong>
                </button>
            ))}
        </section>
    );
}

function RecommendationCard({ recommendations = [] }) {
    return (
        <section className="skillcity-mvp-recommendations">
            <span className="eyebrow">AI-ready guidance</span>
            {(recommendations.length ? recommendations : ['Roadmap engine is ready for generated JSON.']).slice(0, 3).map((item, index) => (
                <p key={`${index}-${item}`}><b>{index + 1}</b>{item}</p>
            ))}
        </section>
    );
}

export function SkillQuestMap({
    user,
    report,
    questMap,
    questLoading = false,
    skills = [],
    challenges = [],
    selectedSkillKeys = [],
    setSelectedSkillKey,
    setSelectedSkillKeys,
    setSelectedChallengeId,
    onQuestNodeAction,
    onResetQuestMap,
    openSimulator
}) {
    const userId = user?.id || user?.email || 'guest';
    const [localProgress, setLocalProgress] = useState(() => readLocalProgress(userId));
    const [activeNodeKey, setActiveNodeKey] = useState('');
    const [activePhaseId, setActivePhaseId] = useState('foundation');
    const [performanceMode, setPerformanceMode] = useState(false);
    const [optimisticAction, setOptimisticAction] = useState('');
    const modelReady = useModelViewerReady();

    useEffect(() => {
        const progress = readLocalProgress(userId);
        setLocalProgress(progress);
    }, [userId]);

    const fallbackMap = useMemo(
        () => buildFallbackMap({ userId, skills, challenges, report, localProgress }),
        [userId, skills, challenges, report, localProgress]
    );

    const effectiveMap = useMemo(() => normalizeQuestMap(questMap, fallbackMap), [questMap, fallbackMap]);
    const nodes = effectiveMap.nodes || [];
    const phases = effectiveMap.phases || [];
    const summary = effectiveMap.summary || {};
    const currentNodeKey = summary.currentNodeKey || nodes.find((node) => node.unlocked && !node.completed)?.nodeKey || nodes[0]?.nodeKey;
    const nextNode = nodes.find((node) => node.nodeKey === currentNodeKey) || nodes.find((node) => node.unlocked && !node.completed) || nodes[nodes.length - 1];
    const nextBoss = nodes.find((node) => node.nodeKey === summary.nextBossNodeKey) || nodes.find((node) => node.boss && !node.completed);

    useEffect(() => {
        if (!nodes.length) return;
        const initialNode = activeNodeKey ? nodes.find((node) => node.nodeKey === activeNodeKey) : null;
        const targetNode = initialNode || nextNode || nodes[0];
        if (targetNode && targetNode.nodeKey !== activeNodeKey) {
            setActiveNodeKey(targetNode.nodeKey);
        }
        if (targetNode?.phaseId && targetNode.phaseId !== activePhaseId) {
            setActivePhaseId(targetNode.phaseId);
        }
    }, [activeNodeKey, activePhaseId, nextNode, nodes]);

    const activeNode = nodes.find((node) => node.nodeKey === activeNodeKey) || nextNode || nodes[0];
    const activePhase = phases.find((phase) => phase.id === activePhaseId) || phases.find((phase) => phase.id === activeNode?.phaseId) || phases[0];
    const activePhaseNodes = nodes.filter((node) => node.phaseId === activePhase?.id).sort((a, b) => a.order - b.order);
    const cityPaletteStyle = avatarCityPaletteVars(user?.avatarConfig);

    const handleSelectNode = (nodeKey) => {
        const node = nodes.find((item) => item.nodeKey === nodeKey);
        if (!node) return;
        setActiveNodeKey(node.nodeKey);
        setActivePhaseId(node.phaseId);
    };

    const persistLocalAction = (node, action) => {
        const next = {
            ...localProgress,
            [node.nodeKey]: {
                status: action === 'COMPLETE' ? 'COMPLETED' : 'IN_PROGRESS',
                updatedAt: new Date().toISOString()
            }
        };
        setLocalProgress(next);
        writeLocalProgress(userId, next);
    };

    const handleNodeAction = async (node, action) => {
        if (!node?.unlocked) return;
        setOptimisticAction(`${node.nodeKey}:${action}`);
        try {
            if (onQuestNodeAction) {
                const result = await onQuestNodeAction(node.nodeKey, action);
                if (!result?.nodes?.length) persistLocalAction(node, action);
            } else {
                persistLocalAction(node, action);
            }
        } finally {
            setOptimisticAction('');
        }
    };

    const handleStartNode = async (node) => {
        if (!node?.unlocked) return;
        await handleNodeAction(node, 'START');
        setSelectedSkillKey?.(node.skillKey);
        setSelectedSkillKeys?.((current) => {
            const base = Array.isArray(current) ? current : [];
            return [...new Set([node.skillKey, ...base])].slice(0, 3);
        });
        if (node.challengeId) setSelectedChallengeId?.(node.challengeId);
        openSimulator?.();
    };

    const handleCompleteNode = (node) => handleNodeAction(node, 'COMPLETE');

    const handleSelectPhase = (phaseId) => {
        setActivePhaseId(phaseId);
        const candidate = nodes.find((node) => node.phaseId === phaseId && node.nodeKey === currentNodeKey)
            || nodes.find((node) => node.phaseId === phaseId && node.unlocked && !node.completed)
            || nodes.find((node) => node.phaseId === phaseId && node.unlocked)
            || nodes.find((node) => node.phaseId === phaseId);
        if (candidate) setActiveNodeKey(candidate.nodeKey);
    };

    const handleShowBoss = () => {
        if (!nextBoss) return;
        setActiveNodeKey(nextBoss.nodeKey);
        setActivePhaseId(nextBoss.phaseId);
    };

    const handleReset = async () => {
        if (onResetQuestMap) {
            const result = await onResetQuestMap();
            if (result?.nodes?.length) return;
        }
        setLocalProgress({});
        writeLocalProgress(userId, {});
    };

    if (!skills.length && !questMap?.nodes?.length) {
        return <div className="loading-card">SkillCity se naloži, ko so veščine pripravljene.</div>;
    }

    return (
        <section className="skillquest-shell skillcity-mvp-shell" style={cityPaletteStyle}>
            <CommandCenter
                map={effectiveMap}
                nextNode={nextNode}
                nextBoss={nextBoss}
                activePhase={activePhase}
                questLoading={questLoading}
                user={user}
                onStartNext={() => handleStartNode(nextNode)}
                onShowBoss={handleShowBoss}
                onReset={handleReset}
            />

            <div className="skillcity-mvp-toolbar">
                <div>
                    <span className="eyebrow">Upodabljalnik</span>
                    <strong>{performanceMode ? 'Nadomestni Eco CSS' : modelReady ? 'Grupiran GLB načrt poti' : 'Nalaganje GLB gledalca'}</strong>
                </div>
                <div className="skillcity-mvp-toolbar__actions">
                    <button type="button" className={!performanceMode ? 'active' : ''} onClick={() => setPerformanceMode(false)}>
                        Grupiran GLB
                    </button>
                    <button type="button" className={performanceMode ? 'active' : ''} onClick={() => setPerformanceMode(true)}>
                        Eco način
                    </button>
                </div>
            </div>

            <div className="skillcity-mvp-layout">
                <main className="skillcity-mvp-main">
                    <DistrictChips phases={phases} activePhaseId={activePhase?.id} onSelectPhase={handleSelectPhase} />
                    <CityWorld
                        nodes={nodes}
                        phases={phases}
                        activeNode={activeNode}
                        currentNodeKey={currentNodeKey}
                        selectedSkillKeys={selectedSkillKeys}
                        activePhaseId={activePhase?.id}
                        user={user}
                        modelReady={modelReady}
                        performanceMode={performanceMode}
                        onSelectNode={handleSelectNode}
                        onSelectPhase={handleSelectPhase}
                    />
                    <JourneyStrip
                        nodes={activePhaseNodes.length ? activePhaseNodes : nodes}
                        activeNodeKey={activeNode?.nodeKey}
                        currentNodeKey={currentNodeKey}
                        onSelectNode={handleSelectNode}
                    />
                </main>

                <div className="skillcity-mvp-side">
                    <MissionPanel
                        node={activeNode}
                        questLoading={questLoading}
                        optimisticAction={optimisticAction}
                        onStart={handleStartNode}
                        onComplete={handleCompleteNode}
                    />
                    <RecommendationCard recommendations={effectiveMap.focusRecommendations} />
                </div>
            </div>
        </section>
    );
}
