import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import keycloak from "../keycloak.js";

import { emptyPrompt, demoChallenges, demoPrompts, demoRivals, demoSkills, demoUser } from '../data/demoContent';

export function useAppData() {
    const [health, setHealth] = useState(null);
    const [users, setUsers] = useState([]);
    const [skills, setSkills] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [prompts, setPrompts] = useState([]);

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedSkillKey, setSelectedSkillKey] = useState('public-speaking');
    const [selectedSkillKeys, setSelectedSkillKeys] = useState(['public-speaking']);
    const [preferredSkillKeys, setPreferredSkillKeys] = useState(['public-speaking']);
    const [selectedChallengeId, setSelectedChallengeId] = useState('');
    const [competitionMode, setCompetitionMode] = useState(null);
    const [competitionOpponentId, setCompetitionOpponentId] = useState('');
    const [lastCompetitionResult, setLastCompetitionResult] = useState(null);

    const [answer, setAnswer] = useState('');
    const [customSituation, setCustomSituation] = useState('');
    const [dailyChallengeActive, setDailyChallengeActive] = useState(false);
    const [lastSession, setLastSession] = useState(null);
    const [lastReward, setLastReward] = useState(null);
    const [mentorNote, setMentorNote] = useState('');
    const [report, setReport] = useState(null);
    const [mentorDashboard, setMentorDashboard] = useState(null);

    const [newPrompt, setNewPrompt] = useState(emptyPrompt);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [demoMode, setDemoMode] = useState(false);

    const [myProfile, setMyProfile] = useState(null);

    const mergeProfileIntoUser = useCallback((user, profileData = {}) => {
        if (!user) return user;
        return {
            ...user,
            ...profileData,
            id: user.id,
            keycloakId: user.keycloakId ?? profileData.keycloakId,
            email: profileData.email || user.email,
            role: profileData.role || user.role
        };
    }, []);

    const applyProfileEverywhere = useCallback((profileData = {}) => {
        if (!profileData) return null;

        setMyProfile((current) => ({
            ...(current || {}),
            ...profileData,
            avatarConfig: profileData.avatarConfig || current?.avatarConfig
        }));

        setUsers((current) => current.map((user) => {
            const isSelected = user.id === selectedUserId;
            const sameProfileId = profileData.id && user.id === profileData.id;
            const sameEmail = profileData.email && user.email && user.email === profileData.email;
            const sameKeycloak = profileData.keycloakId && user.keycloakId && user.keycloakId === profileData.keycloakId;
            return isSelected || sameProfileId || sameEmail || sameKeycloak
                ? mergeProfileIntoUser(user, profileData)
                : user;
        }));

        setLastCompetitionResult((current) => current ? {
            ...current,
            userName: profileData.name || current.userName,
            leaderboard: (current.leaderboard || []).map((entry) => (
                entry.userId === selectedUserId || entry.name === current.userName
                    ? { ...entry, name: profileData.name || entry.name, avatarConfig: profileData.avatarConfig || entry.avatarConfig }
                    : entry
            ))
        } : current);

        return profileData;
    }, [mergeProfileIntoUser, selectedUserId]);

    const refreshUsers = async () => {
        if (demoMode) return;
        const freshUsers = await api.getUsers();
        setUsers(freshUsers);
    };

    const hydrateDemoData = useCallback((message = '') => {
        setDemoMode(true);
        setHealth({ status: 'DEMO' });
        setUsers([demoUser, ...demoRivals]);
        setSkills(demoSkills);
        setChallenges(demoChallenges);
        setPrompts(demoPrompts);
        setSelectedUserId(demoUser.id);
        setReport({
            userId: demoUser.id,
            userName: demoUser.name,
            totalSessions: 1,
            totalPoints: demoUser.points,
            totalStars: demoUser.totalStars,
            level: demoUser.level,
            currentLevelXp: demoUser.currentLevelXp,
            nextLevelXp: demoUser.nextLevelXp,
            streakDays: demoUser.streakDays,
            averageScore: 78,
            badges: demoUser.badges,
            dailyQuests: buildDemoDailyQuests(false, 1),
            skillProgress: [
                { skillKey: 'public-speaking', sessions: 1, averageScore: 78, nextSuggestedChallenge: 'Predstavitev ideje v 2 minutah' }
            ],
            recommendations: ['To je demo način, ker backend trenutno ni dosegljiv.', 'Izberi več veščin in oddaj odgovor za lokalno AI oceno.']
        });
        setError(message ? `Demo način: ${message}` : 'Demo način: backend trenutno ni dosegljiv.');
        syncInitialSelection(demoSkills, demoChallenges);
    }, []);

    const syncInitialSelection = useCallback((skillResult, challengeResult) => {
        const initialSkill = skillResult[0]?.key || 'public-speaking';
        setSelectedSkillKey(initialSkill);
        setSelectedSkillKeys([initialSkill]);
        setPreferredSkillKeys([initialSkill]);
        setDailyChallengeActive(false);
        setCompetitionMode(null);
        setCompetitionOpponentId('');
        setLastCompetitionResult(null);

        const firstChallenge = challengeResult.find(c => c.skillKey === initialSkill) || challengeResult[0];
        setSelectedChallengeId(firstChallenge?.id || '');
        setNewPrompt((current) => ({ ...current, skillKey: initialSkill }));
    }, []);

    const loadMentorDashboard = useCallback(async () => {
        if (demoMode) return;
        try {
            const dashboard = await api.getMentorDashboard();
            setMentorDashboard(dashboard);
        } catch (err) {
            console.warn('Mentor dashboard ni dosegljiv:', err.message);
        }
    }, [demoMode]);

    const loadReport = useCallback(async (userId) => {
        if (demoMode) return;
        try {
            const nextReport = await api.getReport(userId);
            setReport(nextReport);
        } catch (err) {
            setError(err.message);
        }
    }, [demoMode]);

    const loadPublicData = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const [healthResult, userResult, skillResult, challengeResult, promptResult] = await Promise.all([
                api.health(), api.getUsers(), api.getSkills(), api.getChallenges(), api.getPrompts()
            ]);
            setHealth(healthResult);
            setUsers(userResult);
            setSkills(skillResult);
            setChallenges(challengeResult);
            setPrompts(promptResult);
            setSelectedUserId(userResult[0]?.id || '');
            syncInitialSelection(skillResult, challengeResult);
        } catch (err) {
            hydrateDemoData(err.message);
        } finally {
            setLoading(false);
        }
    }, [syncInitialSelection, hydrateDemoData]);

    const handleSuccessfulAuth = useCallback(async () => {
        const keycloakId = keycloak.tokenParsed?.sub;
        const email = keycloak.tokenParsed?.email;
        const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username;

        try {
            setError('');
            setLoading(true);
            const [healthRes, userList, skillRes, challengeRes, promptRes, profileRes] = await Promise.all([
                api.health(), api.getUsers(), api.getSkills(), api.getChallenges(), api.getPrompts(), api.getProfile()
            ]);

            setHealth(healthRes);
            setSkills(skillRes);
            setChallenges(challengeRes);
            setPrompts(promptRes);
            setMyProfile(profileRes)

            try {
                const userList = await api.getUsers();
                let currentMe = userList.find(u => u.keycloakId === keycloakId || u.email === email);

                if (!currentMe) {
                    currentMe = await api.createUser({
                        keycloakId, name, email, role: 'STUDENT', goals: [], targetSkills: []
                    });
                    const freshUsers = await api.getUsers();
                    setUsers(freshUsers);
                } else {
                    setUsers(userList);
                }

                setSelectedUserId(currentMe.id);
            } catch (e) {
                console.warn("Uporabniki niso dostopni, delam v omejenem načinu:", e);
            }

            syncInitialSelection(skillRes, challengeRes);
        } catch (err) {
            hydrateDemoData("Napaka pri nalaganju podatkov: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [syncInitialSelection, hydrateDemoData]);

    useEffect(() => {
        if (selectedUserId) {
            loadReport(selectedUserId);
        }
    }, [selectedUserId, loadReport]);

    useEffect(() => {
        if (!selectedSkillKeys.includes(selectedSkillKey)) {
            setSelectedSkillKey(selectedSkillKeys[0] || skills[0]?.key || 'public-speaking');
        }
    }, [selectedSkillKeys, selectedSkillKey, skills]);

    useEffect(() => {
        const available = challenges.filter((challenge) => selectedSkillKeys.includes(challenge.skillKey));
        if (available.length && !available.some((challenge) => challenge.id === selectedChallengeId)) {
            setSelectedChallengeId(available[0].id);
        }
    }, [selectedSkillKeys, challenges, selectedChallengeId]);

    const toggleSkillKey = (skillKey) => {
        setSelectedSkillKeys((current) => {
            const exists = current.includes(skillKey);
            const next = exists ? current.filter((key) => key !== skillKey) : [...current, skillKey];
            const nextPrimary = next[0] || selectedSkillKey || skills[0]?.key || 'public-speaking';
            setSelectedSkillKey(nextPrimary);
            setNewPrompt((prompt) => ({ ...prompt, skillKey: nextPrimary }));
            return next;
        });
    };

    const togglePreferredSkillKey = (skillKey) => {
        setPreferredSkillKeys((current) => {
            const exists = current.includes(skillKey);
            const next = exists ? current.filter((key) => key !== skillKey) : [...current, skillKey];
            return next.length ? next : [skillKey];
        });
    };

    const handleSubmitSession = async (event) => {
        event.preventDefault();
        if (!selectedUserId || !selectedChallengeId || !answer.trim()) {
            setError('Manjkajo podatki za oddajo (uporabnik, izziv ali odgovor).');
            return;
        }
        try {
            setSaving(true);
            setError('');
            setLastSession(null);
            setLastReward(null);
            setLastCompetitionResult(null);
            if (demoMode) {
                const session = buildDemoSession({ answer, selectedChallenge, selectedSkillKeys, customSituation, dailyChallengeActive });
                const reward = buildDemoReward(session, selectedSkillKeys, dailyChallengeActive);
                const updatedDemoUser = {
                    ...demoUser,
                    points: reward.totalPoints,
                    totalStars: reward.totalStars,
                    level: reward.newLevel,
                    currentLevelXp: reward.currentLevelXp,
                    nextLevelXp: reward.nextLevelXp,
                    streakDays: reward.streakDays,
                    badges: [...new Set([...demoUser.badges, ...reward.newBadges])]
                };
                setLastSession(session);
                setLastReward(reward);
                if (competitionMode) {
                    setLastCompetitionResult(buildCompetitionResult({
                        mode: competitionMode,
                        session,
                        selectedUser: updatedDemoUser,
                        opponent: users.find((user) => user.id === competitionOpponentId),
                        challenge: selectedChallenge,
                        users: [updatedDemoUser, ...demoRivals]
                    }));
                }
                setAnswer('');
                setCustomSituation('');
                setDailyChallengeActive(false);
                setCompetitionMode(null);
                setCompetitionOpponentId('');
                setReport(buildDemoReport(session, selectedSkillKeys, reward, updatedDemoUser));
                setMentorDashboard(buildDemoMentorDashboard([updatedDemoUser, ...demoRivals], [session]));
                setUsers([updatedDemoUser, ...demoRivals]);
                return;
            }
            const submission = await api.submitSession({
                userId: selectedUserId,
                challengeId: selectedChallengeId,
                skillKey: selectedSkillKey,
                skillKeys: selectedSkillKeys,
                userAnswer: answer,
                customSituation: customSituation.trim(),
                dailyDoubleXp: dailyChallengeActive
            });
            const session = submission.session || submission;
            setLastSession(session);
            setLastReward(submission.reward || null);
            if (competitionMode) {
                setLastCompetitionResult(buildCompetitionResult({
                    mode: competitionMode,
                    session,
                    selectedUser: submission.user || selectedUser,
                    opponent: users.find((user) => user.id === competitionOpponentId),
                    challenge: selectedChallenge,
                    users
                }));
            }
            setCompetitionMode(null);
            setCompetitionOpponentId('');
            if (submission.user) {
                setUsers((current) => current.map((user) => user.id === submission.user.id ? submission.user : user));
            }
            setAnswer('');
            setCustomSituation('');
            setDailyChallengeActive(false);
            await Promise.all([loadReport(selectedUserId), refreshUsers()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCreatePrompt = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            setError('');
            const created = await api.createPrompt({
                ...newPrompt,
                skillKey: newPrompt.skillKey || selectedSkillKey,
                tags: Array.isArray(newPrompt.tags) ? newPrompt.tags : splitCsv(newPrompt.tags)
            });
            setPrompts((current) => [created, ...current]);
            setNewPrompt({ ...emptyPrompt, skillKey: selectedSkillKey });
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMentorNote = async () => {
        if (!lastSession?.id || !mentorNote.trim()) return;
        try {
            setSaving(true);
            setError('');
            const updated = await api.updateMentorNote(lastSession.id, { mentorNote: mentorNote.trim() });
            setLastSession(updated);
            setMentorNote('');
            await Promise.all([loadReport(selectedUserId), loadMentorDashboard()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMentorSessionNote = async (sessionId, note) => {
        if (!sessionId || !note?.trim()) return null;
        try {
            setSaving(true);
            setError('');
            const updated = await api.updateMentorNote(sessionId, { mentorNote: note.trim() });
            setMentorDashboard((current) => current ? {
                ...current,
                sessionsNeedingReview: Math.max(0, (current.sessionsNeedingReview || 0) - 1),
                recentSessions: (current.recentSessions || []).map((session) => session.sessionId === sessionId
                    ? { ...session, reviewed: true, mentorNote: updated.mentorNote }
                    : session)
            } : current);
            if (lastSession?.id === sessionId) {
                setLastSession(updated);
            }
            await Promise.all([loadReport(selectedUserId), loadMentorDashboard()]);
            return updated;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const selectedUser = useMemo(() => {
        const baseUser = users.find((u) => u.id === selectedUserId);
        if (!baseUser) return null;
        const profileMatches = myProfile && (
            myProfile.id === baseUser.id ||
            (myProfile.email && baseUser.email && myProfile.email === baseUser.email) ||
            (myProfile.keycloakId && baseUser.keycloakId && myProfile.keycloakId === baseUser.keycloakId)
        );
        return profileMatches ? mergeProfileIntoUser(baseUser, myProfile) : baseUser;
    }, [users, selectedUserId, myProfile, mergeProfileIntoUser]);
    const filteredChallenges = useMemo(() => {
        if (!selectedSkillKeys.length) return challenges;
        return challenges.filter((challenge) => selectedSkillKeys.includes(challenge.skillKey));
    }, [challenges, selectedSkillKeys]);
    const filteredPrompts = useMemo(() => {
        if (!selectedSkillKeys.length) return prompts;
        return prompts.filter((prompt) => selectedSkillKeys.includes(prompt.skillKey));
    }, [prompts, selectedSkillKeys]);
    const selectedChallenge = useMemo(() => challenges.find((c) => c.id === selectedChallengeId), [challenges, selectedChallengeId]);
    const selectedSkills = useMemo(() => skills.filter((skill) => selectedSkillKeys.includes(skill.key)), [skills, selectedSkillKeys]);
    const personalizedDailyChallenge = useMemo(
        () => pickPersonalizedDailyChallenge(challenges, report, preferredSkillKeys, selectedSkillKeys),
        [challenges, report, preferredSkillKeys, selectedSkillKeys]
    );
    const dailyDuelChallenge = useMemo(() => pickDailyDuelChallenge(challenges), [challenges]);
    const competitionOpponent = useMemo(
        () => users.find((user) => user.id === competitionOpponentId) || null,
        [users, competitionOpponentId]
    );

    const handleStartDailyDuel = useCallback(() => {
        if (!dailyDuelChallenge) return;
        const skillKey = dailyDuelChallenge.skillKey || selectedSkillKey;
        setSelectedSkillKey(skillKey);
        setSelectedSkillKeys([skillKey]);
        setSelectedChallengeId(dailyDuelChallenge.id);
        setCompetitionMode('daily-duel');
        setCompetitionOpponentId('');
        setLastCompetitionResult(null);
        setAnswer('');
        setError('');
    }, [dailyDuelChallenge, selectedSkillKey]);

    const handleStartSkillBattle = useCallback(({ opponentId, challengeId }) => {
        const challenge = challenges.find((item) => item.id === challengeId) || challenges[0];
        if (!challenge) return;
        const skillKey = challenge.skillKey || selectedSkillKey;
        setSelectedSkillKey(skillKey);
        setSelectedSkillKeys([skillKey]);
        setSelectedChallengeId(challenge.id);
        setCompetitionMode('skill-battle');
        setCompetitionOpponentId(opponentId || '');
        setLastCompetitionResult(null);
        setAnswer('');
        setError('');
    }, [challenges, selectedSkillKey]);

    const handleCancelCompetition = useCallback(() => {
        setCompetitionMode(null);
        setCompetitionOpponentId('');
        setLastCompetitionResult(null);
    }, []);

    const handleStartDailyChallenge = useCallback(() => {
        if (!personalizedDailyChallenge) return;
        const primarySkill = personalizedDailyChallenge.skillKey || selectedSkillKey;
        const nextSkills = [...new Set([primarySkill, ...preferredSkillKeys])].slice(0, 3);
        setSelectedSkillKey(primarySkill);
        setSelectedSkillKeys(nextSkills.length ? nextSkills : [primarySkill]);
        setSelectedChallengeId(personalizedDailyChallenge.id);
        setDailyChallengeActive(true);
        setError('');
    }, [personalizedDailyChallenge, preferredSkillKeys, selectedSkillKey]);

    const handleUpdateProfile = async (profileData) => {
        try {
            setSaving(true);
            setError('');

            if (demoMode) {
                const selectedDemoUser = users.find((user) => user.id === selectedUserId) || demoUser;
                const updatedDemoProfile = {
                    ...(myProfile || selectedDemoUser),
                    ...profileData,
                    id: myProfile?.id || selectedDemoUser.id,
                    email: myProfile?.email || selectedDemoUser.email,
                    role: myProfile?.role || selectedDemoUser.role
                };
                applyProfileEverywhere(updatedDemoProfile);
                return updatedDemoProfile;
            }

            const updated = await api.updateProfile(profileData);
            const normalized = {
                ...(myProfile || {}),
                ...updated,
                ...profileData,
                avatarConfig: updated?.avatarConfig || profileData.avatarConfig,
                name: updated?.name || profileData.name || myProfile?.name
            };
            applyProfileEverywhere(normalized);
            return normalized;
        } catch (err) {
            setError('Napaka pri posodabljanju profila: ' + err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    return {
        health,
        users,
        skills,
        challenges,
        selectedUserId,
        setSelectedUserId,
        selectedSkillKey,
        setSelectedSkillKey,
        selectedSkillKeys,
        setSelectedSkillKeys,
        preferredSkillKeys,
        setPreferredSkillKeys,
        toggleSkillKey,
        togglePreferredSkillKey,
        selectedChallengeId,
        setSelectedChallengeId,
        answer,
        setAnswer,
        customSituation,
        setCustomSituation,
        dailyChallengeActive,
        setDailyChallengeActive,
        lastSession,
        lastReward,
        mentorNote,
        setMentorNote,
        report,
        newPrompt,
        setNewPrompt,
        loading,
        saving,
        error,
        demoMode,
        loadPublicData,
        handleSuccessfulAuth,
        handleSubmitSession,
        handleCreatePrompt,
        handleMentorNote,
        handleMentorSessionNote,
        selectedUser,
        selectedSkills,
        filteredChallenges,
        filteredPrompts,
        selectedChallenge,
        personalizedDailyChallenge,
        dailyDuelChallenge,
        competitionMode,
        competitionOpponent,
        lastCompetitionResult,
        handleStartDailyChallenge,
        handleStartDailyDuel,
        handleStartSkillBattle,
        handleCancelCompetition,
        myProfile,
        handleUpdateProfile,
        mentorDashboard,
        loadMentorDashboard,
    };
}


function buildDemoStructuredScores(answer, score) {
    const normalized = (answer || '').toLowerCase();
    return {
        clarity: Math.min(100, score + (normalized.includes('najprej') ? 6 : -4)),
        empathy: Math.min(100, score + (normalized.includes('razumem') || normalized.includes('slišim') ? 10 : -8)),
        structure: Math.min(100, score + (normalized.includes('korak') ? 8 : -6)),
        impact: Math.min(100, score + (normalized.includes('primer') ? 8 : -5)),
        confidence: Math.min(100, score + (normalized.includes('predlagam') ? 7 : -3))
    };
}

function buildDemoMentorDashboard(users = [], sessions = []) {
    return {
        totalUsers: users.length,
        totalSessions: sessions.length,
        averageScore: sessions.length ? Math.round(sessions.reduce((sum, session) => sum + (session.score || 0), 0) / sessions.length) : 0,
        sessionsNeedingReview: sessions.filter((session) => !session.mentorNote).length,
        learners: users.map((user) => ({
            userId: user.id,
            name: user.name,
            email: user.email || '',
            level: user.level || 1,
            points: user.points || 0,
            streakDays: user.streakDays || 0,
            sessions: user.id === sessions[0]?.userId ? sessions.length : 0,
            averageScore: user.id === sessions[0]?.userId ? sessions[0]?.score || 0 : 0,
            weakestSkill: sessions[0]?.skillKey || 'še ni podatkov',
            mentorStatus: user.id === sessions[0]?.userId ? 'Čaka pregled' : 'Ni še začel'
        })),
        recentSessions: sessions.map((session) => ({
            sessionId: session.id,
            userId: session.userId,
            userName: users.find((user) => user.id === session.userId)?.name || 'Demo uporabnik',
            challengeId: session.challengeId,
            skillKey: session.skillKey,
            score: session.score,
            reviewed: Boolean(session.mentorNote),
            createdAt: new Date().toISOString()
        }))
    };
}

function splitCsv(value) {
    if (!value) return [];
    return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function buildDemoSession({ answer, selectedChallenge, selectedSkillKeys, customSituation, dailyChallengeActive }) {
    const normalized = answer.toLowerCase();
    const words = normalized.trim() ? normalized.trim().split(/\s+/).length : 0;
    let score = 35 + Math.min(25, words);
    if (normalized.includes('primer')) score += 10;
    if (normalized.includes('razumem') || normalized.includes('slišim') || normalized.includes('slisim')) score += 10;
    if (normalized.includes('korak') || normalized.includes('predlagam') || normalized.includes('dogovor')) score += 12;
    if (normalized.includes('?') || normalized.includes('vpraš') || normalized.includes('vpras')) score += 8;
    score += Math.min(8, selectedSkillKeys.length * 2);
    score = Math.max(20, Math.min(100, score));

    return {
        id: `demo-session-${Date.now()}`,
        score,
        structuredScores: buildDemoStructuredScores(answer, score),
        skillKey: selectedSkillKeys.join(','),
        skillKeys: selectedSkillKeys,
        challengeId: selectedChallenge?.id,
        userAnswer: answer,
        customSituation,
        dailyDoubleXp: dailyChallengeActive,
        mentorNote: '',
        aiFeedback: `Ocena: ${score}/100
Izbrane veščine: ${selectedSkillKeys.join(', ')}

V čem si dober:
- Odgovor je povezan s scenarijem "${selectedChallenge?.title || 'simulacija'}".
- Pokazal/a si pripravljenost za konkretno komunikacijo.

Kje še izboljšaj:
- Dodaj še bolj jasen naslednji korak: kdo naredi kaj in do kdaj.
- Vključi eno vprašanje, s katerim preveriš razumevanje sogovornika.

Boljša verzija:
- Razumem situacijo. Predlagam, da najprej uskladimo cilj, nato določimo odgovornosti in se dogovorimo za kratek pregled napredka.

Naslednji mini izziv:
- Kako bi ta odgovor povedal/a bolj kratko, mirno in samozavestno?${dailyChallengeActive ? '\n\nBonus: Dnevni personaliziran izziv je aktiviral 2x XP.' : ''}`
    };
}

function buildDemoReward(session, selectedSkillKeys, dailyChallengeActive = false) {
    const earnedStars = scoreToStars(session.score);
    const baseXp = Math.max(5, session.score + Math.max(0, selectedSkillKeys.length - 1) * 5 + earnedStars * 5);
    const earnedXp = dailyChallengeActive ? baseXp * 2 : baseXp;
    const totalPoints = demoUser.points + earnedXp;
    const level = totalPoints >= 250 ? 3 : totalPoints >= 100 ? 2 : 1;
    const levelStart = level === 3 ? 250 : level === 2 ? 100 : 0;
    const nextLevelTarget = level === 3 ? 450 : level === 2 ? 250 : 100;
    const newBadges = ['First star'];
    if (session.score >= 80) newBadges.push('Strong answer');
    if (session.score >= 90) newBadges.push('AI-ready communicator');
    if (selectedSkillKeys.length >= 3) newBadges.push('Multi-skill learner');

    return {
        earnedXp,
        earnedStars,
        oldLevel: demoUser.level,
        newLevel: level,
        leveledUp: level > demoUser.level,
        totalPoints,
        totalStars: demoUser.totalStars + earnedStars,
        currentLevelXp: totalPoints - levelStart,
        nextLevelXp: nextLevelTarget - levelStart,
        streakDays: demoUser.streakDays + 1,
        newBadges: [...new Set(newBadges)],
        dailyQuests: buildDemoDailyQuests(session.score >= 70, selectedSkillKeys.length, dailyChallengeActive)
    };
}

function buildDemoDailyQuests(strongAnswerCompleted, selectedSkillCount, dailyDoubleXpCompleted = false) {
    const multiSkillCompleted = selectedSkillCount >= 2;
    return [
        { id: 'practice-once', label: 'Reši 1 simulacijo danes', completed: true, current: 1, target: 1, rewardText: '+20 XP disciplina' },
        { id: 'daily-double-xp', label: 'Personaliziran dnevni izziv', completed: dailyDoubleXpCompleted, current: dailyDoubleXpCompleted ? 1 : 0, target: 1, rewardText: '2x XP' },
        { id: 'strong-answer', label: 'Dosezi vsaj 70/100', completed: strongAnswerCompleted, current: strongAnswerCompleted ? 1 : 0, target: 1, rewardText: 'močnejši score' },
        { id: 'multi-skill', label: 'Vadi vsaj 2 veščini hkrati', completed: multiSkillCompleted, current: Math.min(selectedSkillCount, 2), target: 2, rewardText: '+5 XP bonus' }
    ];
}

function pickPersonalizedDailyChallenge(challenges, report, preferredSkillKeys, selectedSkillKeys) {
    const safeChallenges = challenges || [];
    if (!safeChallenges.length) return null;

    const progress = report?.skillProgress || [];
    const weakestSkillKeys = progress
        .slice()
        .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0))
        .map((item) => item.skillKey);

    const priority = [...new Set([
        ...(preferredSkillKeys || []),
        ...weakestSkillKeys,
        ...(selectedSkillKeys || [])
    ])].filter(Boolean);

    for (const skillKey of priority) {
        const match = safeChallenges.find((challenge) => challenge.skillKey === skillKey);
        if (match) return match;
    }

    return safeChallenges[0];
}

function scoreToStars(score) {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
}

function buildDemoReport(session, selectedSkillKeys, reward, user) {
    return {
        userId: demoUser.id,
        userName: user.name,
        totalSessions: 2,
        totalPoints: user.points,
        totalStars: user.totalStars,
        level: user.level,
        currentLevelXp: user.currentLevelXp,
        nextLevelXp: user.nextLevelXp,
        streakDays: user.streakDays,
        averageScore: session.score,
        badges: user.badges,
        dailyQuests: reward.dailyQuests,
        skillProgress: selectedSkillKeys.map((skillKey) => ({
            skillKey,
            sessions: 1,
            averageScore: session.score,
            nextSuggestedChallenge: 'Ponovi simulacijo z bolj konkretnim primerom in mentorjevim komentarjem.'
        })),
        recommendations: [
            reward.leveledUp ? `Nov level: ${reward.newLevel}. Nadaljuj z dnevno rutino.` : 'Odgovor popravi po AI povratni informaciji in ga oddaj ponovno.',
            'Dodaj mentorjevo opombo, če želiš človeški vpogled v napredek.',
            'Naslednjič izberi še eno povezano veščino za širši učni načrt.'
        ]
    };
}


function pickDailyDuelChallenge(challenges) {
    const safeChallenges = challenges || [];
    if (!safeChallenges.length) return null;
    const todayKey = new Date().toISOString().slice(0, 10);
    const index = Math.abs(hashString(`daily-duel-${todayKey}`)) % safeChallenges.length;
    return safeChallenges[index];
}

function buildCompetitionResult({ mode, session, selectedUser, opponent, challenge, users = [] }) {
    if (!mode || !session) return null;
    const userName = selectedUser?.name || 'Ti';
    const normalizedUsers = ensureCompetitionUsers(users, selectedUser);

    if (mode === 'daily-duel') {
        const leaderboard = normalizedUsers
            .map((user) => ({
                userId: user.id,
                name: user.id === selectedUser?.id ? userName : user.name,
                score: user.id === selectedUser?.id
                    ? session.score
                    : buildDeterministicOpponentScore(user, challenge, 'daily-duel'),
                avatar: initials(user.name),
                avatarConfig: user.id === selectedUser?.id ? selectedUser?.avatarConfig : user.avatarConfig
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
        const current = leaderboard.find((entry) => entry.userId === selectedUser?.id) || leaderboard[0];
        const nextAbove = leaderboard.find((entry) => entry.rank === current.rank - 1);

        return {
            mode,
            title: 'Daily Duel rezultat',
            challengeTitle: challenge?.title || 'Današnji skupni izziv',
            userScore: session.score,
            userRank: current?.rank || 1,
            winnerName: leaderboard[0]?.name || userName,
            message: nextAbove
                ? `Do naslednjega mesta ti manjka ${Math.max(1, nextAbove.score - session.score)} točk.`
                : 'Trenutno vodiš današnji duel.',
            leaderboard
        };
    }

    const resolvedOpponent = opponent || normalizedUsers.find((user) => user.id !== selectedUser?.id);
    const opponentScore = buildDeterministicOpponentScore(resolvedOpponent, challenge, 'skill-battle');
    const diff = session.score - opponentScore;

    return {
        mode,
        title: 'Skill Battle rezultat',
        challengeTitle: challenge?.title || 'Battle izziv',
        userName,
        opponentName: resolvedOpponent?.name || 'SkillBot Rival',
        userScore: session.score,
        opponentScore,
        result: diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw',
        message: diff > 0
            ? `Zmagal/a si za ${diff} točk in dobiš mentalni momentum za naslednjo vajo.`
            : diff < 0
                ? `Rival je bil boljši za ${Math.abs(diff)} točk. Poskusi rematch z bolj konkretnim primerom.`
                : 'Izenačeno. Rematch je idealen naslednji korak.',
        leaderboard: [
            { userId: selectedUser?.id || 'me', name: userName, score: session.score, rank: diff >= 0 ? 1 : 2, avatar: initials(userName), avatarConfig: selectedUser?.avatarConfig },
            { userId: resolvedOpponent?.id || 'opponent', name: resolvedOpponent?.name || 'SkillBot Rival', score: opponentScore, rank: diff >= 0 ? 2 : 1, avatar: initials(resolvedOpponent?.name || 'SkillBot Rival'), avatarConfig: resolvedOpponent?.avatarConfig }
        ].sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, rank: index + 1 }))
    };
}

function ensureCompetitionUsers(users = [], selectedUser) {
    const base = users?.length ? users : [];
    const fallback = [
        { id: 'rival-ana', name: 'Ana Novak', points: 340, level: 3, streakDays: 4 },
        { id: 'rival-luka', name: 'Luka Kovač', points: 275, level: 3, streakDays: 2 },
        { id: 'rival-eva', name: 'Eva Medved', points: 205, level: 2, streakDays: 1 }
    ];
    const withSelected = selectedUser && !base.some((user) => user.id === selectedUser.id)
        ? [selectedUser, ...base]
        : base;
    const merged = [...withSelected];
    fallback.forEach((candidate) => {
        if (!merged.some((user) => user.id === candidate.id || user.name === candidate.name)) {
            merged.push(candidate);
        }
    });
    return merged.slice(0, 8);
}

function buildDeterministicOpponentScore(user, challenge, mode) {
    const seed = `${user?.id || user?.name || 'rival'}-${challenge?.id || challenge?.title || 'challenge'}-${mode}-${new Date().toISOString().slice(0, 10)}`;
    const base = 58 + (Math.abs(hashString(seed)) % 31);
    const levelBonus = Math.min(8, Math.max(0, user?.level || 1));
    const streakBonus = Math.min(6, Math.max(0, user?.streakDays || 0));
    return Math.max(45, Math.min(96, base + levelBonus + streakBonus - 4));
}

function initials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?';
}

function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return hash;
}
