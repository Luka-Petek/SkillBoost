import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';
import { ProfileSection } from './components/ProfileSection';

const scoreLabels = [
    { min: 85, label: 'Odlično', tone: 'great' },
    { min: 70, label: 'Dobro', tone: 'good' },
    { min: 50, label: 'V razvoju', tone: 'warn' },
    { min: 0, label: 'Za vajo', tone: 'danger' }
];

export default function App() {
    const [activeSection, setActiveSection] = useState('simulator');
    const { theme, toggleTheme } = useTheme();
    const data = useAppData();

    const { authenticated, handleLogin, handleRegister, handleLogout, username } = useAuth(
        data.handleSuccessfulAuth,
        data.loadPublicData
    );

    const reportScore = data.report?.averageScore || 0;
    const selectedSkillNames = data.selectedSkills.map((skill) => skill.name).join(', ') || 'Izberi veščine';
    const player = data.selectedUser || {};
    const level = player.level || data.report?.level || 1;
    const totalStars = player.totalStars ?? data.report?.totalStars ?? 0;
    const streakDays = player.streakDays ?? data.report?.streakDays ?? 0;

    return (
        <div className="app-shell">
            <header className="topbar">
                <a className="brand" href="#top" aria-label="SkillBoost home">
                    <span className="brand-mark">SB</span>
                    <span>SkillBoost</span>
                </a>
                <nav className="nav-pill" aria-label="Glavna navigacija">
                    <button onClick={() => setActiveSection('simulator')} className={activeSection === 'simulator' ? 'active' : ''}>Simulator</button>
                    <button onClick={() => setActiveSection('skills')} className={activeSection === 'skills' ? 'active' : ''}>Veščine</button>
                    <button onClick={() => setActiveSection('prompts')} className={activeSection === 'prompts' ? 'active' : ''}>Prompti</button>
                    <button onClick={() => setActiveSection('report')} className={activeSection === 'report' ? 'active' : ''}>Poročilo</button>
                </nav>
                <div className="topbar-actions">
                    <button className="theme-toggle" onClick={toggleTheme}>{theme === 'light' ? 'Temni način' : 'Svetli način'}</button>
                    {!authenticated ? (
                        <>
                            <button className="secondary" onClick={handleLogin}>Prijava</button>
                            <button className="primary" onClick={handleRegister}>Registracija</button>
                        </>
                    ) : (
                        <>
                            <button className={`secondary ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>
                                Moj profil
                            </button>
                            <button className="secondary" onClick={handleLogout}>
                                Odjava ({username})
                            </button>
                        </>
                    )}
                </div>
            </header>

            <main id="top">
                <section className="hero-grid">
                    <article className="hero-card">
                        <p className="eyebrow">AI trener mehkih veščin</p>
                        <h1>Vadi realne situacije, dobi pametno povratno informacijo in spremljaj napredek.</h1>
                        <p>
                            SkillBoost združuje personaliziran učni načrt, več izbranih veščin naenkrat, simulacije pogovorov,
                            mentorjeve zapiske in napredno poročilo o napredku.
                        </p>
                        <div className="hero-actions">
                            <button className="primary" onClick={() => setActiveSection('simulator')}>Začni simulacijo</button>
                            <button className="secondary" onClick={() => setActiveSection('skills')}>Izberi več veščin</button>
                        </div>
                        <div className="hero-strip" aria-label="Trenutni fokus">
                            <span>Fokus</span>
                            <strong>{selectedSkillNames}</strong>
                        </div>
                    </article>

                    <aside className="status-stack" aria-label="Stanje sistema">
                        <div className="status-card compact">
                            <span className={`status-dot ${data.health?.status === 'UP' || data.health?.status === 'DEMO' ? 'ok' : ''}`} />
                            <div>
                                <strong>Backend</strong>
                                <p>{data.health?.status || 'Preverjam...'}</p>
                            </div>
                        </div>
                        <div className="coach-preview">
                            <span className="spark">AI</span>
                            <h2>Interaktivni coach</h2>
                            <p>Po oddaji odgovora dobiš oceno, razlago, vprašanje za razmislek in naslednji korak.</p>
                        </div>
                    </aside>
                </section>

                {data.error && <div className="alert">{data.error}</div>}
                {data.loading && <div className="loading-card">Nalagam SkillBoost podatke...</div>}

                {!data.loading && (
                    <>
                        <section className="metrics-grid" aria-label="Metrike napredka">
                            <MetricCard label="Aktivni uporabnik" value={data.selectedUser?.name || 'Gost'} helper={data.selectedUser?.role || 'Prijava odklene shranjevanje'} />
                            <MetricCard label="Level" value={level} helper={`${player.currentLevelXp ?? data.report?.currentLevelXp ?? 0}/${player.nextLevelXp ?? data.report?.nextLevelXp ?? 100} XP do naslednjega`} />
                            <MetricCard label="Zvezdice" value={totalStars} helper="Zbirajo se po simulacijah" />
                            <MetricCard label="Streak" value={`🔥 ${streakDays}`} helper="dnevni niz vaj" />
                        </section>

                        <PlayerStatus user={data.selectedUser} report={data.report} />

                        <section className="workspace-grid">
                            <aside className="panel side-panel">
                                <SkillSelector
                                    skills={data.skills}
                                    selectedSkillKeys={data.selectedSkillKeys}
                                    toggleSkillKey={data.toggleSkillKey}
                                />
                            </aside>

                            <section className="panel main-panel">
                                {activeSection === 'simulator' && (
                                    <SimulatorSection
                                        skills={data.skills}
                                        demoMode={data.demoMode}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        filteredChallenges={data.filteredChallenges}
                                        selectedChallengeId={data.selectedChallengeId}
                                        setSelectedChallengeId={data.setSelectedChallengeId}
                                        selectedChallenge={data.selectedChallenge}
                                        answer={data.answer}
                                        setAnswer={data.setAnswer}
                                        saving={data.saving}
                                        authenticated={authenticated}
                                        handleSubmitSession={data.handleSubmitSession}
                                        lastSession={data.lastSession}
                                        lastReward={data.lastReward}
                                        mentorNote={data.mentorNote}
                                        setMentorNote={data.setMentorNote}
                                        handleMentorNote={data.handleMentorNote}
                                    />
                                )}

                                {activeSection === 'skills' && (
                                    <SkillsSection
                                        skills={data.skills}
                                        challenges={data.challenges}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        toggleSkillKey={data.toggleSkillKey}
                                    />
                                )}

                                {activeSection === 'prompts' && (
                                    <PromptsSection
                                        skills={data.skills}
                                        filteredPrompts={data.filteredPrompts}
                                        newPrompt={data.newPrompt}
                                        setNewPrompt={data.setNewPrompt}
                                        handleCreatePrompt={data.handleCreatePrompt}
                                        selectedSkillKey={data.selectedSkillKey}
                                        saving={data.saving}
                                        authenticated={authenticated}
                                    />
                                )}

                                {activeSection === 'report' && <ReportSection report={data.report} />}

                                {activeSection === 'profile' && (
                                    <ProfileSection
                                        profile={data.myProfile}
                                        onUpdate={data.handleUpdateProfile}
                                        saving={data.saving}
                                    />
                                )}
                            </section>

                            <aside className="panel side-panel progress-panel">
                                <DailyQuests quests={data.lastReward?.dailyQuests || data.report?.dailyQuests} />
                            </aside>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

function PlayerStatus({ user, report }) {
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

function DailyQuests({ quests }) {
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
                        <span>{quest.completed ? '✓' : '○'}</span>
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

function MetricCard({ label, value, helper }) {
    return (
        <article className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{helper}</p>
        </article>
    );
}

function SkillSelector({ skills, selectedSkillKeys, toggleSkillKey }) {
    return (
        <div className="skill-selector">
            <p className="eyebrow">Učni fokus</p>
            <h2>Več veščin naenkrat</h2>
            <p>Označi vse veščine, ki jih želiš vaditi. Simulator in prompti se prilagodijo izboru.</p>
            <div className="skill-chip-list">
                {(skills || []).map((skill) => (
                    <button
                        key={skill.id}
                        type="button"
                        className={`skill-chip ${selectedSkillKeys.includes(skill.key) ? 'selected' : ''}`}
                        onClick={() => toggleSkillKey(skill.key)}
                    >
                        <span>{selectedSkillKeys.includes(skill.key) ? '✓' : '+'}</span>
                        {skill.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SimulatorSection({ skills, demoMode, selectedSkillKeys, filteredChallenges, selectedChallengeId, setSelectedChallengeId, selectedChallenge, answer, setAnswer, saving, authenticated, handleSubmitSession, lastSession, lastReward, mentorNote, setMentorNote, handleMentorNote }) {
    const answerStats = useMemo(() => getAnswerStats(answer), [answer]);
    const selectedSkillNames = skills.filter((skill) => selectedSkillKeys.includes(skill.key)).map((skill) => skill.name);

    return (
        <div className="content-section">
            <div className="section-title">
                <div>
                    <span>Interaktivna simulacija</span>
                    <small>AI ocenjevanje z več veščinami</small>
                </div>
                <span className="pill">{selectedSkillNames.length} izbranih</span>
            </div>

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
                    <textarea
                        rows="9"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Napiši, kaj bi rekel v situaciji. Poskusi vključiti kontekst, empatijo, jasen predlog in naslednji korak."
                    />
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
                            AI coach pripravlja odgovor...
                        </>
                    ) : authenticated || demoMode ? 'Oddaj in prejmi AI povratno informacijo' : 'Za ocenjevanje se moraš prijaviti'}
                </button>
            </form>

            {lastSession && !saving && <FeedbackCard lastSession={lastSession} reward={lastReward} mentorNote={mentorNote} setMentorNote={setMentorNote} authenticated={authenticated} handleMentorNote={handleMentorNote} />}
        </div>
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
                            {item.done ? '✓' : '•'} {item.label}
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
                        <span>🔥 {reward.streakDays} dni</span>
                        {reward.leveledUp && <span>Level up: {reward.oldLevel} → {reward.newLevel}</span>}
                    </div>
                )}
                <div className="section-title compact-title">
                    <span>AI povratna informacija</span>
                    <small>hitro razdeljeno na pohvalo, izboljšavo, primer in naslednje vprašanje</small>
                </div>
                <FeedbackSections text={lastSession.aiFeedback} score={lastSession.score} />
                {reward?.newBadges?.length > 0 && <div className="new-badges">{reward.newBadges.map((badge) => <span key={badge}>🏅 {badge}</span>)}</div>}
                {lastSession.mentorNote && <p className="mentor-note"><strong>Mentor:</strong> {lastSession.mentorNote}</p>}
                <div className="mentor-row">
                    <input placeholder="Dodaj mentorjev komentar ali naslednjo nalogo" value={mentorNote} onChange={(e) => setMentorNote(e.target.value)} />
                    <button className="secondary" type="button" disabled={!authenticated} onClick={handleMentorNote}>Shrani opombo</button>
                </div>
            </div>
        </article>
    );
}

function FeedbackSections({ text, score }) {
    const sections = parseFeedbackSections(text, score);

    return (
        <div className="feedback-sections">
            {sections.map((section) => (
                <section key={section.key} className={`feedback-section ${section.key}`}>
                    <div className="feedback-section-icon" aria-hidden="true">{section.icon}</div>
                    <div>
                        <h3>{section.title}</h3>
                        {section.lines.map((line, index) => <p key={`${section.key}-${index}`}>{line}</p>)}
                    </div>
                </section>
            ))}
        </div>
    );
}

function SkillsSection({ skills, challenges, selectedSkillKeys, toggleSkillKey }) {
    return (
        <div className="content-section">
            <div className="section-title">
                <div>
                    <span>Katalog veščin</span>
                    <small>{(skills || []).length} področij za razvoj</small>
                </div>
                <span className="pill">Klikni za izbor</span>
            </div>
            <div className="cards-grid">
                {(skills || []).map((skill) => (
                    <article key={skill.id} className={`skill-card interactive ${selectedSkillKeys.includes(skill.key) ? 'selected' : ''}`} onClick={() => toggleSkillKey(skill.key)}>
                        <p>{skill.category}</p>
                        <h3>{skill.name}</h3>
                        <span>{skill.level} · {skill.estimatedMinutes} min</span>
                        <p>{skill.description}</p>
                        <div className="mini-list">{(skill.outcomes || []).map((outcome) => <span key={outcome}>{outcome}</span>)}</div>
                        <small>{(challenges || []).filter((challenge) => challenge.skillKey === skill.key).length} izzivov</small>
                    </article>
                ))}
            </div>
        </div>
    );
}

function PromptsSection({ skills, filteredPrompts, newPrompt, setNewPrompt, handleCreatePrompt, selectedSkillKey, saving, authenticated }) {
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

function ReportSection({ report }) {
    if (!report) return <div className="content-section empty-state">Poročilo še ni na voljo. Najprej oddaj simulacijo.</div>;
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
            <div className="cards-grid single">
                {(report.skillProgress || []).map((skill) => (
                    <article key={skill.skillKey} className="skill-card report-card">
                        <p>{skill.skillKey}</p>
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
                {(report.recommendations || []).map((item) => <p key={item}>→ {item}</p>)}
            </article>
        </div>
    );
}


function parseFeedbackSections(text, score) {
    const fallback = (text || '').trim() || 'AI coach ni vrnil besedila, ocena pa je shranjena.';
    const sectionMeta = {
        score: { title: 'Ocena', icon: '🎯' },
        good: { title: 'Dobro', icon: '✅' },
        improve: { title: 'Izboljšaj', icon: '🔧' },
        example: { title: 'Boljša verzija', icon: '💬' },
        question: { title: 'Vprašanje', icon: '✨' },
        summary: { title: 'Povzetek', icon: '🧠' }
    };

    const labelToKey = (label) => {
        const normalized = label
            .toLowerCase()
            .replaceAll('š', 's')
            .replaceAll('ž', 'z')
            .replaceAll('č', 'c');

        if (normalized.includes('ocena')) return 'score';
        if (normalized.includes('dobro')) return 'good';
        if (normalized.includes('izboljs') || normalized.includes('kaj izboljsati')) return 'improve';
        if (normalized.includes('boljsa') || normalized.includes('verzija') || normalized.includes('primer')) return 'example';
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
    return '★'.repeat(count) + '☆'.repeat(Math.max(0, 3 - count));
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
