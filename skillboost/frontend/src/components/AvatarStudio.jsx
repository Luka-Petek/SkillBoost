import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';

const MODEL_ROOT = '/models';
const MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';

function useModelViewerReady() {
    const [ready, setReady] = useState(() => typeof window !== 'undefined' && Boolean(window.customElements?.get('model-viewer')));

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (window.customElements?.get('model-viewer')) {
            setReady(true);
            return undefined;
        }

        let cancelled = false;
        const existing = document.querySelector('script[data-skillboost-model-viewer="true"]');
        const markReady = () => {
            if (!cancelled) setReady(true);
        };

        if (existing) {
            existing.addEventListener('load', markReady, { once: true });
            window.customElements?.whenDefined?.('model-viewer')?.then(markReady).catch(() => {});
            return () => {
                cancelled = true;
                existing.removeEventListener('load', markReady);
            };
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.src = MODEL_VIEWER_SRC;
        script.async = true;
        script.dataset.skillboostModelViewer = 'true';
        script.addEventListener('load', markReady, { once: true });
        script.addEventListener('error', () => {
            if (!cancelled) setReady(false);
        }, { once: true });
        document.head.appendChild(script);
        window.customElements?.whenDefined?.('model-viewer')?.then(markReady).catch(() => {});

        return () => {
            cancelled = true;
            script.removeEventListener('load', markReady);
        };
    }, []);

    return ready;
}

export const defaultAvatarConfig = {
    playerModel: 'level-00',
    levelModel: 'level-00',
    model: 'level-00',
    outfit: 'core-form',
    energy: 'balanced',
    accent: 'violet',
    characterType: 'guide',
    presentation: 'neutral',
    bodyStyle: 'balanced',
    skinTone: 'warm-medium',
    hairStyle: 'short-wave',
    hairColor: 'midnight',
    accessory: 'none'
};

const levelModels = Array.from({ length: 10 }, (_, level) => ({
    key: `level-${String(level).padStart(2, '0')}`,
    level,
    label: level === 0 ? 'Level 0 — Origin Shard' : `Level ${level} — Skill Shard ${level}`,
    shortLabel: `LVL ${level}`,
    title: [
        'Origin',
        'Spark',
        'Shardling',
        'Seeker',
        'Adept',
        'Runner',
        'Architect',
        'Guide',
        'Master',
        'Ascendant'
    ][level],
    description: [
        'Začetni player model. Minimalen, čist in pripravljen na rast.',
        'Prvi upgrade. Dodan občutek energije in hitrosti.',
        'Več kristalnih oblik in bolj izrazit SkillBoost karakter.',
        'Model začne dobivati močnejšo silhueto.',
        'Uravnotežen stage za redne uporabnike.',
        'Dinamičen model za aktivno napredovanje.',
        'Napreden faceted model z močnejšim armor občutkom.',
        'Mentorski stage z bolj jasnim premium izgledom.',
        'Visok level z izrazitim crystal efektom.',
        'Najmočnejši trenutni model iz tega paketa.'
    ][level],
    source: `${MODEL_ROOT}/player-level-${String(level).padStart(2, '0')}.glb`,
    requiredXp: level * 500,
    // Meshy exports are centered around Y=0. Targeting 0 keeps the full character centered instead of showing empty headroom.
    orbit: level < 3 ? '12deg 70deg 3.95m' : level < 7 ? '10deg 68deg 4.05m' : '8deg 66deg 4.15m',
    cardOrbit: level < 3 ? '12deg 70deg 4.95m' : level < 7 ? '10deg 68deg 5.05m' : '8deg 66deg 5.15m',
    heroOrbit: level < 3 ? '12deg 70deg 4.7m' : level < 7 ? '10deg 68deg 4.85m' : '8deg 66deg 5m',
    selectedOrbit: level < 3 ? '12deg 70deg 4.55m' : level < 7 ? '10deg 68deg 4.7m' : '8deg 66deg 4.85m',
    cameraTarget: '0m 0m 0m',
    scale: 1,
    exposure: level > 6 ? 0.96 : 0.92
}));

