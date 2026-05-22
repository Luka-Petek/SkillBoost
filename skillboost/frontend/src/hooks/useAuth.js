import { useState, useEffect, useRef } from 'react';
import keycloak from "../keycloak.js";

export function useAuth(onAuthSuccess, onAuthFail) {
    const [authenticated, setAuthenticated] = useState(false);
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
                    }
                });
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const currentRedirectUri = () => window.location.origin + '/';

    const handleLogin = () => keycloak.login({ redirectUri: currentRedirectUri() });
    const handleRegister = () => keycloak.register({ redirectUri: currentRedirectUri() });
    const handleLogout = () => keycloak.logout({ redirectUri: currentRedirectUri() });

    return {
        authenticated,
        handleLogin,
        handleRegister,
        handleLogout,
        username: keycloak.tokenParsed?.preferred_username
    };
}