import { useState, useEffect, useRef } from 'react';
import keycloak from "../keycloak.js";

const LOGIN_INTRO_PENDING_KEY = 'skillboost_login_intro_pending';

function markLoginIntroPending() {
    try {
        sessionStorage.setItem(LOGIN_INTRO_PENDING_KEY, 'true');
    } catch {
        // ignore storage access issues
    }
}


function extractRoles() {
    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || [];
    const resourceRoles = Object.values(keycloak.tokenParsed?.resource_access || {})
        .flatMap((resource) => resource?.roles || []);
    return [...new Set([...realmRoles, ...resourceRoles].map((role) => String(role).toUpperCase().replace(/-/g, '_')))];
}

export function useAuth(onAuthSuccess, onAuthFail) {
    const [authenticated, setAuthenticated] = useState(false);
    const [roles, setRoles] = useState([]);
    const isRun = useRef(false);

    useEffect(() => {
        if (isRun.current) return;
        isRun.current = true;

        keycloak.init({
            onLoad: 'check-sso',
            checkLoginIframe: false
        })
        .then((auth) => {
            if (auth) {
                setAuthenticated(true);
                setRoles(extractRoles());
                localStorage.setItem('token', keycloak.token);
                onAuthSuccess();
            } else {
                onAuthFail();
            }
        })
        .catch((err) => {
            console.error("Keycloak init failed:", err);
            onAuthFail();
        });
    }, [onAuthSuccess, onAuthFail]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (keycloak.token) {
                keycloak.updateToken(70).then((refreshed) => {
                    if (refreshed) {
                        localStorage.setItem('token', keycloak.token);
                        setRoles(extractRoles());
                    }
                });
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const currentRedirectUri = () => window.location.origin + '/';

    const handleLogin = () => {
        markLoginIntroPending();
        return keycloak.login({ redirectUri: currentRedirectUri() });
    };
    const handleRegister = () => {
        markLoginIntroPending();
        return keycloak.register({ redirectUri: currentRedirectUri() });
    };
    const handleLogout = () => keycloak.logout({ redirectUri: currentRedirectUri() });

    return {
        authenticated,
        handleLogin,
        handleRegister,
        handleLogout,
        username: keycloak.tokenParsed?.preferred_username,
        roles,
        isMentor: roles.includes('MENTOR') || roles.includes('ADMIN'),
        isAdmin: roles.includes('ADMIN')
    };
}