import { useId, useMemo, useState } from 'react';
import { Icon } from './Icon';

export const defaultAvatarConfig = {
    characterType: 'guide',
    presentation: 'neutral',
    bodyStyle: 'balanced',
    skinTone: 'warm-medium',
    hairStyle: 'short-wave',
    hairColor: 'midnight',
    outfit: 'coach-hoodie',
    accent: 'violet',
    accessory: 'none'
};

const optionGroups = {
    characterType: [
        { value: 'guide', label: 'Guide' },
        { value: 'creator', label: 'Creator' },
        { value: 'champion', label: 'Champion' },
        { value: 'executive', label: 'Executive' }
    ],
    presentation: [
        { value: 'neutral', label: 'Neutral' },
        { value: 'feminine', label: 'Feminine' },
        { value: 'masculine', label: 'Masculine' }
    ],
    bodyStyle: [
        { value: 'compact', label: 'Compact' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'athletic', label: 'Athletic' }
    ],
    skinTone: [
        { value: 'porcelain', label: 'Porcelain', color: '#f2d4c2' },
        { value: 'warm-light', label: 'Warm light', color: '#dfae8c' },
        { value: 'warm-medium', label: 'Warm medium', color: '#b97855' },
        { value: 'deep', label: 'Deep', color: '#7a4937' }
    ],
    hairStyle: [
        { value: 'short-wave', label: 'Short wave' },
        { value: 'soft-bob', label: 'Soft bob' },
        { value: 'high-bun', label: 'High bun' },
        { value: 'curly-top', label: 'Curly top' },
        { value: 'slick-back', label: 'Slick back' }
    ],
    hairColor: [
        { value: 'midnight', label: 'Midnight', color: '#12182f' },
        { value: 'brown', label: 'Brown', color: '#6a3f2d' },
        { value: 'blonde', label: 'Blonde', color: '#d9b46a' },
        { value: 'violet', label: 'Violet', color: '#7c3aed' },
        { value: 'cyan', label: 'Cyan', color: '#0ea5e9' }
    ],
    outfit: [
        { value: 'coach-hoodie', label: 'Coach hoodie', icon: 'sparkles' },
        { value: 'focus-jacket', label: 'Focus jacket', icon: 'shield' },
        { value: 'arena-tee', label: 'Arena tee', icon: 'bolt' },
        { value: 'premium-blazer', label: 'Premium blazer', icon: 'briefcase' }
    ],
    accent: [
        { value: 'violet', label: 'Violet', color: '#8b5cf6' },
        { value: 'blue', label: 'Blue', color: '#3b82f6' },
        { value: 'cyan', label: 'Cyan', color: '#22d3ee' },
        { value: 'emerald', label: 'Emerald', color: '#34d399' },
        { value: 'coral', label: 'Coral', color: '#fb7185' }
    ],
    accessory: [
        { value: 'none', label: 'None' },
        { value: 'round-glasses', label: 'Round glasses' },
        { value: 'visor', label: 'AI visor' },
        { value: 'headphones', label: 'Headphones' }
    ]
};

const presets = [
    {
        label: 'AI coach',
        icon: 'brain',
        config: {
            characterType: 'guide',
            presentation: 'neutral',
            bodyStyle: 'balanced',
            skinTone: 'warm-medium',
            hairStyle: 'short-wave',
            hairColor: 'midnight',
            outfit: 'coach-hoodie',
            accent: 'violet',
            accessory: 'round-glasses'
        }
    },
    {
        label: 'Arena player',
        icon: 'trophy',
        config: {
            characterType: 'champion',
            presentation: 'neutral',
            bodyStyle: 'athletic',
            skinTone: 'warm-light',
            hairStyle: 'curly-top',
            hairColor: 'cyan',
            outfit: 'arena-tee',
            accent: 'cyan',
            accessory: 'headphones'
        }
    },
    {
        label: 'Focus pro',
        icon: 'target',
        config: {
            characterType: 'executive',
            presentation: 'masculine',
            bodyStyle: 'balanced',
            skinTone: 'deep',
            hairStyle: 'slick-back',
            hairColor: 'midnight',
            outfit: 'focus-jacket',
            accent: 'blue',
            accessory: 'visor'
        }
    },
    {
        label: 'Premium mentor',
        icon: 'briefcase',
        config: {
            characterType: 'creator',
            presentation: 'feminine',
            bodyStyle: 'compact',
            skinTone: 'porcelain',
            hairStyle: 'soft-bob',
            hairColor: 'brown',
            outfit: 'premium-blazer',
            accent: 'violet',
            accessory: 'round-glasses'
        }
    },
    {
        label: 'Explorer',
        icon: 'sparkles',
        config: {
            characterType: 'creator',
            presentation: 'neutral',
            bodyStyle: 'balanced',
            skinTone: 'warm-light',
            hairStyle: 'high-bun',
            hairColor: 'blonde',
            outfit: 'focus-jacket',
            accent: 'emerald',
            accessory: 'none'
        }
    },
    {
        label: 'Power captain',
        icon: 'shield',
        config: {
            characterType: 'champion',
            presentation: 'masculine',
            bodyStyle: 'athletic',
            skinTone: 'warm-medium',
            hairStyle: 'short-wave',
            hairColor: 'brown',
            outfit: 'premium-blazer',
            accent: 'coral',
            accessory: 'none'
        }
    }
];

