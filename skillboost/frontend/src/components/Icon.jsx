const iconMap = {
    target: (
        <>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    checkCircle: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
        </>
    ),
    circle: <circle cx="12" cy="12" r="8" />,
    plus: <path d="M12 5v14M5 12h14" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    trophy: (
        <>
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M7 7H4a3 3 0 0 0 3 3" />
            <path d="M17 7h3a3 3 0 0 1-3 3" />
        </>
    ),
    swords: (
        <>
            <path d="M14.5 17.5 4 7l3-3 10.5 10.5" />
            <path d="m6 5 13 13" />
            <path d="M5 19l4-4" />
            <path d="M16 5l3-1 1 3-10.5 10.5" />
        </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />,
    flame: (
        <>
            <path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.8 4.8 0 0 0 4.5-7.5c-.9-1.5-2.3-2.6-2.3-5.5-1.8 1.2-3.1 3.1-3.1 5.2-1.4-.7-2.4-2-2.6-3.7-1.1 1.2-1.7 2.6-1.7 4Z" />
            <path d="M12 22c1.7-1.4 2-3.4.8-5.2" />
        </>
    ),
    medal: (
        <>
            <circle cx="12" cy="14" r="5" />
            <path d="M9 2h6l-1 7h-4L9 2Z" />
            <path d="M12 12v4" />
            <path d="M10 14h4" />
        </>
    ),
    star: (
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" />
    ),
    starOff: (
        <>
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" />
            <path d="M4 4l16 16" />
        </>
    ),
    gamepad: (
        <>
            <path d="M6 10h12a4 4 0 0 1 3.8 5.3l-.5 1.4a2 2 0 0 1-3.2.8L15 15H9l-3.1 2.5a2 2 0 0 1-3.2-.8l-.5-1.4A4 4 0 0 1 6 10Z" />
            <path d="M8 13v3M6.5 14.5h3" />
            <path d="M16.5 14h.01M18.5 15.5h.01" />
        </>
    ),
    briefcase: (
        <>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18" />
        </>
    ),
    handshake: (
        <>
            <path d="M8 12 5.5 9.5a2.8 2.8 0 0 1 4-4L12 8" />
            <path d="m16 12 2.5-2.5a2.8 2.8 0 0 0-4-4L12 8" />
            <path d="m7 13 4 4a2 2 0 0 0 3 0l3-3" />
            <path d="M12 8l-2 2a1.8 1.8 0 0 0 2.5 2.5l1-1" />
        </>
    ),
    message: (
        <>
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
            <path d="M8 11h8M8 15h5" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
            <path d="M16 3.3a4 4 0 0 1 0 7.4" />
        </>
    ),
    brain: (
        <>
            <path d="M8 6a3 3 0 0 1 5-2.2A3 3 0 0 1 18 6a3 3 0 0 1 1 5.8A3.5 3.5 0 0 1 15.5 17H15a3 3 0 0 1-6 0h-.5A3.5 3.5 0 0 1 5 11.8 3 3 0 0 1 8 6Z" />
            <path d="M12 4v16" />
            <path d="M9 9h3M12 13h3" />
        </>
    ),
    sprout: (
        <>
            <path d="M12 21V10" />
            <path d="M12 10C9 6 5 6 3 8c2 4 6 5 9 2Z" />
            <path d="M12 12c3-4 7-4 9-2-2 4-6 5-9 2Z" />
        </>
    ),
    sparkles: (
        <>
            <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3Z" />
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
            <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
        </>
    ),
    microphone: (
        <>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3M8 21h8" />
        </>
    ),
    ear: (
        <>
            <path d="M6 10a6 6 0 1 1 11.5 2.4c-.8 1.5-2.2 2-3.4 3.2-.9.9-1 2.4-2.5 3.1-1.3.6-3 .2-3.9-.8" />
            <path d="M10 10a2 2 0 1 1 4 0c0 1.5-1 2-2 3" />
        </>
    ),
    pen: (
        <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
    ),
    note: (
        <>
            <path d="M8 3h8l4 4v14H4V3h4Z" />
            <path d="M16 3v5h5" />
            <path d="M8 13h8M8 17h5" />
        </>
    ),
    fireExtinguisher: (
        <>
            <path d="M10 6h4" />
            <path d="M12 6V3h3" />
            <rect x="8" y="9" width="8" height="12" rx="3" />
            <path d="M9 13h6" />
            <path d="M15 7h4l2 2" />
        </>
    ),
    heart: (
        <path d="M20.8 8.6c0 5.2-8.8 10.4-8.8 10.4S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z" />
    ),
    shield: (
        <>
            <path d="M12 3 20 6v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
            <path d="m9 12 2 2 4-5" />
        </>
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a13 13 0 0 1 0 18" />
            <path d="M12 3a13 13 0 0 0 0 18" />
        </>
    ),
    userTie: (
        <>
            <circle cx="12" cy="7" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
            <path d="m10 13 2 3 2-3" />
            <path d="m12 16-1 5M12 16l1 5" />
        </>
    ),
    scale: (
        <>
            <path d="M12 3v18" />
            <path d="M5 7h14" />
            <path d="m6 7-3 6h6L6 7Z" />
            <path d="m18 7-3 6h6l-3-6Z" />
            <path d="M8 21h8" />
        </>
    ),
    compass: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m15 9-2 6-4 2 2-6 4-2Z" />
        </>
    ),
    clipboard: (
        <>
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4a3 3 0 0 1 6 0" />
            <path d="M9 12h6M9 16h4" />
        </>
    ),
    timer: (
        <>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 13V8" />
            <path d="M12 13l3 2" />
            <path d="M9 2h6" />
        </>
    ),
    pin: (
        <>
            <path d="m16 3 5 5-5 5-2-2-5 5v5H4v-5h5l5-5-2-2 4-6Z" />
        </>
    ),
    puzzle: (
        <>
            <path d="M10 3h4v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 1-4 0H2v-4h4a2 2 0 1 0 0-4H2V3h4a2 2 0 1 0 4 0Z" />
        </>
    ),
    headphones: (
        <>
            <path d="M4 14a8 8 0 0 1 16 0" />
            <rect x="3" y="14" width="4" height="7" rx="2" />
            <rect x="17" y="14" width="4" height="7" rx="2" />
        </>
    ),
    breath: (
        <>
            <path d="M7 12c-3 0-4-2-4-4s2-4 5-2c2 1 3 4 3 7v8" />
            <path d="M17 12c3 0 4-2 4-4s-2-4-5-2c-2 1-3 4-3 7v8" />
            <path d="M8 16h8" />
        </>
    ),
    wave: (
        <>
            <path d="M3 15c3 0 3-4 6-4s3 4 6 4 3-4 6-4" />
            <path d="M3 19c3 0 3-3 6-3s3 3 6 3 3-3 6-3" />
        </>
    ),
    dumbbell: (
        <>
            <path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" />
        </>
    ),
    sunrise: (
        <>
            <path d="M3 18h18" />
            <path d="M6 15a6 6 0 0 1 12 0" />
            <path d="M12 3v5M4.2 7.2l3.5 3.5M19.8 7.2l-3.5 3.5" />
        </>
    ),
    coins: (
        <>
            <ellipse cx="12" cy="6" rx="7" ry="3" />
            <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
            <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.8 2.8 0 0 1 5 1.8c0 2-2.5 2.2-2.5 4.2" />
            <path d="M12 18h.01" />
        </>
    ),
    speech: (
        <>
            <path d="M4 5h16v10H8l-4 4V5Z" />
            <path d="M8 9h8M8 12h5" />
        </>
    ),
    laptop: (
        <>
            <rect x="5" y="4" width="14" height="10" rx="2" />
            <path d="M3 18h18l-2-4H5l-2 4Z" />
        </>
    ),
    wrench: (
        <>
            <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.9-2.9 2.4-2.6Z" />
        </>
    ),
    rocket: (
        <>
            <path d="M14 4c3 1 5 3 6 6l-5 5-6-6 5-5Z" />
            <path d="M9 15 5 19" />
            <path d="M6 14 4 20l6-2" />
            <circle cx="15" cy="9" r="1.5" />
        </>
    ),
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
        </>
    )
};

export function Icon({ name = 'sparkles', className = '', size = 20, title, ...props }) {
    const content = iconMap[name] || iconMap.sparkles;
    const accessibilityProps = title
        ? { role: 'img', 'aria-label': title }
        : { 'aria-hidden': 'true' };

    return (
        <svg
            className={`app-icon ${className}`.trim()}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...accessibilityProps}
            {...props}
        >
            {title && <title>{title}</title>}
            {content}
        </svg>
    );
}

export function IconBadge({ name, className = '', title, size = 22 }) {
    return (
        <span className={`icon-badge ${className}`.trim()} aria-hidden={!title || undefined}>
            <Icon name={name} size={size} title={title} />
        </span>
    );
}
