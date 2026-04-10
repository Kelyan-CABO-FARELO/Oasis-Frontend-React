import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext.jsx';
import ReservationList from "../../components/Admin/ReservationList.jsx";

const AdminDashboard = () => {
    const { nickname, signOut } = useAuthContext();
    const [activeTab, setActiveTab] = useState('overview');

    const handleLogout = () => {
        signOut(); // 1. On vide le localStorage et le contexte
        window.location.href = '/'; // 2. Redirection native immédiate vers l'accueil !
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* BARRE LATÉRALE (SIDEBAR) */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-black text-amber-500">L'Oasis<span className="text-white">.</span></h2>
                    <p className="text-slate-400 text-sm mt-1">Espace Administration</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 font-medium">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                        📊 Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'reservations' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                        📅 Réservations
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                        👥 Utilisateurs
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                        🏕️ Hébergements
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
                    >
                        🚪 Se déconnecter
                    </button>
                </div>
            </aside>

            {/* CONTENU PRINCIPAL */}
            <main className="flex-1 p-10">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Bonjour {nickname} 👋</h1>
                        <p className="text-slate-500 mt-2">Gérez les données de votre camping en temps réel.</p>
                    </div>
                </header>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[60vh]">
                    {activeTab === 'overview' && <p>📈 Bienvenue sur le tableau de bord ! Sélectionnez un menu à gauche pour commencer.</p>}

                    {/* Liste des réservations */}
                    {activeTab === 'reservations' && (
                        <div>
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                📅 Liste des Réservations
                            </h2>
                            {/* On appelle le composant proprement */}
                            <ReservationList />
                        </div>
                    )}
                    {activeTab === 'users' && <p>👥 (Composant de la liste des utilisateurs à venir...)</p>}
                    {activeTab === 'products' && <p>🏕️ (Composant de la liste des hébergements à venir...)</p>}
                </div>
            </main>

        </div>
    );
};

export default AdminDashboard;