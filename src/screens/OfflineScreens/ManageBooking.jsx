import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';

const ManageBooking = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    // 🛑 SÉCURITÉ N°1 (REACT) : Si aucun jeton n'est présent dans l'URL -> DEHORS !
    if (!token) {
        return <Navigate to="/" replace />;
    }

    const [booking, setBooking] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // On appelle Symfony (sans le /api, comme vu précédemment)
        fetch(`http://localhost:8088/manage-booking/${id}?token=${token}`)
            .then(response => {
                // Si Symfony renvoie une erreur (403 ou 404), on déclenche l'erreur
                if (!response.ok) throw new Error("Ce lien magique est invalide, expiré, ou ne vous appartient pas.");
                return response.json();
            })
            .then(data => setBooking(data))
            .catch(err => setError(err.message));
    }, [id, token]);

    // FONCTION D'ANNULATION
    const handleCancelBooking = async () => {
        // Fenêtre de confirmation native du navigateur
        const isConfirmed = window.confirm("⚠️ Êtes-vous sûr de vouloir annuler ce séjour ? Cette action est irréversible (aucun remboursement automatique n'est traité ici).");

        if (isConfirmed) {
            try {
                const response = await fetch(`http://localhost:8088/manage-booking/${id}/cancel?token=${token}`, {
                    method: 'DELETE', // 👈 On dit bien à Symfony qu'on veut SUPPRIMER
                });

                if (!response.ok) throw new Error("Erreur lors de l'annulation.");

                // Si ça a marché :
                alert("Votre réservation a été annulée et supprimée de nos systèmes.");
                navigate('/'); // On renvoie l'utilisateur à l'accueil

            } catch (err) {
                alert(err.message);
            }
        }
    };

    // 🛑 SÉCURITÉ N°2 (SYMFONY) : Si le jeton est faux ou a expiré
    if (error) {
        return (
            <div className="min-h-screen bg-[#fffdf0] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-md border border-red-100">
                    <div className="text-6xl mb-6">🛑</div>
                    <h1 className="text-2xl font-black text-slate-900 mb-4">Accès Refusé</h1>
                    <p className="text-slate-600 mb-8 font-medium">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        Retourner à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    // Écran de chargement
    if (!booking) {
        return (
            <div className="min-h-screen bg-[#fffdf0] flex items-center justify-center">
                <div className="text-xl font-bold text-amber-600 animate-pulse">
                    Ouverture de votre dossier sécurisé... 🔐
                </div>
            </div>
        );
    }

    // ✅ SI TOUT EST BON : On affiche le Super Dashboard !
    return (
        <div className="min-h-screen bg-[#fffdf0] py-12 px-6">
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                <h1 className="text-4xl font-black text-slate-900 mb-2">
                    Bonjour {booking.user?.firstname} 👋
                </h1>
                <p className="text-lg text-slate-500 mb-8 font-medium">
                    Espace de gestion de votre réservation <span className="text-amber-500 font-bold">#{booking.id}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLONNE GAUCHE : DÉTAILS */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                🏕️ Votre Hébergement
                            </h2>

                            {/* Affichage des hébergements récupérés depuis Symfony */}
                            {booking.products && booking.products.length > 0 ? (
                                booking.products.map((prod, idx) => (
                                    <div key={idx} className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-8 shadow-sm">
                                        <p className="text-xl font-bold text-amber-700">{prod}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-200">
                                    <p className="text-slate-500 italic">Aucun hébergement spécifié.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Arrivée</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">{booking.startDate}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Départ</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">{booking.endDate}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Voyageurs</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">
                                        {booking.nbAdult} Adulte(s), {booking.nbChildren} Enfant(s)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE : ACTIONS DE GESTION */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                ⚙️ Gestion
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                    <span className="font-bold text-slate-600">Paiement</span>
                                    <span className={booking.isPaid ? 'px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg' : 'px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg'}>
                                        {booking.isPaid ? 'Validé' : 'En attente'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => alert("Génération du PDF bientôt disponible !")}
                                    className="w-full py-4 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm"
                                >
                                    📥 Télécharger ma facture
                                </button>

                                <button
                                    onClick={() => alert("Ajout d'options bientôt disponible !")}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm"
                                >
                                    🏊‍♂️ Ajouter des options
                                </button>

                                <hr className="border-slate-100 my-6" />

                                <button
                                    onClick={handleCancelBooking}
                                    className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-red-100"
                                >
                                    ❌ Annuler le séjour
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ManageBooking;