const modelMap = Object.fromEntries(levelModels.map((item) => [item.key, item]));

const outfits = [
    { key: 'core-form', label: 'Core form', helper: 'osnovni model brez dodatkov' },
    { key: 'crystal-armor', label: 'Crystal armor', helper: 'doda armor glow overlay' },
    { key: 'wing-trail', label: 'Wing trail', helper: 'doda hitrostne shard sledi' },
    { key: 'mentor-crown', label: 'Mentor crown', helper: 'premium crown outline' }
];

const energies = [
    { key: 'minimal', label: 'Minimal' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'radiant', label: 'Radiant' }
];

const accentPalettes = {
    // SkillBoost logo palette: deep indigo base, electric blue body, cyan highlights, violet energy.
    violet: {
        label: 'Violet',
        main: '#635bff',
        blue: '#256dff',
        cyan: '#20d7ff',
        purple: '#8b35ff',
        pale: '#e9edff',
        materialBase: '#2146ff',
        materialMid: '#2dd4ff',
        materialAccent: '#8b35ff',
        materialDark: '#07153f'
    },
    blue: {
        label: 'Blue',
        main: '#2f8dff',
        blue: '#175cff',
        cyan: '#39e7ff',
        purple: '#635bff',
        pale: '#e6f2ff',
        materialBase: '#1d63ff',
        materialMid: '#45e4ff',
        materialAccent: '#654dff',
        materialDark: '#061b49'
    },
    cyan: {
        label: 'Cyan',
        main: '#13c8ff',
        blue: '#0f6dff',
        cyan: '#67f8ff',
        purple: '#7c3aed',
        pale: '#e8fbff',
        materialBase: '#0891ff',
        materialMid: '#55f4ff',
        materialAccent: '#7c3aed',
        materialDark: '#05213e'
    }
};

function normalizeAvatar(config) {
    const merged = { ...defaultAvatarConfig, ...(config || {}) };
    const candidate = merged.playerModel || merged.levelModel || merged.model;
    const modelKey = modelMap[candidate] ? candidate : defaultAvatarConfig.playerModel;
    merged.playerModel = modelKey;
    merged.levelModel = modelKey;
    merged.model = modelKey;
    if (!outfits.some((item) => item.key === merged.outfit)) merged.outfit = defaultAvatarConfig.outfit;
    if (!energies.some((item) => item.key === merged.energy)) merged.energy = defaultAvatarConfig.energy;
    if (!accentPalettes[merged.accent]) merged.accent = defaultAvatarConfig.accent;
    return merged;
}

function modelFor(configOrKey) {
    if (typeof configOrKey === 'string') return modelMap[configOrKey] || modelMap[defaultAvatarConfig.playerModel];
    const avatar = normalizeAvatar(configOrKey);
    return modelMap[avatar.playerModel] || modelMap[defaultAvatarConfig.playerModel];
}

function hexToRgbFactor(hex) {
    const clean = String(hex || '#ffffff').replace('#', '');
    const value = clean.length === 3
        ? clean.split('').map((char) => char + char).join('')
        : clean.padEnd(6, 'f').slice(0, 6);
    const int = Number.parseInt(value, 16);
    if (Number.isNaN(int)) return [1, 1, 1, 1];
    return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255, 1];
}

function applySkillBoostMaterialTint(viewer, palette, energy) {
    const model = viewer?.model;
    const materials = model?.materials || [];
    if (!materials.length) return;

    const colors = [
        palette.materialBase || palette.blue,
        palette.materialMid || palette.cyan,
        palette.materialAccent || palette.purple,
        palette.materialDark || '#07153f'
    ];
    const energyBoost = energy === 'radiant' ? 1.18 : energy === 'minimal' ? 0.88 : 1;

    materials.forEach((material, index) => {
        const color = hexToRgbFactor(colors[index % colors.length]);
        const alpha = index % 4 === 1 ? 0.92 : 1;
        try {
            material.pbrMetallicRoughness?.setBaseColorFactor?.([color[0] * energyBoost, color[1] * energyBoost, color[2] * energyBoost, alpha]);
        } catch {
            // model-viewer scene graph support can vary between exported GLB files
        }
        try {
            material.pbrMetallicRoughness?.setMetallicFactor?.(0.42);
            material.pbrMetallicRoughness?.setRoughnessFactor?.(0.38);
        } catch {}
        try {
            const glow = hexToRgbFactor(index % 2 ? palette.cyan : palette.purple);
            material.setEmissiveFactor?.([glow[0] * 0.08, glow[1] * 0.08, glow[2] * 0.08]);
        } catch {}
    });
}

