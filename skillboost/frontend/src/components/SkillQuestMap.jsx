import { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarMini, AvatarPreview, accentPalettes, applySkillBoostMaterialTint, normalizeAvatar, useModelViewerReady } from './AvatarStudio';
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
        rect: { left: 5, top: 57, width: 34, height: 34 }
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
        rect: { left: 5, top: 24, width: 34, height: 30 }
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
        rect: { left: 35, top: 42, width: 32, height: 28 }
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
        rect: { left: 49, top: 10, width: 38, height: 28 }
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
        rect: { left: 61, top: 60, width: 35, height: 32 }
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
        rect: { left: 72, top: 30, width: 24, height: 25 }
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

const STATUS_COPY = {
    COMPLETED: 'Zgrajeno',
    READY_TO_CLAIM: 'Nagrada čaka',
    IN_PROGRESS: 'V gradnji',
    AVAILABLE: 'Odprto',
    LOCKED: 'Zaklenjeno'
};

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


const CITY_LANDMARKS = [
    {
        key: 'core-beacon',
        title: 'Core Beacon',
        subtitle: 'Začetni mestni shard',
        levelLabel: 'CITY LVL 1',
        phaseId: 'foundation',
        unlocksAtStart: true,
        unlockNodeKey: 'public-speaking',
        x: 28,
        y: 84,
        size: 132,
        source: '/city-models/city-level-01-core-beacon.glb',
        fallbackIcon: '◆',
        orbit: '18deg 68deg 3.9m',
        cameraTarget: '0m 0m 0m',
        exposure: 0.92,
        unlockCopy: 'Odprto od začetka — prvi orientir v mestu.'
    },
    {
        key: 'guild-plaza',
        title: 'Guild Plaza',
        subtitle: 'Odnosi in ekipni flow',
        levelLabel: 'CITY LVL 2',
        phaseId: 'social-core',
        unlockNodeKey: 'digital-communication',
        x: 17,
        y: 24,
        size: 132,
        source: '/city-models/city-level-02-guild-plaza.glb',
        fallbackIcon: '◇',
        orbit: '16deg 68deg 4.05m',
        cameraTarget: '0m 0m 0m',
        exposure: 0.9,
        unlockCopy: 'Odkleni z zaključkom Foundation boss stavbe.'
    },
    {
        key: 'focus-engine',
        title: 'Focus Engine',
        subtitle: 'Produktivnost in fokus',
        levelLabel: 'CITY LVL 3',
        phaseId: 'focus-engine',
        unlockNodeKey: 'time-management',
        x: 72,
        y: 18,
        size: 136,
        source: '/city-models/city-level-03-focus-engine.glb',
        fallbackIcon: '⬡',
        orbit: '14deg 66deg 4.2m',
        cameraTarget: '0m 0m 0m',
        exposure: 0.88,
        unlockCopy: 'Odkleni po delovnem boss checkpointu.'
    },
    {
        key: 'ascendant-citadel',
        title: 'Ascendant Citadel',
        subtitle: 'Finalni prestige landmark',
        levelLabel: 'CITY LVL 4',
        phaseId: 'boss-tower',
        unlockNodeKey: 'leadership-basics',
        x: 88,
        y: 39,
        size: 140,
        source: '/city-models/city-level-04-ascendant-citadel.glb',
        fallbackIcon: '⬢',
        orbit: '10deg 64deg 4.3m',
        cameraTarget: '0m 0m 0m',
        exposure: 0.86,
        unlockCopy: 'Odkleni po kariernem bossu — zaključni del mesta.'
    }
];

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
        // Fallback progress is intentionally best-effort only.
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

function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value || 0)));
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

function nodeProgress(node) {
    return clampPercent(((node?.bestScore || 0) / Math.max(node?.requiredScore || 1, 1)) * 100);
}

function decoratePhase(phase) {
    const meta = districtById(phase.id);
    return {
        ...phase,
        title: phase.title || meta.title,
        subtitle: phase.subtitle || meta.subtitle,
        description: phase.description || meta.description,
        emoji: phase.emoji || meta.emoji,
        theme: phase.theme || meta.theme,
        landmark: phase.landmark || meta.landmark,
        unlockCopy: phase.unlockCopy || meta.unlockCopy,
        rect: phase.rect || meta.rect
    };
}

function decorateNode(node) {
    const district = districtById(node.phaseId);
    const shardReward = shardRewardForNode(node);
    return {
        ...node,
        phaseTitle: node.phaseTitle || district.title,
        theme: node.theme || district.theme,
        emoji: SKILL_ICONS[node.skillKey] || node.emoji || district.emoji,
        districtLandmark: district.landmark,
        districtSubtitle: district.subtitle,
        rewardShardCount: shardReward.count,
        rewardShardLabel: shardReward.label,
        cityUnlockText: node.boss
            ? `${district.title} boss odklene naslednji del mesta.`
            : 'Zaključi misijo in prižgi naslednjo stavbo.'
    };
}

function buildFallbackMap({ userId, skills, challenges, report, localProgress }) {
    const skillByKey = new Map(skills.map((skill) => [skill.key, skill]));
    const challengeBySkill = new Map(challenges.map((challenge) => [challenge.skillKey, challenge]));
    const completedSet = new Set();

    const nodes = ROADMAP.map(([skillKey, phaseId, order, x, y, requiredScore, boss]) => {
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
        });
    });

    const phases = DISTRICTS.map((district, index) => {
        const phaseNodes = nodes.filter((node) => node.phaseId === district.id);
        const completedNodes = phaseNodes.filter((node) => node.completed).length;
        const unlockedNodes = phaseNodes.filter((node) => node.unlocked).length;
        return decoratePhase({
            ...district,
            order: index + 1,
            totalNodes: phaseNodes.length,
            completedNodes,
            unlockedNodes,
            progressPercent: phaseNodes.length ? Math.round((completedNodes / phaseNodes.length) * 100) : 0,
            unlocked: unlockedNodes > 0,
            bossNodeKey: phaseNodes.find((node) => node.boss)?.nodeKey
        });
    });

    const completedNodes = nodes.filter((node) => node.completed).length;
    const currentNode = nodes.find((node) => node.unlocked && !node.completed) || nodes[nodes.length - 1];
    const nextBoss = nodes.find((node) => node.boss && !node.completed);

    return {
        userId,
        roadmapTitle: 'SkillCity',
        roadmapSubtitle: 'Odklepaj mesto po okrožjih. Vsaka zgrajena stavba je osvojena veščina, vsak boss pa odpre novo območje.',
        nodes,
        phases,
        summary: {
            totalNodes: nodes.length,
            completedNodes,
            unlockedNodes: nodes.filter((node) => node.unlocked).length,
            inProgressNodes: nodes.filter((node) => node.inProgress).length,
            progressPercent: Math.round((completedNodes / nodes.length) * 100),
            totalEarnedXp: nodes.filter((node) => node.completed).reduce((sum, node) => sum + node.rewardXp, 0),
            currentNodeKey: currentNode?.nodeKey,
            nextBossNodeKey: nextBoss?.nodeKey,
            currentPhaseId: currentNode?.phaseId || 'foundation'
        },
        focusRecommendations: [
            currentNode ? `Najprej zgradi: ${currentNode.skillName}.` : 'Mesto je trenutno v celoti odklenjeno.',
            nextBoss ? `Naslednji city boss: ${nextBoss.skillName}.` : 'Vsi boss checkpointi so zaključeni.',
            'Najboljši flow: misija → simulator → score → odklenjena stavba.'
        ]
    };
}

