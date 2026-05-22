import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import keycloak from "../keycloak.js";

const emptyPrompt = {
    skillKey: 'public-speaking',
    title: '',
    difficulty: 'BEGINNER',
    systemPrompt: 'You are an interactive soft-skills coach. Ask one clarifying question when the answer is vague, evaluate structure, empathy, clarity and actionability, then return concrete next steps.',
    userPromptTemplate: 'Scenario: {{scenario}}\nCriteria: {{criteria}}\nUser answer: {{answer}}\nGive a score, short praise, improvement points and one follow-up question.',
    simulatedAiResponse: 'Strukturirana povratna informacija: ocena, kaj deluje, kaj izboljšati, predlagan popravek in eno nadaljnje vprašanje za uporabnika.',
    tags: []
};

const demoUser = { id: 'demo-user', name: 'Demo uporabnik', role: 'STUDENT', points: 120, badges: ['First simulation', 'Multi-skill learner'] };
const demoSkills = [
    { id: 's1', key: 'public-speaking', name: 'Javno nastopanje', category: 'Komunikacija', level: 'BEGINNER', estimatedMinutes: 12, description: 'Jasna struktura, samozavesten nastop in prepričljiv zaključek.', outcomes: ['jasen uvod', 'argument', 'zaključek'] },
    { id: 's2', key: 'conflict-resolution', name: 'Reševanje konfliktov', category: 'Sodelovanje', level: 'INTERMEDIATE', estimatedMinutes: 15, description: 'Umirjanje napetosti, aktivno poslušanje in skupni dogovor.', outcomes: ['empatija', 'dogovor', 'meje'] },
    { id: 's3', key: 'team-collaboration', name: 'Timsko sodelovanje', category: 'Ekipa', level: 'BEGINNER', estimatedMinutes: 10, description: 'Usklajevanje nalog, povratna informacija in skupna odgovornost.', outcomes: ['vloge', 'ritem', 'feedback'] },
    { id: 's4', key: 'job-interview', name: 'Zaposlitveni razgovor', category: 'Kariera', level: 'INTERMEDIATE', estimatedMinutes: 14, description: 'Odgovori na zahtevna vprašanja in predstavitev kompetenc.', outcomes: ['STAR odgovor', 'primeri', 'vprašanja'] }
];
const demoChallenges = [
    { id: 'c1', skillKey: 'public-speaking', title: 'Predstavitev ideje v 2 minutah', scenario: 'Ekipo moraš prepričati, da podpre tvojo idejo za izboljšavo procesa.', expectedOutcome: 'Jasen problem, rešitev in poziv k akciji.', estimatedMinutes: 8, evaluationCriteria: ['jasnost', 'struktura', 'primer', 'zaključek'] },
    { id: 'c2', skillKey: 'conflict-resolution', title: 'Napet pogovor s sodelavcem', scenario: 'Sodelavec zamuja z nalogo, ti pa potrebuješ njegov del za rok oddaje.', expectedOutcome: 'Mirno izražena potreba in konkreten dogovor.', estimatedMinutes: 10, evaluationCriteria: ['empatija', 'aktivno poslušanje', 'dogovor', 'naslednji korak'] },
    { id: 'c3', skillKey: 'team-collaboration', title: 'Razdelitev nalog v ekipi', scenario: 'Ekipa ni usklajena, zato moraš predlagati jasnejšo delitev odgovornosti.', expectedOutcome: 'Jasne vloge, rok in način preverjanja napredka.', estimatedMinutes: 9, evaluationCriteria: ['vloge', 'odgovornost', 'komunikacija', 'preverjanje'] },
    { id: 'c4', skillKey: 'job-interview', title: 'Odgovor na vprašanje o slabosti', scenario: 'Na razgovoru te vprašajo: katero svojo slabost trenutno izboljšuješ?', expectedOutcome: 'Iskren, profesionalen odgovor z dokazom napredka.', estimatedMinutes: 7, evaluationCriteria: ['iskrenost', 'primer', 'učenje', 'samorefleksija'] }
];
const demoPrompts = [
    { id: 'p1', skillKey: 'public-speaking', title: 'Coach za javni nastop', difficulty: 'BEGINNER', systemPrompt: emptyPrompt.systemPrompt, userPromptTemplate: emptyPrompt.userPromptTemplate, simulatedAiResponse: emptyPrompt.simulatedAiResponse, tags: ['struktura', 'jasnost'] },
    { id: 'p2', skillKey: 'conflict-resolution', title: 'Coach za konflikt', difficulty: 'INTERMEDIATE', systemPrompt: 'Evaluate empathy, boundaries and concrete agreement.', userPromptTemplate: 'Conflict scenario: {{scenario}}\nAnswer: {{answer}}', simulatedAiResponse: 'Ocena + empatija + boljša formulacija + vprašanje za dogovor.', tags: ['empatija', 'dogovor'] }
];

