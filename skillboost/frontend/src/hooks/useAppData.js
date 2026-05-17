import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import keycloak from "../keycloak.js";

const emptyPrompt = {
    skillKey: 'public-speaking',
    title: '',
    difficulty: 'BEGINNER',
    systemPrompt: 'You are a practical soft-skills coach.',
    userPromptTemplate: 'Evaluate this answer: {{answer}}',
    simulatedAiResponse: '',
    tags: []
};

export function useAppData() {
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
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const refreshUsers = async () => {
        const freshUsers = await api.getUsers();
        setUsers(freshUsers);
    };

    const loadReport = useCallback(async (userId) => {
        try {
            const nextReport = await api.getReport(userId);
            setReport(nextReport);
        } catch (err) {
            setError(err.message);
        }
    }, []);

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
            setSelectedSkillKey(skillResult[0]?.key || 'public-speaking');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSuccessfulAuth = useCallback(async () => {
        const keycloakId = keycloak.tokenParsed?.sub;
        const email = keycloak.tokenParsed?.email;
        const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username;

        try {
            setError('');
            setLoading(true);
            const [healthRes, userList, skillRes, challengeRes, promptRes] = await Promise.all([
                api.health(), api.getUsers(), api.getSkills(), api.getChallenges(), api.getPrompts()
            ]);

            setHealth(healthRes);
            setSkills(skillRes);
            setChallenges(challengeRes);
            setPrompts(promptRes);

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
            setSelectedSkillKey(skillRes[0]?.key || 'public-speaking');
        } catch (err) {
            setError("Napaka pri nalaganju podatkov: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            loadReport(selectedUserId);
        }
    }, [selectedUserId, loadReport]);

    useEffect(() => {
        const firstForSkill = challenges.find((c) => c.skillKey === selectedSkillKey);
        setSelectedChallengeId(firstForSkill?.id || '');
    }, [selectedSkillKey, challenges]);

    // Akcije obrazcev
    const handleSubmitSession = async (event) => {
        event.preventDefault();
        if (!selectedUserId || !selectedChallengeId || !answer.trim()) {
            setError('Izberi uporabnika, izziv in vpiši odgovor.');
            return;
        }
        try {
            setSaving(true);
            setError('');
            const session = await api.submitSession({
                userId: selectedUserId, challengeId: selectedChallengeId, skillKey: selectedSkillKey, userAnswer: answer
            });
            setLastSession(session);
            setAnswer('');
            await Promise.all([loadReport(selectedUserId), refreshUsers()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRegisterUser = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            setError('');
            const created = await api.createUser({
                name: newUser.name, email: newUser.email, role: newUser.role,
                goals: splitCsv(newUser.goals), targetSkills: splitCsv(newUser.targetSkills)
            });
            setUsers((current) => [created, ...current]);
            setSelectedUserId(created.id);
            setNewUser({ name: '', email: '', role: 'STUDENT', goals: '', targetSkills: '' });
        } catch (err) {
            setError('Registracija ni uspela: ' + err.message);
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
            const updated = await api.updateMentorNote(lastSession.id, { mentorNote });
            setLastSession(updated);
            setMentorNote('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId), [users, selectedUserId]);
    const filteredChallenges = useMemo(() => challenges.filter((c) => c.skillKey === selectedSkillKey), [challenges, selectedSkillKey]);
    const filteredPrompts = useMemo(() => prompts.filter((p) => p.skillKey === selectedSkillKey), [prompts, selectedSkillKey]);
    const selectedChallenge = useMemo(() => challenges.find((c) => c.id === selectedChallengeId), [challenges, selectedChallengeId]);

    return {
        health, users, skills, selectedUserId, setSelectedUserId, selectedSkillKey, setSelectedSkillKey,
        selectedChallengeId, setSelectedChallengeId, answer, setAnswer, lastSession, mentorNote, setMentorNote,
        report, newPrompt, setNewPrompt, newUser, setNewUser, loading, saving, error,
        loadPublicData, handleSuccessfulAuth, handleSubmitSession, handleRegisterUser, handleCreatePrompt, handleMentorNote,
        selectedUser, filteredChallenges, filteredPrompts, selectedChallenge
    };
}

function splitCsv(value) {
    if (!value) return [];
    return value.split(',').map((item) => item.trim()).filter(Boolean);
}