function districtStatus(phase, summary) {
    if (!phase.unlocked) return 'locked';
    if (phase.completedNodes >= phase.totalNodes) return 'completed';
    if (phase.id === summary.currentPhaseId) return 'active';
    return 'open';
}


function cityLandmarkStatus(landmark, nodes = []) {
    if (landmark.unlocksAtStart) return { unlocked: true, completed: true, unlockNode: null };
    const unlockNode = nodes.find((node) => node.nodeKey === landmark.unlockNodeKey || node.skillKey === landmark.unlockNodeKey);
    return {
        unlocked: Boolean(unlockNode?.completed),
        completed: Boolean(unlockNode?.completed),
        unlockNode
    };
}

function nextCityLandmark(nodes = []) {
    return CITY_LANDMARKS.find((landmark) => !cityLandmarkStatus(landmark, nodes).unlocked) || CITY_LANDMARKS[CITY_LANDMARKS.length - 1];
}

function CityLandmarkModel({ landmark, phase, unlocked, active, muted, modelReady, avatarConfig, onSelectPhase }) {
    const viewerRef = useRef(null);
    const shouldRenderModel = modelReady;
    const statusClass = unlocked ? 'unlocked' : 'locked';
    const palette = accentPalettes[avatarConfig?.accent] || accentPalettes.violet;
    const energy = avatarConfig?.energy || 'balanced';

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !shouldRenderModel) return undefined;

        const applyTint = () => applySkillBoostMaterialTint(viewer, palette, energy);
        applyTint();
        viewer.addEventListener?.('load', applyTint);
        viewer.addEventListener?.('model-visibility', applyTint);

        return () => {
            viewer.removeEventListener?.('load', applyTint);
            viewer.removeEventListener?.('model-visibility', applyTint);
        };
    }, [shouldRenderModel, landmark.source, palette.main, palette.blue, palette.cyan, palette.purple, palette.materialBase, palette.materialMid, palette.materialAccent, palette.materialDark, energy]);

    return (
        <button
            type="button"
            className={`skillcity-landmark-model skillquest-node--${phase?.theme || 'violet'} ${statusClass} ${active ? 'active' : ''} ${muted ? 'muted' : ''}`}
            style={{
                left: `${landmark.x}%`,
                top: `${landmark.y}%`,
                '--landmark-size': `${landmark.size || 128}px`,
                '--landmark-main': palette.main,
                '--landmark-blue': palette.blue,
                '--landmark-cyan': palette.cyan,
                '--landmark-purple': palette.purple,
                '--landmark-dark': palette.materialDark || '#07153f',
                '--node-color': unlocked ? palette.main : 'color-mix(in srgb, var(--city-main, var(--primary)) 58%, #64748b)'
            }}
            onClick={(event) => {
                event.stopPropagation();
                onSelectPhase?.(landmark.phaseId);
            }}
            title={`${landmark.title} · ${unlocked ? 'odklenjeno' : landmark.unlockCopy}`}
            aria-label={`${landmark.title}: ${unlocked ? 'odklenjeno' : landmark.unlockCopy}`}
        >
            <span className="skillcity-landmark-model__level">{landmark.levelLabel}</span>
            <span className="skillcity-landmark-model__stage" aria-hidden="true">
                {shouldRenderModel ? (
                    <model-viewer
                        ref={viewerRef}
                        src={landmark.source}
                        camera-orbit={landmark.orbit}
                        camera-target={landmark.cameraTarget || '0m 0m 0m'}
                        exposure={String(landmark.exposure || 0.94)}
                        shadow-intensity="0.34"
                        shadow-softness="0.9"
                        environment-image="legacy"
                        auto-rotate
                        rotation-per-second="7deg"
                        interaction-prompt="none"
                        loading="eager"
                        reveal="auto"
                        disable-zoom
                        disable-pan
                        touch-action="pan-y"
                    />
                ) : (
                    <span className="skillcity-landmark-model__fallback">
                        <span>{unlocked ? landmark.fallbackIcon : '🔒'}</span>
                    </span>
                )}
                {!unlocked && <span className="skillcity-landmark-model__lock">LOCKED</span>}
            </span>
            <span className="skillcity-landmark-model__copy">
                <strong>{landmark.title}</strong>
                <small>{unlocked ? 'Barve sledijo tvojemu characterju' : `Zaklenjeno · ${landmark.unlockCopy}`}</small>
            </span>
        </button>
    );
}

function missionCtaText(node) {
    if (!node?.unlocked) return 'Zaklenjeno';
    if (node.completed) return 'Ponovi trening';
    if (node.claimable || node.status === 'READY_TO_CLAIM') return 'Izboljšaj score';
    if (node.inProgress) return 'Nadaljuj misijo';
    return 'Začni misijo';
}

function missingScoreFor(node) {
    return Math.max(0, (node?.requiredScore || 0) - (node?.bestScore || 0));
}

function phaseNodesFor(nodes, phaseId) {
    return nodes.filter((node) => node.phaseId === phaseId).sort((a, b) => a.order - b.order);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
    return start + ((end - start) * amount);
}

function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function bezierPoint(start, control, end, t) {
    const inverse = 1 - t;
    return {
        x: (inverse * inverse * start.x) + (2 * inverse * t * control.x) + (t * t * end.x),
        y: (inverse * inverse * start.y) + (2 * inverse * t * control.y) + (t * t * end.y)
    };
}

function bezierTangent(start, control, end, t) {
    return {
        x: (2 * (1 - t) * (control.x - start.x)) + (2 * t * (end.x - control.x)),
        y: (2 * (1 - t) * (control.y - start.y)) + (2 * t * (end.y - control.y))
    };
}

