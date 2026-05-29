import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';
import { AvatarMini } from './AvatarStudio';

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
                            Daily Duel
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
                        <small>focus</small>
                    </div>
                    <div>
                        <strong>{user?.name || 'Gost'}</strong>
                        <p>Level {level} · {streakDays} dni streak · {totalStars} zvezdic</p>
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
                            <h3>{completedQuests}/{dailyQuests.length || 3} questov</h3>
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
                            <p className="eyebrow">Skill momentum</p>
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

                <article className="engagement-panel engagement-panel--arena">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Tekmovanje</p>
                            <h3>Daily Duel</h3>
                        </div>
                        <button type="button" onClick={onOpenCompetition}>Odpri</button>
                    </div>
                    <div className="arena-preview">
                        <div>
                            <span><Icon name="swords" /></span>
                            <strong>{quickChallenge?.title || 'Skill Battle'}</strong>
                            <small>Odpri kratek duel in primerjaj rezultat.</small>
                        </div>
                        <button type="button" className="primary" onClick={onOpenCompetition}>Tekmuj</button>
                    </div>
                </article>

                <article className="engagement-panel">
                    <div className="engagement-panel__title">
                        <div>
                            <p className="eyebrow">Coach insight</p>
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
                <p className="eyebrow">SkillBoost profile</p>
                <h2>{user?.name || report?.userName || 'Gost'} · Level {level}</h2>
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
        { id: 'strong-answer', label: 'Dosezi vsaj 70/100', completed: false, current: 0, target: 1, rewardText: 'močnejši score' },
        { id: 'multi-skill', label: 'Vadi vsaj 2 veščini hkrati', completed: false, current: 0, target: 2, rewardText: '+5 XP bonus' }
    ];

    return (
        <div className="daily-quests">
            <p className="eyebrow">Dnevni cilji</p>
            <h2>Quest board</h2>
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
                <strong>{personalizedDailyChallenge?.title || 'Personaliziran dnevni izziv'}</strong>
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
                    <select value={selectedChallengeId} onChange={(e) => setSelectedChallengeId(e.target.value)}>
                        {(filteredChallenges || []).map((challenge) => (
                            <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
                        ))}
                    </select>
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
                    <small>AI bo feedback prilagodil tvoji realni situaciji, izziv pa še vedno uporabi za merila ocenjevanja.</small>
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
                                <MicrophoneIcon />
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

                {(voiceStatus || fileStatus || attachedFiles.length > 0) && (
                    <div className="input-assist-status" aria-live="polite">
                        {voiceStatus && <p>{voiceStatus}</p>}
                        {fileStatus && <p>{fileStatus}</p>}
                        {attachedFiles.length > 0 && (
                            <div className="attachment-list">
                                {attachedFiles.map((file, index) => (
                                    <span key={`${file.name}-${index}`}><FileIcon /> {file.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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
                            AI coach pripravlja odgovor...
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
                <p className="eyebrow">{isDaily ? 'Daily Duel aktiven' : 'Skill Battle aktiven'}</p>
                <h3>{challenge?.title || 'Tekmovalni izziv'}</h3>
                <p>
                    {isDaily
                        ? 'Vsi uporabniki danes rešujejo isti izziv. Po oddaji vidiš svojo pozicijo na dnevni lestvici.'
                        : `Tekmuješ proti ${opponent?.name || 'SkillBot rivalu'}. Po oddaji primerjamo score in razglasimo rezultat.`}
                </p>
            </div>
            <button type="button" className="secondary" onClick={onCancel}>Prekliči tekmovanje</button>
        </article>
    );
}

function CompetitionResultCard({ result }) {
    if (!result) return null;
    const resultLabel = result.mode === 'daily-duel'
        ? `Tvoj rank: #${result.userRank}`
        : result.result === 'win' ? 'Zmaga' : result.result === 'loss' ? 'Rematch priložnost' : 'Izenačeno';

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
                    <span>VS</span>
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
            {entries.map((entry) => (
                <div key={`${entry.userId}-${entry.rank}`} className={`competition-leaderboard-row ${entry.name === highlightName || entry.userId === 'demo-user' ? 'me' : ''}`}>
                    <span className="rank">#{entry.rank}</span>
                    <span className={`avatar ${entry.avatarConfig ? 'avatar--model avatar--leaderboard' : ''}`}>{entry.avatarConfig ? <AvatarMini config={entry.avatarConfig} /> : (entry.avatar || initialsOfName(entry.name))}</span>
                    <strong>{entry.name}</strong>
                    <span>{entry.score}/100</span>
                </div>
            ))}
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
                <p>{challenge?.scenario || 'Izberi fokus veščine na levi strani in začni dnevni izziv za double XP.'}</p>
                <div className="mini-list">
                    <span>2x XP danes</span>
                    <span>{selectedSkillNames.length ? selectedSkillNames.join(' + ') : 'personaliziran fokus'}</span>
                    {active && <span>aktivno</span>}
                </div>
            </div>
            <div className="personalized-actions">
                <button type="button" className="primary" onClick={onStart}>
                    {active ? 'Ponovno izberi' : 'Začni daily challenge'}
                </button>
                {active && <button type="button" className="secondary" onClick={onCancel}>Izklopi 2x XP</button>}
            </div>
        </article>
    );
}

function MicrophoneIcon() {
    return (
        <svg className="composer-svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M19 11a7 7 0 0 1-14 0" />
            <path d="M12 18v4" />
            <path d="M8 22h8" />
        </svg>
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
                        <strong>AI coach analizira odgovor</strong>
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
                        {reward.leveledUp && <span>Level up: {reward.oldLevel} <Icon name="arrowRight" size={15} /> {reward.newLevel}</span>}
                    </div>
                )}
                <div className="section-title compact-title">
                    <span>AI povratna informacija</span>
                    <small>hitro razdeljeno na pohvalo, izboljšavo, primer in naslednje vprašanje</small>
                </div>
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
                    <strong>Personaliziran dnevni izziv je podvojil XP.</strong>
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
    const [activeLevel, setActiveLevel] = useState('ALL');
    const [expandedSkillKey, setExpandedSkillKey] = useState(selectedSkillKeys[0] || skills[0]?.key || '');

    const categories = useMemo(() => ['Vse', ...Array.from(new Set((skills || []).map((skill) => skill.category).filter(Boolean)))], [skills]);
    const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const groupedSkills = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return (skills || [])
            .filter((skill) => activeCategory === 'Vse' || skill.category === activeCategory)
            .filter((skill) => activeLevel === 'ALL' || skill.level === activeLevel)
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
                    <p>Filtriraj področja, izberi veščine, odpri konkretne izzive in skoči direktno v simulator. Izbrane veščine vplivajo tudi na personaliziran daily challenge.</p>
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
                    <select value={activeLevel} onChange={(event) => setActiveLevel(event.target.value)}>
                        {levels.map((level) => <option key={level} value={level}>{level === 'ALL' ? 'Vse težavnosti' : level}</option>)}
                    </select>
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
                    <strong>{selectedSkills.length ? 'Aktivna skill playlist' : 'Playlist je prazna'}</strong>
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
    { icon: 'handshake', label: 'Boljši odnosi', helper: 'empatija, meje, konflikti', keys: ['empathy', 'boundaries', 'conflict-resolution'] },
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


export function CompetitionSection({ users = [], selectedUser, skills = [], challenges = [], selectedSkillKeys = [], dailyDuelChallenge, lastCompetitionResult, onStartDailyDuel, onStartSkillBattle }) {
    const rivals = useMemo(() => buildCompetitionRivals(users, selectedUser), [users, selectedUser]);
    const [opponentId, setOpponentId] = useState(rivals[0]?.id || '');
    const [battleChallengeId, setBattleChallengeId] = useState(dailyDuelChallenge?.id || challenges[0]?.id || '');
    const [battleSkillFilter, setBattleSkillFilter] = useState(selectedSkillKeys[0] || 'all');

    useEffect(() => {
        if (!opponentId && rivals[0]?.id) setOpponentId(rivals[0].id);
    }, [rivals, opponentId]);

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

    const handleSkillFilterChange = (value) => {
        setBattleSkillFilter(value);
        const nextChallenge = value === 'all'
            ? challenges[0]
            : challenges.find((challenge) => challenge.skillKey === value);
        if (nextChallenge) setBattleChallengeId(nextChallenge.id);
    };

    return (
        <div className="content-section competition-section">
            <div className="section-title">
                <div>
                    <span>Tekmovalni hub</span>
                    <small>Daily Duel + Skill Battle za bolj interaktivno učenje</small>
                </div>
                <span className="pill">live challenge</span>
            </div>

            <div className="competition-hero-card">
                <div>
                    <p className="eyebrow">Tvoj naslednji cilj</p>
                    <h2>Tekmuj na score, ampak zmaguj z izboljšavo.</h2>
                    <p>
                        Daily Duel da vsem isti dnevni izziv. Skill Battle pa ti omogoči, da izbereš rivala,
                        izbereš veščino in takoj dobiš primerjavo po oddaji odgovora.
                    </p>
                </div>
                <div className="competition-stat-strip">
                    <span><Icon name="bolt" size={16} /> instant start</span>
                    <span><Icon name="trophy" size={16} /> rank po oddaji</span>
                    <span><Icon name="swords" size={16} /> 1v1 battle</span>
                </div>
            </div>

            <div className="competition-grid">
                <article className="competition-card daily-duel-card">
                    <div className="competition-card-head">
                        <span className="competition-icon"><Icon name="trophy" /></span>
                        <div>
                            <p className="eyebrow">Točka 3</p>
                            <h3>Daily Duel</h3>
                        </div>
                    </div>
                    <h4>{dailyDuelChallenge?.title || 'Današnji izziv še ni na voljo'}</h4>
                    <p>{dailyDuelChallenge?.scenario || 'Ko se naložijo izzivi, aplikacija vsak dan izbere en skupen challenge za vse uporabnike.'}</p>
                    <div className="mini-list">
                        <span>isti izziv za vse</span>
                        <span>dnevna lestvica</span>
                        <span>bonus motivacija</span>
                    </div>
                    <CompetitionLeaderboard entries={dailyLeaderboard} highlightName={selectedUser?.name || 'Demo uporabnik'} />
                    <button type="button" className="primary full-width" disabled={!dailyDuelChallenge} onClick={onStartDailyDuel}>
                        Začni Daily Duel
                    </button>
                </article>

                <article className="competition-card skill-battle-card">
                    <div className="competition-card-head">
                        <span className="competition-icon"><Icon name="swords" /></span>
                        <div>
                            <p className="eyebrow">Točka 2</p>
                            <h3>Skill Battle</h3>
                        </div>
                    </div>
                    <p>Izberi rivala in challenge. Po oddaji odgovora dobiš 1v1 rezultat in razlog za rematch.</p>
                    <div className="battle-form-grid">
                        <label>Rival
                            <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
                                {rivals.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                        </label>
                        <label>Veščina
                            <select value={battleSkillFilter} onChange={(e) => handleSkillFilterChange(e.target.value)}>
                                <option value="all">Vse veščine</option>
                                {skills.map((skill) => <option key={skill.key} value={skill.key}>{skill.name}</option>)}
                            </select>
                        </label>
                        <label className="wide">Battle challenge
                            <select value={selectedBattleChallenge?.id || ''} onChange={(e) => setBattleChallengeId(e.target.value)}>
                                {(battleChallenges.length ? battleChallenges : challenges).map((challenge) => (
                                    <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="battle-preview-card">
                        <span className={`avatar ${battleOpponent?.avatarConfig ? 'avatar--model avatar--leaderboard' : ''}`}>{battleOpponent?.avatarConfig ? <AvatarMini config={battleOpponent.avatarConfig} /> : initialsOfName(battleOpponent?.name)}</span>
                        <div>
                            <strong>{battleOpponent?.name || 'SkillBot Rival'}</strong>
                            <p>Predviden rival score danes: {battlePreviewScore}/100</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="primary full-width"
                        disabled={!selectedBattleChallenge}
                        onClick={() => onStartSkillBattle({ opponentId: battleOpponent?.id, challengeId: selectedBattleChallenge?.id })}
                    >
                        Začni Skill Battle
                    </button>
                </article>
            </div>

            {lastCompetitionResult && <CompetitionResultCard result={lastCompetitionResult} />}
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
                    <span>Prompt studio</span>
                    <small>bolj strukturirani prompti za AI coacha</small>
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
                        <select value={newPrompt.skillKey || selectedSkillKey} onChange={(e) => setNewPrompt({ ...newPrompt, skillKey: e.target.value })}>
                            {(skills || []).map((skill) => <option key={skill.key} value={skill.key}>{skill.name}</option>)}
                        </select>
                    </label>
                    <label>Težavnost
                        <select value={newPrompt.difficulty} onChange={(e) => setNewPrompt({ ...newPrompt, difficulty: e.target.value })}>
                            <option value="BEGINNER">BEGINNER</option>
                            <option value="INTERMEDIATE">INTERMEDIATE</option>
                            <option value="ADVANCED">ADVANCED</option>
                        </select>
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
                <span className="pill">mentor ready</span>
            </div>
            <div className="report-grid">
                <MetricCard label="Simulacije" value={report.totalSessions} helper="Zaključene vaje" />
                <MetricCard label="Level" value={report.level || 1} helper={`${report.currentLevelXp || 0}/${report.nextLevelXp || 100} XP`} />
                <MetricCard label="Zvezdice" value={report.totalStars || 0} helper="Skupno zbranih" />
                <MetricCard label="Povprečje" value={`${report.averageScore}/100`} helper="Čez vse veščine" />
            </div>

            <GrowthInsightBoard insights={insights} skillName={skillName} />

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
            <article className="recommendations">
                <h3>Priporočila za nadaljnji razvoj</h3>
                {(report.recommendations || []).map((item) => <p key={item}><Icon name="arrowRight" size={14} /> {item}</p>)}
            </article>
        </div>
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
            avatarConfig: user.avatarConfig
        }))
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const meEntry = entries.find((entry) => entry.userId === me.id);
    if (meEntry) {
        meEntry.rank = 'po oddaji';
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
    const fallback = (text || '').trim() || 'AI coach ni vrnil besedila, ocena pa je shranjena.';
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
