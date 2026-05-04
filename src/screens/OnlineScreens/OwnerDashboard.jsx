import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext.jsx';

const OwnerDashboard = () => {
    const [ownerData, setOwnerData] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. N'oublie pas d'importer l'email depuis ton contexte !
    const { userId, email, signOut } = useAuthContext();

    useEffect(() => {
        if (email) { // On écoute l'email maintenant
            fetchOwnerData();
        }
    }, [email]);

    const fetchOwnerData = async () => {
        setLoading(true);
        try {
            // 2. On cherche l'utilisateur par son e-mail !
            const userResponse = await apiFetch(`/users?email=${email}`);

            // API Platform renvoie un tableau, on prend le premier résultat
            const user = userResponse['hydra:member'] ? userResponse['hydra:member'][0] : userResponse[0];

            if (!user) {
                throw new Error("Utilisateur introuvable");
            }

            setOwnerData(user);

            // ... le reste du code reste identique (récupération des factures, etc.)
            const personName = encodeURIComponent(`${user.firstname} ${user.lastname}`);
            const dataInvoices = await apiFetch(`/invoices?person=${personName}`);
            setInvoices(dataInvoices['hydra:member'] || dataInvoices.member || (Array.isArray(dataInvoices) ? dataInvoices : []));

        } catch (error) {
            console.error("Erreur lors du chargement des données propriétaire :", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateContractDetails = (startDateString) => {
        if (!startDateString) return null;
        const start = new Date(startDateString);
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        const today = new Date();
        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
        const daysPassed = (today - start) / (1000 * 60 * 60 * 24);
        const remainingDays = Math.max(0, Math.ceil(totalDays - daysPassed));
        const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
        return { start, end, remainingDays, progressPercent };
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Chargement de votre espace... ⏳</div>;
    if (!ownerData) return <div className="p-10 text-center text-red-500 font-bold">Erreur : Impossible de charger vos données.</div>;

    const contract = calculateContractDetails(ownerData.contractDate);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

            {/* EN-TÊTE AVEC BOUTON DÉCONNEXION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bonjour, {ownerData.firstname} 👋</h1>
                    <p className="text-slate-500 font-medium mt-2">Bienvenue dans votre espace propriétaire du Domaine L'Oasis.</p>
                </div>
                <button
                    onClick={signOut}
                    className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
                >
                    🚪 Déconnexion
                </button>
            </div>

            {/* Reste du code du Dashboard à l'identique... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">⏳</div>
                            <h2 className="text-2xl font-black text-slate-800">Mon Contrat de Location</h2>
                        </div>
                        {contract ? (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Début : {contract.start.toLocaleDateString('fr-FR')}</span>
                                    <span>Renouvellement : {contract.end.toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${contract.remainingDays < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${contract.progressPercent}%` }} />
                                </div>
                                <p className="text-right font-black text-lg text-slate-700">{contract.remainingDays} jours restants</p>
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">Aucune date de contrat enregistrée.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">🏡</div>
                            <h2 className="text-2xl font-black text-slate-800">Mes Résidences & Parcelles</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ownerData.products && ownerData.products.length > 0 ? (
                                ownerData.products.map(product => (
                                    <div key={product.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-emerald-200 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-lg text-slate-800 leading-tight">{product.title}</h3>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Actif</span>
                                        </div>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description || 'Aucune description'}</p>
                                        <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors">Gérer ce bien</button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic col-span-full">Vous ne possédez aucun bien actuellement.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl">💰</div>
                        <h2 className="text-2xl font-black">Mes Rétributions</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">Retrouvez ici vos revenus générés par la sous-location de votre bien par le camping.</p>
                    <div className="space-y-3">
                        {invoices.length > 0 ? (
                            invoices.map(invoice => (
                                <div key={invoice.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-emerald-400">{invoice.title}</h4>
                                        <p className="text-xs text-slate-400">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <button onClick={() => window.open(invoice.path, '_blank')} disabled={!invoice.path || invoice.path === 'generation_en_attente'} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30" title="Télécharger la facture">📥</button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/20">
                                <span className="text-3xl block mb-2">📉</span>
                                <p className="text-slate-400 font-medium">Aucune rétribution pour le moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;