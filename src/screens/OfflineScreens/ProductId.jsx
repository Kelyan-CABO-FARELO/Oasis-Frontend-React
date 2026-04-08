import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";

const ProductId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 🛑 SÉCURITÉ : Si l'utilisateur arrive ici sans avoir fait de recherche, on le renvoie à la carte !
    const searchData = location.state;
    if (!searchData || !searchData.startDate || !searchData.endDate) {
        return <Navigate to="/product" replace />;
    }

    const { startDate, endDate, nbAdults, nbChildren } = searchData;

    // --- ÉTATS ---
    const [product, setProduct] = useState(null);
    const [extras, setExtras] = useState({ taxeAdulte: 0, taxeEnfant: 0, piscineAdulte: 0, piscineEnfant: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Options choisies par l'utilisateur
    const [wantsPool, setWantsPool] = useState(false);
    const [poolDays, setPoolDays] = useState(1);

    // Calcul du nombre de nuits
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. On récupère l'hébergement cliqué
                const prodRes = await fetch(`${API_URL}/products/${id}`, { headers: { 'Accept': 'application/ld+json' }});
                const prodData = await prodRes.json();
                setProduct(prodData);

                // 2. On récupère TOUS les produits pour isoler les taxes et la piscine
                const allRes = await fetch(`${API_URL}/products`, { headers: { 'Accept': 'application/ld+json' }});
                const allData = await allRes.json();
                const productsList = allData['hydra:member'] || [];

                // On cherche les prix exacts dans la BDD (divisés par 100 pour les euros)
                const findPrice = (title) => {
                    const item = productsList.find(p => p.title.includes(title));
                    return item?.prices?.[0]?.price ? item.prices[0].price / 100 : 0;
                };

                setExtras({
                    taxeAdulte: findPrice('Taxe de séjour Adulte'),
                    taxeEnfant: findPrice('Taxe de séjour Enfant'),
                    piscineAdulte: findPrice('Accès piscine Adulte'),
                    piscineEnfant: findPrice('Accès piscine Enfant')
                });

            } catch (err) {
                console.error(err);
                navigate('/product');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    if (isLoading || !product) return <PageLoader />;

    // --- CALCULS DU PANIER ---
    const basePrice = product.prices?.[0]?.price ? product.prices[0].price / 100 : 0;

    const totalAccommodation = basePrice * nights;
    const totalTaxes = (extras.taxeAdulte * nbAdults * nights) + (extras.taxeEnfant * nbChildren * nights);

    let totalPool = 0;
    if (wantsPool) {
        totalPool = (extras.piscineAdulte * nbAdults * poolDays) + (extras.piscineEnfant * nbChildren * poolDays);
    }

    const grandTotal = totalAccommodation + totalTaxes + totalPool;

    const imagePath = product.media?.[0]?.path ? `${IMAGE_URL}/${product.media[0].path}` : null;

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800 pb-24">
            <button onClick={() => navigate(-1)} className="mb-8 font-bold text-amber-700 hover:text-amber-600 bg-amber-100 px-5 py-2 rounded-full flex items-center gap-2">
                ← Modifier ma recherche
            </button>

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">

                {/* COLONNE GAUCHE : INFOS DE L'HÉBERGEMENT */}
                <div className="w-full lg:w-7/12">
                    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-amber-50">
                        <div className="h-80 bg-slate-100 relative">
                            {imagePath ? (
                                <img src={imagePath} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Image non disponible</div>
                            )}
                        </div>
                        <div className="p-8 md:p-10">
                            <h1 className="text-4xl font-black text-slate-900 mb-4">{product.title}</h1>
                            <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

                            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase">Votre séjour</p>
                                    <p className="font-bold text-slate-700">Du {start.toLocaleDateString('fr-FR')} au {end.toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-400 uppercase">Voyageurs</p>
                                    <p className="font-bold text-slate-700">{nbAdults} Adulte(s), {nbChildren} Enfant(s)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOC OPTIONS (PISCINE) */}
                    <div className="mt-8 bg-white rounded-[2rem] shadow-xl p-8 md:p-10 border border-emerald-50">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Options et Suppléments</h2>
                        <p className="text-slate-500 mb-6">Personnalisez votre séjour avec nos services exclusifs.</p>

                        <label className="flex items-start gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${wantsPool ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}">
                            <input
                                type="checkbox"
                                className="w-6 h-6 mt-1 accent-emerald-500 cursor-pointer"
                                checked={wantsPool}
                                onChange={(e) => setWantsPool(e.target.checked)}
                            />
                            <div className="flex-1">
                                <p className="font-bold text-lg text-slate-800">Accès Espace Aquatique 🏊‍♂️</p>
                                <p className="text-sm text-slate-500 mb-4">Profitez de nos toboggans et piscines chauffées. Tarif calculé selon le nombre de voyageurs.</p>

                                {wantsPool && (
                                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 w-max shadow-sm">
                                        <label className="text-sm font-bold text-slate-600">Pour combien de jours ?</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={nights}
                                            value={poolDays}
                                            onChange={(e) => setPoolDays(Math.min(nights, Math.max(1, e.target.value)))}
                                            className="w-16 p-2 text-center font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {/* COLONNE DROITE : LE RÉCAPITULATIF DE PAIEMENT */}
                <div className="w-full lg:w-5/12">
                    <div className="bg-amber-50/80 rounded-[2rem] shadow-2xl p-8 md:p-10 border border-amber-200 sticky top-10">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">Récapitulatif</h2>

                        <div className="space-y-4 mb-6 text-slate-700 font-medium">
                            <div className="flex justify-between items-center">
                                <span>Hébergement ({nights} nuits)</span>
                                <span className="font-bold">{totalAccommodation.toFixed(2)} €</span>
                            </div>

                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <span>Taxes de séjour (Obligatoire)</span>
                                <span>{totalTaxes.toFixed(2)} €</span>
                            </div>

                            {wantsPool && (
                                <div className="flex justify-between items-center text-emerald-600">
                                    <span>Accès Piscine ({poolDays} jours)</span>
                                    <span className="font-bold">+{totalPool.toFixed(2)} €</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-amber-200 pt-6 mb-8">
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-slate-800">Total à payer</span>
                                <span className="text-4xl font-black text-amber-600">{grandTotal.toFixed(2)} €</span>
                            </div>
                            <p className="text-right text-xs text-slate-400 mt-2">Taxes et frais inclus</p>
                        </div>

                        <button
                            onClick={() => alert(`Prêt pour le paiement Stripe de ${grandTotal.toFixed(2)} € !`)}
                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            Confirmer et Payer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductId;