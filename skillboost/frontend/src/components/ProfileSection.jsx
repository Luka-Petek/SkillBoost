import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { AvatarPreview, AvatarStudio, defaultAvatarConfig } from './AvatarStudio';

const splitTags = (value) => value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function initialsOf(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'SB';
}

export function ProfileSection({ profile, selectedUser, report, skills = [], selectedSkillKeys = [], onUpdate, saving }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [goals, setGoals] = useState('');
    const [targetSkills, setTargetSkills] = useState('');
    const [avatarDraft, setAvatarDraft] = useState(defaultAvatarConfig);
    const [successMessage, setSuccessMessage] = useState('');

    const fallbackProfile = useMemo(() => ({
        name: profile?.name || selectedUser?.name || 'SkillBoost uporabnik',
        role: profile?.role || selectedUser?.role || 'STUDENT',
        email: profile?.email || selectedUser?.email || '',
        goals: profile?.goals || selectedUser?.goals || [],
        targetSkills: profile?.targetSkills || selectedUser?.targetSkills || [],
        avatarConfig: profile?.avatarConfig || selectedUser?.avatarConfig || defaultAvatarConfig
    }), [profile, selectedUser]);

    const selectedSkills = skills.filter((skill) => selectedSkillKeys.includes(skill.key));
    const bestSkill = report?.skillProgress?.length
        ? [...report.skillProgress].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))[0]
        : null;
    const weakestSkill = report?.skillProgress?.length
        ? [...report.skillProgress].sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0))[0]
        : null;

    const skillName = (skillKey) => skills.find((skill) => skill.key === skillKey)?.name || skillKey || 'Brez podatka';

    useEffect(() => {
        setName(fallbackProfile.name || '');
        setGoals((fallbackProfile.goals || []).join(', '));
        setTargetSkills((fallbackProfile.targetSkills || []).join(', '));
        setAvatarDraft({ ...defaultAvatarConfig, ...(fallbackProfile.avatarConfig || {}) });
    }, [fallbackProfile]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        await onUpdate({
            name: name.trim(),
            goals: splitTags(goals),
            targetSkills: splitTags(targetSkills),
            avatarConfig: avatarDraft
        });
        setSuccessMessage('Profil je posodobljen.');
        setIsEditing(false);
        window.setTimeout(() => setSuccessMessage(''), 2600);
    };

    const handleAvatarSave = async (nextAvatar) => {
        const cleanName = name.trim() || fallbackProfile.name;
        await onUpdate({
            name: cleanName,
            goals: splitTags(goals),
            targetSkills: splitTags(targetSkills),
            avatarConfig: nextAvatar
        });
        setAvatarDraft({ ...defaultAvatarConfig, ...nextAvatar });
        setSuccessMessage('Avatar je posodobljen.');
        window.setTimeout(() => setSuccessMessage(''), 2600);
    };


    return (
        <div className="profile-page content-section">
            <section className="profile-hero-card">
                <div className="profile-avatar-wrap">
                    <div className="profile-avatar profile-avatar--model"><AvatarPreview config={avatarDraft} size="hero" /></div>
                    <span className="profile-avatar-ring" aria-hidden="true" />
                </div>
                <div className="profile-hero-copy">
                    <p className="eyebrow">Moj SkillBoost profil</p>
                    <h2>{fallbackProfile.name}</h2>
                    <div className="profile-meta-row">
                        <span><Icon name="users" size={15} /> {fallbackProfile.role || 'STUDENT'}</span>
                        {fallbackProfile.email && <span><Icon name="message" size={15} /> {fallbackProfile.email}</span>}
                        <span><Icon name="flame" size={15} /> {report?.streakDays || selectedUser?.streakDays || 0} dni niza</span>
                    </div>
                </div>
                <div className="profile-hero-actions">
                    {!isEditing ? (
                        <button className="primary" type="button" onClick={() => setIsEditing(true)}>
                            <Icon name="pen" size={16} />
                            Uredi profil
                        </button>
                    ) : (
                        <button className="secondary" type="button" onClick={() => setIsEditing(false)}>
                            Prekliči
                        </button>
                    )}
                </div>
            </section>

            {successMessage && <div className="profile-success"><Icon name="checkCircle" size={17} /> {successMessage}</div>}

            <section className="profile-overview-grid">
                <article className="profile-stat-card">
                    <span>Level</span>
                    <strong>{selectedUser?.level || report?.level || 1}</strong>
                    <small>{selectedUser?.currentLevelXp ?? report?.currentLevelXp ?? 0}/{selectedUser?.nextLevelXp ?? report?.nextLevelXp ?? 100} XP</small>
                </article>
                <article className="profile-stat-card">
                    <span>Skupni XP</span>
                    <strong>{selectedUser?.points ?? report?.totalPoints ?? 0}</strong>
                    <small>točke iz vaj</small>
                </article>
                <article className="profile-stat-card">
                    <span>Zvezdice</span>
                    <strong>{selectedUser?.totalStars ?? report?.totalStars ?? 0}</strong>
                    <small>nagrade za simulacije</small>
                </article>
                <article className="profile-stat-card">
                    <span>Seje</span>
                    <strong>{report?.totalSessions || 0}</strong>
                    <small>oddani treningi</small>
                </article>
            </section>

            <AvatarStudio
                value={avatarDraft}
                onChange={setAvatarDraft}
                onSave={handleAvatarSave}
                saving={saving}
                profile={fallbackProfile}
                selectedUser={selectedUser}
                report={report}
            />

            <div className="profile-layout-grid">
                <section className="profile-card profile-card--form">
                    <div className="profile-card-head">
                        <div>
                            <p className="eyebrow">Osebni fokus</p>
                            <h3>Cilji in preference</h3>
                        </div>
                        <Icon name="target" size={20} />
                    </div>

                    {isEditing ? (
                        <form className="profile-edit-form" onSubmit={handleSubmit}>
                            <label>
                                Ime
                                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tvoje ime" />
                            </label>
                            <label>
                                Cilji
                                <textarea value={goals} onChange={(event) => setGoals(event.target.value)} placeholder="npr. boljši razgovori, samozavest, komunikacija" />
                                <small>Loči z vejico.</small>
                            </label>
                            <label>
                                Veščine za izboljšavo
                                <textarea value={targetSkills} onChange={(event) => setTargetSkills(event.target.value)} placeholder="npr. public-speaking, feedback-giving" />
                                <small>Loči z vejico.</small>
                            </label>
                            <div className="profile-form-actions">
                                <button className="primary" disabled={saving} type="submit">
                                    <Icon name="check" size={16} />
                                    {saving ? 'Shranjujem...' : 'Shrani profil'}
                                </button>
                                <button className="secondary" type="button" onClick={() => setIsEditing(false)}>Prekliči</button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-display-list">
                            <div>
                                <span>Cilji</span>
                                <div className="profile-tag-list">
                                    {(fallbackProfile.goals || []).length
                                        ? fallbackProfile.goals.map((goal) => <span key={goal}>{goal}</span>)
                                        : <small>Dodaj cilje, da bo AI trener bolj personaliziran.</small>}
                                </div>
                            </div>
                            <div>
                                <span>Željene veščine</span>
                                <div className="profile-tag-list">
                                    {(fallbackProfile.targetSkills || []).length
                                        ? fallbackProfile.targetSkills.map((skill) => <span key={skill}>{skill}</span>)
                                        : <small>Dodaj veščine, ki jih želiš izboljšati.</small>}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="profile-card profile-card--coach">
                    <div className="profile-card-head">
                        <div>
                            <p className="eyebrow">Trenerski vpogled</p>
                            <h3>Tvoj trening profil</h3>
                        </div>
                        <Icon name="brain" size={20} />
                    </div>
                    <div className="profile-insight-list">
                        <article>
                            <Icon name="checkCircle" size={18} />
                            <div>
                                <span>Najmočnejše področje</span>
                                <strong>{bestSkill ? `${skillName(bestSkill.skillKey)} · ${Math.round(bestSkill.averageScore || 0)}/100` : 'Oddaj več vaj za analizo.'}</strong>
                            </div>
                        </article>
                        <article>
                            <Icon name="target" size={18} />
                            <div>
                                <span>Naslednji fokus</span>
                                <strong>{weakestSkill ? `${skillName(weakestSkill.skillKey)} · izboljšaj stabilnost` : 'Izberi fokus in začni simulacijo.'}</strong>
                            </div>
                        </article>
                        <article>
                            <Icon name="bolt" size={18} />
                            <div>
                                <span>Aktivni trening</span>
                                <strong>{selectedSkills.length ? selectedSkills.map((skill) => skill.name).join(', ') : 'Ni izbranih veščin.'}</strong>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    );
}
