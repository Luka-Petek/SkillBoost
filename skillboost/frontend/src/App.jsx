import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';
import { ProfileSection } from './components/ProfileSection';
import { SkillQuestMap } from './components/SkillQuestMap';
import { LogoIntro } from './components/LogoIntro';
import { Icon } from './components/Icon';
import { AvatarMini } from './components/AvatarStudio';
import {
    CompetitionSection,
    DailyQuests,
    EngagementDashboard,
    GrowthFocusPanel,
    MentorDashboardSection,
    MetricCard,
    PromptsSection,
    ReportSection,
    SimulatorSection,
    SkillSelector,
    SkillsSection
} from './components/AppSections';

const LOGIN_INTRO_PENDING_KEY = 'skillboost_login_intro_pending';

const navItems = [
    { key: 'dashboard', label: 'Pregledna plošča', icon: 'chart' },
    { key: 'simulator', label: 'Simulator', icon: 'message' },
    { key: 'skills', label: 'Veščine', icon: 'target' },
    { key: 'quest', label: 'SkillCity', icon: 'compass' },
    { key: 'competition', label: 'Tekmovanje', icon: 'trophy' },
    { key: 'prompts', label: 'Prompti', icon: 'sparkles' },
    { key: 'report', label: 'Poročilo', icon: 'chart' },
    { key: 'mentor', label: 'Mentor', icon: 'userTie', mentorOnly: true },
    { key: 'profile', label: 'Profil', icon: 'users', protected: true }
];

const sectionMeta = {
    dashboard: {
        eyebrow: 'Tvoj razvojni nadzorni center',
        title: 'Pregledna plošča',
        helper: 'Najhitrejša pot do naslednje vaje, XP-ja in izboljšave.'
    },
    simulator: {
        eyebrow: 'Današnji trening',
        title: 'AI simulator',
        helper: 'Vadi odgovor, ga oddaj in takoj prejmi povratno informacijo.'
    },
    skills: {
        eyebrow: 'Tvoj fokus',
        title: 'Katalog veščin',
        helper: 'Izberi veščine brez odpiranja dolge uvodne strani.'
    },
    quest: {
        eyebrow: 'Zemljevid kampanje',
        title: 'SkillCity',
        helper: 'Odpiraj mesto po okrožjih: ena misija, ena stavba, en jasen naslednji korak.'
    },
    competition: {
        eyebrow: 'Igraj proti drugim',
        title: 'Tekmovalno središče',
        helper: 'Dnevni dvoboj in bitka veščin v bolj kompaktnem pogledu.'
    },
    prompts: {
        eyebrow: 'AI nastavitve',
        title: 'Prompti',
        helper: 'Pripravi in testiraj navodila za AI trenerja.'
    },
    report: {
        eyebrow: 'Napredek',
        title: 'Poročilo',
        helper: 'Poglej rezultate, močne točke in naslednji fokus.'
    },
    profile: {
        eyebrow: 'Račun',
        title: 'Moj profil',
        helper: 'Uredi osebni profil in preference.'
    },
    mentor: {
        eyebrow: 'Mentorski vpogled',
        title: 'Mentorska nadzorna plošča',
        helper: 'Preglej uporabnike, šibke veščine in simulacije, ki čakajo na komentar.'
    }
};

function readPendingLoginIntro() {
    try {
        return sessionStorage.getItem(LOGIN_INTRO_PENDING_KEY) === 'true';
    } catch {
        return false;
    }
}

function clearPendingLoginIntro() {
    try {
        sessionStorage.removeItem(LOGIN_INTRO_PENDING_KEY);
    } catch {
        // ignore storage access issues
    }
}

