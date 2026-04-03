import { createContext, useContext, useState } from "react";
// N'oubliez pas d'importer TOKEN_KEY en plus de USER_INFOS
import { USER_INFOS, TOKEN_KEY } from "../constants/appConstants.js";

// ===========================
// CONTEXTE D'AUTHENTIFICATION
// ===========================
// Ce contexte gère l'authentification globale de l'application
// Il permet de partager l'état de connexion entre tous les composants
// Avantage: Évite le prop drilling (passage de props a travers le niveau de composant)

// ====================
// CRÉATION DU CONTEXTE
// ====================
// On définit la structure du contexte avec des valeurs par defaut
const AuthContext = createContext({
    userId: '', // ID de l'utilisateur connecté
    email: '', // Email de l'utilisateur
    nickname: '', // Pseudo de l'utilisateur (corrigé)
    setUserId: () => {}, // Fonction pour modifier userId
    setEmail: () => {}, // Fonction pour modifier email
    setNickname: () => {}, // Fonction pour modifier nickname (corrigé)
    signIn: async () => {}, // Fonction de connexion
    signOut: async () => {} // Fonction de déconnexion
})

// ====================
// PROVIDER DU CONTEXTE
// ====================
// Le Provider encapsule toute l'application et rend les données accessibles
const AuthContextProvider = ({children}) => {
    // États locaux pour stocker les infos utilisateur
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState(''); // Remplacé firstname par nickname

    // ====================
    // MÉTHODE DE CONNEXION
    // ====================
    /**
     * Connecte un utilisateur et sauvegarde ses infos et son token
     * @param {Objet} user - Objet qui contient userId, email et nickname
     * @param {String} token - Le jeton JWT renvoyé par l'API
     */
    const signIn = async (user, token) => {
        try {
            // Mise à jour des états avec les données utilisateur
            setUserId(user.userId);
            setEmail(user.email);
            setNickname(user.nickname); // Remplacé setFirstname par setNickname

            // Sauvegarde dans le localStorage
            localStorage.setItem(USER_INFOS, JSON.stringify(user));
            localStorage.setItem(TOKEN_KEY, token); // Ajout de la sauvegarde du token
        } catch (error) {
            throw new Error(`Erreur lors de la connexion: ${error}`);
        }
    };

    // ======================
    // MÉTHODE DE DÉCONNEXION
    // ======================
    /**
     * Déconnecte l'utilisateur et nettoie les données
     */
    const signOut = async () => {
        try {
            // Nettoyage des états
            setUserId('');
            setEmail('');
            setNickname(''); // Ajout du nettoyage du pseudo

            // Suppression du localStorage
            localStorage.removeItem(USER_INFOS);
            localStorage.removeItem(TOKEN_KEY); // Ajout de la suppression du token
        } catch (error) {
            throw new Error(`Erreur lors de la déconnexion: ${error}`);
        }
    }

    // ======================
    // VALEUR DU CONTEXTE
    // ======================
    // Objet contenant toutes les valeurs et fonctions à partager
    const value = {
        userId,
        email,
        nickname, // Remplacé firstname par nickname
        setUserId,
        setEmail,
        setNickname, // Remplacé setFirstname par setNickname
        signIn,
        signOut
    }

    //Rendu du Provider avec les valeurs
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};

// =================
// HOOK PERSONNALISE
// =================
// Hook pour faciliter l'acccès au contexte dans les composants
// Usage : const {userId, signIn} = useAuthContext()
const useAuthContext = () => useContext(AuthContext);

export {AuthContext, AuthContextProvider, useAuthContext};