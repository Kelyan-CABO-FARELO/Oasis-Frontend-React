import React, { useEffect, useState } from 'react';
import { RouterProvider } from "react-router-dom";
import OfflineRouter from "./OfflineRouter.jsx";
import OnlineRouter from "./OnlineRouter.jsx";
import { useAuthContext } from "../contexts/AuthContext.jsx";
import { TOKEN_KEY, USER_INFOS } from "../constants/appConstants.js";
import PageLoader from "../components/Loader/PageLoader.jsx";

const AppRouter = () => {
    const [isChecking, setIsChecking] = useState(true);
    // 👇 On récupère directement userId et signOut du contexte
    const { userId, setUserId, setEmail, setNickname, signOut } = useAuthContext();

    useEffect(() => {
        const checkUserSession = () => {
            const token = localStorage.getItem(TOKEN_KEY);
            const userInfos = JSON.parse(localStorage.getItem(USER_INFOS));

            if (token && userInfos) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const isTokenExpired = payload.exp * 1000 < Date.now();

                    if (isTokenExpired) {
                        signOut(); // On utilise la fonction de déconnexion globale !
                    } else {
                        setUserId(userInfos.userId);
                        setEmail(userInfos.email);
                        setNickname(userInfos.nickname);
                    }
                } catch (error) {
                    console.error("Token invalide", error);
                    signOut();
                }
            }
            setIsChecking(false);
        };

        checkUserSession();
    }, []); // 👈 On ne l'exécute qu'au chargement

    if (isChecking) {
        return <PageLoader />;
    }

    // 👇 LA MAGIE OPÈRE ICI :
    // La propriété `key` force React à détruire et recréer le Routeur à chaque changement de connexion
    return (
        <RouterProvider
            key={userId ? 'online' : 'offline'}
            router={userId ? OnlineRouter : OfflineRouter}
        />
    );
};

export default AppRouter;