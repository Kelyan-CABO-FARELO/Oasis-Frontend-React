import React, { createContext, useContext, useEffect, useState } from 'react';
import { RouterProvider } from "react-router-dom";
import OfflineRouter from "./OfflineRouter.jsx";
import { useAuthContext } from "../contexts/AuthContext.jsx";
import { TOKEN_KEY, USER_INFOS } from "../constants/appConstants.js";
import PageLoader from "../components/Loader/PageLoader.jsx";
import OnlineRouter from "./OnlineRouter.jsx";
// Optionnel : une instance axios configurée
// import api from "../services/api.js";

const SessionContext = createContext({ inSession: false });
export const useSessionContext = () => useContext(SessionContext);

const AppRouter = () => {
    const [inSession, setInSession] = useState(null);
    const { setUserId, setEmail, setNickname } = useAuthContext();

    useEffect(() => {
        const checkUserSession = () => {
            const token = localStorage.getItem(TOKEN_KEY); // 'token_jwt' par exemple
            const userInfos = JSON.parse(localStorage.getItem(USER_INFOS));

            if (token && userInfos) {
                try {
                    // 1. Analyse du token (Vérification de l'expiration)
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const isTokenExpired = payload.exp * 1000 < Date.now();

                    if (isTokenExpired) {
                        handleLogout();
                    } else {
                        // 2. Hydratation du contexte
                        setUserId(userInfos.userId);
                        setEmail(userInfos.email);
                        setNickname(userInfos.nickname);

                        // 3. (Optionnel) Configurer le header par défaut pour Axios
                        // api.defaults.headers.Authorization = `Bearer ${token}`;

                        setInSession(true);
                    }
                } catch (error) {
                    console.error("Token invalide", error);
                    handleLogout();
                }
            } else {
                setInSession(false);
            }
        };

        const handleLogout = () => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_INFOS);
            setInSession(false);
        };

        checkUserSession();
    }, [setUserId, setEmail, setNickname]);

    if (inSession === null) {
        return <PageLoader />;
    }

    return (
        <SessionContext.Provider value={{ inSession }}>
            <RouterProvider router={inSession ? OnlineRouter : OfflineRouter} />
        </SessionContext.Provider>
    );
};

export default AppRouter;