function ShardLogo({ compact = false }) {
    return <span className={compact ? 'sb-shard-logo sb-shard-logo--compact' : 'sb-shard-logo'} aria-hidden="true"><span /></span>;
}

function MiniShardAvatar({ config }) {
    const avatar = normalizeAvatar(config);
    const model = modelFor(avatar);
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    return (
        <span
            className="player-mini-avatar"
            style={{
                '--shard-main': palette.main,
                '--shard-blue': palette.blue,
                '--shard-cyan': palette.cyan,
                '--shard-purple': palette.purple,
                '--mini-level': model.level
            }}
            aria-label={model.shortLabel}
        >
            <span />
            <small>{model.level}</small>
        </span>
    );
}

function LevelModelViewer({ config, modelKey, size = 'large', interactive = false, label }) {
    const avatar = normalizeAvatar(config);
    const model = modelFor(modelKey || avatar.playerModel);
    const outfit = outfits.find((item) => item.key === avatar.outfit)?.key || defaultAvatarConfig.outfit;
    const energy = energies.find((item) => item.key === avatar.energy)?.key || defaultAvatarConfig.energy;
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    const viewerReady = useModelViewerReady();
    const viewerRef = useRef(null);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !viewerReady) return undefined;

        const applyTint = () => applySkillBoostMaterialTint(viewer, palette, energy);
        applyTint();
        viewer.addEventListener?.('load', applyTint);
        viewer.addEventListener?.('model-visibility', applyTint);

        return () => {
            viewer.removeEventListener?.('load', applyTint);
            viewer.removeEventListener?.('model-visibility', applyTint);
        };
    }, [viewerReady, model.source, palette.main, energy]);

    const isCard = size === 'card';
    const isHero = size === 'hero' || size === 'mini';
    const isSelected = size === 'selected';
    const cameraOrbit = isCard ? model.cardOrbit : isSelected ? (model.selectedOrbit || model.heroOrbit) : isHero ? model.heroOrbit : model.orbit;
    const fov = size === 'large' ? '37deg' : isCard ? '39deg' : isSelected ? '38deg' : '40deg';
    const cameraTarget = model.cameraTarget || '0m 0.66m 0m';

    return (
        <div
            className={`player-model player-model--${size} player-model--${outfit} player-model--${energy}`}
            style={{
                '--shard-main': palette.main,
                '--shard-blue': palette.blue,
                '--shard-cyan': palette.cyan,
                '--shard-purple': palette.purple,
                '--shard-pale': palette.pale,
                '--model-stage-scale': model.scale || 1
            }}
        >
            <span className="player-model__aura" />
            <span className="player-model__ring" />
            <span className="player-model__trail player-model__trail--one" />
            <span className="player-model__trail player-model__trail--two" />
            <span className="player-model__trail player-model__trail--three" />

            {viewerReady ? (
                <model-viewer
                    ref={viewerRef}
                    src={model.source}
                    alt={label || model.label}
                    camera-orbit={cameraOrbit}
                    camera-target={cameraTarget}
                    field-of-view={fov}
                    min-camera-orbit="auto auto 2.8m"
                    max-camera-orbit="auto auto 7.8m"
                    exposure={model.exposure || 0.92}
                    shadow-intensity="0.72"
                    shadow-softness="0.94"
                    environment-image="legacy"
                    interaction-prompt="none"
                    loading={size === 'large' ? 'eager' : 'lazy'}
                    reveal="auto"
                    auto-rotate={size === 'large'}
                    rotation-per-second={interactive ? '9deg' : '4deg'}
                    camera-controls={interactive}
                    disable-pan
                />
            ) : (
                <div className="player-model__fallback">
                    <span className="player-model__fallback-crystal" />
                    <strong>{model.shortLabel}</strong>
                    <small>GLB model je v projektu.</small>
                </div>
            )}

            <span className="player-model__color-wash" />
            <span className="player-model__overlay player-model__overlay--shoulder" />
            <span className="player-model__overlay player-model__overlay--core" />
            <span className="player-model__overlay player-model__overlay--crown" />
            <span className="player-model__level-badge">{model.level}</span>
            <span className="player-model__shadow" />
        </div>
    );
}