const accentPalettes = {
    violet: { base: '#7c3aed', secondary: '#a78bfa', highlight: '#e9ddff', dark: '#4c1d95' },
    blue: { base: '#2563eb', secondary: '#60a5fa', highlight: '#dbeafe', dark: '#1e3a8a' },
    cyan: { base: '#0891b2', secondary: '#22d3ee', highlight: '#cffafe', dark: '#164e63' },
    emerald: { base: '#059669', secondary: '#34d399', highlight: '#d1fae5', dark: '#065f46' },
    coral: { base: '#e11d48', secondary: '#fb7185', highlight: '#ffe4e8', dark: '#881337' }
};

const skinPalettes = {
    porcelain: { base: '#f2d4c2', mid: '#e0b69b', shadow: '#c88e71', blush: '#f0b2b4' },
    'warm-light': { base: '#dfae8c', mid: '#cb946f', shadow: '#a46e50', blush: '#d79d90' },
    'warm-medium': { base: '#b97855', mid: '#9d6244', shadow: '#7c4933', blush: '#b67b70' },
    deep: { base: '#7a4937', mid: '#623729', shadow: '#44251c', blush: '#8d574b' }
};

const hairPalettes = {
    midnight: { base: '#12182f', mid: '#222943', shine: '#4b5572' },
    brown: { base: '#6a3f2d', mid: '#7e503d', shine: '#b07a5e' },
    blonde: { base: '#d9b46a', mid: '#c99d4d', shine: '#f3d89e' },
    violet: { base: '#7c3aed', mid: '#8b5cf6', shine: '#c4b5fd' },
    cyan: { base: '#0ea5e9', mid: '#38bdf8', shine: '#bae6fd' }
};

const typeTraits = {
    guide: { shoulders: 98, waist: 74, hips: 78, headRx: 43, headRy: 52, armOut: 28, legGap: 8, smileLift: 7, bodyYOffset: 0 },
    creator: { shoulders: 92, waist: 68, hips: 74, headRx: 45, headRy: 54, armOut: 24, legGap: 7, smileLift: 9, bodyYOffset: -2 },
    champion: { shoulders: 110, waist: 82, hips: 84, headRx: 41, headRy: 50, armOut: 34, legGap: 11, smileLift: 6, bodyYOffset: 2 },
    executive: { shoulders: 100, waist: 74, hips: 80, headRx: 42, headRy: 51, armOut: 25, legGap: 8, smileLift: 5, bodyYOffset: 1 }
};

function mergeAvatar(config) {
    return { ...defaultAvatarConfig, ...(config || {}) };
}

function findColor(group, value, fallback) {
    return optionGroups[group]?.find((option) => option.value === value)?.color || fallback;
}

function getTypeLabel(value) {
    return optionGroups.characterType.find((item) => item.value === value)?.label || 'Guide';
}

function getBodyMetrics(avatar) {
    const trait = typeTraits[avatar.characterType] || typeTraits.guide;
    const adjustments = {
        compact: { shoulders: -6, waist: -5, hips: -4, headRx: 1, headRy: 2, legScale: -6 },
        balanced: { shoulders: 0, waist: 0, hips: 0, headRx: 0, headRy: 0, legScale: 0 },
        athletic: { shoulders: 8, waist: 4, hips: 4, headRx: -1, headRy: -1, legScale: 4 }
    }[avatar.bodyStyle] || { shoulders: 0, waist: 0, hips: 0, headRx: 0, headRy: 0, legScale: 0 };

    const presentationAdjustments = {
        feminine: { headRy: 2, jawSoftness: 2, smile: 2 },
        masculine: { headRy: -1, jawSoftness: -2, smile: -1 },
        neutral: { headRy: 0, jawSoftness: 0, smile: 0 }
    }[avatar.presentation] || { headRy: 0, jawSoftness: 0, smile: 0 };

    return {
        shoulders: trait.shoulders + adjustments.shoulders,
        waist: trait.waist + adjustments.waist,
        hips: trait.hips + adjustments.hips,
        headRx: trait.headRx + adjustments.headRx,
        headRy: trait.headRy + adjustments.headRy + presentationAdjustments.headRy,
        armOut: trait.armOut,
        legGap: trait.legGap,
        smileLift: trait.smileLift + presentationAdjustments.smile,
        bodyYOffset: trait.bodyYOffset,
        legScale: adjustments.legScale,
        jawSoftness: presentationAdjustments.jawSoftness
    };
}

