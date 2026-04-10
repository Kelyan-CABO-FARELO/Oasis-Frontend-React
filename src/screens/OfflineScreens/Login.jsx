import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import ErrorMessage from '../../components/UI/ErrorMessage.jsx';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useAuthContext();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. On récupère le jeton depuis Symfony
            const token = await authService.login(credentials.email, credentials.password);

            // 2. On décode grossièrement le token pour extraire l'email (LexikJWT l'y met par défaut sous "username")
            const payload = JSON.parse(atob(token.split('.')[1]));

            // 3. On sauvegarde dans le contexte
            // (Tu pourras ajuster l'objet "user" selon ce que ton API renvoie vraiment)
            const userInfos = {
                userId: payload.id || 'admin',
                email: payload.username || credentials.email,
                nickname: 'Admin'
            };

            await signIn(userInfos, token);

            // 4. La magie opère : AppRouter va détecter "inSession = true" et charger OnlineRouter !
            navigate('/');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffdf0] flex items-center justify-center p-6">
            <button onClick={() => navigate("/")} className="mb-8 font-bold text-amber-700 hover:text-amber-600 bg-amber-100 px-5 py-2 rounded-full flex items-center gap-2">
                ← Retour à l'acceuil
            </button>
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-amber-50">
                <div className="text-center mb-8">
                    <span className="text-4xl block mb-4">🔐</span>
                    <h1 className="text-3xl font-black text-slate-900">Espace Réservé</h1>
                    <p className="text-slate-500 mt-2 font-medium">Connectez-vous à votre compte</p>
                </div>

                {error && <ErrorMessage message={error} />}

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div>
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-amber-400 outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-amber-400 outline-none transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-xl shadow-lg transition-all ${isLoading ? 'opacity-70' : 'hover:-translate-y-1'}`}
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;