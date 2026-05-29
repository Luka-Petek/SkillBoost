import { useEffect, useMemo, useState } from 'react';

const VISITED_KEY = 'skillboost_intro_has_visited';

function hasVisited() {
  try {
    return window.localStorage.getItem(VISITED_KEY) === 'true';
  } catch {
    return false;
  }
}

function markVisited() {
  try {
    window.localStorage.setItem(VISITED_KEY, 'true');
  } catch {
    // ignore storage access issues
  }
}

export function LogoIntro({ playKey = 0 }) {
  const [visible, setVisible] = useState(() => !hasVisited());
  const [closing, setClosing] = useState(false);
  const particles = useMemo(
    () => [
      { left: '18%', top: '24%', size: 6, delay: '0s', duration: '3.8s' },
      { left: '28%', top: '18%', size: 4, delay: '0.4s', duration: '4.4s' },
      { left: '68%', top: '22%', size: 5, delay: '0.9s', duration: '3.6s' },
      { left: '78%', top: '14%', size: 7, delay: '1.2s', duration: '4.1s' },
      { left: '14%', top: '72%', size: 5, delay: '0.6s', duration: '4.8s' },
      { left: '30%', top: '82%', size: 4, delay: '1s', duration: '3.9s' },
      { left: '72%', top: '78%', size: 6, delay: '0.2s', duration: '4.5s' },
      { left: '84%', top: '68%', size: 4, delay: '1.4s', duration: '4.2s' },
      { left: '48%', top: '16%', size: 3, delay: '0.8s', duration: '3.7s' },
      { left: '58%', top: '80%', size: 3, delay: '1.1s', duration: '4s' }
    ],
    []
  );

  useEffect(() => {
    if (playKey > 0) {
      setClosing(false);
      setVisible(true);
    }
  }, [playKey]);

  useEffect(() => {
    if (!visible) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const activeDuration = prefersReducedMotion ? 550 : 3200;
    const exitDuration = prefersReducedMotion ? 220 : 700;

    const beginClose = window.setTimeout(() => {
      setClosing(true);
      markVisited();
    }, activeDuration);

    const remove = window.setTimeout(() => {
      setVisible(false);
    }, activeDuration + exitDuration);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setClosing(true);
        markVisited();
        window.setTimeout(() => setVisible(false), exitDuration);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(beginClose);
      window.clearTimeout(remove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, playKey]);

  if (!visible) return null;

  return (
    <div className={`logo-intro ${closing ? 'logo-intro--closing' : ''}`} aria-label="SkillBoost opening animation">
      <div className="logo-intro__sky" />
      <div className="logo-intro__horizon" />
      <div className="logo-intro__nebula logo-intro__nebula--left" />
      <div className="logo-intro__nebula logo-intro__nebula--right" />

      <div className="logo-intro__stars" aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>

      <div className="logo-intro__center-glow" />

      <div className="logo-intro__scene">
        <div className="logo-intro__trail logo-intro__trail--one" />
        <div className="logo-intro__trail logo-intro__trail--two" />
        <div className="logo-intro__shards" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <img className="logo-intro__mark" src="/brand/skillboost-mark.png" alt="SkillBoost logo" />

        <div className="logo-intro__copy">
          <div className="logo-intro__pill">SKILLBOOST</div>
          <h1>
            <span>Skill</span>
            <strong>Boost</strong>
          </h1>
          <p>AI coaching • growth • progress</p>
          <div className="logo-intro__loader" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