function shardRewardForNode(node) {
    const count = node?.rewardShardCount ?? (node?.boss ? 4 : Math.max(1, Math.ceil((node?.rewardStars || 2) / 2)));
    const label = node?.rewardShardLabel || (node?.boss ? 'Boss shard' : 'Boost shard');
    return { count, label };
}

function avatarStopPointForNode(node, orderedNodes = []) {
    if (!node) return { x: 50, y: 84, facing: 1 };
    const index = orderedNodes.findIndex((item) => item.nodeKey === node.nodeKey);
    const previousNode = index > 0 ? orderedNodes[index - 1] : null;

    if (!previousNode) {
        return {
            x: clamp((node.x || 50) - 4, 6, 94),
            y: clamp((node.y || 50) + 7.4, 8, 95),
            facing: 1
        };
    }

    const dx = (node.x || 0) - (previousNode.x || 0);
    const dy = (node.y || 0) - (previousNode.y || 0);
    const distance = Math.hypot(dx, dy) || 1;
    const offset = clamp(distance * 0.22, 4.5, 8.2);
    const standX = (node.x || 50) - ((dx / distance) * offset);
    const standY = (node.y || 50) - ((dy / distance) * offset) + 7.2;

    return {
        x: clamp(standX, 6, 94),
        y: clamp(standY, 8, 95),
        facing: dx >= 0 ? 1 : -1
    };
}


function districtEntryPoint(phaseId) {
    const district = districtById(phaseId);
    const rect = district.rect || { left: 6, top: 60, width: 28, height: 28 };
    return {
        x: clamp((rect.left || 6) + 5, 6, 92),
        y: clamp((rect.top || 60) + (rect.height || 28) - 3, 12, 95),
        facing: 1
    };
}

function MapAvatarMarker({ config }) {
    const palette = accentPalettes[config?.accent] || accentPalettes.violet;
    return (
        <span
            className="skillcity-map-avatar-marker"
            style={{
                '--map-avatar-main': palette.main,
                '--map-avatar-blue': palette.blue,
                '--map-avatar-cyan': palette.cyan,
                '--map-avatar-purple': palette.purple,
                '--map-avatar-dark': palette.materialDark || '#07153f'
            }}
        >
            <span className="skillcity-map-avatar-marker__shadow" />
            <span className="skillcity-map-avatar-marker__head" />
            <span className="skillcity-map-avatar-marker__body" />
            <span className="skillcity-map-avatar-marker__core" />
            <span className="skillcity-map-avatar-marker__shard skillcity-map-avatar-marker__shard--one" />
            <span className="skillcity-map-avatar-marker__shard skillcity-map-avatar-marker__shard--two" />
        </span>
    );
}

function SkillShardReward({ count = 1, label = 'Boost shard', compact = false }) {
    const shards = Array.from({ length: Math.min(4, Math.max(1, count)) }, (_, index) => index);
    return (
        <div className={`skillcity-shard-reward ${compact ? 'compact' : ''}`} aria-label={`${count} ${label}${count > 1 ? 's' : ''}`}>
            <div className="skillcity-shard-reward__cluster" aria-hidden="true">
                {shards.map((index) => <span key={index} className={`skillcity-shard shard-${index + 1}`} />)}
            </div>
            <div className="skillcity-shard-reward__copy">
                <small>{label}</small>
                <strong>{count}x city shard</strong>
            </div>
        </div>
    );
}

function CommandCenter({ title, subtitle, nextNode, nextBoss, summary, questLoading, user, currentPhase, recommendations = [], nodes = [], onStartNext, onShowBoss }) {
    const cityOpenPercent = summary.progressPercent || 0;
    const nextProgress = nodeProgress(nextNode);
    const upcomingLandmark = nextCityLandmark(nodes);
    const leadingTip = recommendations[0] || 'Sledi označeni cesti, zgradi eno stavbo naenkrat in ne preskakuj city journeyja.';

    return (
        <section className="skillcity-command">
            <div className="skillcity-command__main">
                <p className="eyebrow">SkillCity Campaign</p>
                <h2>{title || 'SkillCity'}</h2>
                <p>{subtitle || 'Odklepaj mesto po okrožjih in treniraj samo naslednji najbolj logičen korak.'}</p>

                <div className="skillcity-next-mission">
                    <div className="skillcity-next-mission__icon">{nextNode?.emoji || '🏁'}</div>
                    <div className="skillcity-next-mission__copy">
                        <span>Naslednja misija</span>
                        <strong>{nextNode?.skillName || 'Mesto je odklenjeno'}</strong>
                        <small>{nextNode?.phaseTitle || 'Vse trenutno odklenjene misije so zaključene.'}</small>
                    </div>
                    <div className="skillcity-next-mission__meter" aria-label="Napredek naslednje misije">
                        <strong>{nextNode?.bestScore || 0}/{nextNode?.requiredScore || 100}</strong>
                        <i><em style={{ width: `${nextProgress}%` }} /></i>
                    </div>
                </div>

                <div className="skillcity-command__actions">
                    <button type="button" className="primary" disabled={!nextNode || questLoading} onClick={onStartNext}>
                        <Icon name="rocket" size={16} /> Nadaljuj mesto
                    </button>
                    <button type="button" className="secondary" disabled={!nextBoss} onClick={onShowBoss}>
                        <Icon name="trophy" size={16} /> Boss checkpoint
                    </button>
                </div>
            </div>

            <div className="skillcity-command__guide">
                <div className="skillcity-guide-model" aria-hidden="true">
                    <AvatarPreview config={user?.avatarConfig} size="hero" />
                </div>
                <div className="skillcity-command__hud">
                    <div className="skillcity-ring" style={{ '--skillcity-progress': `${cityOpenPercent}%` }}>
                        <strong>{cityOpenPercent}%</strong>
                        <span>odprto</span>
                    </div>
                    <div>
                        <strong>{summary.completedNodes || 0}/{summary.totalNodes || 0} stavb</strong>
                        <span>{summary.unlockedNodes || 0} odprtih · +{summary.totalEarnedXp || 0} XP</span>
                    </div>
                </div>
                <div className="skillcity-guide-tip">
                    <span>{currentPhase?.emoji || '🧭'} {currentPhase?.title || 'Aktivno okrožje'} · {upcomingLandmark?.levelLabel}</span>
                    <strong>{leadingTip}</strong>
                    <small>Naslednji 3D unlock: {upcomingLandmark?.title}</small>
                </div>
            </div>
        </section>
    );
}