export function AvatarPreview({ config, size = 'stage' }) {
    if (size === 'mini') return <MiniShardAvatar config={config} />;
    if (size === 'hero') return <LevelModelViewer config={config} size="hero" />;
    if (size === 'selected') return <LevelModelViewer config={config} size="selected" />;
    return <LevelModelViewer config={config} size={size} />;
}

export function AvatarMini({ config }) {
    return <MiniShardAvatar config={config} />;
}

function ProgressCard({ report, selectedUser, selectedModel }) {
    const level = selectedUser?.level ?? report?.level ?? selectedModel.level;
    const xp = selectedUser?.currentLevelXp ?? report?.currentLevelXp ?? selectedModel.requiredXp;
    const max = selectedUser?.nextLevelXp ?? report?.nextLevelXp ?? Math.max(500, selectedModel.requiredXp + 500);
    const progress = Math.min(100, Math.round((xp / Math.max(1, max)) * 100));
    const streak = report?.streakDays || selectedUser?.streakDays || 0;
    const skillsMastered = report?.skillProgress?.filter((skill) => (skill.averageScore || 0) >= 80).length || 0;
    const challengesWon = selectedUser?.badges?.length || 0;

    return (
        <aside className="shard-progress-card">
            <div className="shard-progress-card__head">
                <div>
                    <span>Your Progress</span>
                    <strong>Level {level}</strong>
                    <small>{selectedModel.title}</small>
                </div>
                <ShardLogo />
            </div>
            <div className="shard-progress-card__bar">
                <div><span style={{ width: `${progress}%` }} /></div>
                <footer><span>{Number(xp).toLocaleString()} / {Number(max).toLocaleString()} XP</span><span>{progress}%</span></footer>
            </div>
            <div className="shard-progress-card__stats">
                <div><Icon name="users" size={16} /><span>Skills</span><strong>{skillsMastered}</strong></div>
                <div><Icon name="flame" size={16} /><span>Streak</span><strong>{streak}d</strong></div>
                <div><Icon name="trophy" size={16} /><span>Wins</span><strong>{challengesWon}</strong></div>
            </div>
        </aside>
    );
}

