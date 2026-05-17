import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';

export default function App() {
    const [activeSection, setActiveSection] = useState('simulator');
    const { theme, toggleTheme } = useTheme();
    const data = useAppData();

    const { authenticated, handleLogin, handleRegister, handleLogout, username } = useAuth(
        data.handleSuccessfulAuth,
        data.loadPublicData
    );

    const reportScore = data.report?.averageScore || 0;

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
                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? 'Dark' : 'Light'} mode
                </button>

                {!authenticated ? (
                    <>
                        <button className="secondary" onClick={handleLogin}>Prijava</button>
                        <button className="primary" onClick={handleRegister}>Registracija</button>
                    </>
                ) : (
                    <button className="secondary" onClick={handleLogout}>
                        Odjava ({username})
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
                        <span className={`status-dot ${data.health?.status === 'UP' ? 'ok' : ''}`} />
                        <div>
                            <strong>Backend status</strong>
                            <p>{data.health?.status || 'Checking...'}</p>
                        </div>
                    </div>
                </section>

                {data.error && <div className="alert">{data.error}</div>}
                {data.loading && <div className="loading-card">Loading SkillBoost data...</div>}

                {!data.loading && (
                    <>
                        <section className="metrics-grid" aria-label="Progress metrics">
                            <MetricCard label="Active user" value={data.selectedUser?.name || 'None'} helper={data.selectedUser?.role || 'Create a user'} />
                            <MetricCard label="Points" value={data.selectedUser?.points ?? 0} helper="Updated after each simulation" />
                            <MetricCard label="Average score" value={`${reportScore}/100`} helper={`${data.report?.totalSessions || 0} completed sessions`} />
                            <MetricCard label="Badges" value={data.selectedUser?.badges?.length || 0} helper={(data.selectedUser?.badges || []).join(', ') || 'No badges yet'} />
                        </section>

                        <section className="workspace-grid">
                            <aside className="panel side-panel">
                                <div className="section-title">
                                    <span>Setup</span>
                                    <small>user + skill</small>
                                </div>

                                <label>
                                    User
                                    <select value={data.selectedUserId} onChange={(e) => data.setSelectedUserId(e.target.value)}>
                                        {data.users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name} · {user.role}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Skill
                                    <select value={data.selectedSkillKey} onChange={(e) => data.setSelectedSkillKey(e.target.value)}>
                                        {data.skills.map((skill) => (
                                            <option key={skill.id} value={skill.key}>{skill.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="mini-list">
                                    {(data.skills.find((skill) => skill.key === data.selectedSkillKey)?.outcomes || []).map((outcome) => (
                                        <span key={outcome}>{outcome}</span>
                                    ))}
                                </div>
                            </aside>

                            <section className="panel main-panel">
                                {activeSection === 'simulator' && (
                                    <SimulatorSection
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
                                        mentorNote={data.mentorNote}
                                        setMentorNote={data.setMentorNote}
                                        handleMentorNote={data.handleMentorNote}
                                    />
                                )}

                                {activeSection === 'skills' && <SkillsSection skills={data.skills} challenges={data.challenges} />}

                                {activeSection === 'prompts' && (
                                    <PromptsSection
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
                            </section>

                            <aside className="panel side-panel">
                                <div className="section-title">
                                    <span>Registracija</span>
                                    <small>Ustvari nov račun</small>
                                </div>
                                <form className="stack" onSubmit={data.handleRegisterUser}>
                                    <input placeholder="Name" value={data.newUser.name} onChange={(e) => data.setNewUser({ ...data.newUser, name: e.target.value })} />
                                    <input placeholder="Email" value={data.newUser.email} onChange={(e) => data.setNewUser({ ...data.newUser, email: e.target.value })} />
                                    <input placeholder="Goals, comma separated" value={data.newUser.goals} onChange={(e) => data.setNewUser({ ...data.newUser, goals: e.target.value })} />
                                    <input placeholder="Target skills, comma separated" value={data.newUser.targetSkills} onChange={(e) => data.setNewUser({ ...data.newUser, targetSkills: e.target.value })} />
                                    <button className="secondary" disabled={data.saving}>
                                        {data.saving ? 'Registracija...' : 'Registriraj uporabnika'}
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

function SimulatorSection({ filteredChallenges, selectedChallengeId, setSelectedChallengeId, selectedChallenge, answer, setAnswer, saving, authenticated, handleSubmitSession, lastSession, mentorNote, setMentorNote, handleMentorNote }) {
    return (
        <div className="content-section">
            <div className="section-title"><span>Simulation</span><small>mock AI evaluator</small></div>
            <form className="simulation-form" onSubmit={handleSubmitSession}>
                <label>Challenge
                    <select value={selectedChallengeId} onChange={(e) => setSelectedChallengeId(e.target.value)}>
                        {filteredChallenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </label>
                {selectedChallenge && (
                    <div className="challenge-card">
                        <div><h3>{selectedChallenge.title}</h3><p>{selectedChallenge.scenario}</p></div>
                        <span>{selectedChallenge.estimatedMinutes} min</span>
                    </div>
                )}
                <label>Your answer
                    <textarea rows="8" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your response to the simulated situation..." />
                </label>
                <button className="primary" disabled={saving || !authenticated}>
                    {saving ? 'Saving...' : authenticated ? 'Submit simulation' : 'Za ocenjevanje se moraš prijaviti'}
                </button>
            </form>
            {lastSession && (
                <div className="feedback-card">
                    <div className="score-circle">{lastSession.score}</div>
                    <div>
                        <h3>Mock AI feedback</h3><pre>{lastSession.aiFeedback}</pre>
                        {lastSession.mentorNote && <p className="mentor-note"><strong>Mentor:</strong> {lastSession.mentorNote}</p>}
                        <div className="mentor-row">
                            <input placeholder="Add mentor note" value={mentorNote} onChange={(e) => setMentorNote(e.target.value)} />
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
            <div className="section-title"><span>Skill catalogue</span><small>{skills.length} skills</small></div>
            <div className="cards-grid">
                {skills.map((skill) => (
                    <article key={skill.id} className="skill-card">
                        <p>{skill.category}</p><h3>{skill.name}</h3><span>{skill.level} · {skill.estimatedMinutes} min</span>
                        <p>{skill.description}</p>
                        <div className="mini-list">{skill.outcomes.map((o) => <span key={o}>{o}</span>)}</div>
                        <small>{challenges.filter((c) => c.skillKey === skill.key).length} challenges</small>
                    </article>
                ))}
            </div>
        </div>
    );
}

function PromptsSection({ filteredPrompts, newPrompt, setNewPrompt, handleCreatePrompt, selectedSkillKey, saving, authenticated }) {
    return (
        <div className="content-section">
            <div className="section-title"><span>Prompt library</span><small>mock LLM JSON</small></div>
            <div className="prompt-layout">
                <div className="prompt-list">
                    {filteredPrompts.map((p) => (
                        <article key={p.id} className="prompt-card">
                            <p>{p.difficulty}</p><h3>{p.title}</h3><code>{p.userPromptTemplate}</code><pre>{p.simulatedAiResponse}</pre>
                        </article>
                    ))}
                </div>
                <form className="prompt-form" onSubmit={handleCreatePrompt}>
                    <h3>Add prompt</h3>
                    <input value={newPrompt.title} onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} placeholder="Prompt title" />
                    <select value={newPrompt.skillKey || selectedSkillKey} onChange={(e) => setNewPrompt({ ...newPrompt, skillKey: e.target.value })}>
                        <option value="public-speaking">public-speaking</option>
                        <option value="conflict-resolution">conflict-resolution</option>
                        <option value="team-collaboration">team-collaboration</option>
                        <option value="job-interview">job-interview</option>
                    </select>
                    <textarea rows="3" value={newPrompt.systemPrompt} onChange={(e) => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })} placeholder="System prompt" />
                    <textarea rows="3" value={newPrompt.userPromptTemplate} onChange={(e) => setNewPrompt({ ...newPrompt, userPromptTemplate: e.target.value })} placeholder="User prompt template" />
                    <textarea rows="4" value={newPrompt.simulatedAiResponse} onChange={(e) => setNewPrompt({ ...newPrompt, simulatedAiResponse: e.target.value })} placeholder="Simulated AI response" />
                    <input value={Array.isArray(newPrompt.tags) ? newPrompt.tags.join(', ') : newPrompt.tags} onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })} placeholder="tags, comma separated" />
                    <button className="primary" disabled={saving || !authenticated}>
                        {authenticated ? 'Save prompt' : 'Prijavi se za shranjevanje'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ReportSection({ report }) {
    if (!report) return <div className="content-section">No report yet.</div>;
    return (
        <div className="content-section">
            <div className="section-title"><span>Progress report</span><small>{report.userName}</small></div>
            <div className="report-grid">
                <MetricCard label="Sessions" value={report.totalSessions} helper="Completed simulations" />
                <MetricCard label="Points" value={report.totalPoints} helper="Gamified progress" />
                <MetricCard label="Average" value={`${report.averageScore}/100`} helper="Across all sessions" />
            </div>
            <div className="cards-grid single">
                {report.skillProgress.map((s) => (
                    <article key={s.skillKey} className="skill-card">
                        <p>{s.skillKey}</p><h3>{s.averageScore}/100</h3><span>{s.sessions} sessions</span><p>Next: {s.nextSuggestedChallenge}</p>
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