function DistrictRail({ phases, selectedPhaseId, summary, onSelectPhase }) {
    return (
        <aside className="skillcity-district-rail" aria-label="SkillCity okrožja">
            <div className="skillcity-rail-title">
                <span>🏙️</span>
                <div>
                    <strong>Okrožja</strong>
                    <small>Odpri eno po eno</small>
                </div>
            </div>
            {phases.map((phase) => {
                const status = districtStatus(phase, summary);
                return (
                    <button
                        key={phase.id}
                        type="button"
                        className={`skillcity-district-card skillquest-node--${phase.theme || 'violet'} ${selectedPhaseId === phase.id ? 'active' : ''} ${status}`}
                        onClick={() => onSelectPhase(phase.id)}
                    >
                        <span className="skillcity-district-card__emoji">{status === 'locked' ? '🔒' : phase.emoji}</span>
                        <span className="skillcity-district-card__copy">
                            <strong>{phase.title}</strong>
                            <small>{phase.completedNodes}/{phase.totalNodes} zgrajeno</small>
                        </span>
                        <span className="skillcity-district-card__meter"><em style={{ width: `${phase.progressPercent || 0}%` }} /></span>
                    </button>
                );
            })}
        </aside>
    );
}


function RoadmapToolbar({ phases, selectedPhaseId, summary, mapMode, onMapModeChange, onSelectPhase }) {
    return (
        <section className="skillcity-roadmap-toolbar" aria-label="SkillCity pogled in okrožja">
            <div className="skillcity-view-switch" role="group" aria-label="Preklop pogleda mape">
                <button type="button" className={mapMode === 'city' ? 'active' : ''} onClick={() => onMapModeChange('city')}>
                    🏙️ Celotno mesto
                </button>
                <button type="button" className={mapMode === 'focus' ? 'active' : ''} onClick={() => onMapModeChange('focus')}>
                    🎯 Fokus četrt
                </button>
            </div>

            <div className="skillcity-district-chips">
                {phases.map((phase) => {
                    const status = districtStatus(phase, summary);
                    return (
                        <button
                            key={phase.id}
                            type="button"
                            className={`skillcity-district-chip skillquest-node--${phase.theme || 'violet'} ${selectedPhaseId === phase.id ? 'active' : ''} ${status}`}
                            onClick={() => onSelectPhase(phase.id)}
                        >
                            <span>{status === 'locked' ? '🔒' : phase.emoji}</span>
                            <strong>{phase.title}</strong>
                            <small>{phase.completedNodes}/{phase.totalNodes}</small>
                            <i><em style={{ width: `${phase.progressPercent || 0}%` }} /></i>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function JourneyStrip({ phase, nodes, activeNode, currentNodeKey, onSelectNode }) {
    const phaseNodes = [...(nodes || [])].sort((a, b) => a.order - b.order);
    if (!phaseNodes.length) return null;

    return (
        <section className="skillcity-journey-strip" aria-label="Trenutna pot po okrožju">
            <div className="skillcity-journey-strip__head">
                <div>
                    <p className="eyebrow">Trenutna pot</p>
                    <h3>{phase?.title || 'Aktivno okrožje'}</h3>
                </div>
                <span>{phase?.completedNodes || 0}/{phase?.totalNodes || phaseNodes.length} zgrajeno</span>
            </div>
            <div className="skillcity-journey-track">
                {phaseNodes.map((node, index) => {
                    const isActive = activeNode?.nodeKey === node.nodeKey;
                    const isCurrent = currentNodeKey === node.nodeKey;
                    return (
                        <button
                            key={node.nodeKey}
                            type="button"
                            className={`skillcity-journey-step skillquest-node--${node.theme || 'violet'} ${node.status?.toLowerCase().replaceAll('_', '-')} ${node.boss ? 'boss' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                            onClick={() => onSelectNode(node.nodeKey)}
                        >
                            <span>{node.completed ? '✓' : node.unlocked ? node.emoji : '🔒'}</span>
                            <strong>{node.skillName}</strong>
                            <small>{node.boss ? 'Boss gate' : `Korak ${index + 1}`}</small>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function CityRoadmapStage({ phases, nodes, activeNode, currentNodeKey, selectedPhaseId, selectedSkillKeys, user, mapMode, summary, avatarPosition, avatarMoving, onSelectNode, onSelectPhase, onStartActive }) {
    const modelReady = useModelViewerReady();
    const routeNodes = [...nodes].sort((a, b) => a.order - b.order);
    const currentIndex = Math.max(0, routeNodes.findIndex((node) => node.nodeKey === currentNodeKey));
    const activeRoute = routeNodes.slice(0, currentIndex + 1);
    const selectedSkills = Array.isArray(selectedSkillKeys) ? selectedSkillKeys : [];
    const currentPhase = phases.find((phase) => phase.id === selectedPhaseId) || phases.find((phase) => phase.id === summary.currentPhaseId) || phases[0];
    const cityLandmarks = CITY_LANDMARKS.map((landmark) => {
        const phase = phases.find((item) => item.id === landmark.phaseId) || currentPhase;
        const { unlocked, completed, unlockNode } = cityLandmarkStatus(landmark, routeNodes);
        return {
            ...landmark,
            phase,
            unlocked,
            completed,
            unlockNode,
            active: selectedPhaseId === landmark.phaseId,
            muted: mapMode === 'focus' && selectedPhaseId && selectedPhaseId !== landmark.phaseId
        };
    });

    const routePoints = routeNodes.map((node) => `${node.x},${node.y}`).join(' ');
    const activeRoutePoints = activeRoute.map((node) => `${node.x},${node.y}`).join(' ');

    return (
        <section className={`skillcity-roadmap-stage skillcity-real-stage ${mapMode === 'focus' ? 'focus-mode' : 'city-mode'}`}>
            <div className="skillcity-roadmap-stage__head skillcity-real-stage__head">
                <div>
                    <p className="eyebrow">Real city roadmap</p>
                    <h3>SkillCity mestni načrt</h3>
                    <p>Vsaka stavba je trening. Sledi osvetljeni cesti, klikni stavbo in najprej dokončaj trenutno misijo.</p>
                </div>
                <div className="skillcity-map-hud skillcity-real-hud">
                    <span>{summary.completedNodes || 0}/{summary.totalNodes || 0}</span>
                    <strong>zgrajenih</strong>
                    <small>{currentPhase?.title || 'Aktivno okrožje'}</small>
                </div>
            </div>

            <div className="skillcity-real-map" aria-label="Interaktivni tloris SkillCity mesta">
                <div className="skillcity-real-map__surface" aria-hidden="true" />
                <div className="skillcity-real-map__water" aria-hidden="true" />
                <div className="skillcity-real-map__fog" aria-hidden="true" />
                <div className="skillcity-real-map__lights" aria-hidden="true" />
                <div className="skillcity-real-map__skyline" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
                <div className="skillcity-real-map__park skillcity-real-map__park--north" aria-hidden="true" />
                <div className="skillcity-real-map__park skillcity-real-map__park--south" aria-hidden="true" />
                <div className="skillcity-real-map__artery skillcity-real-map__artery--h" aria-hidden="true" />
                <div className="skillcity-real-map__artery skillcity-real-map__artery--v" aria-hidden="true" />
                <div className="skillcity-real-map__artery skillcity-real-map__artery--diagonal" aria-hidden="true" />

                {phases.map((phase) => {
                    const rect = phase.rect || {};
                    const status = districtStatus(phase, summary);
                    const isFocused = selectedPhaseId === phase.id;
                    const isMuted = mapMode === 'focus' && selectedPhaseId && !isFocused;
                    return (
                        <button
                            key={phase.id}
                            type="button"
                            className={`skillcity-real-district skillquest-node--${phase.theme || 'violet'} ${isFocused ? 'active' : ''} ${status} ${isMuted ? 'muted' : ''}`}
                            style={{
                                left: `${rect.left || 0}%`,
                                top: `${rect.top || 0}%`,
                                width: `${rect.width || 22}%`,
                                height: `${rect.height || 20}%`
                            }}
                            onClick={() => onSelectPhase(phase.id)}
                            title={`${phase.title} · ${phase.completedNodes}/${phase.totalNodes}`}
                        >
                            <span className="skillcity-real-district__grid" aria-hidden="true" />
                            <span className="skillcity-real-district__label">
                                <span>{status === 'locked' ? '🔒' : phase.emoji}</span>
                                <strong>{phase.title}</strong>
                                <small>{phase.completedNodes}/{phase.totalNodes} · {phase.progressPercent || 0}%</small>
                            </span>
                            <span className="skillcity-real-district__landmark" aria-hidden="true">
                                <span>{phase.landmark || phase.subtitle}</span>
                            </span>
                        </button>
                    );
                })}

                {cityLandmarks.map((landmark) => (
                    <CityLandmarkModel
                        key={landmark.key}
                        landmark={landmark}
                        phase={landmark.phase}
                        unlocked={landmark.unlocked}
                        active={landmark.active}
                        muted={landmark.muted}
                        modelReady={modelReady}
                        avatarConfig={user?.avatarConfig}
                        onSelectPhase={onSelectPhase}
                    />
                ))}

                <svg className="skillcity-real-roads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline className="skillcity-real-road skillcity-real-road--shadow" points={routePoints} />
                    <polyline className="skillcity-real-road skillcity-real-road--asphalt" points={routePoints} />
                    <polyline className="skillcity-real-road skillcity-real-road--lane" points={routePoints} />
                    <polyline className="skillcity-real-road skillcity-real-road--active" points={activeRoutePoints} />
                </svg>

                {routeNodes.map((node) => {
                    const isActive = activeNode?.nodeKey === node.nodeKey;
                    const isCurrent = currentNodeKey === node.nodeKey;
                    const isSelectedSkill = selectedSkills.includes(node.skillKey);
                    const isMutedByFocus = mapMode === 'focus' && selectedPhaseId && node.phaseId !== selectedPhaseId;
                    const progress = nodeProgress(node);
                    const missing = missingScoreFor(node);
                    const height = node.boss ? 112 : 72 + ((node.order % 4) * 10);
                    return (
                        <button
                            key={node.nodeKey}
                            type="button"
                            className={`skillcity-real-node skillquest-node--${node.theme || 'violet'} ${node.status?.toLowerCase().replaceAll('_', '-')} ${node.boss ? 'boss' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isSelectedSkill ? 'selected-skill' : ''} ${isMutedByFocus ? 'muted' : ''}`}
                            style={{ left: `${node.x}%`, top: `${node.y}%`, '--tower-height': `${height}px`, '--node-progress': `${progress}%` }}
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelectNode(node.nodeKey);
                            }}
                            title={`${node.skillName} · ${STATUS_COPY[node.status] || node.status}`}
                        >
                            <span className="skillcity-real-node__plot" aria-hidden="true">
                                <span className="skillcity-real-node__tower">
                                    <span className="skillcity-real-node__roof" />
                                    <span className="skillcity-real-node__windows" />
                                </span>
                                <span className="skillcity-real-node__base" />
                            </span>
                            <span className="skillcity-real-node__badge">
                                {node.completed ? '✓' : node.unlocked ? node.emoji : '🔒'}
                            </span>
                            <span className="skillcity-real-node__progress" aria-hidden="true"><em /></span>
                            {(node.claimable || node.completed) && (
                                <span className="skillcity-real-node__shards" aria-hidden="true">
                                    {Array.from({ length: Math.min(4, shardRewardForNode(node).count) }, (_, index) => (
                                        <span key={index} className={`skillcity-node-shard shard-${index + 1}`} />
                                    ))}
                                </span>
                            )}
                            <span className="skillcity-real-node__label">
                                <strong>{node.skillName}</strong>
                                <small>{node.completed ? 'Zgrajeno' : node.unlocked ? (missing ? `${missing} score manjka` : 'Pripravljeno') : 'Zaklenjeno'}</small>
                            </span>
                            {node.boss && <b>Boss gate</b>}
                            {isCurrent && <i>Next</i>}
                        </button>
                    );
                })}

                {activeNode && (
                    <>
                        {avatarPosition && (
                            <div
                                className={`skillcity-real-avatar ${avatarMoving ? 'moving' : ''}`}
                                style={{ left: `${avatarPosition.x}%`, top: `${avatarPosition.y}%`, '--avatar-facing': avatarPosition.facing || 1 }}
                                aria-hidden="true"
                            >
                                <span className="skillcity-real-avatar__trail" />
                                <span className="skillcity-real-avatar__mini avatar avatar--model avatar--roadmap"><AvatarMini config={user?.avatarConfig} /></span>
                                <span className="skillcity-real-avatar__label">YOU</span>
                            </div>
                        )}
                        <div
                            className={`skillcity-map-callout skillquest-node--${activeNode.theme || 'violet'}`}
                            style={{ left: `${activeNode.x}%`, top: `${Math.max(7, activeNode.y - 13)}%` }}
                        >
                            <span>{activeNode.claimable || activeNode.status === 'READY_TO_CLAIM' ? 'Reward ready' : activeNode.completed ? 'Built' : activeNode.unlocked ? 'Next mission' : 'Locked'}</span>
                            <strong>{activeNode.skillName}</strong>
                            <small>{activeNode.bestScore || 0}/{activeNode.requiredScore} score</small>
                            <SkillShardReward count={shardRewardForNode(activeNode).count} label={shardRewardForNode(activeNode).label} compact />
                            {activeNode.unlocked && !activeNode.completed && (
                                <button type="button" onClick={(event) => { event.stopPropagation(); onStartActive?.(activeNode); }}>
                                    Odpri trening
                                </button>
                            )}
                        </div>
                    </>
                )}

                <div className="skillcity-real-legend" aria-hidden="true">
                    <span><i className="built" /> zgrajeno</span>
                    <span><i className="open" /> odprto</span>
                    <span><i className="locked" /> zaklenjeno</span>
                    <span><i className="landmark" /> 3D landmark</span>
                </div>
            </div>
        </section>
    );
}

function DistrictStage({ phase, nodes, activeNode, currentNodeKey, selectedSkillKeys, user, onSelectNode }) {
    const visibleNodes = nodes.length ? nodes : [];

    return (
        <section className="skillcity-stage-card">
            <div className="skillcity-stage-head">
                <div>
                    <p className="eyebrow">Aktivno okrožje</p>
                    <h3>{phase?.title || 'Okrožje'}</h3>
                    <p>{phase?.description}</p>
                </div>
                <div className="skillcity-stage-badge">
                    <span>{phase?.emoji || '🏙️'}</span>
                    <strong>{phase?.progressPercent || 0}%</strong>
                </div>
            </div>

            <div className="skillcity-stage" aria-label="Fokusirano okrožje">
                <div className="skillcity-stage__skyline" aria-hidden="true">
                    <span /><span /><span /><span /><span />
                </div>
                <div className="skillcity-stage__road" aria-hidden="true" />

                {visibleNodes.map((node, index) => {
                    const isActive = activeNode?.nodeKey === node.nodeKey;
                    const isCurrent = currentNodeKey === node.nodeKey;
                    const isSelectedSkill = selectedSkillKeys.includes(node.skillKey);
                    const progress = nodeProgress(node);
                    const missing = missingScoreFor(node);

                    return (
                        <button
                            key={node.nodeKey}
                            type="button"
                            className={`skillcity-building-card skillquest-node--${node.theme || 'violet'} ${node.status?.toLowerCase().replaceAll('_', '-')} ${node.boss ? 'boss' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isSelectedSkill ? 'selected-skill' : ''}`}
                            style={{ '--building-index': index }}
                            onClick={() => onSelectNode(node.nodeKey)}
                        >
                            <span className="skillcity-building-card__status">
                                {node.completed ? '✓' : node.unlocked ? node.emoji : '🔒'}
                            </span>
                            <span className="skillcity-building-card__tower" aria-hidden="true">
                                <span /><span /><span />
                            </span>
                            <span className="skillcity-building-card__copy">
                                <strong>{node.skillName}</strong>
                                <small>{node.completed ? 'Zgrajeno' : node.unlocked ? (missing ? `${missing} score manjka` : 'Pripravljeno') : 'Zaklenjeno'}</small>
                            </span>
                            <i><em style={{ width: `${progress}%` }} /></i>
                            {node.boss && <b>Boss</b>}
                        </button>
                    );
                })}

                {activeNode && (
                    <div className="skillcity-stage-avatar" aria-hidden="true">
                        <MapAvatarMarker config={user?.avatarConfig} />
                        <span className="skillcity-real-avatar__label">YOU</span>
                    </div>
                )}
            </div>
        </section>
    );
}

function MissionPanel({ node, questLoading, optimisticAction, onStart, onComplete }) {
    if (!node) {
        return <aside className="skillcity-mission-panel"><div className="skillquest-empty-panel">Izberi stavbo v mestu.</div></aside>;
    }

    const progress = nodeProgress(node);
    const missing = missingScoreFor(node);
    const canClaim = node.unlocked && !node.completed && (node.claimable || node.status === 'READY_TO_CLAIM' || node.bestScore >= node.requiredScore);
    const criteria = [...(node.evaluationCriteria || []), ...(node.outcomes || [])].slice(0, 4);
    const landmarkReward = CITY_LANDMARKS.find((landmark) => landmark.unlockNodeKey === node.nodeKey || landmark.unlockNodeKey === node.skillKey);

    return (
        <aside className="skillcity-mission-panel">
            <div className="skillcity-mission-panel__status">
                <span className={`skillquest-status skillquest-status--${node.status?.toLowerCase().replaceAll('_', '-')}`}>
                    {STATUS_COPY[node.status] || node.status}
                </span>
                <small>{node.boss ? 'City boss' : `Building ${node.order}`}</small>
            </div>

            <div className="skillcity-mission-title">
                <span className={`skillcity-mission-title__icon skillquest-node--${node.theme || 'violet'}`}>{node.emoji}</span>
                <div>
                    <h3>{node.skillName}</h3>
                    <p>{node.phaseTitle} · {node.estimatedMinutes} min</p>
                </div>
            </div>

            <div className="skillcity-briefing-card">
                <span>Mission briefing</span>
                <strong>{node.challengeTitle}</strong>
                <p>{node.expectedOutcome}</p>
            </div>

            <div className="skillcity-score-card">
                <div>
                    <strong>Score za odklep</strong>
                    <span>{node.bestScore || 0}/{node.requiredScore}</span>
                </div>
                <i><em style={{ width: `${progress}%` }} /></i>
                {!node.completed && missing > 0 && <small>Manjka še {missing} score točk.</small>}
                {canClaim && <small className="skillcity-claim-ready">Dosežen score — stavba je pripravljena za odklep.</small>}
            </div>

            <div className="skillcity-mission-goal">
                <span>Kaj treniraš</span>
                <p>{node.scenario}</p>
            </div>

            <div className="skillcity-route-note">
                <Icon name={node.boss ? 'trophy' : 'compass'} size={15} />
                <span>{canClaim ? 'Prevzemi nagrado, da se stavba prižge in naslednja ulica odklene.' : (node.nextUnlockText || node.cityUnlockText || 'Zaključi misijo, da se pot nadaljuje.')}</span>
            </div>

            <div className="skillcity-reward-row">
                <span><Icon name="bolt" size={14} /> +{node.rewardXp} XP</span>
                <span><Icon name="star" size={14} /> {node.rewardStars} stars</span>
                <span><Icon name="trophy" size={14} /> {node.boss ? 'Novo okrožje' : 'Nova ulica'}</span>
                {landmarkReward && <span className="skillcity-landmark-unlock-chip"><Icon name="compass" size={14} /> {landmarkReward.levelLabel}: {landmarkReward.title}</span>}
                <SkillShardReward count={shardRewardForNode(node).count} label={shardRewardForNode(node).label} />
            </div>

            {!!criteria.length && (
                <div className="skillcity-checklist">
                    {criteria.map((item) => <span key={item}><Icon name="check" size={13} /> {item}</span>)}
                </div>
            )}

            <div className="skillcity-panel-actions">
                <button type="button" className="primary" disabled={!node.unlocked || questLoading} onClick={() => onStart(node)}>
                    <Icon name="rocket" size={16} /> {missionCtaText(node)}
                </button>
                <button
                    type="button"
                    className="secondary"
                    disabled={!canClaim || questLoading || optimisticAction === `${node.nodeKey}:COMPLETE`}
                    onClick={() => onComplete(node)}
                >
                    <Icon name="checkCircle" size={16} /> Prižgi stavbo
                </button>
            </div>

            {!node.unlocked && (
                <div className="skillcity-lock-note"><Icon name="shield" size={16} /> {node.lockReason}</div>
            )}
        </aside>
    );
}

function CityOverview({ phases, nodes, summary, selectedPhaseId, onSelectPhase, onSelectNode }) {
    return (
        <section className="skillcity-overview-card">
            <div className="skillcity-overview-head">
                <div>
                    <p className="eyebrow">City overview</p>
                    <h3>Celotno mesto</h3>
                    <p>Pregled je namenjen orientaciji. Za trening ostani v aktivnem okrožju.</p>
                </div>
                <strong>{summary.progressPercent || 0}%</strong>
            </div>

            <div className="skillcity-overview-grid">
                {phases.map((phase) => {
                    const status = districtStatus(phase, summary);
                    const bossNode = nodes.find((node) => node.nodeKey === phase.bossNodeKey);
                    return (
                        <button
                            key={phase.id}
                            type="button"
                            className={`skillcity-overview-district skillquest-node--${phase.theme || 'violet'} ${selectedPhaseId === phase.id ? 'active' : ''} ${status}`}
                            onClick={() => {
                                onSelectPhase(phase.id);
                                const firstNode = nodes.find((node) => node.phaseId === phase.id && (node.unlocked || node.completed)) || nodes.find((node) => node.phaseId === phase.id);
                                if (firstNode) onSelectNode(firstNode.nodeKey);
                            }}
                        >
                            <span>{status === 'locked' ? '🔒' : phase.emoji}</span>
                            <strong>{phase.title}</strong>
                            <small>{phase.completedNodes}/{phase.totalNodes} · boss: {bossNode?.skillName || '—'}</small>
                            <i><em style={{ width: `${phase.progressPercent || 0}%` }} /></i>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

export function SkillQuestMap({
    user,
    report,
    questMap,
    questLoading,
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
    const userId = user?.id || report?.userId || 'guest';
    const [localProgress, setLocalProgress] = useState(() => readLocalProgress(userId));
    const [selectedPhaseId, setSelectedPhaseId] = useState('');
    const [activeNodeKey, setActiveNodeKey] = useState('');
    const [mapMode, setMapMode] = useState('city');
    const [optimisticAction, setOptimisticAction] = useState('');
    const [avatarPosition, setAvatarPosition] = useState(null);
    const [avatarMoving, setAvatarMoving] = useState(false);
    const avatarPositionRef = useRef(null);
    const avatarAnimationRef = useRef(0);

    useEffect(() => {
        setLocalProgress(readLocalProgress(userId));
    }, [userId]);

    useEffect(() => () => {
        if (avatarAnimationRef.current) {
            cancelAnimationFrame(avatarAnimationRef.current);
        }
    }, []);

    const effectiveMap = useMemo(() => (
        questMap?.nodes?.length
            ? {
                ...questMap,
                roadmapTitle: 'SkillCity',
                roadmapSubtitle: 'Odklepaj mesto po okrožjih. Vsaka zgrajena stavba je osvojena veščina, vsak boss pa odpre novo območje.',
                phases: (questMap.phases || []).map(decoratePhase),
                nodes: (questMap.nodes || []).map(decorateNode)
            }
            : buildFallbackMap({ userId, skills, challenges, report, localProgress })
    ), [questMap, userId, skills, challenges, report, localProgress]);

    const nodes = useMemo(() => [...(effectiveMap.nodes || [])].sort((a, b) => a.order - b.order), [effectiveMap.nodes]);
    const phases = useMemo(() => [...(effectiveMap.phases || [])].map(decoratePhase).sort((a, b) => a.order - b.order), [effectiveMap.phases]);
    const summary = effectiveMap.summary || {};
    const currentNodeKey = summary.currentNodeKey || nodes.find((node) => node.unlocked && !node.completed)?.nodeKey || nodes[0]?.nodeKey;
    const nextNode = nodes.find((node) => node.nodeKey === currentNodeKey) || nodes.find((node) => node.unlocked && !node.completed) || nodes[0];
    const nextBoss = nodes.find((node) => node.nodeKey === summary.nextBossNodeKey) || nodes.find((node) => node.boss && !node.completed);

    useEffect(() => {
        const nextPhase = summary.currentPhaseId || nextNode?.phaseId || phases[0]?.id;
        if (!selectedPhaseId && nextPhase) setSelectedPhaseId(nextPhase);
    }, [selectedPhaseId, summary.currentPhaseId, nextNode?.phaseId, phases]);

    useEffect(() => {
        const activeNode = nodes.find((node) => node.nodeKey === activeNodeKey);
        if (currentNodeKey && (!activeNodeKey || activeNode?.completed)) {
            setActiveNodeKey(currentNodeKey);
        }
    }, [activeNodeKey, currentNodeKey, nodes]);

    const activeNode = nodes.find((node) => node.nodeKey === activeNodeKey)
        || nodes.find((node) => node.nodeKey === currentNodeKey)
        || nodes[0];
    const activePhaseId = selectedPhaseId || activeNode?.phaseId || summary.currentPhaseId || phases[0]?.id;
    const activePhase = phases.find((phase) => phase.id === activePhaseId) || phases[0];
    const activePhaseNodes = useMemo(() => phaseNodesFor(nodes, activePhase?.id), [nodes, activePhase?.id]);
    const selectedSkills = Array.isArray(selectedSkillKeys) ? selectedSkillKeys : [];

    useEffect(() => {
        if (!activeNode) return undefined;
        const target = avatarStopPointForNode(activeNode, nodes);
        const current = avatarPositionRef.current || districtEntryPoint(activeNode.phaseId);

        if (avatarAnimationRef.current) {
            cancelAnimationFrame(avatarAnimationRef.current);
        }

        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 0.28) {
            avatarPositionRef.current = target;
            setAvatarPosition(target);
            setAvatarMoving(false);
            return undefined;
        }

        if (!avatarPositionRef.current) {
            avatarPositionRef.current = current;
            setAvatarPosition(current);
        }

        const duration = clamp(420 + (distance * 34), 520, 1240);
        const midpoint = {
            x: lerp(current.x, target.x, 0.5),
            y: clamp(Math.min(current.y, target.y) - clamp(distance * 0.12, 3.5, 8.5), 8, 94)
        };
        const startPoint = { x: current.x, y: current.y };
        const endPoint = { x: target.x, y: target.y };
        let cancelled = false;
        let startedAt = null;
        setAvatarMoving(true);

        const step = (timestamp) => {
            if (cancelled) return;
            if (startedAt === null) startedAt = timestamp;
            const progress = Math.min(1, (timestamp - startedAt) / duration);
            const eased = easeInOutCubic(progress);
            const point = bezierPoint(startPoint, midpoint, endPoint, eased);
            const tangent = bezierTangent(startPoint, midpoint, endPoint, Math.min(0.999, eased + 0.001));
            const next = {
                x: point.x,
                y: point.y,
                facing: tangent.x >= 0 ? 1 : -1
            };

            avatarPositionRef.current = next;
            setAvatarPosition(next);

            if (progress < 1) {
                avatarAnimationRef.current = requestAnimationFrame(step);
            } else {
                avatarPositionRef.current = target;
                setAvatarPosition(target);
                setAvatarMoving(false);
            }
        };

        avatarAnimationRef.current = requestAnimationFrame(step);
        return () => {
            cancelled = true;
            if (avatarAnimationRef.current) {
                cancelAnimationFrame(avatarAnimationRef.current);
            }
        };
    }, [activeNode, nodes]);

    const handleSelectNode = (nodeKey) => {
        const node = nodes.find((item) => item.nodeKey === nodeKey);
        setActiveNodeKey(nodeKey);
        if (node?.phaseId) {
            setSelectedPhaseId(node.phaseId);
        }
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
                if (!result?.nodes?.length) {
                    persistLocalAction(node, action);
                }
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
        setSelectedPhaseId(phaseId);
        const firstUsefulNode = nodes.find((node) => node.phaseId === phaseId && node.nodeKey === currentNodeKey)
            || nodes.find((node) => node.phaseId === phaseId && node.unlocked && !node.completed)
            || nodes.find((node) => node.phaseId === phaseId && node.unlocked)
            || nodes.find((node) => node.phaseId === phaseId);
        if (firstUsefulNode) setActiveNodeKey(firstUsefulNode.nodeKey);
    };

    const handleShowBoss = () => {
        if (!nextBoss) return;
        setSelectedPhaseId(nextBoss.phaseId);
        setActiveNodeKey(nextBoss.nodeKey);
        setMapMode('city');
    };

    const handleReset = async () => {
        if (onResetQuestMap) {
            const result = await onResetQuestMap();
            if (result?.nodes?.length) {
                return;
            }
        }
        setLocalProgress({});
        writeLocalProgress(userId, {});
    };

    if (!skills.length && !questMap?.nodes?.length) {
        return <div className="loading-card">SkillCity se naloži, ko so veščine pripravljene.</div>;
    }

    const cityPaletteStyle = avatarCityPaletteVars(user?.avatarConfig);

    return (
        <section className="skillquest-shell skillcity-shell skillcity-shell--avatar-tinted" style={cityPaletteStyle}>
            <CommandCenter
                title={effectiveMap.roadmapTitle}
                subtitle={effectiveMap.roadmapSubtitle}
                nextNode={nextNode}
                nextBoss={nextBoss}
                summary={summary}
                user={user}
                currentPhase={activePhase}
                recommendations={effectiveMap.focusRecommendations}
                nodes={nodes}
                questLoading={questLoading}
                onStartNext={() => handleStartNode(nextNode)}
                onShowBoss={handleShowBoss}
            />

            <RoadmapToolbar
                phases={phases}
                selectedPhaseId={activePhase?.id}
                summary={summary}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
                onSelectPhase={handleSelectPhase}
            />

            <JourneyStrip
                phase={activePhase}
                nodes={activePhaseNodes}
                activeNode={activeNode}
                currentNodeKey={currentNodeKey}
                onSelectNode={handleSelectNode}
            />

            <div className="skillcity-roadmap-layout">
                <CityRoadmapStage
                    phases={phases}
                    nodes={nodes}
                    activeNode={activeNode}
                    currentNodeKey={currentNodeKey}
                    selectedPhaseId={activePhase?.id}
                    selectedSkillKeys={selectedSkills}
                    user={user}
                    mapMode={mapMode}
                    summary={summary}
                    avatarPosition={avatarPosition}
                    avatarMoving={avatarMoving}
                    onSelectNode={handleSelectNode}
                    onSelectPhase={handleSelectPhase}
                    onStartActive={handleStartNode}
                />

                <MissionPanel
                    node={activeNode}
                    questLoading={questLoading}
                    optimisticAction={optimisticAction}
                    onStart={handleStartNode}
                    onComplete={handleCompleteNode}
                />
            </div>

            <section className="skillcity-guide-strip skillcity-guide-strip--compact">
                <div>
                    <span>1</span>
                    <strong>Klikni stavbo</strong>
                    <small>V mapi vidiš celotno pot, brez odpiranja dodatnega pregleda.</small>
                </div>
                <div>
                    <span>2</span>
                    <strong>Začni trening</strong>
                    <small>Simulator sam dobi pravi skill in challenge.</small>
                </div>
                <div>
                    <span>3</span>
                    <strong>Odkleni naprej</strong>
                    <small>Boss stavbe odpirajo nove dele mesta.</small>
                </div>
                <button type="button" className="secondary skillcity-reset-button" disabled={questLoading} onClick={handleReset}>
                    <Icon name="x" size={15} /> Reset progress
                </button>
            </section>
        </section>
    );
}