export function AvatarStudio({ value, onChange, onSave, saving, profile, selectedUser, report }) {
    const avatar = useMemo(() => normalizeAvatar(value), [value]);
    const selectedModel = modelFor(avatar);
    const displayName = profile?.name || selectedUser?.name || 'SkillBoost player';
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    const currentOutfit = outfits.find((item) => item.key === avatar.outfit) || outfits[0];
    const currentEnergy = energies.find((item) => item.key === avatar.energy) || energies[1];

    const updateAvatar = (patch) => {
        onChange?.(normalizeAvatar({ ...avatar, ...patch }));
    };

    return (
        <section
            className="avatar-studio avatar-studio--level-models avatar-studio--integrated-profile"
            style={{
                '--shard-main': palette.main,
                '--shard-blue': palette.blue,
                '--shard-cyan': palette.cyan,
                '--shard-purple': palette.purple,
                '--shard-pale': palette.pale
            }}
        >
            <div className="avatar-studio__head">
                <div>
                    <p className="eyebrow">3D player</p>
                    <h3>Tvoj SkillBoost player</h3>
                    <span>Izberi GLB player model, prilagodi energijo in shrani izgled profila.</span>
                </div>
                <button type="button" className="primary" onClick={() => onSave?.(avatar)} disabled={saving}>
                    <Icon name="check" size={16} />
                    {saving ? 'Shranjujem...' : 'Shrani playerja'}
                </button>
            </div>

            <div className="avatar-studio__main avatar-studio__main--integrated avatar-studio__main--balanced">
                <article className="avatar-studio__copy-card avatar-studio__copy-card--selected">
                    <span>Izbran model</span>
                    <div className="avatar-studio__selected-line avatar-studio__selected-line--model">
                        <AvatarPreview config={avatar} size="selected" />
                        <div>
                            <h4>{displayName}</h4>
                            <p>{selectedModel.shortLabel} · {selectedModel.title}</p>
                        </div>
                    </div>
                    <b><Icon name="checkCircle" size={15} /> {currentOutfit.label} · {currentEnergy.label}</b>
                    <small>{selectedModel.description}</small>
                </article>

                <div className="avatar-studio__model-stage" aria-label={`${selectedModel.label} preview`}>
                    <div className="avatar-studio__model-bg" />
                    <LevelModelViewer config={avatar} size="large" interactive />
                    <div className="avatar-studio__stage-title">
                        <strong>{selectedModel.label}</strong>
                        <span>{currentOutfit.label} · {avatar.energy}</span>
                    </div>
                </div>

                <div className="avatar-studio__side-column">
                    <ProgressCard report={report} selectedUser={selectedUser} selectedModel={selectedModel} />
                    <div className="avatar-studio__quick-controls">
                        <div className="avatar-studio__customizer-group avatar-studio__customizer-group--energy">
                            <span>Energy</span>
                            <div>
                                {energies.map((energy) => (
                                    <button
                                        key={energy.key}
                                        type="button"
                                        className={avatar.energy === energy.key ? 'is-active' : ''}
                                        onClick={() => updateAvatar({ energy: energy.key })}
                                    >
                                        {energy.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="avatar-studio__customizer-group avatar-studio__customizer-group--energy">
                            <span>Accent</span>
                            <div>
                                {Object.keys(accentPalettes).map((accent) => (
                                    <button
                                        key={accent}
                                        type="button"
                                        className={avatar.accent === accent ? 'is-active' : ''}
                                        onClick={() => updateAvatar({ accent })}
                                    >
                                        {accent}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="avatar-studio__customizer avatar-studio__customizer--outfits">
                <div className="avatar-studio__customizer-group">
                    <span>Preobleci model</span>
                    <div>
                        {outfits.map((outfit) => (
                            <button
                                key={outfit.key}
                                type="button"
                                className={avatar.outfit === outfit.key ? 'is-active' : ''}
                                onClick={() => updateAvatar({ outfit: outfit.key })}
                            >
                                <strong>{outfit.label}</strong>
                                <small>{outfit.helper}</small>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="avatar-studio__evolution">
                <div className="avatar-studio__evolution-head">
                    <div>
                        <p className="eyebrow">Level 0–9</p>
                        <h4>Player modeli za progression</h4>
                    </div>
                    <span className="avatar-studio__model-count">{levelModels.length} GLB modelov</span>
                </div>

                <div className="avatar-studio__evolution-grid avatar-studio__evolution-grid--levels">
                    {levelModels.map((model) => {
                        const selected = avatar.playerModel === model.key;
                        return (
                            <button
                                key={model.key}
                                type="button"
                                className={`shard-stage-card ${selected ? 'is-current' : ''}`}
                                onClick={() => updateAvatar({ playerModel: model.key, levelModel: model.key, model: model.key })}
                            >
                                <div className="shard-stage-card__top">
                                    <strong>{model.shortLabel}</strong>
                                    <span>{model.title}</span>
                                </div>
                                <div className="shard-stage-card__preview">
                                    <LevelModelViewer config={avatar} modelKey={model.key} size="card" />
                                </div>
                                <p>{model.description}</p>
                                <footer>
                                    {selected ? <><Icon name="circle" size={14} /> Current</> : <><Icon name="checkCircle" size={14} /> Available</>}
                                </footer>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