function renderHair(avatar, { cx, headTop, headRx, headRy, hairId, shineColor }) {
    const common = { fill: `url(#${hairId})` };
    switch (avatar.hairStyle) {
        case 'soft-bob':
            return (
                <>
                    <path {...common} d={`M ${cx - headRx - 2} ${headTop + 20} C ${cx - headRx - 8} ${headTop + 72}, ${cx - headRx + 6} ${headTop + 118}, ${cx - 28} ${headTop + 120} L ${cx + 28} ${headTop + 120} C ${cx + headRx - 6} ${headTop + 118}, ${cx + headRx + 8} ${headTop + 72}, ${cx + headRx + 2} ${headTop + 20} C ${cx + 24} ${headTop - 12}, ${cx - 24} ${headTop - 12}, ${cx - headRx - 2} ${headTop + 20} Z`} />
                    <path d={`M ${cx - 30} ${headTop + 6} C ${cx - 10} ${headTop - 2}, ${cx + 12} ${headTop - 2}, ${cx + 34} ${headTop + 10} C ${cx + 22} ${headTop + 26}, ${cx + 4} ${headTop + 28}, ${cx - 18} ${headTop + 22} Z`} fill={shineColor} opacity="0.18" />
                </>
            );
        case 'high-bun':
            return (
                <>
                    <circle cx={cx + 10} cy={headTop - 10} r="18" fill={`url(#${hairId})`} />
                    <path {...common} d={`M ${cx - headRx + 2} ${headTop + 18} C ${cx - headRx + 10} ${headTop - 8}, ${cx - 20} ${headTop - 18}, ${cx + 20} ${headTop - 18} C ${cx + headRx - 10} ${headTop - 8}, ${cx + headRx - 2} ${headTop + 18}, ${cx + 20} ${headTop + 48} C ${cx + 4} ${headTop + 22}, ${cx - 20} ${headTop + 22}, ${cx - 24} ${headTop + 46} C ${cx - 34} ${headTop + 40}, ${cx - 40} ${headTop + 34}, ${cx - headRx + 2} ${headTop + 18} Z`} />
                </>
            );
        case 'curly-top':
            return (
                <>
                    <path {...common} d={`M ${cx - headRx + 2} ${headTop + 18} C ${cx - headRx + 8} ${headTop - 10}, ${cx - 28} ${headTop - 18}, ${cx + 28} ${headTop - 16} C ${cx + headRx - 8} ${headTop - 8}, ${cx + headRx - 2} ${headTop + 18}, ${cx + 24} ${headTop + 42} C ${cx + 12} ${headTop + 24}, ${cx - 10} ${headTop + 24}, ${cx - 22} ${headTop + 44} C ${cx - 34} ${headTop + 34}, ${cx - 42} ${headTop + 28}, ${cx - headRx + 2} ${headTop + 18} Z`} />
                    <circle cx={cx - 28} cy={headTop + 4} r="10" fill={`url(#${hairId})`} />
                    <circle cx={cx - 10} cy={headTop - 4} r="12" fill={`url(#${hairId})`} />
                    <circle cx={cx + 10} cy={headTop - 2} r="12" fill={`url(#${hairId})`} />
                    <circle cx={cx + 28} cy={headTop + 6} r="10" fill={`url(#${hairId})`} />
                </>
            );
        case 'slick-back':
            return (
                <>
                    <path {...common} d={`M ${cx - headRx - 2} ${headTop + 20} C ${cx - headRx + 10} ${headTop - 10}, ${cx - 6} ${headTop - 20}, ${cx + 38} ${headTop - 6} C ${cx + headRx + 6} ${headTop + 12}, ${cx + headRx} ${headTop + 30}, ${cx + 14} ${headTop + 26} C ${cx - 2} ${headTop + 20}, ${cx - 24} ${headTop + 18}, ${cx - 34} ${headTop + 34} C ${cx - 40} ${headTop + 34}, ${cx - 44} ${headTop + 28}, ${cx - headRx - 2} ${headTop + 20} Z`} />
                    <path d={`M ${cx - 22} ${headTop + 8} C ${cx + 8} ${headTop - 8}, ${cx + 26} ${headTop - 6}, ${cx + 42} ${headTop + 4}`} fill="none" stroke={shineColor} strokeWidth="6" strokeLinecap="round" opacity="0.24" />
                </>
            );
        case 'short-wave':
        default:
            return (
                <>
                    <path {...common} d={`M ${cx - headRx + 2} ${headTop + 18} C ${cx - headRx + 10} ${headTop - 12}, ${cx - 14} ${headTop - 20}, ${cx + 26} ${headTop - 16} C ${cx + headRx - 10} ${headTop - 10}, ${cx + headRx - 2} ${headTop + 18}, ${cx + 10} ${headTop + 34} C ${cx - 2} ${headTop + 18}, ${cx - 28} ${headTop + 20}, ${cx - 26} ${headTop + 44} C ${cx - 36} ${headTop + 40}, ${cx - 42} ${headTop + 32}, ${cx - headRx + 2} ${headTop + 18} Z`} />
                    <path d={`M ${cx - 18} ${headTop + 6} C ${cx - 2} ${headTop - 4}, ${cx + 18} ${headTop - 2}, ${cx + 34} ${headTop + 10}`} fill="none" stroke={shineColor} strokeWidth="6" strokeLinecap="round" opacity="0.22" />
                </>
            );
    }
}

