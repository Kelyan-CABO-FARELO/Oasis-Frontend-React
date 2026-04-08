import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useBookingContext } from "../../contexts/BookingContext.jsx";
import { reservationService } from "../../services/reservationService.js";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { searchParams, poolOptions } = useBookingContext();

    // Récupération des données passées par la page précédente
    const grandTotal = location.state?.grandTotal;
    const productId = location.state?.productId;

    // Sécurité : si on arrive ici sans prix, sans dates ou sans ID de produit, on renvoie à la carte
    if (!grandTotal || !searchParams.startDate || !productId) {
        return <Navigate to="/product" replace />;
    }

    // État du formulaire invité
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        mobile: '',
        consentDataRetention: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Construction de l'objet complet à envoyer à Symfony
        const payload = {
            user: formData,
            reservation: {
                productId: Number(productId),
                startDate: searchParams.startDate,
                endDate: searchParams.endDate,
                nbAdults: Number(searchParams.nbAdults),
                nbChildren: Number(searchParams.nbChildren),
                wantsPool: poolOptions.wantsPool,
                poolDays: poolOptions.wantsPool ? poolOptions.poolDays : 0
            }
        };

        try {
            // Appel au service que nous venons de créer
            const response = await reservationService.createGuestReservation(payload);
            console.log("Réservation réussie !", response);

            // Plus tard on mettra Stripe ici
            alert("Succès ! Redirection vers Stripe pour la réservation n°" + response.id);

        } catch (err) {
            console.error("Erreur Checkout:", err);
            setError(err.message || "Une erreur est survenue lors de la création de votre réservation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800 flex items-center justify-center pb-24">
            <div className="max-w-3xl w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 border border-amber-50">

                <button onClick={() => navigate(-1)} className="mb-6 font-bold text-slate-400 hover:text-amber-600 transition-colors">
                    ← Retour au récapitulatif
                </button>

                <h1 className="text-4xl font-black text-slate-900 mb-2">Dernière étape ! ⛺</h1>
                <p className="text-slate-500 mb-8 font-medium">Veuillez saisir vos coordonnées pour confirmer votre réservation.</p>

                {/* Affichage d'erreur si l'API refuse */}
                {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Prénom *</label>
                            <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-400 outline-none transition-colors font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="Jean" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Nom *</label>
                            <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-400 outline-none transition-colors font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="Dupont" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Email *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-400 outline-none transition-colors font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="jean.dupont@email.com" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Téléphone *</label>
                            <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-400 outline-none transition-colors font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="06 12 34 56 78" />
                        </div>
                    </div>

                    {/* LA FAMEUSE CONTRAINTE RGPD */}
                    <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <label className="flex items-start gap-4 cursor-pointer">
                            <input
                                type="checkbox"
                                name="consentDataRetention"
                                checked={formData.consentDataRetention}
                                onChange={handleChange}
                                className="w-6 h-6 mt-1 accent-amber-500 cursor-pointer"
                            />
                            <div className="flex-1">
                                <p className="font-bold text-slate-800">Sauvegarder mes informations pour plus tard</p>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    J'accepte que le camping conserve mes coordonnées pendant <span className="font-bold">1 an</span> afin de faciliter mes prochaines réservations et recevoir des offres.
                                    <br/>
                                    <span className="italic text-xs">(Si non cochée, vos données seront effacées 7 jours après votre départ, conformément au RGPD).</span>
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-500/30 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1'}`}
                        >
                            {isSubmitting ? 'Préparation...' : `Payer ${grandTotal?.toFixed(2)} €`}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4">Paiement 100% sécurisé via Stripe</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;