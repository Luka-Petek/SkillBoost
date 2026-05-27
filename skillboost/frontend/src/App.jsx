import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';
import { ProfileSection } from './components/ProfileSection';
import { Icon } from './components/Icon';
import {
    CompetitionSection,
    DailyQuests,
    GrowthFocusPanel,
    MetricCard,
    PlayerStatus,
    PromptsSection,
    ReportSection,
    SelectedSkillsDock,
    SimulatorSection,
    SkillSelector,
    SkillsSection
} from './components/AppSections';

export default function App() {
    const [activeSection, setActiveSection] = useState('simulator');
    const { theme, toggleTheme } = useTheme();
    const data = useAppData();

    const { authenticated, handleLogin, handleRegister, handleLogout, username } = useAuth(
        data.handleSuccessfulAuth,
        data.loadPublicData
    );

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
                    <button onClick={() => setActiveSection('competition')} className={activeSection === 'competition' ? 'active' : ''}>Tekmovanje</button>
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
                            <MetricCard label="Streak" value={<span className="metric-inline"><Icon name="flame" size={19} />{streakDays}</span>} helper="dnevni niz vaj" />
                        </section>

                        <PlayerStatus user={data.selectedUser} report={data.report} />

                        {activeSection !== 'skills' && (
                            <SelectedSkillsDock
                                skills={data.skills}
                                selectedSkillKeys={data.selectedSkillKeys}
                                toggleSkillKey={data.toggleSkillKey}
                                clearSkills={() => data.setSelectedSkillKeys([])}
                                openSkills={() => setActiveSection('skills')}
                                startSimulator={() => setActiveSection('simulator')}
                            />
                        )}

                        <section className={`workspace-grid ${activeSection === 'skills' ? 'workspace-grid--catalog' : ''}`}>
                            <aside className="panel side-panel">
                                <SkillSelector
                                    skills={data.skills}
                                    selectedSkillKeys={data.selectedSkillKeys}
                                    toggleSkillKey={data.toggleSkillKey}
                                />
                                <GrowthFocusPanel
                                    skills={data.skills}
                                    report={data.report}
                                    preferredSkillKeys={data.preferredSkillKeys}
                                    togglePreferredSkillKey={data.togglePreferredSkillKey}
                                    personalizedDailyChallenge={data.personalizedDailyChallenge}
                                    dailyChallengeActive={data.dailyChallengeActive}
                                    onStartDailyChallenge={data.handleStartDailyChallenge}
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
                                        report={data.report}
                                        preferredSkillKeys={data.preferredSkillKeys}
                                        personalizedDailyChallenge={data.personalizedDailyChallenge}
                                        dailyChallengeActive={data.dailyChallengeActive}
                                        setDailyChallengeActive={data.setDailyChallengeActive}
                                        handleStartDailyChallenge={data.handleStartDailyChallenge}
                                        customSituation={data.customSituation}
                                        setCustomSituation={data.setCustomSituation}
                                        competitionMode={data.competitionMode}
                                        competitionOpponent={data.competitionOpponent}
                                        lastCompetitionResult={data.lastCompetitionResult}
                                        onCancelCompetition={data.handleCancelCompetition}
                                    />
                                )}

                                {activeSection === 'skills' && (
                                    <SkillsSection
                                        skills={data.skills}
                                        challenges={data.challenges}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        toggleSkillKey={data.toggleSkillKey}
                                        setSelectedSkillKey={data.setSelectedSkillKey}
                                        setSelectedSkillKeys={data.setSelectedSkillKeys}
                                        setSelectedChallengeId={data.setSelectedChallengeId}
                                        openSimulator={() => setActiveSection('simulator')}
                                    />
                                )}

                                {activeSection === 'competition' && (
                                    <CompetitionSection
                                        users={data.users}
                                        selectedUser={data.selectedUser}
                                        skills={data.skills}
                                        challenges={data.challenges}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        dailyDuelChallenge={data.dailyDuelChallenge}
                                        lastCompetitionResult={data.lastCompetitionResult}
                                        onStartDailyDuel={() => {
                                            data.handleStartDailyDuel();
                                            setActiveSection('simulator');
                                        }}
                                        onStartSkillBattle={(payload) => {
                                            data.handleStartSkillBattle(payload);
                                            setActiveSection('simulator');
                                        }}
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

                                {activeSection === 'report' && <ReportSection report={data.report} skills={data.skills} />}

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