function renderOutfit(avatar, metrics, colors, cx, torsoTop, torsoBottom) {
    const shoulders = metrics.shoulders;
    const waist = metrics.waist;
    const innerTop = torsoTop + 26;
    const innerBottom = torsoBottom - 2;

    switch (avatar.outfit) {
        case 'arena-tee':
            return (
                <>
                    <path d={`M ${cx - 18} ${innerTop} L ${cx + 18} ${innerTop} L ${cx + 12} ${innerBottom} L ${cx - 12} ${innerBottom} Z`} fill="rgba(255,255,255,0.12)" />
                    <path d={`M ${cx - shoulders / 2 + 18} ${torsoTop + 20} H ${cx - 6}`} fill="none" stroke={colors.secondary} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                    <path d={`M ${cx + shoulders / 2 - 18} ${torsoTop + 30} H ${cx + 12}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
                </>
            );
        case 'focus-jacket':
            return (
                <>
                    <path d={`M ${cx - 10} ${innerTop - 4} L ${cx + 10} ${innerTop - 4} L ${cx + 8} ${innerBottom} L ${cx - 8} ${innerBottom} Z`} fill="rgba(255,255,255,0.09)" />
                    <path d={`M ${cx - 26} ${torsoTop + 18} L ${cx - 4} ${torsoTop + 58} L ${cx - 8} ${innerBottom - 6}`} fill="rgba(255,255,255,0.16)" opacity="0.9" />
                    <path d={`M ${cx + 26} ${torsoTop + 18} L ${cx + 4} ${torsoTop + 58} L ${cx + 8} ${innerBottom - 6}`} fill="rgba(0,0,0,0.14)" opacity="0.9" />
                    <path d={`M ${cx} ${torsoTop + 16} V ${innerBottom - 2}`} fill="none" stroke={colors.highlight} strokeWidth="3" strokeLinecap="round" opacity="0.74" />
                </>
            );
        case 'premium-blazer':
            return (
                <>
                    <path d={`M ${cx - 30} ${torsoTop + 14} L ${cx - 8} ${torsoTop + 60} L ${cx - 10} ${innerBottom} L ${cx - 26} ${torsoTop + 56} Z`} fill="rgba(255,255,255,0.22)" opacity="0.9" />
                    <path d={`M ${cx + 30} ${torsoTop + 14} L ${cx + 8} ${torsoTop + 60} L ${cx + 10} ${innerBottom} L ${cx + 26} ${torsoTop + 56} Z`} fill="rgba(0,0,0,0.16)" opacity="0.9" />
                    <path d={`M ${cx - 12} ${innerTop - 4} L ${cx + 12} ${innerTop - 4} L ${cx + 8} ${innerBottom} L ${cx - 8} ${innerBottom} Z`} fill="rgba(255,255,255,0.10)" />
                    <circle cx={cx + waist / 2 - 10} cy={torsoTop + 56} r="4" fill={colors.highlight} opacity="0.8" />
                    <circle cx={cx + waist / 2 - 12} cy={torsoTop + 82} r="4" fill={colors.highlight} opacity="0.72" />
                </>
            );
        case 'coach-hoodie':
        default:
            return (
                <>
                    <path d={`M ${cx - 12} ${innerTop - 2} L ${cx + 12} ${innerTop - 2} L ${cx + 6} ${innerBottom} L ${cx - 6} ${innerBottom} Z`} fill="rgba(255,255,255,0.08)" />
                    <path d={`M ${cx - 20} ${torsoBottom - 32} Q ${cx} ${torsoBottom - 14} ${cx + 20} ${torsoBottom - 32}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />
                    <path d={`M ${cx} ${torsoTop + 16} V ${torsoBottom - 12}`} fill="none" stroke={colors.secondary} strokeWidth="8" strokeLinecap="round" opacity="0.42" />
                </>
            );
    }
}

function renderAccessory(avatar, colors, { cx, eyeY, headTop, headRx }) {
    if (avatar.accessory === 'round-glasses') {
        return (
            <g className="avatar-svg__accessory">
                <rect x={cx - 28} y={eyeY - 9} width="24" height="18" rx="8" fill="none" stroke="#1f2937" strokeWidth="3.5" />
                <rect x={cx + 4} y={eyeY - 9} width="24" height="18" rx="8" fill="none" stroke="#1f2937" strokeWidth="3.5" />
                <path d={`M ${cx - 4} ${eyeY} H ${cx + 4}`} fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
            </g>
        );
    }

    if (avatar.accessory === 'visor') {
        return (
            <g className="avatar-svg__accessory">
                <rect x={cx - 34} y={eyeY - 10} width="68" height="22" rx="11" fill={`url(#${colors.visorId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            </g>
        );
    }

    if (avatar.accessory === 'headphones') {
        return (
            <g className="avatar-svg__accessory">
                <path d={`M ${cx - headRx - 8} ${headTop + 26} C ${cx - headRx - 8} ${headTop - 8}, ${cx + headRx + 8} ${headTop - 8}, ${cx + headRx + 8} ${headTop + 26}`} fill="none" stroke={colors.base} strokeWidth="8" strokeLinecap="round" />
                <rect x={cx - headRx - 12} y={eyeY - 4} width="16" height="34" rx="8" fill={colors.base} />
                <rect x={cx + headRx - 4} y={eyeY - 4} width="16" height="34" rx="8" fill={colors.base} />
            </g>
        );
    }

    return null;
}

export function AvatarPreview({ config, size = 'large', interactive = false }) {
    const avatar = mergeAvatar(config);
    const uid = useId().replace(/:/g, '');
    const skin = skinPalettes[avatar.skinTone] || skinPalettes['warm-medium'];
    const hair = hairPalettes[avatar.hairColor] || hairPalettes.midnight;
    const accent = accentPalettes[avatar.accent] || accentPalettes.violet;
    const metrics = getBodyMetrics(avatar);

    const viewBoxWidth = 280;
    const viewBoxHeight = 380;
    const cx = 140;
    const headCy = 76;
    const headTop = headCy - metrics.headRy;
    const torsoTop = 126 + metrics.bodyYOffset;
    const torsoBottom = 250 + metrics.bodyYOffset;
    const hipsTop = torsoBottom - 6;
    const hipsHeight = 34;
    const legTop = hipsTop + hipsHeight - 4;
    const legHeight = 72 + metrics.legScale;
    const armTop = torsoTop + 8;
    const eyeY = headCy + 6;
    const mouthY = headCy + 34;

    const leftShoulderX = cx - metrics.shoulders / 2;
    const rightShoulderX = cx + metrics.shoulders / 2;
    const leftWaistX = cx - metrics.waist / 2;
    const rightWaistX = cx + metrics.waist / 2;
    const leftHipX = cx - metrics.hips / 2;
    const rightHipX = cx + metrics.hips / 2;
    const legWidth = avatar.bodyStyle === 'athletic' ? 22 : 20;
    const leftLegX = cx - metrics.legGap - legWidth;
    const rightLegX = cx + metrics.legGap;
    const shoeWidth = legWidth + 12;

    const torsoPath = `M ${leftShoulderX} ${torsoTop} C ${leftShoulderX - 8} ${torsoTop + 38}, ${leftWaistX - 10} ${torsoBottom - 46}, ${leftWaistX} ${torsoBottom} L ${rightWaistX} ${torsoBottom} C ${rightWaistX + 10} ${torsoBottom - 46}, ${rightShoulderX + 8} ${torsoTop + 38}, ${rightShoulderX} ${torsoTop} C ${rightShoulderX - 18} ${torsoTop - 16}, ${cx + 18} ${torsoTop - 18}, ${cx} ${torsoTop - 18} C ${cx - 18} ${torsoTop - 18}, ${leftShoulderX + 18} ${torsoTop - 16}, ${leftShoulderX} ${torsoTop} Z`;

    const leftArmPath = `M ${leftShoulderX + 10} ${armTop} C ${leftShoulderX - metrics.armOut} ${armTop + 16}, ${leftShoulderX - metrics.armOut} ${armTop + 82}, ${leftShoulderX + 2} ${armTop + 132} C ${leftShoulderX + 7} ${armTop + 146}, ${leftShoulderX + 24} ${armTop + 148}, ${leftShoulderX + 30} ${armTop + 134} C ${leftShoulderX + 16} ${armTop + 82}, ${leftShoulderX + 18} ${armTop + 36}, ${leftShoulderX + 30} ${armTop + 10} Z`;
    const rightArmPath = `M ${rightShoulderX - 10} ${armTop} C ${rightShoulderX + metrics.armOut} ${armTop + 16}, ${rightShoulderX + metrics.armOut} ${armTop + 82}, ${rightShoulderX - 2} ${armTop + 132} C ${rightShoulderX - 7} ${armTop + 146}, ${rightShoulderX - 24} ${armTop + 148}, ${rightShoulderX - 30} ${armTop + 134} C ${rightShoulderX - 16} ${armTop + 82}, ${rightShoulderX - 18} ${armTop + 36}, ${rightShoulderX - 30} ${armTop + 10} Z`;

    const ids = {
        skin: `skin-${uid}`,
        skinShadow: `skin-shadow-${uid}`,
        hair: `hair-${uid}`,
        torso: `torso-${uid}`,
        pants: `pants-${uid}`,
        shoes: `shoes-${uid}`,
        visor: `visor-${uid}`,
        stage: `stage-${uid}`
    };

    const classes = ['avatar-model', `avatar-model--${size}`, interactive ? 'avatar-model--interactive' : ''].filter(Boolean).join(' ');

    return (
        <div className={classes} aria-label="3D avatar preview">
            <svg className="avatar-svg" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} role="img" aria-hidden="true">
                <defs>
                    <linearGradient id={ids.skin} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={skin.base} />
                        <stop offset="60%" stopColor={skin.mid} />
                        <stop offset="100%" stopColor={skin.shadow} />
                    </linearGradient>
                    <linearGradient id={ids.skinShadow} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={skin.shadow} stopOpacity="0.05" />
                        <stop offset="100%" stopColor={skin.shadow} stopOpacity="0.28" />
                    </linearGradient>
                    <linearGradient id={ids.hair} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={hair.shine} />
                        <stop offset="20%" stopColor={hair.mid} />
                        <stop offset="100%" stopColor={hair.base} />
                    </linearGradient>
                    <linearGradient id={ids.torso} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={accent.secondary} />
                        <stop offset="22%" stopColor={accent.base} />
                        <stop offset="100%" stopColor={accent.dark} />
                    </linearGradient>
                    <linearGradient id={ids.pants} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#27324d" />
                        <stop offset="100%" stopColor="#111827" />
                    </linearGradient>
                    <linearGradient id={ids.shoes} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id={ids.visor} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={accent.highlight} />
                        <stop offset="55%" stopColor={accent.secondary} />
                        <stop offset="100%" stopColor={accent.base} />
                    </linearGradient>
                    <radialGradient id={ids.stage} cx="50%" cy="42%" r="60%">
                        <stop offset="0%" stopColor={accent.secondary} stopOpacity="0.20" />
                        <stop offset="60%" stopColor={accent.base} stopOpacity="0.06" />
                        <stop offset="100%" stopColor={accent.base} stopOpacity="0" />
                    </radialGradient>
                </defs>

                <ellipse cx={cx} cy="352" rx="54" ry="16" fill="rgba(15,23,42,0.22)" />
                <rect x="100" y="338" width="80" height="18" rx="9" fill={accent.highlight} fillOpacity="0.95" />
                <rect x="100" y="338" width="80" height="18" rx="9" fill="url(#stage-sheen)" opacity="0" />
                <circle cx={cx} cy="214" r="112" fill={`url(#${ids.stage})`} />

                <g className="avatar-svg__avatar">
                    <path d={leftArmPath} fill={`url(#${ids.torso})`} opacity="0.94" />
                    <path d={rightArmPath} fill={`url(#${ids.torso})`} opacity="0.94" />
                    <circle cx={leftShoulderX + 18} cy={armTop + 140} r="15" fill={`url(#${ids.skin})`} />
                    <circle cx={rightShoulderX - 18} cy={armTop + 140} r="15" fill={`url(#${ids.skin})`} />

                    <path d={torsoPath} fill={`url(#${ids.torso})`} />
                    <path d={torsoPath} fill="rgba(255,255,255,0.06)" opacity="0.3" />
                    {renderOutfit(avatar, metrics, { ...accent, visorId: ids.visor }, cx, torsoTop, torsoBottom)}
                    <circle cx={cx + metrics.waist / 2 - 10} cy={torsoTop + 46} r="14" fill={accent.secondary} fillOpacity="0.88" />
                    <g transform={`translate(${cx + metrics.waist / 2 - 10} ${torsoTop + 46})`}>
                        <foreignObject x="-8" y="-8" width="16" height="16" className="avatar-svg__badge-icon">
                            <div xmlns="http://www.w3.org/1999/xhtml" className="avatar-svg__badge-icon-inner">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2L6 13h5l-1 9 8-13h-5l0-7z" fill="white" stroke="white" />
                                </svg>
                            </div>
                        </foreignObject>
                    </g>

                    <rect x={leftHipX} y={hipsTop} width={metrics.hips} height={hipsHeight} rx="18" fill={`url(#${ids.pants})`} />
                    <rect x={leftLegX} y={legTop} width={legWidth} height={legHeight} rx="10" fill={`url(#${ids.pants})`} />
                    <rect x={rightLegX} y={legTop} width={legWidth} height={legHeight} rx="10" fill={`url(#${ids.pants})`} />
                    <rect x={leftLegX - 6} y={legTop + legHeight - 4} width={shoeWidth} height="14" rx="7" fill={`url(#${ids.shoes})`} />
                    <rect x={rightLegX - 6} y={legTop + legHeight - 4} width={shoeWidth} height="14" rx="7" fill={`url(#${ids.shoes})`} />

                    <rect x={cx - 12} y={106} width="24" height="22" rx="8" fill={`url(#${ids.skin})`} />
                    <ellipse cx={cx} cy={headCy} rx={metrics.headRx} ry={metrics.headRy} fill={`url(#${ids.skin})`} />
                    <ellipse cx={cx - metrics.headRx + 3} cy={headCy + 4} rx="8" ry="13" fill={`url(#${ids.skin})`} />
                    <ellipse cx={cx + metrics.headRx - 3} cy={headCy + 4} rx="8" ry="13" fill={`url(#${ids.skin})`} />
                    <path d={`M ${cx - metrics.headRx + 8} ${headCy + 26} C ${cx - 24} ${headCy + 42}, ${cx + 24} ${headCy + 42}, ${cx + metrics.headRx - 8} ${headCy + 26}`} fill="url(#${ids.skinShadow})" opacity="0.35" />
                    <ellipse cx={cx - 26} cy={headCy + 24} rx="10" ry="5" fill={skin.blush} opacity="0.22" />
                    <ellipse cx={cx + 26} cy={headCy + 24} rx="10" ry="5" fill={skin.blush} opacity="0.22" />

                    {renderHair(avatar, { cx, headTop, headRx: metrics.headRx, headRy: metrics.headRy, hairId: ids.hair, shineColor: hair.shine })}

                    <path d={`M ${cx - 26} ${eyeY - 18} C ${cx - 16} ${eyeY - 22}, ${cx - 8} ${eyeY - 22}, ${cx + 2} ${eyeY - 18}`} fill="none" stroke={hair.base} strokeWidth="4" strokeLinecap="round" />
                    <path d={`M ${cx - 2} ${eyeY - 18} C ${cx + 8} ${eyeY - 22}, ${cx + 16} ${eyeY - 22}, ${cx + 26} ${eyeY - 18}`} fill="none" stroke={hair.base} strokeWidth="4" strokeLinecap="round" />

                    <g className="avatar-svg__eyes">
                        <ellipse cx={cx - 16} cy={eyeY} rx="11" ry="8" fill="white" />
                        <ellipse cx={cx + 16} cy={eyeY} rx="11" ry="8" fill="white" />
                        <circle cx={cx - 16} cy={eyeY + 1} r="4.5" fill="#111827" />
                        <circle cx={cx + 16} cy={eyeY + 1} r="4.5" fill="#111827" />
                        <circle cx={cx - 14} cy={eyeY - 1} r="1.5" fill="white" />
                        <circle cx={cx + 18} cy={eyeY - 1} r="1.5" fill="white" />
                    </g>

                    <path d={`M ${cx - 2} ${eyeY + 8} Q ${cx - 6} ${eyeY + 20}, ${cx} ${eyeY + 26} Q ${cx + 5} ${eyeY + 20}, ${cx + 2} ${eyeY + 8}`} fill="rgba(121,74,56,0.18)" />
                    <path d={`M ${cx - 18} ${mouthY} Q ${cx} ${mouthY + metrics.smileLift}, ${cx + 18} ${mouthY}`} fill="none" stroke="rgba(96,52,44,0.56)" strokeWidth="3.2" strokeLinecap="round" />

                    {renderAccessory(avatar, { ...accent, visorId: ids.visor }, { cx, eyeY, headTop, headRx: metrics.headRx })}

                    <circle className="avatar-svg__spark avatar-svg__spark--one" cx="200" cy="126" r="4" fill={accent.secondary} />
                    <circle className="avatar-svg__spark avatar-svg__spark--two" cx="78" cy="182" r="4" fill={accent.secondary} />
                </g>
            </svg>
        </div>
    );
}

export function AvatarMini({ config }) {
    return <AvatarPreview config={config} size="mini" />;
}

export function AvatarStudio({ value, onChange, onSave, saving }) {
    const [draft, setDraft] = useState(() => mergeAvatar(value));
    const [activeTab, setActiveTab] = useState('style');
    const [saved, setSaved] = useState(false);

    const selectedPreset = useMemo(
        () => presets.find((preset) => Object.entries(preset.config).every(([key, val]) => draft[key] === val)),
        [draft]
    );

    const update = (key, val) => {
        const next = { ...draft, [key]: val };
        setDraft(next);
        onChange?.(next);
        setSaved(false);
    };

    const randomize = () => {
        const next = Object.fromEntries(
            Object.entries(optionGroups).map(([key, options]) => [key, options[Math.floor(Math.random() * options.length)].value])
        );
        setDraft(next);
        onChange?.(next);
        setSaved(false);
    };

    const handleSave = async () => {
        await onSave?.(draft);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2400);
    };

    const resetAvatar = () => {
        setDraft(defaultAvatarConfig);
        onChange?.(defaultAvatarConfig);
        setSaved(false);
    };

    return (
        <section className="avatar-studio profile-card">
            <div className="avatar-studio__preview-panel">
                <div className="avatar-studio__header">
                    <div>
                        <p className="eyebrow">Avatar Studio</p>
                        <h3>Tvoj 3D karakter</h3>
                        <span>{selectedPreset ? selectedPreset.label : `${getTypeLabel(draft.characterType)} avatar`} · {draft.presentation}</span>
                    </div>
                    <button className="secondary" type="button" onClick={randomize}>
                        <Icon name="sparkles" size={16} /> Randomize
                    </button>
                </div>
                <div className="avatar-stage">
                    <div className="avatar-stage__grid" />
                    <div className="avatar-stage__halo" />
                    <AvatarPreview config={draft} interactive />
                </div>
                <div className="avatar-studio__actions">
                    <button className="primary" type="button" onClick={handleSave} disabled={saving}>
                        <Icon name="check" size={16} /> {saving ? 'Shranjujem...' : 'Shrani avatar'}
                    </button>
                    <button className="secondary" type="button" onClick={resetAvatar}>
                        Reset
                    </button>
                    {saved && <span className="avatar-save-hint"><Icon name="checkCircle" size={15} /> Avatar shranjen</span>}
                </div>
            </div>

            <div className="avatar-studio__editor-panel">
                <div className="avatar-tabs" role="tablist" aria-label="Avatar nastavitve">
                    <button type="button" className={activeTab === 'style' ? 'active' : ''} onClick={() => setActiveTab('style')}>Style</button>
                    <button type="button" className={activeTab === 'hair' ? 'active' : ''} onClick={() => setActiveTab('hair')}>Hair</button>
                    <button type="button" className={activeTab === 'outfit' ? 'active' : ''} onClick={() => setActiveTab('outfit')}>Outfit</button>
                </div>

                {activeTab === 'style' && (
                    <div className="avatar-editor-grid">
                        <OptionButtons title="Character type" options={optionGroups.characterType} value={draft.characterType} onChange={(val) => update('characterType', val)} />
                        <OptionButtons title="Prezentacija" options={optionGroups.presentation} value={draft.presentation} onChange={(val) => update('presentation', val)} />
                        <OptionButtons title="Body style" options={optionGroups.bodyStyle} value={draft.bodyStyle} onChange={(val) => update('bodyStyle', val)} />
                        <ColorOptions title="Skin tone" options={optionGroups.skinTone} value={draft.skinTone} onChange={(val) => update('skinTone', val)} />
                    </div>
                )}

                {activeTab === 'hair' && (
                    <div className="avatar-editor-grid">
                        <OptionButtons title="Frizura" options={optionGroups.hairStyle} value={draft.hairStyle} onChange={(val) => update('hairStyle', val)} />
                        <ColorOptions title="Barva las" options={optionGroups.hairColor} value={draft.hairColor} onChange={(val) => update('hairColor', val)} />
                        <OptionButtons title="Dodatek" options={optionGroups.accessory} value={draft.accessory} onChange={(val) => update('accessory', val)} />
                    </div>
                )}

                {activeTab === 'outfit' && (
                    <div className="avatar-editor-grid">
                        <OptionButtons title="Oblačilo" options={optionGroups.outfit} value={draft.outfit} onChange={(val) => update('outfit', val)} withIcon />
                        <ColorOptions title="Accent" options={optionGroups.accent} value={draft.accent} onChange={(val) => update('accent', val)} />
                        <div className="avatar-presets">
                            <span>Preseti</span>
                            <div>
                                {presets.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        className={selectedPreset?.label === preset.label ? 'active' : ''}
                                        onClick={() => {
                                            setDraft(preset.config);
                                            onChange?.(preset.config);
                                            setSaved(false);
                                        }}
                                    >
                                        <Icon name={preset.icon} size={16} />
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function OptionButtons({ title, options, value, onChange, withIcon = false }) {
    return (
        <div className="avatar-option-group">
            <span>{title}</span>
            <div>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={value === option.value ? 'active' : ''}
                        onClick={() => onChange(option.value)}
                    >
                        {withIcon && option.icon && <Icon name={option.icon} size={15} />}
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ColorOptions({ title, options, value, onChange }) {
    return (
        <div className="avatar-option-group avatar-color-group">
            <span>{title}</span>
            <div>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={value === option.value ? 'active' : ''}
                        onClick={() => onChange(option.value)}
                        title={option.label}
                    >
                        <i style={{ background: option.color || findColor('accent', option.value, '#8b5cf6') }} />
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