export default function App() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [introPlayKey, setIntroPlayKey] = useState(0);
    const { theme, toggleTheme } = useTheme();
    const data = useAppData();

    const { authenticated, handleLogin, handleRegister, handleLogout, username, isMentor, roles } = useAuth(
        data.handleSuccessfulAuth,
        data.loadPublicData
    );

    useEffect(() => {
        if (authenticated && readPendingLoginIntro()) {
            clearPendingLoginIntro();
            setIntroPlayKey((current) => current + 1);
        }
    }, [authenticated]);

    const effectiveIsMentor = isMentor || ['MENTOR', 'ADMIN'].includes(String(data.myProfile?.role || data.selectedUser?.role || '').toUpperCase());
    const selectedSkillNames = data.selectedSkills.map((skill) => skill.name).join(', ') || 'Izberi veščine';
    const selectedSkills = data.skills.filter((skill) => data.selectedSkillKeys.includes(skill.key));
    const player = data.selectedUser || {};
    const level = player.level || data.report?.level || 1;
    const totalStars = player.totalStars ?? data.report?.totalStars ?? 0;
    const streakDays = player.streakDays ?? data.report?.streakDays ?? 0;
    const currentMeta = sectionMeta[activeSection] || sectionMeta.simulator;

    const nav = useMemo(
        () => navItems.filter((item) => (authenticated || !item.protected) && (!item.mentorOnly || effectiveIsMentor)),
        [authenticated, effectiveIsMentor]
    );

    const handleNavigate = (sectionKey) => {
        if (sectionKey === 'mentor') {
            data.loadMentorDashboard?.();
        }
        setActiveSection(sectionKey);
    };

    return (
        <>
            <LogoIntro playKey={introPlayKey} />
            <div className="app-shell app-shell--dashboard">
                <aside className="app-sidebar" aria-label="Glavna navigacija">
                    <a className="app-sidebar__brand" href="#top" aria-label="Domov SkillBoost" onClick={() => handleNavigate('simulator')}>
                        <span className="app-sidebar__mark" aria-hidden="true">
                            <img src="/brand/skillboost-mark.png" alt="" />
                        </span>
                        <span>
                            <strong>SkillBoost</strong>
                            <small>AI trener</small>
                        </span>
                    </a>

                    <nav className="app-sidebar__nav">
                        {nav.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                className={activeSection === item.key ? 'active' : ''}
                                onClick={() => handleNavigate(item.key)}
                            >
                                <Icon name={item.icon} size={18} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="app-sidebar__status">
                        <span className={`status-dot ${data.health?.status === 'UP' || data.health?.status === 'DEMO' ? 'ok' : ''}`} />
                        <div>
                            <strong>Backend</strong>
                            <small>{data.health?.status || 'Preverjam...'}</small>
                        </div>
                    </div>

                    <div className="app-sidebar__footer">
                        <button className="theme-toggle" onClick={toggleTheme}>
                            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
                            {theme === 'light' ? 'Temni način' : 'Svetli način'}
                        </button>
                        {!authenticated ? (
                            <>
                                <button className="secondary" onClick={handleLogin}>Prijava</button>
                                <button className="primary" onClick={handleRegister}>Registracija</button>
                            </>
                        ) : (
                            <button className="secondary" onClick={handleLogout}>Odjava ({username})</button>
                        )}
                    </div>
                </aside>

                <div className={`app-frame app-frame--${activeSection}`}>
                    <header className="app-header" id="top">
                        <div>
                            <p className="eyebrow">{currentMeta.eyebrow}</p>
                            <h1>{currentMeta.title}</h1>
                            <span>{currentMeta.helper}</span>
                        </div>
                        <div className="app-header__actions">
                            <button className="secondary" onClick={() => handleNavigate('dashboard')}>
                                <Icon name="chart" size={16} />
                                Pregled
                            </button>
                            <button className="secondary" onClick={() => handleNavigate('skills')}>
                                <Icon name="target" size={16} />
                                Fokus
                            </button>
                            <button className="primary" onClick={() => handleNavigate('simulator')}>
                                <Icon name="bolt" size={16} />
                                Začni vajo
                            </button>
                        </div>
                    </header>

                    {data.error && <div className="alert app-alert">{data.error}</div>}
                    {data.loading && <div className="loading-card app-loading">Nalagam SkillBoost podatke...</div>}

                    {!data.loading && (
                        <main className={`app-workbench app-workbench--${activeSection}`}>
                            <section className="app-main-panel">
                                {activeSection === 'dashboard' && (
                                    <EngagementDashboard
                                        user={data.selectedUser}
                                        report={data.report}
                                        skills={data.skills}
                                        selectedSkills={selectedSkills}
                                        selectedSkillNames={selectedSkillNames}
                                        challenges={data.challenges}
                                        selectedChallenge={data.selectedChallenge}
                                        dailyDuelChallenge={data.dailyDuelChallenge}
                                        personalizedDailyChallenge={data.personalizedDailyChallenge}
                                        lastReward={data.lastReward}
                                        lastSession={data.lastSession}
                                        onStartSimulator={() => handleNavigate('simulator')}
                                        onOpenSkills={() => handleNavigate('skills')}
                                        onOpenCompetition={() => handleNavigate('competition')}
                                        onOpenReport={() => handleNavigate('report')}
                                        onStartDailyChallenge={() => {
                                            data.handleStartDailyChallenge();
                                            handleNavigate('simulator');
                                        }}
                                        onStartDailyDuel={() => {
                                            data.handleStartDailyDuel();
                                            handleNavigate('simulator');
                                        }}
                                    />
                                )}

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
                                        openSimulator={() => handleNavigate('simulator')}
                                    />
                                )}

                                {activeSection === 'quest' && (
                                    <SkillQuestMap
                                        user={data.selectedUser}
                                        report={data.report}
                                        questMap={data.questMap}
                                        questLoading={data.questLoading}
                                        skills={data.skills}
                                        challenges={data.challenges}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        setSelectedSkillKey={data.setSelectedSkillKey}
                                        setSelectedSkillKeys={data.setSelectedSkillKeys}
                                        setSelectedChallengeId={data.setSelectedChallengeId}
                                        onQuestNodeAction={data.handleQuestNodeAction}
                                        onResetQuestMap={data.handleResetQuestMap}
                                        openSimulator={() => handleNavigate('simulator')}
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
                                            handleNavigate('simulator');
                                        }}
                                        onStartSkillBattle={(payload) => {
                                            data.handleStartSkillBattle(payload);
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
                                {activeSection === 'mentor' && (
                                    <MentorDashboardSection
                                        dashboard={data.mentorDashboard}
                                        users={data.users}
                                        roles={roles}
                                        isMentor={effectiveIsMentor}
                                        onRefresh={data.loadMentorDashboard}
                                        onSaveMentorNote={data.handleMentorSessionNote}
                                        saving={data.saving}
                                    />
                                )}

                                {activeSection === 'profile' && (
                                    <ProfileSection
                                        profile={data.myProfile}
                                        selectedUser={data.selectedUser}
                                        report={data.report}
                                        skills={data.skills}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        onUpdate={data.handleUpdateProfile}
                                        saving={data.saving}
                                    />
                                )}
                            </section>

                            <aside className="app-right-panel" aria-label="Napredek in fokus">
                                <section className="right-card right-card--profile">
                                    <div className="right-card__head">
                                        <span className="avatar avatar--large avatar--model"><AvatarMini config={data.myProfile?.avatarConfig || data.selectedUser?.avatarConfig} /></span>
                                        <div>
                                            <strong>{data.selectedUser?.name || 'Gost'}</strong>
                                            <small>{data.selectedUser?.role || 'Demo način'}</small>
                                        </div>
                                    </div>
                                    <div className="compact-metrics">
                                        <MetricCard label="Stopnja" value={level} helper={`${player.currentLevelXp ?? data.report?.currentLevelXp ?? 0}/${player.nextLevelXp ?? data.report?.nextLevelXp ?? 100} XP`} />
                                        <MetricCard label="Niz" value={<span className="metric-inline"><Icon name="flame" size={17} />{streakDays}</span>} helper="dni" />
                                        <MetricCard label="Zvezdice" value={totalStars} helper="skupno" />
                                    </div>
                                </section>

                                <section className="right-card">
                                    <div className="right-section-title">
                                        <span>Izbrane veščine</span>
                                        <button type="button" onClick={() => handleNavigate('skills')}>Uredi</button>
                                    </div>
                                    <div className="right-skill-chips">
                                        {selectedSkills.length ? selectedSkills.map((skill) => (
                                            <button key={skill.key} type="button" onClick={() => data.toggleSkillKey(skill.key)}>
                                                {skill.name}
                                                <Icon name="x" size={12} />
                                            </button>
                                        )) : <p>Izberi veščine za personaliziran trening.</p>}
                                    </div>
                                </section>

                                <section className="right-card right-card--selector">
                                    <SkillSelector
                                        skills={data.skills}
                                        selectedSkillKeys={data.selectedSkillKeys}
                                        toggleSkillKey={data.toggleSkillKey}
                                    />
                                </section>

                                <section className="right-card right-card--growth">
                                    <GrowthFocusPanel
                                        skills={data.skills}
                                        report={data.report}
                                        preferredSkillKeys={data.preferredSkillKeys}
                                        togglePreferredSkillKey={data.togglePreferredSkillKey}
                                        personalizedDailyChallenge={data.personalizedDailyChallenge}
                                        dailyChallengeActive={data.dailyChallengeActive}
                                        onStartDailyChallenge={data.handleStartDailyChallenge}
                                    />
                                </section>

                                <section className="right-card">
                                    <DailyQuests quests={data.lastReward?.dailyQuests || data.report?.dailyQuests} />
                                </section>
                            </aside>
                        </main>
                    )}
                </div>
            </div>
        </>
    );
}
