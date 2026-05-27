import { useState, useEffect } from 'react';

export function ProfileSection({ profile, onUpdate, saving }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [goals, setGoals] = useState('');
    const [targetSkills, setTargetSkills] = useState('');

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setGoals((profile.goals || []).join(', '));
            setTargetSkills((profile.targetSkills || []).join(', '));
        }
    }, [profile]);

    if (!profile) return <div>Nalagam profil...</div>;

    return (
        <div className="content-section">
            <div className="section-title">
                <h2>Moj profil</h2>
                {!isEditing && <button className="secondary" onClick={() => setIsEditing(true)}>Uredi</button>}
            </div>
            {isEditing ? (
                <form className="prompt-form" onSubmit={(e) => { e.preventDefault(); onUpdate({ name, goals: goals.split(',').map(g => g.trim()), targetSkills: targetSkills.split(',').map(s => s.trim()) }); setIsEditing(false); }}>
                    <label>Ime: <input value={name} onChange={e => setName(e.target.value)} /></label>
                    <label>Cilji (loči z vejico): <input value={goals} onChange={e => setGoals(e.target.value)} /></label>
                    <label>Veščine (loči z vejico): <input value={targetSkills} onChange={e => setTargetSkills(e.target.value)} /></label>
                    <button className="primary" disabled={saving}>Shrani</button>
                    <button type="button" className="secondary" onClick={() => setIsEditing(false)}>Prekliči</button>
                </form>
            ) : (
                <div className="report-grid">
                    <article className="metric-card"><span>Ime</span><strong>{profile.name}</strong></article>
                    <article className="metric-card"><span>Cilji</span><strong>{profile.goals?.join(', ') || 'Brez'}</strong></article>
                    <article className="metric-card"><span>Veščine</span><strong>{profile.targetSkills?.join(', ') || 'Brez'}</strong></article>
                </div>
            )}
        </div>
    );
}