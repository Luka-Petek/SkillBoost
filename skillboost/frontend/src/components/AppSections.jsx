import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';
import { AvatarMini, defaultAvatarConfig, accentPalettes, normalizeAvatar, applySkillBoostMaterialTint } from './AvatarStudio';

export function StyledSelect({ value, options = [], onChange, label = 'Izberi možnost', className = '' }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const normalizedOptions = useMemo(() => options.map((option) => (
        typeof option === 'string' ? { value: option, label: option } : option
    )), [options]);
    const selectedOption = normalizedOptions.find((option) => String(option.value) === String(value)) || normalizedOptions[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!wrapperRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectOption = (optionValue) => {
        onChange?.(optionValue);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`styled-select ${open ? 'is-open' : ''} ${className}`}>
            <button
                type="button"
                className="styled-select__button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={label}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpen(false);
                    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                <span>{selectedOption?.label || label}</span>
                <i aria-hidden="true" />
            </button>
            {open && (
                <div className="styled-select__menu" role="listbox">
                    {normalizedOptions.map((option) => {
                        const selected = String(option.value) === String(value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={`styled-select__option ${selected ? 'is-selected' : ''}`}
                                role="option"
                                aria-selected={selected}
                                onClick={() => selectOption(option.value)}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


const scoreLabels = [
    { min: 85, label: 'Odlično', tone: 'great' },
    { min: 70, label: 'Dobro', tone: 'good' },
    { min: 50, label: 'V razvoju', tone: 'warn' },
    { min: 0, label: 'Za vajo', tone: 'danger' }
];


export function EngagementDashboard({
    user,
    report,
    skills = [],
    selectedSkills = [],
    selectedSkillNames,
    challenges = [],
    selectedChallenge,
    dailyDuelChallenge,
    personalizedDailyChallenge,
    lastReward,
    lastSession,
    onStartSimulator,
    onOpenSkills,
    onOpenCompetition,
    onOpenReport,
    onStartDailyChallenge,
    onStartDailyDuel
}) {
    const level = user?.level || report?.level || 1;
    const currentLevelXp = user?.currentLevelXp ?? report?.currentLevelXp ?? 0;
    const nextLevelXp = user?.nextLevelXp ?? report?.nextLevelXp ?? 100;
    const xpProgress = Math.min(100, Math.round((currentLevelXp / Math.max(1, nextLevelXp)) * 100));
    const streakDays = user?.streakDays ?? report?.streakDays ?? 0;
    const totalStars = user?.totalStars ?? report?.totalStars ?? 0;
    const averageScore = Math.round(report?.averageScore ?? lastSession?.score ?? 0);
    const sessionsCount = report?.sessionsCount ?? report?.totalSessions ?? 0;
    const activeSkills = selectedSkills.length ? selectedSkills : skills.slice(0, 3);
    const skillProgress = (report?.skillProgress || [])
        .filter((item) => item?.skillKey)
        .slice()
        .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));
    const focusSkill = skillProgress[0]
        ? skills.find((skill) => skill.key === skillProgress[0].skillKey)
        : activeSkills[0];
    const strongestSkill = skillProgress[skillProgress.length - 1]
        ? skills.find((skill) => skill.key === skillProgress[skillProgress.length - 1].skillKey)
        : activeSkills[0];
    const nextChallenge = personalizedDailyChallenge || selectedChallenge || challenges[0];
    const quickChallenge = dailyDuelChallenge || challenges[1] || nextChallenge;
    const dailyQuests = lastReward?.dailyQuests || report?.dailyQuests || [];
    const completedQuests = dailyQuests.filter((quest) => quest.completed).length;
    const questProgress = dailyQuests.length ? Math.round((completedQuests / dailyQuests.length) * 100) : 0;
    const retentionScore = Math.min(100, Math.round((xpProgress * 0.28) + (Math.min(streakDays, 7) / 7 * 34) + (questProgress * 0.22) + (averageScore * 0.16)));
    const weeklyRows = buildWeeklyRows(streakDays, sessionsCount, averageScore);

    return (
        <div className="engagement-dashboard">
            <section className="engagement-hero">
                <div className="engagement-hero__copy">
                    <p className="eyebrow">Današnji plan</p>
                    <h2>Naslednja vaja je pripravljena.</h2>
                    <p>
                        Odpri priporočeni izziv, oddaj odgovor in takoj vidiš, kaj izboljšati. Vse ključne akcije so v prvem pogledu.
                    </p>
                    <div className="engagement-actions">
                        <button type="button" className="primary" onClick={onStartSimulator}>
                            <Icon name="bolt" size={17} />
                            Začni naslednjo vajo
                        </button>
                        <button type="button" className="secondary" onClick={onStartDailyDuel}>
                            <Icon name="trophy" size={17} />
                            Dnevni dvoboj
                        </button>
                        <button type="button" className="secondary" onClick={onOpenSkills}>
                            <Icon name="target" size={17} />
                            Uredi fokus
                        </button>
                    </div>
                </div>

                <div className="engagement-score-card">
                    <div className="engagement-score-ring" style={{ '--score': `${retentionScore}%` }}>
                        <span>{retentionScore}</span>
                        <small>fokus</small>
                    </div>
                    <div>
                        <strong>{user?.name || 'Gost'}</strong>
                        <p>Stopnja {level} · {streakDays} dni niza · {totalStars} zvezdic</p>
                    </div>
                </div>
            </section>

            <section className="engagement-grid">
                <article className="engagement-card engagement-card--primary">
                    <div className="engagement-card__head">
                        <span className="engagement-icon"><Icon name="rocket" /></span>
                        <div>
                            <p className="eyebrow">Naslednja akcija</p>
                            <h3>{nextChallenge?.title || 'Začni prvo vajo'}</h3>
                        </div>
                    </div>
                    <p>{nextChallenge?.scenario || 'Izberi veščino in začni kratko simulacijo. Cilj je manj trenja in hitrejša prva akcija.'}</p>
                    <div className="engagement-card__footer">
                        <span><Icon name="timer" size={15} /> 3–8 min</span>
                        <span><Icon name="star" size={15} /> +XP</span>
                        <button type="button" className="primary" onClick={onStartDailyChallenge}>Odpri</button>
                    </div>
                </article>

                <article className="engagement-card">
                    <div className="engagement-card__head">
                        <span className="engagement-icon"><Icon name="chart" /></span>
                        <div>
                            <p className="eyebrow">Napredek</p>
                            <h3>{currentLevelXp}/{nextLevelXp} XP</h3>
                        </div>
                    </div>
                    <div className="engagement-progress">
                        <span style={{ width: `${xpProgress}%` }} />
                    </div>
                    <p>Še {Math.max(0, nextLevelXp - currentLevelXp)} XP do novega levela.</p>
                </article>

                <article className="engagement-card">
                    <div className="engagement-card__head">
                        <span className="engagement-icon"><Icon name="flame" /></span>
                        <div>
                            <p className="eyebrow">Dnevni loop</p>
                            <h3>{completedQuests}/{dailyQuests.length || 3} nalog</h3>
                        </div>
                    </div>
                    <div className="engagement-progress">
                        <span style={{ width: `${questProgress}%` }} />
                    </div>
                    <p>{questProgress >= 100 ? 'Dnevni loop je zaključen.' : 'Zaključi mini quest in obdrži dnevni ritem.'}</p>
                </article>
            </section>

            <section className="engagement-lower-grid">
                <article className="engagement-panel">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Zagon veščin</p>
                            <h3>Fokus za danes</h3>
                        </div>
                        <button type="button" onClick={onOpenSkills}>Uredi</button>
                    </div>
                    <div className="engagement-skill-list">
                        {activeSkills.slice(0, 5).map((skill, index) => (
                            <div key={skill.key || index} className="engagement-skill-row">
                                <span className="engagement-skill-icon">{skillIcon(skill.key, skill.category)}</span>
                                <div>
                                    <strong>{skill.name}</strong>
                                    <small>{skill.category || 'Fokus'}</small>
                                </div>
                                <span>{skill.estimatedMinutes || 8} min</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="engagement-panel">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Tedenski ritem</p>
                            <h3>Aktivnost</h3>
                        </div>
                        <button type="button" onClick={onOpenReport}>Poročilo</button>
                    </div>
                    <div className="week-strip">
                        {weeklyRows.map((day) => (
                            <span key={day.label} className={day.done ? 'done' : ''}>
                                <Icon name={day.done ? 'check' : 'circle'} size={14} />
                                {day.label}
                            </span>
                        ))}
                    </div>
                    <div className="insight-callout">
                        <Icon name="brain" size={18} />
                        <p>
                            {focusSkill?.name
                                ? `Naslednji najpametnejši fokus: ${focusSkill.name}.`
                                : 'Dodaj fokus, da lahko app priporoča bolj osebne vaje.'}
                        </p>
                    </div>
                </article>

                <AdvancedSkillMatrix report={report} skills={skills} />

                <article className="engagement-panel engagement-panel--arena">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Tekmovanje</p>
                            <h3>Dnevni dvoboj</h3>
                        </div>
                        <button type="button" onClick={onOpenCompetition}>Odpri</button>
                    </div>
                    <div className="arena-preview">
                        <div>
                            <span><Icon name="swords" /></span>
                            <strong>{quickChallenge?.title || 'Bitka veščin'}</strong>
                            <small>Odpri kratek duel in primerjaj rezultat.</small>
                        </div>
                        <button type="button" className="primary" onClick={onOpenCompetition}>Tekmuj</button>
                    </div>
                </article>

                <article className="engagement-panel">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Trenerski vpogled</p>
                            <h3>Kaj trenirati</h3>
                        </div>
                    </div>
                    <div className="dual-insight">
                        <div>
                            <span><Icon name="checkCircle" /></span>
                            <small>Močna točka</small>
                            <strong>{strongestSkill?.name || selectedSkillNames}</strong>
                        </div>
                        <div>
                            <span><Icon name="target" /></span>
                            <small>Izboljšaj</small>
                            <strong>{focusSkill?.name || 'Izberi fokus'}</strong>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
}


function AdvancedSkillMatrix({ report, skills = [] }) {
    const rows = (report?.skillProgress || []).slice(0, 5);
    const skillName = (skillKey) => skills.find((skill) => skill.key === skillKey)?.name || skillKey;
    return (
        <article className="engagement-panel advanced-skill-matrix">
            <div className="engagement-panel__title">
                <div>
                    <p className="eyebrow">Napredna nadzorna plošča</p>
                    <h3>Matrika stanja veščin</h3>
                </div>
            </div>
            {rows.length ? rows.map((row) => (
                <div key={row.skillKey} className="matrix-row">
                    <div>
                        <strong>{skillName(row.skillKey)}</strong>
                        <small>{row.sessions} vaj</small>
                    </div>
                    <div className="matrix-meter"><span style={{ width: `${Math.min(100, row.averageScore || 0)}%` }} /></div>
                    <b>{row.averageScore}/100</b>
                </div>
            )) : (
                <p>Po prvi simulaciji se tukaj prikaže napredna matrika veščin.</p>
            )}
        </article>
    );
}

function buildWeeklyRows(streakDays = 0, sessionsCount = 0, averageScore = 0) {
    const labels = ['P', 'T', 'S', 'Č', 'P', 'S', 'N'];
    const completed = Math.min(7, Math.max(streakDays, sessionsCount > 0 ? Math.ceil(Math.min(7, sessionsCount) / 2) : 0));
    return labels.map((label, index) => ({
        label,
        done: index < completed || (averageScore >= 75 && index < 2)
    }));
}


export function PlayerStatus({ user, report }) {
    const level = user?.level || report?.level || 1;
    const currentLevelXp = user?.currentLevelXp ?? report?.currentLevelXp ?? 0;
    const nextLevelXp = user?.nextLevelXp ?? report?.nextLevelXp ?? 100;
    const progress = Math.min(100, Math.round((currentLevelXp / Math.max(1, nextLevelXp)) * 100));
    const badges = user?.badges || report?.badges || [];

    return (
        <section className="player-status" aria-label="Igralčev napredek">
            <div>
                <p className="eyebrow">SkillBoost profil</p>
                <h2>{user?.name || report?.userName || 'Gost'} · Stopnja {level}</h2>
                <p>Napreduj z dnevno vajo, zberi zvezdice in odklepaj značke kot v učni igri.</p>
            </div>
            <div className="level-progress">
                <div className="level-progress-head"><strong>{currentLevelXp}/{nextLevelXp} XP</strong><span>{progress}%</span></div>
                <div className="progress-bar big"><span style={{ width: `${progress}%` }} /></div>
                <div className="badge-strip">
                    {badges.length ? badges.slice(-4).map((badge) => <span key={badge}>{badge}</span>) : <span>Prva značka čaka nate</span>}
                </div>
            </div>
        </section>
    );
}


export function SelectedSkillsDock({ skills = [], selectedSkillKeys = [], toggleSkillKey, clearSkills, openSkills, startSimulator }) {
    const selectedSkills = skills.filter((skill) => selectedSkillKeys.includes(skill.key));
    const totalMinutes = selectedSkills.reduce((sum, skill) => sum + (skill.estimatedMinutes || 0), 0);

    return (
        <section className={`selected-skills-dock ${selectedSkills.length ? 'has-skills' : 'empty'}`} aria-label="Izbrane veščine">
            <div className="selected-dock-head">
                <span className="selected-dock-icon" aria-hidden="true"><Icon name="target" /></span>
                <div>
                    <strong>Moj trening</strong>
                    <p>{selectedSkills.length ? `${selectedSkills.length} veščin · približno ${totalMinutes || 0} min` : 'Izberi veščine, ki jih želiš vaditi danes.'}</p>
                </div>
            </div>
            <div className="selected-dock-chips">
                {selectedSkills.length ? selectedSkills.map((skill) => (
                    <button key={skill.key} type="button" className="selected-skill-pill" onClick={() => toggleSkillKey(skill.key)} title="Odstrani veščino">
                        <span className="inline-icon-wrap">{skillIcon(skill.key, skill.category)}</span>
                        {skill.name}
                        <b aria-hidden="true"><Icon name="x" size={13} /></b>
                    </button>
                )) : (
                    <span className="selected-empty-pill">Ni izbranih veščin</span>
                )}
            </div>
            <div className="selected-dock-actions">
                <button type="button" className="secondary" onClick={openSkills}>Katalog</button>
                {selectedSkills.length > 0 && <button type="button" className="secondary danger-soft" onClick={clearSkills}>Počisti</button>}
                <button type="button" className="primary" onClick={startSimulator}>Začni vajo</button>
            </div>
        </section>
    );
}

export function DailyQuests({ quests }) {
    const safeQuests = quests?.length ? quests : [
        { id: 'practice-once', label: 'Reši 1 simulacijo danes', completed: false, current: 0, target: 1, rewardText: '+20 XP disciplina' },
        { id: 'strong-answer', label: 'Dosezi vsaj 70/100', completed: false, current: 0, target: 1, rewardText: 'močnejši rezultat' },
        { id: 'multi-skill', label: 'Vadi vsaj 2 veščini hkrati', completed: false, current: 0, target: 2, rewardText: '+5 XP bonus' }
    ];

    return (
        <div className="daily-quests">
            <p className="eyebrow">Dnevni cilji</p>
            <h2>Tabla dnevnih nalog</h2>
            <div className="quest-list">
                {safeQuests.map((quest) => (
                    <div key={quest.id} className={`quest-item ${quest.completed ? 'done' : ''}`}>
                        <span>{quest.completed ? <Icon name="check" size={17} /> : <Icon name="circle" size={15} />}</span>
                        <div>
                            <strong>{quest.label}</strong>
                            <p>{quest.current}/{quest.target} · {quest.rewardText}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MetricCard({ label, value, helper }) {
    return (
        <article className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{helper}</p>
        </article>
    );
}

export function SkillSelector({ skills = [], selectedSkillKeys = [], toggleSkillKey }) {
    const [query, setQuery] = useState('');
    const selectedSkills = skills.filter((skill) => selectedSkillKeys.includes(skill.key));
    const normalizedQuery = query.trim().toLowerCase();
    const filteredSkills = skills.filter((skill) => {
        if (!normalizedQuery) return true;
        return [skill.name, skill.category, skill.description].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });

    return (
        <div className="skill-selector improved-selector">
            <p className="eyebrow">Učni fokus</p>
            <h2>Veščine za trening</h2>
            <p>Dodaj ali odstrani veščine. Izbor ostane viden zgoraj med scrollanjem.</p>

            <div className="selected-mini-panel">
                <div className="selected-mini-head">
                    <strong>Izbrano</strong>
                    <span>{selectedSkills.length}</span>
                </div>
                <div className="selected-mini-chips">
                    {selectedSkills.length ? selectedSkills.map((skill) => (
                        <button key={skill.key} type="button" onClick={() => toggleSkillKey(skill.key)} title="Odstrani iz fokusa">
                            {skill.name}<span aria-hidden="true"><Icon name="x" size={12} /></span>
                        </button>
                    )) : <small>Trenutno ni izbranih veščin.</small>}
                </div>
            </div>

            <label className="skill-search-label">Poišči
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="npr. stres, intervju, meje ..." />
            </label>

            <div className="skill-chip-list selector-scroll-list">
                {filteredSkills.map((skill) => {
                    const selected = selectedSkillKeys.includes(skill.key);
                    return (
                        <button
                            key={skill.id || skill.key}
                            type="button"
                            className={`skill-chip ${selected ? 'selected' : ''}`}
                            onClick={() => toggleSkillKey(skill.key)}
                            aria-pressed={selected}
                        >
                            <span>{selected ? <Icon name="x" size={13} /> : <Icon name="plus" size={14} />}</span>
                            <div>
                                <strong>{skill.name}</strong>
                                <small>{skill.category}</small>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function GrowthFocusPanel({ skills = [], report, preferredSkillKeys = [], togglePreferredSkillKey, personalizedDailyChallenge, dailyChallengeActive, onStartDailyChallenge }) {
    const insights = getGrowthInsights(report, skills);
    const skillName = (skillKey) => skills.find((skill) => skill.key === skillKey)?.name || skillKey;

    return (
        <div className="growth-focus-panel">
            <p className="eyebrow">Personalizacija</p>
            <h2>Moj fokus za izboljšavo</h2>
            <p>Označi veščine, ki jih želiš trenutno izboljševati. Dnevni AI izziv jih uporabi pred samodejnim izborom.</p>
            <div className="skill-chip-list compact">
                {(skills || []).map((skill) => (
                    <button
                        key={skill.id}
                        type="button"
                        className={`skill-chip ${preferredSkillKeys.includes(skill.key) ? 'selected' : ''}`}
                        onClick={() => togglePreferredSkillKey(skill.key)}
                    >
                        <span>{preferredSkillKeys.includes(skill.key) ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}</span>
                        {skill.name}
                    </button>
                ))}
            </div>

            <div className="growth-mini-insights">
                <div>
                    <small>Močno področje</small>
                    <strong>{insights.strengths[0] ? skillName(insights.strengths[0].skillKey) : 'Še zbiramo podatke'}</strong>
                </div>
                <div>
                    <small>Naslednji fokus</small>
                    <strong>{insights.improvements[0] ? skillName(insights.improvements[0].skillKey) : skillName(preferredSkillKeys[0])}</strong>
                </div>
            </div>

            <div className={`daily-double-card ${dailyChallengeActive ? 'active' : ''}`}>
                <span className="double-xp-badge">2x XP</span>
                <strong>{personalizedDailyChallenge?.title || 'Osebno prilagojen dnevni izziv'}</strong>
                <p>{personalizedDailyChallenge?.scenario || 'AI ti izbere izziv glede na izbrane veščine in najšibkejše rezultate.'}</p>
                <button type="button" className="secondary" onClick={onStartDailyChallenge}>
                    {dailyChallengeActive ? 'Dnevni izziv je aktiven' : 'Začni za 2x XP'}
                </button>
            </div>
        </div>
    );
}

export function SimulatorSection({ skills, demoMode, selectedSkillKeys, filteredChallenges, selectedChallengeId, setSelectedChallengeId, selectedChallenge, answer, setAnswer, saving, authenticated, handleSubmitSession, lastSession, lastReward, mentorNote, setMentorNote, handleMentorNote, personalizedDailyChallenge, dailyChallengeActive, setDailyChallengeActive, handleStartDailyChallenge, customSituation, setCustomSituation, competitionMode, competitionOpponent, lastCompetitionResult, onCancelCompetition }) {
    const answerStats = useMemo(() => getAnswerStats(answer), [answer]);
    const selectedSkillNames = skills.filter((skill) => selectedSkillKeys.includes(skill.key)).map((skill) => skill.name);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('');
    const [fileStatus, setFileStatus] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const appendToAnswer = useCallback((text) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        setAnswer((current) => `${current}${current.trim() ? '\n\n' : ''}${cleanText}`);
    }, [setAnswer]);

    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceStatus('Tvoj brskalnik ne podpira glasovnega vnosa. Poskusi Chrome ali Edge.');
            return;
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            setVoiceStatus('Snemanje ustavljeno.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'sl-SI';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceStatus('Poslušam ... govori svoj odgovor.');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;
                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript.trim()) {
                appendToAnswer(finalTranscript);
            }
            if (interimTranscript.trim()) {
                setVoiceStatus(`Slišim: ${interimTranscript.trim()}`);
            }
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            setVoiceStatus(event.error === 'not-allowed'
                ? 'Dovoli uporabo mikrofona v brskalniku.'
                : 'Mikrofon trenutno ni dosegljiv. Poskusi znova.');
        };

        recognition.onend = () => {
            setIsListening(false);
            setVoiceStatus((current) => current.includes('Slišim:') ? 'Glasovni vnos je dodan v odgovor.' : current);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleFilePick = () => {
        fileInputRef.current?.click();
    };

    const handleFilesSelected = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        setFileStatus('Berem datoteke ...');
        const parsedFiles = [];
        const failedFiles = [];

        for (const file of files) {
            try {
                const extractedText = await extractTextFromFile(file);
                if (!extractedText.trim()) {
                    failedFiles.push(`${file.name} (brez berljivega besedila)`);
                    continue;
                }

                const clippedText = extractedText.trim().slice(0, 12000);
                parsedFiles.push({ name: file.name, size: file.size, textLength: extractedText.trim().length });
                appendToAnswer(`[Pripeta datoteka: ${file.name}]\n${clippedText}${extractedText.length > clippedText.length ? '\n... (besedilo je skrajšano)' : ''}\n[/Pripeta datoteka]`);
            } catch (error) {
                failedFiles.push(`${file.name} (${error.message})`);
            }
        }

        if (parsedFiles.length) {
            setAttachedFiles((current) => [...current, ...parsedFiles]);
        }
        setFileStatus([
            parsedFiles.length ? `Dodano: ${parsedFiles.map((file) => file.name).join(', ')}` : '',
            failedFiles.length ? `Ni uspelo prebrati: ${failedFiles.join(', ')}` : ''
        ].filter(Boolean).join(' · '));
        event.target.value = '';
    };

    return (
        <div className="content-section">
            <div className="section-title">
                <div>
                    <span>Interaktivna simulacija</span>
                    <small>AI ocenjevanje z več veščinami</small>
                </div>
                <span className="pill">{selectedSkillNames.length} izbranih</span>
            </div>

            <DailyPersonalizedChallengeCard
                challenge={personalizedDailyChallenge}
                active={dailyChallengeActive}
                onStart={handleStartDailyChallenge}
                onCancel={() => setDailyChallengeActive(false)}
                selectedSkillNames={selectedSkillNames}
            />

            {competitionMode && (
                <CompetitionModeBanner
                    mode={competitionMode}
                    challenge={selectedChallenge}
                    opponent={competitionOpponent}
                    onCancel={onCancelCompetition}
                />
            )}

            <form className="simulation-form" onSubmit={handleSubmitSession}>
                <label>Scenarij
                    <StyledSelect
                        value={selectedChallengeId}
                        label="Izberi scenarij"
                        onChange={setSelectedChallengeId}
                        options={(filteredChallenges || []).map((challenge) => ({ value: challenge.id, label: challenge.title }))}
                    />
                </label>

                {selectedChallenge && (
                    <article className="challenge-card">
                        <div>
                            <p>{selectedChallenge.skillKey}</p>
                            <h3>{selectedChallenge.title}</h3>
                            <p>{selectedChallenge.scenario}</p>
                            <div className="mini-list">
                                {(selectedChallenge.evaluationCriteria || []).map((criterion) => <span key={criterion}>{criterion}</span>)}
                            </div>
                        </div>
                        <span>{selectedChallenge.estimatedMinutes} min</span>
                    </article>
                )}

                <label className="custom-situation-card">Moja situacija za izboljšavo
                    <textarea
                        rows="4"
                        value={customSituation}
                        onChange={(e) => setCustomSituation(e.target.value)}
                        placeholder="Npr. Šef mi je zavrnil idejo na sestanku in želim vaditi, kako mirno odgovoriti. Če pustiš prazno, AI uporabi izbran scenarij."
                    />
                    <small>AI bo povratno informacijo prilagodil tvoji realni situaciji, izziv pa še vedno uporabi za merila ocenjevanja.</small>
                </label>

                <div className="coach-box">
                    <div>
                        <strong>AI namig pred oddajo</strong>
                        <p>{answerStats.tip}</p>
                    </div>
                    <div className="quality-meter" aria-label="Kakovost osnutka">
                        <span style={{ width: `${answerStats.percent}%` }} />
                    </div>
                    <div className="quick-actions">
                        {['Dodaj konkreten primer', 'Zapiši naslednji korak', 'Pokaži empatijo', 'Zaključi z vprašanjem'].map((hint) => (
                            <button key={hint} type="button" onClick={() => setAnswer(`${answer}${answer ? '\n' : ''}${hint}: `)}>{hint}</button>
                        ))}
                    </div>
                </div>

                <label>Tvoj odgovor
                    <div className="answer-composer">
                           <textarea
                            rows="9"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Napiši ali povej, kaj bi rekel v situaciji. Lahko pripneš tudi datoteko, ki jo AI upošteva pri odgovoru."
                        />
                        <div className="composer-toolbar" aria-label="Orodja za odgovor">
                            <button
                                type="button"
                                className={`composer-icon-button mic-button ${isListening ? 'recording' : ''}`}
                                onClick={handleVoiceToggle}
                                aria-pressed={isListening}
                                title="Odgovori z mikrofonom"
                            >
                                <Icon name="microphone" size={18} />
                                {isListening ? 'Ustavi' : 'Mikrofon'}
                            </button>
                            <button
                                type="button"
                                className="composer-icon-button attach-button"
                                onClick={handleFilePick}
                                title="Dodaj datoteko"
                            >
                                <span aria-hidden="true">+</span>
                                Datoteka
                            </button>
                            <input
                                ref={fileInputRef}
                                className="visually-hidden"
                                type="file"
                                multiple
                                accept=".docx,.txt,.md,.csv,.json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/json"
                                onChange={handleFilesSelected}
                            />
                        </div>
                    </div>
                </label>

                {saving && (
                    <AiThinkingCard
                        answerStats={answerStats}
                        selectedSkillNames={selectedSkillNames}
                        selectedChallenge={selectedChallenge}
                    />
                )}

                <button className={`primary submit-button ${saving ? 'is-loading' : ''}`} disabled={saving || (!authenticated && !demoMode)}>
                    {saving ? (
                        <>
                            <span className="button-spinner" aria-hidden="true" />
                            AI trener pripravlja odgovor...
                        </>
                    ) : authenticated || demoMode ? 'Oddaj in prejmi AI povratno informacijo' : 'Za ocenjevanje se moraš prijaviti'}
                </button>
            </form>

            {lastSession && !saving && <FeedbackCard lastSession={lastSession} reward={lastReward} mentorNote={mentorNote} setMentorNote={setMentorNote} authenticated={authenticated} handleMentorNote={handleMentorNote} />}
            {lastCompetitionResult && !saving && <CompetitionResultCard result={lastCompetitionResult} />}
        </div>
    );
}


function CompetitionModeBanner({ mode, challenge, opponent, onCancel }) {
    const isDaily = mode === 'daily-duel';
    return (
        <article className={`competition-mode-banner ${isDaily ? 'daily' : 'battle'}`}>
            <div className="competition-mode-icon" aria-hidden="true"><Icon name={isDaily ? 'trophy' : 'swords'} /></div>
            <div>
                <p className="eyebrow">{isDaily ? 'Dnevni dvoboj je aktiven' : 'Bitka veščin je aktivna'}</p>
                <h3>{challenge?.title || 'Tekmovalni izziv'}</h3>
                <p>
                    {isDaily
                        ? 'Vsi uporabniki danes rešujejo isti izziv. Po oddaji vidiš svojo pozicijo na dnevni lestvici.'
                        : `Tekmuješ proti ${opponent?.name || 'SkillBot tekmecu'}. Po oddaji primerjamo score in razglasimo rezultat.`}
                </p>
            </div>
            <button type="button" className="secondary" onClick={onCancel}>Prekliči tekmovanje</button>
        </article>
    );
}

function CompetitionResultCard({ result }) {
    if (!result) return null;
    const resultLabel = result.mode === 'daily-duel'
        ? `Tvoje mesto: #${result.userRank}`
        : result.result === 'win' ? 'Zmaga' : result.result === 'loss' ? 'Ponovni dvoboj priložnost' : 'Izenačeno';

    return (
        <article className={`competition-result-card ${result.result || 'daily'}`}>
            <div className="section-title compact-title">
                <div>
                    <span>{result.title}</span>
                    <small>{result.challengeTitle}</small>
                </div>
                <span className="pill">{resultLabel}</span>
            </div>
            <p>{result.message}</p>
            {result.mode === 'skill-battle' && (
                <div className="battle-score-row">
                    <div>
                        <small>{result.userName}</small>
                        <strong>{result.userScore}</strong>
                    </div>
                    <span>PROTI</span>
                    <div>
                        <small>{result.opponentName}</small>
                        <strong>{result.opponentScore}</strong>
                    </div>
                </div>
            )}
            <CompetitionLeaderboard entries={result.leaderboard || []} highlightName={result.userName || 'Ti'} />
        </article>
    );
}

function CompetitionLeaderboard({ entries = [], highlightName }) {
    return (
        <div className="competition-leaderboard-list">
            {entries.map((entry) => {
                const displayRank = entry.mesto ?? entry.rank;
                const avatarConfig = entry.avatarConfig || fallbackAvatarConfig(displayRank || 0);
                return (
                    <div key={`${entry.userId}-${displayRank}`} className={`competition-leaderboard-row ${entry.name === highlightName || entry.userId === 'demo-user' ? 'me' : ''}`}>
                        <span className="rank">#{displayRank}</span>
                        <span className="avatar avatar--model avatar--leaderboard"><AvatarMini config={avatarConfig} /></span>
                        <strong>{entry.name}</strong>
                        <span>{entry.score}/100</span>
                    </div>
                );
            })}
        </div>
    );
}

function DailyPersonalizedChallengeCard({ challenge, active, onStart, onCancel, selectedSkillNames }) {
    return (
        <article className={`personalized-challenge-card ${active ? 'active' : ''}`}>
            <div className="personalized-challenge-icon" aria-hidden="true"><Icon name="bolt" /></div>
            <div>
                <p className="eyebrow">Dnevni personaliziran izziv</p>
                <h3>{challenge?.title || 'AI izbere najboljši trening za danes'}</h3>
                <p>{challenge?.scenario || 'Izberi fokus veščine na levi strani in začni dnevni izziv za dvojni XP.'}</p>
                <div className="mini-list">
                    <span>2x XP danes</span>
                    <span>{selectedSkillNames.length ? selectedSkillNames.join(' + ') : 'personaliziran fokus'}</span>
                    {active && <span>aktivno</span>}
                </div>
            </div>
            <div className="personalized-actions">
                <button type="button" className="primary" onClick={onStart}>
                    {active ? 'Ponovno izberi' : 'Začni dnevni izziv'}
                </button>
                {active && <button type="button" className="secondary" onClick={onCancel}>Izklopi 2x XP</button>}
            </div>
        </article>
    );
}


function FileIcon() {
    return (
        <svg className="attachment-svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 3h7l4 4v14H7V3Z" />
            <path d="M14 3v5h4" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
        </svg>
    );
}

function AiThinkingCard({ answerStats, selectedSkillNames, selectedChallenge }) {
    const steps = [
        'Berem tvoj odgovor',
        'Preverjam jasnost in strukturo',
        'Iščem empatijo in konkreten primer',
        'Sestavljam boljšo verzijo odgovora'
    ];
    const [activeStep, setActiveStep] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveStep((current) => (current + 1) % steps.length);
            setSeconds((current) => current + 1);
        }, 1200);

        return () => window.clearInterval(interval);
    }, [steps.length]);

    const signalItems = [
        { label: 'Dolžina', done: answerStats.words >= 25 },
        { label: 'Empatija', done: answerStats.percent >= 45 },
        { label: 'Akcijski korak', done: answerStats.percent >= 70 }
    ];

    return (
        <article className="ai-thinking-card" aria-live="polite">
            <div className="ai-thinking-orb" aria-hidden="true">AI</div>
            <div className="ai-thinking-main">
                <div className="ai-thinking-head">
                    <div>
                        <strong>AI trener analizira odgovor</strong>
                        <p>{steps[activeStep]} · {seconds}s</p>
                    </div>
                    <span>{Math.max(20, answerStats.percent)}%</span>
                </div>

                <div className="ai-thinking-progress">
                    <span style={{ width: `${Math.max(22, Math.min(96, answerStats.percent + activeStep * 6))}%` }} />
                </div>

                <div className="ai-thinking-grid">
                    <div>
                        <small>Scenarij</small>
                        <p>{selectedChallenge?.title || 'Izbran izziv'}</p>
                    </div>
                    <div>
                        <small>Veščine</small>
                        <p>{selectedSkillNames.join(', ') || 'mehke veščine'}</p>
                    </div>
                    <div>
                        <small>Osnutek</small>
                        <p>{answerStats.words} besed</p>
                    </div>
                </div>

                <div className="ai-signal-row">
                    {signalItems.map((item) => (
                        <span key={item.label} className={item.done ? 'done' : ''}>
                            <Icon name={item.done ? 'checkCircle' : 'circle'} size={14} /> {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
}

function FeedbackCard({ lastSession, reward, mentorNote, setMentorNote, authenticated, handleMentorNote }) {
    const scoreMeta = scoreLabels.find((item) => lastSession.score >= item.min) || scoreLabels.at(-1);
    const stars = reward?.earnedStars ?? lastSession.earnedStars ?? scoreToStars(lastSession.score);
    return (
        <article className={`feedback-card ${scoreMeta.tone}`}>
            <div className="score-circle" style={{ '--score': lastSession.score }}>
                <strong>{lastSession.score}</strong>
                <span>{scoreMeta.label}</span>
            </div>
            <div className="feedback-content">
                {reward && (
                    <div className="reward-banner">
                        <div className="stars" aria-label={`${stars} zvezdice`}>{renderStars(stars)}</div>
                        <strong>+{reward.earnedXp} XP</strong>
                        <span><Icon name="flame" size={15} /> {reward.streakDays} dni</span>
                        {reward.leveledUp && <span>Nova stopnja: {reward.oldLevel} <Icon name="arrowRight" size={15} /> {reward.newLevel}</span>}
                    </div>
                )}
                <div className="section-title compact-title">
                    <span>AI povratna informacija</span>
                    <small>hitro razdeljeno na pohvalo, izboljšavo, primer in naslednje vprašanje</small>
                </div>
                <StructuredScorePanel scores={lastSession.structuredScores} />
                <FeedbackSections text={lastSession.aiFeedback} score={lastSession.score} />
                <FeedbackInsightSummary text={lastSession.aiFeedback} score={lastSession.score} dailyDoubleXp={lastSession.dailyDoubleXp} />
                {reward?.newBadges?.length > 0 && <div className="new-badges">{reward.newBadges.map((badge) => <span key={badge}><Icon name="medal" size={15} /> {badge}</span>)}</div>}
                {lastSession.mentorNote && <p className="mentor-note"><strong>Mentor:</strong> {lastSession.mentorNote}</p>}
                <div className="mentor-row">
                    <input placeholder="Dodaj mentorjev komentar ali naslednjo nalogo" value={mentorNote} onChange={(e) => setMentorNote(e.target.value)} />
                    <button className="secondary" type="button" disabled={!authenticated} onClick={handleMentorNote}>Shrani opombo</button>
                </div>
            </div>
        </article>
    );
}


function StructuredScorePanel({ scores }) {
    const labels = {
        clarity: 'Jasnost',
        empathy: 'Empatija',
        structure: 'Struktura',
        impact: 'Učinek',
        confidence: 'Samozavest'
    };
    const entries = Object.entries(scores || {});
    if (!entries.length) return null;
    return (
        <section className="structured-score-panel">
            <div className="section-title compact-title">
                <span>Strukturirano AI ocenjevanje</span>
                <small>5 meril, ki jih lahko mentor in dashboard spremljata skozi čas</small>
            </div>
            <div className="structured-score-grid">
                {entries.map(([key, value]) => (
                    <div key={key} className="structured-score-item">
                        <div>
                            <strong>{labels[key] || key}</strong>
                            <span>{value}/100</span>
                        </div>
                        <div className="progress-bar"><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function FeedbackInsightSummary({ text, score, dailyDoubleXp }) {
    const sections = parseFeedbackSections(text, score);
    const good = sections.find((section) => section.key === 'good');
    const improve = sections.find((section) => section.key === 'improve');

    return (
        <div className="feedback-insight-summary">
            <div className="insight-tile positive">
                <span>Močna točka</span>
                <strong>{good?.lines?.[0] || 'Jasnost in pripravljenost na izboljšavo.'}</strong>
            </div>
            <div className="insight-tile focus">
                <span>Naslednji fokus</span>
                <strong>{improve?.lines?.[0] || 'Dodaj konkreten naslednji korak.'}</strong>
            </div>
            {dailyDoubleXp && (
                <div className="insight-tile bonus">
                    <span>Bonus</span>
                    <strong>Osebno prilagojen dnevni izziv je podvojil XP.</strong>
                </div>
            )}
        </div>
    );
}

function FeedbackSections({ text, score }) {
    const sections = parseFeedbackSections(text, score);

    return (
        <div className="feedback-sections">
            {sections.map((section) => (
                <section key={section.key} className={`feedback-section ${section.key}`}>
                    <div className="feedback-section-icon" aria-hidden="true"><Icon name={section.icon} /></div>
                    <div>
                        <h3>{section.title}</h3>
                        {section.lines.map((line, index) => <p key={`${section.key}-${index}`}>{line}</p>)}
                    </div>
                </section>
            ))}
        </div>
    );
}

export function SkillsSection({ skills = [], challenges = [], selectedSkillKeys, toggleSkillKey, setSelectedSkillKey, setSelectedSkillKeys, setSelectedChallengeId, openSimulator }) {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Vse');
    const [activeLevel, setActiveLevel] = useState('VSE');
    const [expandedSkillKey, setExpandedSkillKey] = useState(selectedSkillKeys[0] || skills[0]?.key || '');

    const categories = useMemo(() => ['Vse', ...Array.from(new Set((skills || []).map((skill) => skill.category).filter(Boolean)))], [skills]);
   const normalizeFilterValue = (value = '') =>
    String(value)
        .trim()
        .toUpperCase();

    const levels = useMemo(() => [
    'VSE',
    ...Array.from(new Set((skills || []).map((skill) => normalizeFilterValue(skill.level)).filter(Boolean)))
    ], [skills]);

    const groupedSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedActiveLevel = normalizeFilterValue(activeLevel);

    return (skills || [])
        .filter((skill) => activeCategory === 'Vse' || skill.category === activeCategory)
        .filter((skill) => normalizedActiveLevel === 'VSE' || normalizeFilterValue(skill.level) === normalizedActiveLevel)
            .filter((skill) => {
                if (!normalizedQuery) return true;
                const haystack = [skill.name, skill.category, skill.description, ...(skill.outcomes || [])].join(' ').toLowerCase();
                return haystack.includes(normalizedQuery);
            })
            .reduce((groups, skill) => {
                const category = skill.category || 'Ostalo';
                groups[category] = [...(groups[category] || []), skill];
                return groups;
            }, {});
    }, [skills, query, activeCategory, activeLevel]);

    const expandedSkill = skills.find((skill) => skill.key === expandedSkillKey) || skills.find((skill) => selectedSkillKeys.includes(skill.key)) || skills[0];
    const expandedChallenges = challenges.filter((challenge) => challenge.skillKey === expandedSkill?.key);
    const selectedCatalogSkills = skills.filter((skill) => selectedSkillKeys.includes(skill.key));
    const selectedMinutes = selectedCatalogSkills.reduce((sum, skill) => sum + (skill.estimatedMinutes || 0), 0);
    const categoryEntries = Object.entries(groupedSkills);

    const startChallenge = (challenge, skill) => {
        setSelectedSkillKey(skill.key);
        setSelectedSkillKeys((current) => current.includes(skill.key) ? current : [...current, skill.key]);
        setSelectedChallengeId(challenge.id);
        openSimulator();
    };

    const applyPreset = (keys) => {
        const availableKeys = keys.filter((key) => skills.some((skill) => skill.key === key));
        if (!availableKeys.length) return;
        setSelectedSkillKeys(availableKeys);
        setSelectedSkillKey(availableKeys[0]);
        const firstChallenge = challenges.find((challenge) => challenge.skillKey === availableKeys[0]);
        if (firstChallenge) setSelectedChallengeId(firstChallenge.id);
        setExpandedSkillKey(availableKeys[0]);
    };

    return (
        <div className="content-section skill-catalog-section">
            <div className="section-title">
                <div>
                    <span>Katalog življenjskih veščin</span>
                    <small>{skills.length} normalnih veščin iz vsakdanjega življenja, dela, odnosov in osebnega razvoja</small>
                </div>
                <span className="pill">{selectedSkillKeys.length} izbranih · {selectedMinutes || 0} min</span>
            </div>

            <div className="catalog-hero-card">
                <div>
                    <p className="eyebrow">Interaktivni izbor</p>
                    <h3>Sestavi svoj trening kot playlisto.</h3>
                    <p>Filtriraj področja, izberi veščine, odpri konkretne izzive in skoči direktno v simulator. Izbrane veščine vplivajo tudi na personaliziran dnevni izziv.</p>
                </div>
                <div className="catalog-stats">
                    <span><strong>{categories.length - 1}</strong> sekcij</span>
                    <span><strong>{challenges.length}</strong> izzivov</span>
                    <span><strong>2x</strong> XP daily</span>
                </div>
            </div>

            <SkillPlaylistBar
                selectedSkills={selectedCatalogSkills}
                totalMinutes={selectedMinutes}
                toggleSkillKey={toggleSkillKey}
                clearSkills={() => setSelectedSkillKeys([])}
                openSimulator={openSimulator}
            />

            <div className="catalog-toolbar">
                <label className="catalog-search">Poišči veščino
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="npr. stres, pogajanje, poslušanje, samozavest ..." />
                </label>
                <label>Težavnost
                    <StyledSelect
                        value={activeLevel}
                        label="Izberi težavnost"
                        onChange={setActiveLevel}
                        options={levels.map((level) => ({ value: level, label: level === 'VSE' ? 'Vse težavnosti' : level }))}
                    />
                </label>
            </div>

            <div className="catalog-category-tabs" aria-label="Sekcije veščin">
                {categories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        className={activeCategory === category ? 'active' : ''}
                        onClick={() => setActiveCategory(category)}
                    >
                        <span>{categoryIcon(category)}</span>
                        {category}
                    </button>
                ))}
            </div>

            <div className="catalog-presets">
                {catalogPresets.map((preset) => (
                    <button key={preset.label} type="button" className="catalog-preset" onClick={() => applyPreset(preset.keys)}>
                        <span><Icon name={preset.icon} /></span>
                        <strong>{preset.label}</strong>
                        <small>{preset.helper}</small>
                    </button>
                ))}
            </div>

            <div className="catalog-layout">
                <div className="catalog-groups">
                    {categoryEntries.length ? categoryEntries.map(([category, items]) => (
                        <section key={category} className="catalog-group">
                            <div className="catalog-group-head">
                                <h3><span>{categoryIcon(category)}</span>{category}</h3>
                                <small>{items.length} veščin</small>
                            </div>
                            <div className="catalog-card-grid">
                                {items.map((skill) => {
                                    const selected = selectedSkillKeys.includes(skill.key);
                                    const skillChallenges = challenges.filter((challenge) => challenge.skillKey === skill.key);
                                    return (
                                        <article key={skill.id || skill.key} className={`skill-card catalog-skill-card ${selected ? 'selected' : ''} ${expandedSkill?.key === skill.key ? 'expanded' : ''}`}>
                                            <button type="button" className="catalog-card-open" onClick={() => setExpandedSkillKey(skill.key)}>
                                                <span className="skill-emoji" aria-hidden="true">{skillIcon(skill.key, skill.category)}</span>
                                                <div>
                                                    <p>{skill.category}</p>
                                                    <h3>{skill.name}</h3>
                                                </div>
                                            </button>
                                            <p>{skill.description}</p>
                                            <div className="catalog-meta-row">
                                                <span>{skill.level}</span>
                                                <span>{skill.estimatedMinutes} min</span>
                                                <span>{skillChallenges.length} izziv</span>
                                            </div>
                                            <div className="mini-list">{(skill.outcomes || []).slice(0, 3).map((outcome) => <span key={outcome}>{outcome}</span>)}</div>
                                            <div className="catalog-card-actions">
                                                <button type="button" className={selected ? 'primary' : 'secondary'} onClick={() => toggleSkillKey(skill.key)}>
                                                    {selected ? 'Odstrani' : 'Dodaj v fokus'}
                                                </button>
                                                {skillChallenges[0] && (
                                                    <button type="button" className="secondary" onClick={() => startChallenge(skillChallenges[0], skill)}>
                                                        Začni vajo
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )) : (
                        <div className="empty-state">Ni najdenih veščin. Poskusi drug iskalni niz ali resetiraj filter.</div>
                    )}
                </div>

                <aside className="catalog-detail-panel">
                    {expandedSkill ? (
                        <>
                            <div className="catalog-detail-head">
                                <span className="skill-emoji large" aria-hidden="true">{skillIcon(expandedSkill.key, expandedSkill.category)}</span>
                                <div>
                                    <p className="eyebrow">Izbrana veščina</p>
                                    <h3>{expandedSkill.name}</h3>
                                    <small>{expandedSkill.category} · {expandedSkill.level} · {expandedSkill.estimatedMinutes} min</small>
                                </div>
                            </div>
                            <p>{expandedSkill.description}</p>
                            <div className="catalog-outcome-list">
                                {(expandedSkill.outcomes || []).map((outcome) => <span key={outcome}><Icon name="check" size={14} /> {outcome}</span>)}
                            </div>
                            <button type="button" className={selectedSkillKeys.includes(expandedSkill.key) ? 'primary' : 'secondary'} onClick={() => toggleSkillKey(expandedSkill.key)}>
                                {selectedSkillKeys.includes(expandedSkill.key) ? 'Odstrani iz fokusa' : 'Dodaj v moj fokus'}
                            </button>

                            <div className="catalog-detail-challenges">
                                <h4>Vaje za to veščino</h4>
                                {expandedChallenges.length ? expandedChallenges.map((challenge) => (
                                    <article key={challenge.id}>
                                        <strong>{challenge.title}</strong>
                                        <p>{challenge.scenario}</p>
                                        <div className="mini-list">{(challenge.evaluationCriteria || []).slice(0, 4).map((criterion) => <span key={criterion}>{criterion}</span>)}</div>
                                        <button type="button" className="primary" onClick={() => startChallenge(challenge, expandedSkill)}>Odpri v simulatorju</button>
                                    </article>
                                )) : <p>Za to veščino še ni vaje.</p>}
                            </div>
                        </>
                    ) : <p>Izberi veščino za podrobnosti.</p>}
                </aside>
            </div>
        </div>
    );
}


function SkillPlaylistBar({ selectedSkills = [], totalMinutes = 0, toggleSkillKey, clearSkills, openSimulator }) {
    return (
        <section className={`skill-playlist-bar ${selectedSkills.length ? 'filled' : 'empty'}`} aria-label="Aktivna playlist veščin">
            <div className="playlist-copy">
                <span aria-hidden="true"><Icon name="gamepad" /></span>
                <div>
                    <strong>{selectedSkills.length ? 'Aktiven seznam veščin' : 'Playlist je prazna'}</strong>
                    <p>{selectedSkills.length ? `${selectedSkills.length} veščin · ${totalMinutes || 0} min treninga` : 'Klikni Dodaj v fokus pri veščinah spodaj.'}</p>
                </div>
            </div>
            <div className="playlist-chip-row">
                {selectedSkills.length ? selectedSkills.map((skill) => (
                    <button key={skill.key} type="button" onClick={() => toggleSkillKey(skill.key)} title="Odstrani veščino">
                        <span className="inline-icon-wrap">{skillIcon(skill.key, skill.category)}</span>
                        {skill.name}
                        <b aria-hidden="true"><Icon name="x" size={13} /></b>
                    </button>
                )) : <span>Izberi vsaj eno veščino za personaliziran trening.</span>}
            </div>
            <div className="playlist-actions">
                {selectedSkills.length > 0 && <button type="button" className="secondary danger-soft" onClick={clearSkills}>Počisti izbor</button>}
                <button type="button" className="primary" onClick={openSimulator}>Začni z izbranimi</button>
            </div>
        </section>
    );
}

const catalogPresets = [
    { icon: 'briefcase', label: 'Karierni boost', helper: 'razgovor, pogajanje, nastop', keys: ['job-interview', 'negotiation', 'public-speaking'] },
    { icon: 'handshake', label: 'Boljši odnosi', helper: 'empatija, meje, konflikti', keys: ['empatija', 'boundaries', 'conflict-resolution'] },
    { icon: 'target', label: 'Fokus in disciplina', helper: 'čas, prioritete, fokus', keys: ['time-management', 'prioritization', 'focus-discipline'] },
    { icon: 'brain', label: 'Mir pod pritiskom', helper: 'stres, čustva, odpornost', keys: ['stress-management', 'emotional-regulation', 'resilience'] }
];

function categoryIconName(category = '') {
    if (category.includes('Komunikacija')) return 'message';
    if (category.includes('Odnosi')) return 'handshake';
    if (category.includes('Kariera')) return 'briefcase';
    if (category.includes('Osebna')) return 'target';
    if (category.includes('Čustvena')) return 'brain';
    if (category.includes('Vsakdanje')) return 'sprout';
    return 'sparkles';
}

function categoryIcon(category = '') {
    return <Icon name={categoryIconName(category)} />;
}

function skillIconName(key = '', category = '') {
    const map = {
        'public-speaking': 'microphone',
        'active-listening': 'ear',
        'clear-writing': 'pen',
        'feedback-giving': 'note',
        'conflict-resolution': 'fireExtinguisher',
        empathy: 'heart',
        boundaries: 'shield',
        networking: 'globe',
        'job-interview': 'userTie',
        negotiation: 'scale',
        'leadership-basics': 'compass',
        'meeting-facilitation': 'clipboard',
        'time-management': 'timer',
        prioritization: 'pin',
        'decision-making': 'puzzle',
        'focus-discipline': 'headphones',
        'stress-management': 'breath',
        'emotional-regulation': 'wave',
        'self-confidence': 'dumbbell',
        resilience: 'sunrise',
        'personal-finance': 'coins',
        'asking-for-help': 'help',
        'difficult-conversations': 'speech',
        'digital-communication': 'laptop'
    };
    return map[key] || categoryIconName(category);
}

function skillIcon(key = '', category = '') {
    return <Icon name={skillIconName(key, category)} />;
}


const DUEL_MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
const DUEL_ANIMATION_MODELS = {
    waiting: '/duel-models/walking.glb',
    loading: '/duel-models/running.glb',
    attack: '/duel-models/attack.glb',
    block: '/duel-models/block.glb',
    dodge: '/duel-models/dodge.glb',
    celebrate: '/duel-models/funnydance.glb',
    idle: '/duel-models/boxing.glb',
    hit: '/duel-models/hit.glb'
};

const DUEL_MODEL_CAMERA = {
    target: '0m 0.88m 0m',
    orbit: '8deg 76deg 4.55m',
    compactOrbit: '8deg 76deg 4.05m',
    fov: '39deg',
    compactFov: '42deg'
};

function useDuelModelViewerReady() {
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
        script.src = DUEL_MODEL_VIEWER_SRC;
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

function DuelAnimatedModel({ action = 'idle', name, side = 'player', compact = false, avatarConfig }) {
    const viewerReady = useDuelModelViewerReady();
    const src = DUEL_ANIMATION_MODELS[action] || DUEL_ANIMATION_MODELS.idle;
    const viewerRef = useRef(null);
    const avatar = useMemo(() => normalizeAvatar(avatarConfig), [avatarConfig]);
    const palette = accentPalettes[avatar.accent] || accentPalettes.violet;
    const energy = avatar.energy || 'balanced';

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !viewerReady) return undefined;

        let raf = 0;
        const timeouts = [];
        const applyTint = () => {
            raf = window.requestAnimationFrame?.(() => applySkillBoostMaterialTint(viewer, palette, energy)) || 0;
        };

        applyTint();
        [80, 220, 520].forEach((delay) => {
            timeouts.push(window.setTimeout(applyTint, delay));
        });

        viewer.addEventListener?.('load', applyTint);
        viewer.addEventListener?.('model-visibility', applyTint);

        return () => {
            viewer.removeEventListener?.('load', applyTint);
            viewer.removeEventListener?.('model-visibility', applyTint);
            timeouts.forEach((timeout) => window.clearTimeout(timeout));
            if (raf) window.cancelAnimationFrame?.(raf);
        };
    }, [viewerReady, src, palette.materialBase, palette.materialMid, palette.materialAccent, palette.materialDark, palette.cyan, palette.purple, energy]);

    return (
        <div
            className={`duel-model duel-model--${side} duel-model--${action} ${compact ? 'compact' : ''}`}
            style={{
                '--shard-main': palette.main,
                '--shard-blue': palette.blue,
                '--shard-cyan': palette.cyan,
                '--shard-purple': palette.purple,
                '--shard-pale': palette.pale
            }}
        >
            <div className="duel-model__glow" />
            {viewerReady ? (
                <model-viewer
                    ref={viewerRef}
                    key={`${side}-${action}-${src}-${avatar.accent}-${energy}`}
                    src={src}
                    alt={`${name || 'Player'} animation`}
                    camera-orbit={compact ? DUEL_MODEL_CAMERA.compactOrbit : DUEL_MODEL_CAMERA.orbit}
                    camera-target={DUEL_MODEL_CAMERA.target}
                    field-of-view={compact ? DUEL_MODEL_CAMERA.compactFov : DUEL_MODEL_CAMERA.fov}
                    min-camera-orbit="auto auto 3.4m"
                    max-camera-orbit="auto auto 6.8m"
                    exposure="1.04"
                    shadow-intensity="0.82"
                    shadow-softness="0.95"
                    environment-image="legacy"
                    interaction-prompt="none"
                    loading="eager"
                    reveal="auto"
                    autoplay
                    disable-pan
                />
            ) : (
                <div className="duel-model__fallback">
                    <Icon name="swords" size={18} />
                    <span>{action}</span>
                </div>
            )}
            <span className="duel-model__name">{name}</span>
        </div>
    );
}

function buildDuelRounds(challenge) {
    const scenario = challenge?.scenario || 'Odgovori profesionalno, strukturirano in z empatijo.';
    return [
        {
            id: 'opening',
            label: 'Runda 1',
            title: 'Uvodna poteza',
            focus: 'Jasnost in ton',
            prompt: `${scenario}

Napiši uvodni odgovor, ki hitro postavi miren in profesionalen ton.`
        },
        {
            id: 'pressure',
            label: 'Runda 2',
            title: 'Runda pod pritiskom',
            focus: 'Empatija in zbranost',
            prompt: `${scenario}

Druga oseba se brani. Odgovori tako, da pokažeš empatijo, a vseeno ohraniš smer pogovora.`
        },
        {
            id: 'closing',
            label: 'Runda 3',
            title: 'Močan zaključek',
            focus: 'Uporabnost',
            prompt: `${scenario}

Zaključi z jasnim naslednjim korakom in kratkim povzetkom dogovora.`
        }
    ];
}

const DUEL_ROUND_SECONDS = 90;
const DUEL_WAITING_MS = 900;
const DUEL_INTRO_MS = 1200;
const DUEL_JUDGING_MS = 1900;

function evaluateDuelRound({ answer, round, challenge, opponent, timeRemaining = 0, forcedTimeout = false }) {
    const clean = String(answer || '').trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    const sentenceCount = (clean.match(/[.!?]/g) || []).length;
    const criteria = challenge?.evaluationCriteria || [];
    const empathyHit = /(razumem|hvala|cenim|skupaj|lahko|predlagam|help|support|appreciate|strinjam)/i.test(clean);
    const actionHit = /(predlagam|naslednji korak|rok|let's|next step|dogovorimo|lahko naredimo|plan|korak)/i.test(clean);
    const structureHit = /\n|1\.|2\.|3\.|:|- /.test(clean);
    const tonePenalty = /(kriv|napaka je tvoja|vedno|nikoli|nimaš prav|stupid|bad)/i.test(clean) ? 8 : 0;

    const clarityScore = Math.min(25, Math.round(8 + Math.min(17, words * 0.28) + Math.min(4, sentenceCount)));
    const empathyScore = Math.min(25, Math.round(9 + (empathyHit ? 11 : 2) + (round === 2 ? 3 : 0)));
    const structureScore = Math.min(20, Math.round(7 + (structureHit ? 8 : 3) + Math.min(5, sentenceCount)));
    const toneScore = Math.max(0, Math.min(20, Math.round(13 + (empathyHit ? 4 : 0) - tonePenalty)));
    const actionabilityScore = Math.min(10, Math.round(2 + (actionHit ? 6 : 0) + (round === 3 ? 2 : 0)));
    const speedBonus = forcedTimeout ? 0 : Math.min(5, Math.round((timeRemaining / DUEL_ROUND_SECONDS) * 5));
    const criteriaBonus = Math.min(4, criteria.length ? 2 : 0);
    const shortPenalty = words < 18 ? 9 : words < 35 ? 4 : 0;
    const offTopicPenalty = clean.length < 20 ? 18 : 0;

    const base = clarityScore + empathyScore + structureScore + toneScore + actionabilityScore;
    const playerScore = Math.max(35, Math.min(100, Math.round(base + speedBonus + criteriaBonus - shortPenalty - offTopicPenalty)));
    const rivalBase = buildPreviewScore(opponent, challenge, 'skill-battle');
    const opponentScore = Math.max(52, Math.min(97, rivalBase - 8 + (round * 4) + ((String(opponent?.name || 'rival').length + round) % 9)));
    const winner = playerScore >= opponentScore ? 'player' : 'opponent';
    const loserMove = round % 2 === 0 ? 'block' : 'dodge';
    const reason = winner === 'player'
        ? 'Tvoj odgovor je bil bolj jasen, miren in uporaben za naslednji korak.'
        : 'Rival je to rundo dobil zaradi bolj konkretne strukture in hitrejšega zaključka.';
    const coachTip = actionHit
        ? 'Dober zaključek. V naslednji rundi samo še bolj skrajšaj uvod.'
        : 'Dodaj jasen naslednji korak, ker to najbolj dvigne rezultat dvoboja.';

    return {
        playerScore,
        opponentScore,
        winner,
        loserMove,
        reason,
        coachTip,
        scoreBreakdown: {
            clarity: clarityScore,
            empathy: empathyScore,
            structure: structureScore,
            tone: toneScore,
            actionability: actionabilityScore,
            speedBonus,
            penalties: shortPenalty + offTopicPenalty + tonePenalty
        }
    };
}

function resolveDuelActions(duelState) {
    if (!duelState) return { player: 'idle', opponent: 'idle' };
    if (duelState.phase === 'waiting') return { player: 'waiting', opponent: 'waiting' };
    if (duelState.phase === 'intro') return { player: 'idle', opponent: 'idle' };
    if (duelState.phase === 'judging') return { player: 'loading', opponent: 'loading' };
    if (duelState.phase === 'result') {
        return duelState.lastRoundWinner === 'player'
            ? { player: 'attack', opponent: duelState.lastLoserMove || 'dodge' }
            : { player: duelState.lastLoserMove || 'block', opponent: 'attack' };
    }
    if (duelState.phase === 'finished') {
        return duelState.matchWinner === 'player'
            ? { player: 'celebrate', opponent: 'hit' }
            : { player: 'hit', opponent: 'celebrate' };
    }
    return { player: 'idle', opponent: 'idle' };
}

function DuelArena({ duelState, selectedUser, battleOpponent, selectedBattleChallenge, duelRounds, duelAnswer, setDuelAnswer, onSubmitRound, onNextRound, onReset }) {
    const roundData = duelRounds[duelState.round - 1] || duelRounds[0];
    const actions = resolveDuelActions(duelState);
    const playerName = selectedUser?.name || 'Ti';
    const opponentName = battleOpponent?.name || 'Rival';
    const isFinished = duelState.phase === 'finished';
    const timerPercent = Math.max(0, Math.min(100, Math.round((duelState.timeLeft / DUEL_ROUND_SECONDS) * 100)));
    const judgingProgress = Math.max(0, Math.min(100, duelState.judgingProgress || 0));
    const roundHistory = Array.from({ length: 3 }, (_, index) => duelState.history[index]);

    return (
        <article className="competition-duel-arena">
            <div className="competition-duel-arena__head">
                <div>
                    <span className="eyebrow">Dvoboj na dve dobljeni rundi</span>
                    <h3>{selectedBattleChallenge?.title || 'Dvoboj veščin'}</h3>
                    <small>{selectedBattleChallenge?.scenario || 'Isti naloga, isti pogoji. Boljši odgovor vzame rundo.'}</small>
                </div>
                <div className="duel-round-tracker" aria-label="Sledilnik rund">
                    {roundHistory.map((item, index) => (
                        <span key={index} className={item ? (item.winner === 'player' ? 'win' : 'loss') : (duelState.round === index + 1 ? 'active' : '')}>
                            R{index + 1}
                        </span>
                    ))}
                </div>
                <button type="button" className="secondary" onClick={onReset}>Nazaj v preddverje</button>
            </div>

            <div className="duel-stage-board">
                <div className={`duel-fighter ${duelState.lastRoundWinner === 'player' || duelState.matchWinner === 'player' ? 'winner' : ''}`}>
                    <DuelAnimatedModel action={actions.player} name={playerName} side="player" avatarConfig={selectedUser?.avatarConfig || fallbackAvatarConfig(selectedUser?.level || 0)} />
                    <div className="duel-fighter__meta">
                        <strong>{playerName}</strong>
                        <span>{duelState.playerWins} dobljenih rund</span>
                    </div>
                </div>

                <div className="duel-versus-card">
                    <span className="pill">Runda {duelState.round}</span>
                    <strong>{duelState.playerWins} : {duelState.opponentWins}</strong>
                    <small>
                        {duelState.phase === 'waiting' && 'Čakalnica'}
                        {duelState.phase === 'intro' && 'Uvod v rundo'}
                        {duelState.phase === 'prompt' && `${roundData?.title || 'Runda'} · ${roundData?.focus || 'Fokus veščine'}`}
                        {duelState.phase === 'judging' && 'AI ocenjuje'}
                        {duelState.phase === 'result' && 'Rezultat runde'}
                        {duelState.phase === 'finished' && 'Dvoboj zaključen'}
                    </small>
                    {duelState.phase === 'prompt' && (
                        <div className="duel-timer" style={{ '--timer': `${timerPercent}%` }}>
                            <span>{duelState.timeLeft}s</span>
                            <small>preostali čas</small>
                        </div>
                    )}
                    {duelState.phase === 'judging' && (
                        <div className="duel-judging-progress">
                            <div><span style={{ width: `${judgingProgress}%` }} /></div>
                            <small>{judgingProgress}%</small>
                        </div>
                    )}
                </div>

                <div className={`duel-fighter ${duelState.lastRoundWinner === 'opponent' || duelState.matchWinner === 'opponent' ? 'winner' : ''}`}>
                    <DuelAnimatedModel action={actions.opponent} name={opponentName} side="opponent" avatarConfig={battleOpponent?.avatarConfig || fallbackAvatarConfig(battleOpponent?.level || 2)} />
                    <div className="duel-fighter__meta">
                        <strong>{opponentName}</strong>
                        <span>{duelState.opponentWins} dobljenih rund</span>
                    </div>
                </div>
            </div>

            <div className="duel-round-card">
                {duelState.phase === 'waiting' && (
                    <div className="duel-state duel-state--waiting">
                        <h4>Čakalnica</h4>
                        <p>Oba playerja hodita v lobbyju, medtem ko sistem pripravi match.</p>
                    </div>
                )}

                {duelState.phase === 'intro' && (
                    <div className="duel-state duel-state--intro">
                        <div className="round-intro-badge">{roundData?.label}</div>
                        <h4>{roundData?.title}</h4>
                        <p>{roundData?.focus} · pripravi najboljši odgovor.</p>
                    </div>
                )}

                {duelState.phase === 'prompt' && (
                    <div className="duel-state duel-state--prompt">
                        <div className="duel-round-copy">
                            <span>{roundData?.label}</span>
                            <h4>{roundData?.title}</h4>
                            <p>{roundData?.prompt}</p>
                            <div className="mini-list">
                                <span>{roundData?.focus}</span>
                                <span>same prompt for both</span>
                                <span>speed bonus max +5</span>
                            </div>
                        </div>
                        <label className="duel-answer-field">
                            <span>Tvoj odgovor</span>
                            <textarea
                                rows="7"
                                value={duelAnswer}
                                onChange={(e) => setDuelAnswer(e.target.value)}
                                placeholder="Napiši svoj odgovor za to rundo..."
                            />
                        </label>
                        <div className="duel-actions">
                            <button type="button" className="primary" onClick={() => onSubmitRound(false)} disabled={!duelAnswer.trim()}>
                                Oddaj odgovor za rundo
                            </button>
                            <span className="duel-autosubmit-hint">Ko timer pride na 0, se odda trenutni odgovor.</span>
                        </div>
                    </div>
                )}

                {duelState.phase === 'judging' && (
                    <div className="duel-state duel-state--judging">
                        <h4>AI Coach scoring...</h4>
                        <p>GLB player teče, medtem ko AI primerja jasnost, empatijo, strukturo, ton in naslednji korak.</p>
                    </div>
                )}

                {duelState.phase === 'result' && (
                    <div className="duel-state duel-state--result">
                        <div className={`duel-result-pill ${duelState.lastRoundWinner === 'player' ? 'win' : 'loss'}`}>
                            {duelState.lastRoundWinner === 'player' ? 'Tvoja runda' : 'Runda za rivala'}
                        </div>
                        <div className="duel-score-split">
                            <div>
                                <small>{playerName}</small>
                                <strong>{duelState.lastPlayerScore}</strong>
                            </div>
                            <span>PROTI</span>
                            <div>
                                <small>{opponentName}</small>
                                <strong>{duelState.lastOpponentScore}</strong>
                            </div>
                        </div>
                        {duelState.lastBreakdown && (
                            <div className="duel-score-breakdown">
                                <span>Clarity {duelState.lastBreakdown.clarity}</span>
                                <span>Empathy {duelState.lastBreakdown.empathy}</span>
                                <span>Structure {duelState.lastBreakdown.structure}</span>
                                <span>Tone {duelState.lastBreakdown.tone}</span>
                                <span>Action {duelState.lastBreakdown.actionability}</span>
                                <span>Speed +{duelState.lastBreakdown.speedBonus}</span>
                            </div>
                        )}
                        <p>{duelState.lastReason}</p>
                        <small>{duelState.lastCoachTip}</small>
                        <button type="button" className="primary" onClick={onNextRound}>
                            {duelState.playerWins === 2 || duelState.opponentWins === 2 || duelState.round >= 3 ? 'Pokaži rezultat dvoboja' : 'Naslednja runda'}
                        </button>
                    </div>
                )}

                {isFinished && (
                    <div className="duel-state duel-state--finished">
                        <div className={`duel-result-pill ${duelState.matchWinner === 'player' ? 'win' : 'loss'}`}>
                            {duelState.matchWinner === 'player' ? 'Zmaga v dvoboju' : 'Ponovni dvoboj?'}
                        </div>
                        <h4>{duelState.matchWinner === 'player' ? `${playerName} zmaga v dvoboju na dve dobljeni rundi` : `${opponentName} zmaga v dvoboju`}</h4>
                        <p>
                            {duelState.matchWinner === 'player'
                                ? 'Končna zmaga sproži funny dance animacijo in XP reward.'
                                : 'Rival je bil tokrat boljši. Naslednji korak je ponovni dvoboj ali novi challenge.'}
                        </p>
                        <div className="duel-round-history">
                            {duelState.history.map((item) => (
                                <div key={item.round} className={`duel-history-chip ${item.winner === 'player' ? 'win' : 'loss'}`}>
                                    <strong>R{item.round}</strong>
                                    <span>{item.playerScore}:{item.opponentScore}</span>
                                </div>
                            ))}
                        </div>
                        <div className="duel-actions">
                            <button type="button" className="primary" onClick={onReset}>Nazaj v preddverje</button>
                            <button type="button" className="secondary" onClick={onNextRound}>Ponovni dvoboj</button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

function initialDuelState(overrides = {}) {
    return {
        active: false,
        round: 1,
        phase: 'idle',
        timeLeft: DUEL_ROUND_SECONDS,
        judgingProgress: 0,
        playerWins: 0,
        opponentWins: 0,
        history: [],
        lastRoundWinner: null,
        lastPlayerScore: null,
        lastOpponentScore: null,
        lastReason: '',
        lastCoachTip: '',
        lastLoserMove: 'dodge',
        lastBreakdown: null,
        matchWinner: null,
        ...overrides
    };
}

export function CompetitionSection({ users = [], selectedUser, skills = [], challenges = [], selectedSkillKeys = [], dailyDuelChallenge, lastCompetitionResult, onStartDailyDuel, onStartSkillBattle }) {
    const rivals = useMemo(() => buildCompetitionRivals(users, selectedUser), [users, selectedUser]);
    const [battleChallengeId, setBattleChallengeId] = useState(dailyDuelChallenge?.id || challenges[0]?.id || '');
    const [battleSkillFilter, setBattleSkillFilter] = useState(selectedSkillKeys[0] || 'all');
    const [opponentId, setOpponentId] = useState(() => (rivals[0]?.id || ''));
    const [duelAnswer, setDuelAnswer] = useState('');
    const [duelState, setDuelState] = useState(() => initialDuelState());

    useEffect(() => {
        if (!battleChallengeId && (dailyDuelChallenge?.id || challenges[0]?.id)) {
            setBattleChallengeId(dailyDuelChallenge?.id || challenges[0]?.id);
        }
    }, [dailyDuelChallenge, challenges, battleChallengeId]);

    const battleChallenges = useMemo(() => {
        if (battleSkillFilter === 'all') return challenges;
        return challenges.filter((challenge) => challenge.skillKey === battleSkillFilter);
    }, [challenges, battleSkillFilter]);

    const selectedBattleChallenge = challenges.find((challenge) => challenge.id === battleChallengeId)
        || battleChallenges[0]
        || challenges[0];
    const dailyLeaderboard = buildCompetitionPreviewLeaderboard(rivals, selectedUser, dailyDuelChallenge, 'daily-duel');
    const battleOpponent = rivals.find((user) => user.id === opponentId) || rivals[0];
    const battlePreviewScore = buildPreviewScore(battleOpponent, selectedBattleChallenge, 'skill-battle');
    const duelRounds = useMemo(() => buildDuelRounds(selectedBattleChallenge), [selectedBattleChallenge]);

    const handleSkillFilterChange = (value) => {
        setBattleSkillFilter(value);
        const nextChallenge = value === 'all'
            ? challenges[0]
            : challenges.find((challenge) => challenge.skillKey === value);
        if (nextChallenge) setBattleChallengeId(nextChallenge.id);
    };

    const resetToLobby = useCallback(() => {
        setDuelAnswer('');
        setDuelState(initialDuelState());
    }, []);

    const startDuel = useCallback((challengeOverride) => {
        const challenge = challengeOverride || selectedBattleChallenge;
        if (challenge?.id) setBattleChallengeId(challenge.id);
        onStartSkillBattle?.({ opponentId: battleOpponent?.id, challengeId: challenge?.id });
        setDuelAnswer('');
        setDuelState(initialDuelState({ active: true, phase: 'waiting' }));
    }, [battleOpponent, selectedBattleChallenge, onStartSkillBattle]);

    useEffect(() => {
        if (!duelState.active || duelState.phase !== 'waiting') return undefined;
        const timer = window.setTimeout(() => {
            setDuelState((current) => current.active && current.phase === 'waiting'
                ? { ...current, phase: 'intro', timeLeft: DUEL_ROUND_SECONDS, judgingProgress: 0 }
                : current);
        }, DUEL_WAITING_MS);
        return () => window.clearTimeout(timer);
    }, [duelState.active, duelState.phase, duelState.round]);

    useEffect(() => {
        if (!duelState.active || duelState.phase !== 'intro') return undefined;
        const timer = window.setTimeout(() => {
            setDuelState((current) => current.active && current.phase === 'intro'
                ? { ...current, phase: 'prompt', timeLeft: DUEL_ROUND_SECONDS }
                : current);
        }, DUEL_INTRO_MS);
        return () => window.clearTimeout(timer);
    }, [duelState.active, duelState.phase, duelState.round]);

    const submitRound = useCallback((forcedTimeout = false) => {
        let answerToScore = '';
        let roundToScore = 1;
        let timeRemaining = 0;
        setDuelState((current) => {
            if (!current.active || current.phase !== 'prompt') return current;
            answerToScore = duelAnswer.trim() || (forcedTimeout ? 'Time expired before a complete answer was submitted.' : '');
            if (!answerToScore) return current;
            roundToScore = current.round;
            timeRemaining = current.timeLeft;
            return { ...current, phase: 'judging', judgingProgress: 8 };
        });

        window.setTimeout(() => {
            if (!answerToScore) return;
            setDuelState((current) => {
                if (!current.active || current.phase !== 'judging') return current;
                const result = evaluateDuelRound({
                    answer: answerToScore,
                    round: roundToScore,
                    challenge: selectedBattleChallenge,
                    opponent: battleOpponent,
                    timeRemaining,
                    forcedTimeout
                });
                const nextPlayerWins = current.playerWins + (result.winner === 'player' ? 1 : 0);
                const nextOpponentWins = current.opponentWins + (result.winner === 'opponent' ? 1 : 0);
                return {
                    ...current,
                    phase: 'result',
                    judgingProgress: 100,
                    playerWins: nextPlayerWins,
                    opponentWins: nextOpponentWins,
                    lastRoundWinner: result.winner,
                    lastPlayerScore: result.playerScore,
                    lastOpponentScore: result.opponentScore,
                    lastReason: result.reason,
                    lastCoachTip: result.coachTip,
                    lastLoserMove: result.loserMove,
                    lastBreakdown: result.scoreBreakdown,
                    history: [
                        ...current.history,
                        {
                            round: current.round,
                            winner: result.winner,
                            playerScore: result.playerScore,
                            opponentScore: result.opponentScore
                        }
                    ]
                };
            });
            setDuelAnswer('');
        }, DUEL_JUDGING_MS);
    }, [battleOpponent, duelAnswer, selectedBattleChallenge]);

    useEffect(() => {
        if (!duelState.active || duelState.phase !== 'prompt') return undefined;
        if (duelState.timeLeft <= 0) {
            submitRound(true);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            setDuelState((current) => current.active && current.phase === 'prompt'
                ? { ...current, timeLeft: Math.max(0, current.timeLeft - 1) }
                : current);
        }, 1000);
        return () => window.clearTimeout(timer);
    }, [duelState.active, duelState.phase, duelState.timeLeft, submitRound]);

    useEffect(() => {
        if (!duelState.active || duelState.phase !== 'judging') return undefined;
        const timer = window.setInterval(() => {
            setDuelState((current) => current.active && current.phase === 'judging'
                ? { ...current, judgingProgress: Math.min(96, (current.judgingProgress || 0) + 13) }
                : current);
        }, 240);
        return () => window.clearInterval(timer);
    }, [duelState.active, duelState.phase]);

    const handleNextRound = () => {
        setDuelAnswer('');
        setDuelState((current) => {
            const matchWinner = current.playerWins === current.opponentWins
                ? (current.playerWins >= current.opponentWins ? 'player' : 'opponent')
                : (current.playerWins > current.opponentWins ? 'player' : 'opponent');
            if (current.phase === 'finished') {
                return initialDuelState({ active: true, phase: 'waiting' });
            }
            if (current.playerWins === 2 || current.opponentWins === 2 || current.round >= 3) {
                return { ...current, phase: 'finished', matchWinner, timeLeft: 0, judgingProgress: 100 };
            }
            return {
                ...current,
                round: current.round + 1,
                phase: 'waiting',
                timeLeft: DUEL_ROUND_SECONDS,
                judgingProgress: 0,
                lastRoundWinner: null,
                lastPlayerScore: null,
                lastOpponentScore: null,
                lastReason: '',
                lastCoachTip: '',
                lastLoserMove: 'dodge',
                lastBreakdown: null
            };
        });
    };

    return (
        <div className="content-section competition-section">
            <div className="section-title">
                <div>
                    <span>Tekmovalno središče</span>
                    <small>Najprej izbereš tekmeca, nato ostaneš v istem zavihku in odigraš celoten dvoboj na dve dobljeni rundi</small>
                </div>
                <span className="pill">izziv v živo</span>
            </div>

            <div className="competition-hero-card competition-hero-card--duel">
                <div>
                    <p className="eyebrow">Tvoj naslednji cilj</p>
                    <h2>Dvoboj veščin: isti poziv, tri runde, en zmagovalec.</h2>
                    <p>
                        To ni več preusmeritev v navaden simulator. Zavihek Tekmovanje zdaj sam vodi celoten potek: preddverje → uvod v rundo → odgovor → AI ocenjuje → rezultat runde → končni zmagovalec. Dnevni dvoboj in preddverje izzivov uporabljata isti zaslon dvoboja.
                    </p>
                </div>
                <div className="competition-stat-strip">
                    <span><Icon name="bolt" size={16} /> 90 s časovnik</span>
                    <span><Icon name="trophy" size={16} /> na dve dobljeni</span>
                    <span><Icon name="swords" size={16} /> animiran dvoboj</span>
                </div>
            </div>

            {!duelState.active && (
                <div className="competition-grid competition-grid--lobby">
                <article className="competition-card daily-duel-card">
                    <div className="competition-card-head">
                        <span className="competition-icon"><Icon name="trophy" /></span>
                        <div>
                            <p className="eyebrow">Točka 1</p>
                            <h3>Dnevni dvoboj</h3>
                        </div>
                    </div>
                    <h4>{dailyDuelChallenge?.title || 'Današnji izziv še ni na voljo'}</h4>
                    <p>{dailyDuelChallenge?.scenario || 'Ko se naložijo izzivi, aplikacija vsak dan izbere en skupen izziv za vse uporabnike.'}</p>
                    <div className="mini-list">
                        <span>isti izziv za vse</span>
                        <span>dnevna lestvica</span>
                        <span>bonus motivacija</span>
                    </div>
                    <CompetitionLeaderboard entries={dailyLeaderboard} highlightName={selectedUser?.name || 'Demo uporabnik'} />
                    <button type="button" className="primary full-width" disabled={!dailyDuelChallenge} onClick={() => startDuel(dailyDuelChallenge)}>
                        Začni Dnevni dvoboj kot 1v1
                    </button>
                </article>

                <article className="competition-card skill-battle-card challenge-lobby-card">
                    <div className="competition-card-head">
                        <span className="competition-icon"><Icon name="swords" /></span>
                        <div>
                            <p className="eyebrow">Točka 2</p>
                            <h3>Preddverje izzivov</h3>
                        </div>
                    </div>
                    <p>Nastavi tekmeca, fokus in izziv. Ko klikneš začetek, se odpre zaslon dvoboja z rundami na dve dobljeni.</p>
                    <div className="battle-form-grid">
                        <label>Rival
                            <StyledSelect
                                value={opponentId}
                                label="Izberi rivala"
                                onChange={setOpponentId}
                                options={rivals.map((user) => ({ value: user.id, label: user.name }))}
                            />
                        </label>
                        <label>Veščina
                            <StyledSelect
                                value={battleSkillFilter}
                                label="Izberi veščino"
                                onChange={handleSkillFilterChange}
                                options={[{ value: 'all', label: 'Vse veščine' }, ...skills.map((skill) => ({ value: skill.key, label: skill.name }))]}
                            />
                        </label>
                        <label className="wide">Izziv bitke
                            <StyledSelect
                                value={selectedBattleChallenge?.id || ''}
                                label="Izberi izziv bitke"
                                onChange={setBattleChallengeId}
                                options={(battleChallenges.length ? battleChallenges : challenges).map((challenge) => ({ value: challenge.id, label: challenge.title }))}
                            />
                        </label>
                    </div>
                    <div className="battle-preview-card battle-preview-card--duel">
                        <span className="avatar avatar--model avatar--leaderboard"><AvatarMini config={battleOpponent?.avatarConfig || fallbackAvatarConfig(2)} /></span>
                        <div>
                            <strong>{battleOpponent?.name || 'SkillBot tekmec'}</strong>
                            <p>Predviden rezultat tekmeca danes: {battlePreviewScore}/100</p>
                        </div>
                        <div className="battle-preview-card__meta">
                            <span>format</span>
                            <strong>Na dve dobljeni</strong>
                        </div>
                    </div>
                    <div className="challenge-lobby-features mini-list">
                        <span>hoja med čakanjem</span>
                        <span>tek med nalaganjem</span>
                        <span>boksarski izid po rundi</span>
                        <span>zmagovalni ples ob zmagi</span>
                    </div>
                    <button
                        type="button"
                        className="primary full-width"
                        disabled={!selectedBattleChallenge}
                        onClick={() => startDuel()}
                    >
                        Odpri zaslon dvoboja
                    </button>
                </article>
                </div>
            )}

            {duelState.active && (
                <DuelArena
                    duelState={duelState}
                    selectedUser={selectedUser}
                    battleOpponent={battleOpponent}
                    selectedBattleChallenge={selectedBattleChallenge}
                    duelRounds={duelRounds}
                    duelAnswer={duelAnswer}
                    setDuelAnswer={setDuelAnswer}
                    onSubmitRound={submitRound}
                    onNextRound={handleNextRound}
                    onReset={resetToLobby}
                />
            )}

            {!duelState.active && lastCompetitionResult && <CompetitionResultCard result={lastCompetitionResult} />}
        </div>
    );
}

export function PromptsSection({ skills, filteredPrompts, newPrompt, setNewPrompt, handleCreatePrompt, selectedSkillKey, saving, authenticated }) {
    const selectedSkill = skills.find((skill) => skill.key === (newPrompt.skillKey || selectedSkillKey));
    const preview = buildPromptPreview(newPrompt, selectedSkill);

    return (
        <div className="content-section">
            <div className="section-title">
                <div>
                    <span>Studio promptov</span>
                    <small>bolj strukturirani prompti za AI trenera</small>
                </div>
                <span className="pill">{(filteredPrompts || []).length} aktivnih</span>
            </div>
            <div className="prompt-layout">
                <div className="prompt-list">
                    {(filteredPrompts || []).map((prompt) => (
                        <article key={prompt.id} className="prompt-card">
                            <div className="prompt-card-head">
                                <p>{prompt.difficulty}</p>
                                <span>{prompt.skillKey}</span>
                            </div>
                            <h3>{prompt.title}</h3>
                            <code>{prompt.userPromptTemplate}</code>
                            <pre>{prompt.simulatedAiResponse}</pre>
                            <div className="mini-list">{(prompt.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                        </article>
                    ))}
                </div>
                <form className="prompt-form" onSubmit={handleCreatePrompt}>
                    <h3>Dodaj ali izboljšaj prompt</h3>
                    <label>Naslov prompta
                        <input value={newPrompt.title} onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} placeholder="npr. Empatično reševanje konflikta" />
                    </label>
                    <label>Veščina
                        <StyledSelect
                            value={newPrompt.skillKey || selectedSkillKey}
                            label="Izberi veščino prompta"
                            onChange={(value) => setNewPrompt({ ...newPrompt, skillKey: value })}
                            options={(skills || []).map((skill) => ({ value: skill.key, label: skill.name }))}
                        />
                    </label>
                    <label>Težavnost
                        <StyledSelect
                            value={newPrompt.difficulty}
                            label="Izberi težavnost prompta"
                            onChange={(value) => setNewPrompt({ ...newPrompt, difficulty: value })}
                            options={[
                                { value: 'ZAČETNIK', label: 'ZAČETNIK' },
                                { value: 'SREDNJI', label: 'SREDNJI' },
                                { value: 'NAPREDNI', label: 'NAPREDNI' }
                            ]}
                        />
                    </label>
                    <label>Sistemski prompt
                        <textarea rows="4" value={newPrompt.systemPrompt} onChange={(e) => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })} placeholder="AI naj bo trener, naj sprašuje, ocenjuje in predlaga izboljšave" />
                    </label>
                    <label>Uporabniška predloga
                        <textarea rows="4" value={newPrompt.userPromptTemplate} onChange={(e) => setNewPrompt({ ...newPrompt, userPromptTemplate: e.target.value })} placeholder="Uporabi {{answer}}, {{scenario}}, {{criteria}}" />
                    </label>
                    <label>Primer AI odgovora
                        <textarea rows="5" value={newPrompt.simulatedAiResponse} onChange={(e) => setNewPrompt({ ...newPrompt, simulatedAiResponse: e.target.value })} placeholder="Ocena, pohvala, izboljšava, vprašanje" />
                    </label>
                    <label>Oznake
                        <input value={Array.isArray(newPrompt.tags) ? newPrompt.tags.join(', ') : newPrompt.tags} onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })} placeholder="empatija, jasnost, akcijski-korak" />
                    </label>
                    <div className="prompt-preview">
                        <strong>Predogled</strong>
                        <pre>{preview}</pre>
                    </div>
                    <button className="primary" disabled={saving || !authenticated}>{authenticated ? 'Shrani prompt' : 'Prijavi se za shranjevanje'}</button>
                </form>
            </div>
        </div>
    );
}


export function MentorDashboardSection({ dashboard, users = [], roles = [], isMentor, onRefresh, onSaveMentorNote, saving }) {
    const [selectedLearner, setSelectedLearner] = useState(null);

    if (!isMentor) {
        return (
            <div className="content-section empty-state">
                Mentorska nadzorna plošča je dostopna samo uporabnikom z vlogo MENTOR ali ADMIN.
                <small>Trenutne vloge: {roles?.join(', ') || 'brez prijave'}</small>
            </div>
        );
    }

    const safeDashboard = dashboard || {
        totalUsers: users.length,
        totalSessions: 0,
        averageScore: 0,
        sessionsNeedingReview: 0,
        learners: users.map((user) => ({
            userId: user.id, name: user.name, email: user.email, level: user.level || 1, points: user.points || 0,
            streakDays: user.streakDays || 0, sessions: 0, averageScore: 0, weakestSkill: 'še ni podatkov', mentorStatus: 'Naloži nadzorno ploščo'
        })),
        recentSessions: [],
        allSessions: []
    };

    const allMentorSessions = safeDashboard.allSessions || safeDashboard.recentSessions || [];
    const selectedLearnerSessions = selectedLearner
        ? allMentorSessions.filter((session) => String(session.userId) === String(selectedLearner.userId))
        : [];

    return (
        <div className="content-section mentor-dashboard-section">
            <div className="section-title">
                <div>
                    <span>Mentorska nadzorna plošča</span>
                    <small>Pregled napredka, šibkih področij in simulacij za ročni komentar</small>
                </div>
                <button type="button" className="secondary" onClick={onRefresh}>Osveži</button>
            </div>

            <div className="report-grid">
                <MetricCard label="Uporabniki" value={safeDashboard.totalUsers} helper="v sistemu" />
                <MetricCard label="Simulacije" value={safeDashboard.totalSessions} helper="skupno oddanih" />
                <MetricCard label="Povprečje" value={`${safeDashboard.averageScore}/100`} helper="vseh uporabnikov" />
                <MetricCard label="Za pregled" value={safeDashboard.sessionsNeedingReview} helper="brez mentorskega komentarja" />
            </div>

            {selectedLearner && (
                <MentorLearnerSessionsModal
                    learner={selectedLearner}
                    sessions={selectedLearnerSessions}
                    saving={saving}
                    onClose={() => setSelectedLearner(null)}
                    onSaveMentorNote={onSaveMentorNote}
                />
            )}

            <div className={selectedLearner ? 'mentor-layout mentor-layout--modal-open' : 'mentor-layout'}>
                <section className="mentor-panel mentor-panel--full">
                    <h3>Učenci po prioriteti</h3>
                    <div className="mentor-learner-list">
                        {(safeDashboard.learners || []).map((learner) => (
                            <article
                                key={learner.userId}
                                className="mentor-learner-card mentor-learner-card--clickable"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedLearner(learner)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedLearner(learner);
                                    }
                                }}
                            >
                                <div>
                                    <strong>{learner.name || 'Uporabnik'}</strong>
                                    <small>{learner.email || 'brez e-maila'}</small>
                                </div>
                                <div className="mentor-metrics">
                                    <span>Stopnja {learner.level}</span>
                                    <span>{learner.sessions} vaj</span>
                                    <span>{learner.averageScore}/100</span>
                                </div>
                                <p>Najšibkejša veščina: <b>{learner.weakestSkill}</b></p>
                                <span className="pill">{learner.mentorStatus}</span>
                                <button type="button" className="secondary mentor-open-user" onClick={(event) => { event.stopPropagation(); setSelectedLearner(learner); }}>
                                    Odpri vse odgovore
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function MentorLearnerSessionsModal({ learner, sessions = [], saving, onClose, onSaveMentorNote }) {
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="mentor-user-modal-overlay" onClick={onClose}>
            <section className="mentor-user-modal" onClick={(event) => event.stopPropagation()}>
                <div className="mentor-user-modal__header">
                    <div>
                        <span>Odgovori uporabnika</span>
                        <h3>{learner.name || 'Uporabnik'}</h3>
                        <small>{learner.email || 'brez e-maila'} · {sessions.length} odgovorov</small>
                    </div>
                    <button type="button" className="secondary mentor-user-modal__close" onClick={onClose}>Zapri</button>
                </div>

                <div className="mentor-user-modal__body">
                    {sessions.length ? sessions.map((session) => (
                        <MentorSessionReviewCard
                            key={session.sessionId}
                            session={session}
                            saving={saving}
                            onSaveMentorNote={onSaveMentorNote}
                            expanded
                        />
                    )) : (
                        <div className="mentor-user-modal__empty">Ta uporabnik še nima oddanih odgovorov.</div>
                    )}
                </div>
            </section>
        </div>
    );
}

function MentorSessionReviewCard({ session, saving, onSaveMentorNote }) {
    const [note, setNote] = useState(session.mentorNote || '');
    const [status, setStatus] = useState('');

    useEffect(() => {
        setNote(session.mentorNote || '');
        setStatus('');
    }, [session.sessionId, session.mentorNote]);

    const handleSave = async () => {
        if (!note.trim() || !onSaveMentorNote) return;
        setStatus('Shranjujem komentar ...');
        try {
            await onSaveMentorNote(session.sessionId, note);
            setStatus('Komentar je shranjen in prikazan v uporabnikovem poročilu.');
        } catch {
            setStatus('Komentarja ni bilo mogoče shraniti.');
        }
    };

    return (
        <article className="mentor-session-card mentor-session-card--review">
            <div className="mentor-session-top">
                <div>
                    <strong>{session.userName}</strong>
                    <small>{session.skillKey} · {session.createdAt ? new Date(session.createdAt).toLocaleDateString('sl-SI') : 'brez datuma'}</small>
                </div>
                <b>{session.score}/100</b>
            </div>
            <span className={session.reviewed ? 'reviewed' : 'needs-review'}>{session.reviewed ? 'pregledano' : 'čaka komentar'}</span>
            <div className="mentor-session-details">
                <section>
                    <small>Vprašanje / naloga</small>
                    <p>
                        <strong>{session.challengeTitle || 'Naloga'}</strong>
                        {session.challengeScenario ? `\n${session.challengeScenario}` : ''}
                    </p>
                </section>
                <section>
                    <small>Odgovor uporabnika</small>
                    <p>{session.userAnswer || 'Uporabnik še ni oddal odgovora.'}</p>
                </section>
            </div>
            <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Napiši mentorjev komentar, naslednji korak ali domačo nalogo za uporabnika."
            />
            <div className="mentor-actions">
                <small>{status || 'Komentar se po shranjevanju prikaže na poročilu uporabnika.'}</small>
                <button type="button" className="primary" disabled={saving || !note.trim()} onClick={handleSave}>
                    {saving ? 'Shranjujem ...' : 'Shrani komentar'}
                </button>
            </div>
        </article>
    );
}

export function ReportSection({ report, skills = [] }) {
    if (!report) return <div className="content-section empty-state">Poročilo še ni na voljo. Najprej oddaj simulacijo.</div>;
    const insights = getGrowthInsights(report, skills);
    const skillName = (skillKey) => skills.find((skill) => skill.key === skillKey)?.name || skillKey;

    return (
        <div className="content-section">
            <div className="section-title">
                <div>
                    <span>Napredno poročilo</span>
                    <small>{report.userName}</small>
                </div>
                <span className="pill">pripravljeno za mentorja</span>
            </div>
            <div className="report-grid">
                <MetricCard label="Simulacije" value={report.totalSessions} helper="Zaključene vaje" />
                <MetricCard label="Stopnja" value={report.level || 1} helper={`${report.currentLevelXp || 0}/${report.nextLevelXp || 100} XP`} />
                <MetricCard label="Zvezdice" value={report.totalStars || 0} helper="Skupno zbranih" />
                <MetricCard label="Povprečje" value={`${report.averageScore}/100`} helper="Čez vse veščine" />
            </div>

            <GrowthInsightBoard insights={insights} skillName={skillName} />

            {(report.metricProgress || []).length > 0 && (
                <article className="metric-progress-report">
                    <div className="section-title compact-title">
                        <div>
                            <span>Analiza po kriterijih</span>
                            <small>Skupni rezultat iz vseh rešenih nalog: empatija, jasnost, struktura, reševanje in samozavest</small>
                        </div>
                    </div>
                    <div className="metric-progress-grid">
                        {(report.metricProgress || []).map((metric) => (
                            <section key={metric.metricKey} className="metric-progress-card">
                                <div>
                                    <strong>{metric.label}</strong>
                                    <span>{metric.averageScore}/100</span>
                                </div>
                                <div className="progress-bar"><span style={{ width: `${Math.min(100, metric.averageScore)}%` }} /></div>
                                <small>{metric.status}</small>
                                <p>{metric.recommendation}</p>
                            </section>
                        ))}
                    </div>
                </article>
            )}

            <div className="cards-grid single">
                {(report.skillProgress || []).map((skill) => (
                    <article key={skill.skillKey} className="skill-card report-card">
                        <p>{skillName(skill.skillKey)}</p>
                        <div className="report-score-row">
                            <h3>{skill.averageScore}/100</h3>
                            <span>{skill.sessions} vaj</span>
                        </div>
                        <div className="progress-bar"><span style={{ width: `${Math.min(100, skill.averageScore)}%` }} /></div>
                        <p>Naslednje: {skill.nextSuggestedChallenge}</p>
                    </article>
                ))}
            </div>
            {(report.mentorComments || []).length > 0 && (
                <article className="mentor-comments-report">
                    <div className="section-title compact-title">
                        <div>
                            <span>Mentorjevi komentarji</span>
                            <small>Ročne povratne informacije mentorja za tvoje simulacije</small>
                        </div>
                    </div>
                    <div className="mentor-comment-list">
                        {(report.mentorComments || []).map((comment) => (
                            <section key={comment.sessionId} className="mentor-comment-card">
                                <div>
                                    <strong>{skillName(comment.skillKey)}</strong>
                                    <span>{comment.score}/100</span>
                                </div>
                                <p>{comment.mentorNote}</p>
                                {comment.createdAt && <small>{new Date(comment.createdAt).toLocaleString('sl-SI')}</small>}
                            </section>
                        ))}
                    </div>
                </article>
            )}
            <article className="recommendations">
                <h3>Priporočila za nadaljnji razvoj</h3>
                {(report.recommendations || []).map((item) => <p key={item}><Icon name="arrowRight" size={14} /> {item}</p>)}
            </article>
        </div>
    );
}

//welcome section za vse neprijavljene uorabnike
export function GuestWelcome({ onLogin, onRegister }) {
    return (
        <div className="engagement-dashboard guest-welcome">
            <section className="engagement-hero guest-welcome__hero">
                <div className="engagement-hero__copy">
                    <p className="eyebrow">Dobrodošel v SkillBoost</p>
                    <h2>Postani boljši.<br />Vsak dan.</h2>
                    <p>AI trener za mehke veščine. Kratke vaje, takojšnja ocena, merljiv napredek.</p>
                    <div className="engagement-actions">
                        <button type="button" className="primary" onClick={onRegister}>
                            <Icon name="bolt" size={17} />
                            Registracija
                        </button>
                        <button type="button" className="secondary" onClick={onLogin}>
                            Prijava
                        </button>
                    </div>
                </div>
            </section>

            <div className="guest-steps">
                <div className="guest-step">
                    <div className="guest-step__num">1</div>
                    <div className="guest-step__body">
                        <strong>Registracija</strong>
                        <p>Brezplačen račun. 30 sekund.</p>
                    </div>
                </div>
                <div className="guest-step">
                    <div className="guest-step__num">2</div>
                    <div className="guest-step__body">
                        <strong>Izberi veščino</strong>
                        <p>Komunikacija, vodenje, pogajanja — fokus si določiš sam.</p>
                    </div>
                </div>
                <div className="guest-step">
                    <div className="guest-step__num">3</div>
                    <div className="guest-step__body">
                        <strong>Treniraj</strong>
                        <p>AI izziv, tvoj odgovor, takojšnja ocena in XP.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

export function GuestSidebar({ onRegister }) {
    return (
        <>
            <section className="right-card right-card--guest-feature">
                <span className="guest-sidebar-icon"><Icon name="chart" size={22} /></span>
                <strong>Leveli & XP</strong>
                <p>Napreduj skozi 10+ nivojev. Vsaka vaja prinese XP, zvezdice in nova odklepanja.</p>
            </section>
            <section className="right-card right-card--guest-feature right-card--accent">
                <span className="guest-sidebar-icon"><Icon name="compass" size={22} /></span>
                <strong>SkillCity</strong>
                <p>Osvoji virtualno mesto misijo po misijo. Vsaka zaključena naloga zgradi novo stavbo.</p>
            </section>
            <section className="right-card right-card--guest-feature right-card--warm">
                <span className="guest-sidebar-icon"><Icon name="swords" size={22} /></span>
                <strong>Dvoboji</strong>
                <p>Meri se z drugimi v živem dvoboju. Isti izziv, tri runde, en zmagovalec.</p>
            </section>
        </>
    );
}


function GrowthInsightBoard({ insights, skillName }) {
    return (
        <section className="growth-insight-board">
            <article>
                <span className="insight-icon"><Icon name="checkCircle" /></span>
                <div>
                    <p className="eyebrow">V čem si dober</p>
                    {insights.strengths.length ? insights.strengths.map((item) => (
                        <strong key={item.skillKey}>{skillName(item.skillKey)} · {item.averageScore}/100</strong>
                    )) : <strong>Oddaj še nekaj simulacij, da zgradimo profil močnih točk.</strong>}
                </div>
            </article>
            <article>
                <span className="insight-icon"><Icon name="target" /></span>
                <div>
                    <p className="eyebrow">Kje še izboljšaj</p>
                    {insights.improvements.length ? insights.improvements.map((item) => (
                        <strong key={item.skillKey}>{skillName(item.skillKey)} · {item.averageScore}/100</strong>
                    )) : <strong>Trenutno ni izrazito šibke točke. Izberi težji dnevni izziv.</strong>}
                </div>
            </article>
        </section>
    );
}


function buildCompetitionRivals(users = [], selectedUser) {
    const fallback = [
        { id: 'rival-ana', name: 'Ana Novak', role: 'STUDENT', points: 340, level: 3, streakDays: 4 },
        { id: 'rival-luka', name: 'Luka Kovač', role: 'STUDENT', points: 275, level: 3, streakDays: 2 },
        { id: 'rival-eva', name: 'Eva Medved', role: 'STUDENT', points: 205, level: 2, streakDays: 1 },
        { id: 'rival-mark', name: 'Marko Hribar', role: 'STUDENT', points: 185, level: 2, streakDays: 3 }
    ];
    const selectedId = selectedUser?.id;
    const realUsers = (users || []).filter((user) => user.id !== selectedId);
    const merged = [...realUsers];
    fallback.forEach((candidate) => {
        if (!merged.some((user) => user.id === candidate.id || user.name === candidate.name)) {
            merged.push(candidate);
        }
    });
    return merged.slice(0, 6);
}

function buildCompetitionPreviewLeaderboard(rivals, selectedUser, challenge, mode) {
    const me = selectedUser || { id: 'demo-user', name: 'Demo uporabnik', level: 2, streakDays: 1 };
    const entries = [me, ...(rivals || []).slice(0, 5)]
        .map((user, index) => ({
            userId: user.id || `preview-${index}`,
            name: user.name || 'Uporabnik',
            score: user.id === me.id ? '??' : buildPreviewScore(user, challenge, mode),
            avatar: initialsOfName(user.name),
            avatarConfig: user.avatarConfig || fallbackAvatarConfig(index + 1)
        }))
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
        .map((entry, index) => ({ ...entry, mesto: index + 1 }));

    const meEntry = entries.find((entry) => entry.userId === me.id);
    if (meEntry) {
        meEntry.mesto = 'po oddaji';
    }
    return entries;
}

function buildPreviewScore(user, challenge, mode) {
    const seed = `${user?.id || user?.name || 'rival'}-${challenge?.id || challenge?.title || 'challenge'}-${mode}-${new Date().toISOString().slice(0, 10)}`;
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(index);
        hash |= 0;
    }
    const base = 57 + (Math.abs(hash) % 30);
    const levelBonus = Math.min(8, Math.max(0, user?.level || 1));
    const streakBonus = Math.min(5, Math.max(0, user?.streakDays || 0));
    return Math.max(45, Math.min(96, base + levelBonus + streakBonus - 4));
}

function fallbackAvatarConfig(seed = 0) {
    const colors = ['violet', 'blue', 'cyan', 'royal', 'neon', 'plasma', 'aqua', 'emerald', 'magenta', 'amber'];
    const numericSeed = Number.isFinite(Number(seed)) ? Number(seed) : String(seed || '').length;
    const level = Math.abs(numericSeed) % 10;
    const model = `level-${String(level).padStart(2, '0')}`;
    return {
        ...defaultAvatarConfig,
        playerModel: model,
        levelModel: model,
        model,
        accent: colors[level % colors.length],
        energy: level > 6 ? 'radiant' : 'balanced'
    };
}

function initialsOfName(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?';
}


function getGrowthInsights(report, skills = []) {
    const progress = (report?.skillProgress || []).filter((item) => item?.skillKey);
    const sorted = progress.slice().sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const strengths = sorted.filter((item) => (item.averageScore || 0) >= 75).slice(0, 2);
    const improvements = sorted
        .slice()
        .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0))
        .filter((item) => (item.averageScore || 0) < 75)
        .slice(0, 2);

    return {
        strengths: strengths.length ? strengths : sorted.slice(0, 1),
        improvements: improvements.length ? improvements : sorted.slice(-1)
    };
}

function parseFeedbackSections(text, score) {
    const fallback = (text || '').trim() || 'AI trener ni vrnil besedila, ocena pa je shranjena.';
    const sectionMeta = {
        score: { title: 'Ocena', icon: 'target' },
        good: { title: 'Dobro', icon: 'checkCircle' },
        improve: { title: 'Izboljšaj', icon: 'wrench' },
        example: { title: 'Boljša verzija', icon: 'message' },
        question: { title: 'Vprašanje', icon: 'sparkles' },
        next: { title: 'Naslednji mini izziv', icon: 'rocket' },
        summary: { title: 'Povzetek', icon: 'brain' }
    };

    const labelToKey = (label) => {
        const normalized = label
            .toLowerCase()
            .replaceAll('š', 's')
            .replaceAll('ž', 'z')
            .replaceAll('č', 'c');

        if (normalized.includes('ocena')) return 'score';
        if (normalized.includes('dobro') || normalized.includes('v cem si dober') || normalized.includes('mocna')) return 'good';
        if (normalized.includes('izboljs') || normalized.includes('kje se') || normalized.includes('kaj izboljsati') || normalized.includes('naslednji fokus')) return 'improve';
        if (normalized.includes('boljsa') || normalized.includes('verzija') || normalized.includes('primer')) return 'example';
        if (normalized.includes('mini izziv') || normalized.includes('naslednji izziv')) return 'next';
        if (normalized.includes('vprasanje')) return 'question';
        return null;
    };

    const sections = [];
    let current = null;

    fallback.split(/\n+/).forEach((rawLine) => {
        const line = rawLine.replace(/^[-•*]\s*/, '').trim();
        if (!line) return;

        const match = line.match(/^(?:\d+[).]\s*)?([^:]{3,32}):\s*(.*)$/);
        const key = match ? labelToKey(match[1]) : null;

        if (key) {
            current = { key, ...sectionMeta[key], lines: [] };
            if (match[2]) current.lines.push(match[2]);
            sections.push(current);
            return;
        }

        if (!current) {
            current = { key: 'summary', ...sectionMeta.summary, lines: [] };
            sections.push(current);
        }
        current.lines.push(line);
    });

    if (!sections.some((section) => section.key === 'score')) {
        sections.unshift({ key: 'score', ...sectionMeta.score, lines: [`${score}/100`] });
    }

    return sections
        .map((section) => ({
            ...section,
            lines: section.lines.length ? section.lines : ['Ni dodatnega besedila.']
        }))
        .slice(0, 6);
}

function scoreToStars(score) {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
}

function renderStars(count) {
    return (
        <span className="star-rating" aria-label={`${count} od 3 zvezdic`}>
            {Array.from({ length: 3 }).map((_, index) => (
                <Icon key={index} name={index < count ? 'star' : 'starOff'} size={16} />
            ))}
        </span>
    );
}

async function extractTextFromFile(file) {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth/mammoth.browser');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || '';
    }

    if (['txt', 'md', 'csv', 'json'].includes(extension)) {
        return file.text();
    }

    if (file.type.startsWith('text/')) {
        return file.text();
    }

    throw new Error('podprte so .docx, .txt, .md, .csv in .json datoteke');
}

function getAnswerStats(answer) {
    const normalized = answer.toLowerCase();
    const words = normalized.trim() ? normalized.trim().split(/\s+/).length : 0;
    let percent = Math.min(40, words * 2);
    if (normalized.includes('primer') || normalized.includes('na primer')) percent += 15;
    if (normalized.includes('razumem') || normalized.includes('slišim') || normalized.includes('slisim')) percent += 15;
    if (normalized.includes('korak') || normalized.includes('predlagam') || normalized.includes('dogovor')) percent += 15;
    if (normalized.includes('?') || normalized.includes('vprašanje') || normalized.includes('vprasanje')) percent += 15;
    percent = Math.min(100, percent);

    let tip = 'Začni z jasnim odzivom: pokaži razumevanje, dodaj konkreten predlog in zaključi z naslednjim korakom.';
    if (words > 20) tip = 'Dober začetek. Dodaj še merljiv naslednji korak ali vprašanje za sogovornika.';
    if (percent >= 75) tip = 'Osnutek je močan: ima strukturo, empatijo in akcijo. Pred oddajo preveri ton.';

    return { words, percent, tip };
}

function buildPromptPreview(prompt, skill) {
    return [
        `Veščina: ${skill?.name || prompt.skillKey}`,
        `Sistem: ${prompt.systemPrompt || 'Ni sistemskega prompta.'}`,
        `Uporabnik: ${(prompt.userPromptTemplate || '').replace('{{answer}}', 'Moj odgovor ...').replace('{{scenario}}', 'Izbran scenarij ...').replace('{{criteria}}', 'Merila ocenjevanja ...')}`,
        `Pričakovan AI: ${prompt.simulatedAiResponse || 'Ocena + pohvala + izboljšave + vprašanje.'}`
    ].join('\n\n');
}
