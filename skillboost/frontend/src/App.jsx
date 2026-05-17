import { useEffect, useMemo, useState, useRef } from 'react';
import { api } from './api';
import keycloak from "./keycloak.js";

const emptyPrompt = {
    skillKey: 'public-speaking',
    title: '',
    difficulty: 'BEGINNER',
    systemPrompt: 'You are a practical soft-skills coach.',
    userPromptTemplate: 'Evaluate this answer: {{answer}}',
    simulatedAiResponse: '',
    tags: []
};

export default function App() {
    const isRun = useRef(false); // Blokada za React 18 Strict Mode..??

    const [authenticated, setAuthenticated] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('skillboost-theme') || 'light');
    const [health, setHealth] = useState(null);
    const [users, setUsers] = useState([]);
    const [skills, setSkills] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedSkillKey, setSelectedSkillKey] = useState('public-speaking');
    const [selectedChallengeId, setSelectedChallengeId] = useState('');
    const [answer, setAnswer] = useState('');
    const [lastSession, setLastSession] = useState(null);
    const [mentorNote, setMentorNote] = useState('');
    const [report, setReport] = useState(null);
    const [newPrompt, setNewPrompt] = useState(emptyPrompt);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'STUDENT', goals: '', targetSkills: '' });
    const [activeSection, setActiveSection] = useState('simulator');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isRun.current) return;
        isRun.current = true;

        keycloak.init({
            onLoad: 'check-sso',
            checkLoginIframe: false
        })
            .then((auth) => {
                if (auth) {
                    handleSuccessfulAuth();
                } else {
                    loadPublicData();
                }
            })
            .catch((err) => {
                console.error("Keycloak init failed:", err);
                loadPublicData();
            });
    }, []);

    //auto refresh zetona na 60 sekund
    useEffect(() => {
        const interval = setInterval(() => {
            if (keycloak.token) {
                keycloak.updateToken(70).then((refreshed) => {
                    if (refreshed) {
                        localStorage.setItem('token', keycloak.token);
                    }
                });
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('skillboost-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (selectedUserId) {
            loadReport(selectedUserId);
        }
    }, [selectedUserId]);

    useEffect(() => {
        const firstForSkill = challenges.find((challenge) => challenge.skillKey === selectedSkillKey);
        setSelectedChallengeId(firstForSkill?.id || '');
    }, [selectedSkillKey, challenges]);

    async function loadPublicData() {
        try {
            setError('');
            setLoading(true);
            const [healthResult, userResult, skillResult, challengeResult, promptResult] = await Promise.all([
                api.health(),
                api.getUsers(),
                api.getSkills(),
                api.getChallenges(),
                api.getPrompts()
            ]);
            setHealth(healthResult);
            setUsers(userResult);
            setSkills(skillResult);
            setChallenges(challengeResult);
            setPrompts(promptResult);
            setSelectedUserId(userResult[0]?.id || '');
            setSelectedSkillKey(skillResult[0]?.key || 'public-speaking');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSuccessfulAuth() {
        setAuthenticated(true);
        localStorage.setItem('token', keycloak.token);

        const keycloakId = keycloak.tokenParsed?.sub;
        const email = keycloak.tokenParsed?.email;
        const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username;

        try {
            setError('');
            setLoading(true);

            const [healthRes, userList, skillRes, challengeRes, promptRes] = await Promise.all([
                api.health(),
                api.getUsers(),
                api.getSkills(),
                api.getChallenges(),
                api.getPrompts()
            ]);

            setHealth(healthRes);
            setSkills(skillRes);
            setChallenges(challengeRes);
            setPrompts(promptRes);

            let currentMe = userList.find(u => u.keycloakId === keycloakId || u.email === email);

            if (!currentMe) {
                currentMe = await api.createUser({
                    keycloakId: keycloakId,
                    name: name,
                    email: email,
                    role: 'STUDENT',
                    goals: [],
                    targetSkills: []
                });
                const freshUsers = await api.getUsers();
                setUsers(freshUsers);
            } else {
                setUsers(userList);
            }

            setSelectedUserId(currentMe.id);
            setSelectedSkillKey(skillRes[0]?.key || 'public-speaking');
        } catch (err) {
            setError("Napaka pri nalaganju podatkov: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleLogin() {
        keycloak.login({ redirectUri: 'http://localhost:3000/' });
    }
    function handleRegister() {
        keycloak.register({ redirectUri: 'http://localhost:3000/' });
    }

    async function loadReport(userId) {
        try {
            const nextReport = await api.getReport(userId);
            setReport(nextReport);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmitSession(event) {
        event.preventDefault();
        if (!selectedUserId || !selectedChallengeId || !answer.trim()) {
            setError('Izberi uporabnika, izziv in vpiši odgovor.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            const session = await api.submitSession({
                userId: selectedUserId,
                challengeId: selectedChallengeId,
                skillKey: selectedSkillKey,
                userAnswer: answer
            });
            setLastSession(session);
            setAnswer('');
            await Promise.all([loadReport(selectedUserId), refreshUsers()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    //deluje kot javna registracija novega uporabnika
    async function handleRegisterUser(event) {
        event.preventDefault();
        try {
            setSaving(true);
            setError('');
            const created = await api.createUser({
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                goals: splitCsv(newUser.goals),
                targetSkills: splitCsv(newUser.targetSkills)
            });
            setUsers((current) => [created, ...current]);
            setSelectedUserId(created.id);
            setNewUser({ name: '', email: '', role: 'STUDENT', goals: '', targetSkills: '' });
        } catch (err) {
            setError('Registracija ni uspela: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleCreatePrompt(event) {
        event.preventDefault();
        try {
            setSaving(true);
            setError('');
            const created = await api.createPrompt({
                ...newPrompt,
                tags: Array.isArray(newPrompt.tags) ? newPrompt.tags : splitCsv(newPrompt.tags)
            });
            setPrompts((current) => [created, ...current]);
            setNewPrompt({ ...emptyPrompt, skillKey: selectedSkillKey });
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleMentorNote() {
        if (!lastSession?.id || !mentorNote.trim()) return;
        try {
            setSaving(true);
            setError('');
            const updated = await api.updateMentorNote(lastSession.id, { mentorNote });
            setLastSession(updated);
            setMentorNote('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function refreshUsers() {
        const freshUsers = await api.getUsers();
        setUsers(freshUsers);
    }

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId),
        [users, selectedUserId]
    );

    const filteredChallenges = useMemo(
        () => challenges.filter((challenge) => challenge.skillKey === selectedSkillKey),
        [challenges, selectedSkillKey]
    );

    const filteredPrompts = useMemo(
        () => prompts.filter((prompt) => prompt.skillKey === selectedSkillKey),
        [prompts, selectedSkillKey]
    );

    const selectedChallenge = useMemo(
        () => challenges.find((challenge) => challenge.id === selectedChallengeId),
        [challenges, selectedChallengeId]
    );

    const reportScore = report?.averageScore || 0;

    return (
        <div className="app-shell">
            <header className="topbar">
                <a className="brand" href="#top" aria-label="SkillBoost home">
                    <span className="brand-mark">S</span>
                    <span>SkillBoost</span>
                </a>
                <nav className="nav-pill" aria-label="Main navigation">
                    <button onClick={() => setActiveSection('simulator')} className={activeSection === 'simulator' ? 'active' : ''}>Simulator</button>
                    <button onClick={() => setActiveSection('skills')} className={activeSection === 'skills' ? 'active' : ''}>Skills</button>
                    <button onClick={() => setActiveSection('prompts')} className={activeSection === 'prompts' ? 'active' : ''}>Prompts</button>
                    <button onClick={() => setActiveSection('report')} className={activeSection === 'report' ? 'active' : ''}>Report</button>
                </nav>
                <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? 'Dark' : 'Light'} mode
                </button>

                {!authenticated ? (
                    <>
                        <button className="secondary" onClick={handleLogin} >
                            Prijava
                        </button>
                        <button className="primary" onClick={handleRegister} >
                            Registracija
                        </button>
                    </>
                ) : (
                    <button className="secondary" onClick={() => keycloak.logout()}>
                        Odjava ({keycloak.tokenParsed?.preferred_username})
                    </button>
                )}
            </header>

            <main id="top">
                <section className="hero-grid">
                    <div className="hero-card">
                        <p className="eyebrow">Soft-skills MVP</p>
                        <h1>Practice real situations, get mock AI feedback, track progress.</h1>
                        <p>
                            {authenticated
                                ? 'Prijavljen si preko varnega protokola Keycloak.'
                                : 'Pregleduješ aplikacijo kot gost. Za polno funkcionalnost in pošiljanje podatkov se prijavi.'}
                        </p>
                        <div className="hero-actions">
                            <button className="primary" onClick={() => setActiveSection('simulator')}>Start simulation</button>
                            <button className="secondary" onClick={() => setActiveSection('prompts')}>Open prompt library</button>
                        </div>
                    </div>

                    <div className="status-card">
                        <span className={`status-dot ${health?.status === 'UP' ? 'ok' : ''}`} />
                        <div>
                            <strong>Backend status</strong>
                            <p>{health?.status || 'Checking...'}</p>
                        </div>
                    </div>
                </section>

                {error && <div className="alert">{error}</div>}
                {loading && <div className="loading-card">Loading SkillBoost data...</div>}

                {!loading && (
                    <>
                        <section className="metrics-grid" aria-label="Progress metrics">
                            <MetricCard label="Active user" value={selectedUser?.name || 'None'} helper={selectedUser?.role || 'Create a user'} />
                            <MetricCard label="Points" value={selectedUser?.points ?? 0} helper="Updated after each simulation" />
                            <MetricCard label="Average score" value={`${reportScore}/100`} helper={`${report?.totalSessions || 0} completed sessions`} />
                            <MetricCard label="Badges" value={selectedUser?.badges?.length || 0} helper={(selectedUser?.badges || []).join(', ') || 'No badges yet'} />
                        </section>

                        <section className="workspace-grid">
                            <aside className="panel side-panel">
                                <div className="section-title">
                                    <span>Setup</span>
                                    <small>user + skill</small>
                                </div>

                                <label>
                                    User
                                    <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name} · {user.role}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Skill
                                    <select value={selectedSkillKey} onChange={(event) => setSelectedSkillKey(event.target.value)}>
                                        {skills.map((skill) => (
                                            <option key={skill.id} value={skill.key}>{skill.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="mini-list">
                                    {(skills.find((skill) => skill.key === selectedSkillKey)?.outcomes || []).map((outcome) => (
                                        <span key={outcome}>{outcome}</span>
                                    ))}
                                </div>
                            </aside>

                            <section className="panel main-panel">
                                {activeSection === 'simulator' && (
                                    <SimulatorSection
                                        filteredChallenges={filteredChallenges}
                                        selectedChallengeId={selectedChallengeId}
                                        setSelectedChallengeId={setSelectedChallengeId}
                                        selectedChallenge={selectedChallenge}
                                        answer={answer}
                                        setAnswer={setAnswer}
                                        saving={saving}
                                        authenticated={authenticated}
                                        handleSubmitSession={handleSubmitSession}
                                        lastSession={lastSession}
                                        mentorNote={mentorNote}
                                        setMentorNote={setMentorNote}
                                        handleMentorNote={handleMentorNote}
                                    />
                                )}

                                {activeSection === 'skills' && <SkillsSection skills={skills} challenges={challenges} />}

                                {activeSection === 'prompts' && (
                                    <PromptsSection
                                        filteredPrompts={filteredPrompts}
                                        newPrompt={newPrompt}
                                        setNewPrompt={setNewPrompt}
                                        handleCreatePrompt={handleCreatePrompt}
                                        selectedSkillKey={selectedSkillKey}
                                        saving={saving}
                                        authenticated={authenticated}
                                    />
                                )}

                                {activeSection === 'report' && <ReportSection report={report} />}
                            </section>

                            <aside className="panel side-panel">
                                <div className="section-title">
                                    <span>Registracija</span>
                                    <small>Ustvari nov račun</small>
                                </div>
                                {/*Form sedaj sproži handleRegisterUser, gumb pa ni več zaklenjen s Keycloak pogojem */}
                                <form className="stack" onSubmit={handleRegisterUser}>
                                    <input placeholder="Name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} />
                                    <input placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
                                    <input placeholder="Goals, comma separated" value={newUser.goals} onChange={(event) => setNewUser({ ...newUser, goals: event.target.value })} />
                                    <input placeholder="Target skills, comma separated" value={newUser.targetSkills} onChange={(event) => setNewUser({ ...newUser, targetSkills: event.target.value })} />
                                    <button className="secondary" disabled={saving}>
                                        {saving ? 'Registracija...' : 'Registriraj uporabnika'}
                                    </button>
                                </form>
                            </aside>
                        </section>
                    </>
                )}
            </main>
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

function SimulatorSection({
                              filteredChallenges,
                              selectedChallengeId,
                              setSelectedChallengeId,
                              selectedChallenge,
                              answer,
                              setAnswer,
                              saving,
                              authenticated,
                              handleSubmitSession,
                              lastSession,
                              mentorNote,
                              setMentorNote,
                              handleMentorNote
                          }) {
    return (
        <div className="content-section">
            <div className="section-title">
                <span>Simulation</span>
                <small>mock AI evaluator</small>
            </div>

            <form className="simulation-form" onSubmit={handleSubmitSession}>
                <label>
                    Challenge
                    <select value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)}>
                        {filteredChallenges.map((challenge) => (
                            <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
                        ))}
                    </select>
                </label>

                {selectedChallenge && (
                    <div className="challenge-card">
                        <div>
                            <h3>{selectedChallenge.title}</h3>
                            <p>{selectedChallenge.scenario}</p>
                        </div>
                        <span>{selectedChallenge.estimatedMinutes} min</span>
                    </div>
                )}

                <label>
                    Your answer
                    <textarea
                        rows="8"
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        placeholder="Write your response to the simulated situation..."
                    />
                </label>

                <button className="primary" disabled={saving || !authenticated}>
                    {saving ? 'Saving...' : authenticated ? 'Submit simulation' : 'Za ocenjevanje se moraš prijaviti'}
                </button>
            </form>

            {lastSession && (
                <div className="feedback-card">
                    <div className="score-circle">{lastSession.score}</div>
                    <div>
                        <h3>Mock AI feedback</h3>
                        <pre>{lastSession.aiFeedback}</pre>
                        {lastSession.mentorNote && <p className="mentor-note"><strong>Mentor:</strong> {lastSession.mentorNote}</p>}
                        <div className="mentor-row">
                            <input placeholder="Add mentor note" value={mentorNote} onChange={(event) => setMentorNote(event.target.value)} />
                            <button className="secondary" type="button" disabled={!authenticated} onClick={handleMentorNote}>Save note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SkillsSection({ skills, challenges }) {
    return (
        <div className="content-section">
            <div className="section-title">
                <span>Skill catalogue</span>
                <small>{skills.length} skills</small>
            </div>
            <div className="cards-grid">
                {skills.map((skill) => (
                    <article key={skill.id} className="skill-card">
                        <p>{skill.category}</p>
                        <h3>{skill.name}</h3>
                        <span>{skill.level} · {skill.estimatedMinutes} min</span>
                        <p>{skill.description}</p>
                        <div className="mini-list">
                            {skill.outcomes.map((outcome) => <span key={outcome}>{outcome}</span>)}
                        </div>
                        <small>{challenges.filter((challenge) => challenge.skillKey === skill.key).length} challenges</small>
                    </article>
                ))}
            </div>
        </div>
    );
}

function PromptsSection({ filteredPrompts, newPrompt, setNewPrompt, handleCreatePrompt, selectedSkillKey, saving, authenticated }) {
    return (
        <div className="content-section">
            <div className="section-title">
                <span>Prompt library</span>
                <small>mock LLM JSON</small>
            </div>

            <div className="prompt-layout">
                <div className="prompt-list">
                    {filteredPrompts.map((prompt) => (
                        <article key={prompt.id} className="prompt-card">
                            <p>{prompt.difficulty}</p>
                            <h3>{prompt.title}</h3>
                            <code>{prompt.userPromptTemplate}</code>
                            <pre>{prompt.simulatedAiResponse}</pre>
                        </article>
                    ))}
                </div>

                <form className="prompt-form" onSubmit={handleCreatePrompt}>
                    <h3>Add prompt</h3>
                    <input value={newPrompt.title} onChange={(event) => setNewPrompt({ ...newPrompt, title: event.target.value })} placeholder="Prompt title" />
                    <select value={newPrompt.skillKey || selectedSkillKey} onChange={(event) => setNewPrompt({ ...newPrompt, skillKey: event.target.value })}>
                        <option value="public-speaking">public-speaking</option>
                        <option value="conflict-resolution">conflict-resolution</option>
                        <option value="team-collaboration">team-collaboration</option>
                        <option value="job-interview">job-interview</option>
                    </select>
                    <textarea rows="3" value={newPrompt.systemPrompt} onChange={(event) => setNewPrompt({ ...newPrompt, systemPrompt: event.target.value })} placeholder="System prompt" />
                    <textarea rows="3" value={newPrompt.userPromptTemplate} onChange={(event) => setNewPrompt({ ...newPrompt, userPromptTemplate: event.target.value })} placeholder="User prompt template" />
                    <textarea rows="4" value={newPrompt.simulatedAiResponse} onChange={(event) => setNewPrompt({ ...newPrompt, simulatedAiResponse: event.target.value })} placeholder="Simulated AI response" />
                    <input value={Array.isArray(newPrompt.tags) ? newPrompt.tags.join(', ') : newPrompt.tags} onChange={(event) => setNewPrompt({ ...newPrompt, tags: event.target.value })} placeholder="tags, comma separated" />
                    <button className="primary" disabled={saving || !authenticated}>
                        {authenticated ? 'Save prompt' : 'Prijavi se za shranjevanje'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ReportSection({ report }) {
    if (!report) {
        return <div className="content-section">No report yet.</div>;
    }

    return (
        <div className="content-section">
            <div className="section-title">
                <span>Progress report</span>
                <small>{report.userName}</small>
            </div>

            <div className="report-grid">
                <MetricCard label="Sessions" value={report.totalSessions} helper="Completed simulations" />
                <MetricCard label="Points" value={report.totalPoints} helper="Gamified progress" />
                <MetricCard label="Average" value={`${report.averageScore}/100`} helper="Across all sessions" />
            </div>

            <div className="cards-grid single">
                {report.skillProgress.map((skill) => (
                    <article key={skill.skillKey} className="skill-card">
                        <p>{skill.skillKey}</p>
                        <h3>{skill.averageScore}/100</h3>
                        <span>{skill.sessions} sessions</span>
                        <p>Next: {skill.nextSuggestedChallenge}</p>
                    </article>
                ))}
            </div>

            <div className="recommendations">
                <h3>Recommendations</h3>
                {report.recommendations.map((item) => <p key={item}>→ {item}</p>)}
            </div>
        </div>
    );
}

function splitCsv(value) {
    if (!value) return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}