export function useAppData() {
    const [health, setHealth] = useState(null);
    const [users, setUsers] = useState([]);
    const [skills, setSkills] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [prompts, setPrompts] = useState([]);

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedSkillKey, setSelectedSkillKey] = useState('public-speaking');
    const [selectedSkillKeys, setSelectedSkillKeys] = useState(['public-speaking']);
    const [selectedChallengeId, setSelectedChallengeId] = useState('');

    const [answer, setAnswer] = useState('');
    const [lastSession, setLastSession] = useState(null);
    const [mentorNote, setMentorNote] = useState('');
    const [report, setReport] = useState(null);

    const [newPrompt, setNewPrompt] = useState(emptyPrompt);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [demoMode, setDemoMode] = useState(false);

    const refreshUsers = async () => {
        if (demoMode) return;
        const freshUsers = await api.getUsers();
        setUsers(freshUsers);
    };

    const hydrateDemoData = useCallback((message = '') => {
        setDemoMode(true);
        setHealth({ status: 'DEMO' });
        setUsers([demoUser]);
        setSkills(demoSkills);
        setChallenges(demoChallenges);
        setPrompts(demoPrompts);
        setSelectedUserId(demoUser.id);
        setReport({
            userId: demoUser.id,
            userName: demoUser.name,
            totalSessions: 1,
            totalPoints: demoUser.points,
            averageScore: 78,
            badges: demoUser.badges,
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

        const firstChallenge = challengeResult.find(c => c.skillKey === initialSkill) || challengeResult[0];
        setSelectedChallengeId(firstChallenge?.id || '');
        setNewPrompt((current) => ({ ...current, skillKey: initialSkill }));
    }, []);

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
            const safeNext = next.length ? next : [skillKey];
            setSelectedSkillKey(safeNext[0]);
            setNewPrompt((prompt) => ({ ...prompt, skillKey: safeNext[0] }));
            return safeNext;
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
            if (demoMode) {
                const session = buildDemoSession({ answer, selectedChallenge, selectedSkillKeys });
                setLastSession(session);
                setAnswer('');
                setReport(buildDemoReport(session, selectedSkillKeys));
                setUsers([{ ...demoUser, points: demoUser.points + session.score, badges: [...demoUser.badges, session.score >= 80 ? 'Strong answer' : 'Practice streak'] }]);
                return;
            }
            const session = await api.submitSession({
                userId: selectedUserId,
                challengeId: selectedChallengeId,
                skillKey: selectedSkillKey,
                skillKeys: selectedSkillKeys,
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
        toggleSkillKey,
        selectedChallengeId,
        setSelectedChallengeId,
        answer,
        setAnswer,
        lastSession,
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
        selectedUser,
        selectedSkills,
        filteredChallenges,
        filteredPrompts,
        selectedChallenge
    };
}

function splitCsv(value) {
    if (!value) return [];
    return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function buildDemoSession({ answer, selectedChallenge, selectedSkillKeys }) {
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
        skillKey: selectedSkillKeys.join(','),
        challengeId: selectedChallenge?.id,
        userAnswer: answer,
        mentorNote: '',
        aiFeedback: `Ocena: ${score}/100\nIzbrane veščine: ${selectedSkillKeys.join(', ')}\n\nKaj je dobro:\n- Odgovor je povezan s scenarijem "${selectedChallenge?.title || 'simulacija'}".\n- Pokazal/a si pripravljenost za konkretno komunikacijo.\n\nKaj izboljšati:\n- Dodaj še bolj jasen naslednji korak: kdo naredi kaj in do kdaj.\n- Vključi eno vprašanje, s katerim preveriš razumevanje sogovornika.\n\nBoljša verzija:\n- Razumem situacijo. Predlagam, da najprej uskladimo cilj, nato določimo odgovornosti in se dogovorimo za kratek pregled napredka.\n\nVprašanje za nadaljevanje:\n- Kako bi ta odgovor povedal/a bolj kratko, mirno in samozavestno?`
    };
}

function buildDemoReport(session, selectedSkillKeys) {
    return {
        userId: demoUser.id,
        userName: demoUser.name,
        totalSessions: 2,
        totalPoints: demoUser.points + session.score,
        averageScore: session.score,
        badges: [...demoUser.badges, session.score >= 80 ? 'Strong answer' : 'Practice streak'],
        skillProgress: selectedSkillKeys.map((skillKey) => ({
            skillKey,
            sessions: 1,
            averageScore: session.score,
            nextSuggestedChallenge: 'Ponovi simulacijo z bolj konkretnim primerom in mentorjevim komentarjem.'
        })),
        recommendations: [
            'Odgovor popravi po AI povratni informaciji in ga oddaj ponovno.',
            'Dodaj mentorjevo opombo, če želiš človeški vpogled v napredek.',
            'Naslednjič izberi še eno povezano veščino za širši učni načrt.'
        ]
    };
}
