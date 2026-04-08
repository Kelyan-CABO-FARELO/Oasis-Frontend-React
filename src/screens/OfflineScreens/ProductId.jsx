import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import { useBookingContext } from "../../contexts/BookingContext.jsx";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import BookingSummary from "../../components/Product/BookingSummary.jsx";
// 🛑 NOUVEL IMPORT : On importe notre cerveau mathématique !
import { calculateTripPrice } from "../../utils/pricing.js";

const ProductId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { searchParams, poolOptions, updatePoolOptions } = useBookingContext();

    if (!searchParams.startDate || !searchParams.endDate) {
        return <Navigate to="/product" replace />;
    }

    const adults = Number(searchParams.nbAdults) || 0;
    const children = Number(searchParams.nbChildren) || 0;
    const start = new Date(searchParams.startDate);
    const end = new Date(searchParams.endDate);

    const [product, setProduct] = useState(null);
    const [extras, setExtras] = useState({ taxeAdulte: 0, taxeEnfant: 0, piscineAdulte: 0, piscineEnfant: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await fetch(`${API_URL}/products/${id}`);
                const prodData = await prodRes.json();
                setProduct(prodData);

                const allRes = await fetch(`${API_URL}/products?pagination=false`);
                const allData = await allRes.json();
                const productsList = allData['member'] || allData['hydra:member'] || (Array.isArray(allData) ? allData : []);

                const findPrice = (searchTitle) => {
                    const item = productsList.find(p => p.title?.toLowerCase().includes(searchTitle.toLowerCase()));
                    return item?.prices?.[0]?.price ? item.prices[0].price / 100 : 0;
                };

                setExtras({
                    taxeAdulte: findPrice('Taxe de séjour Adulte'),
                    taxeEnfant: findPrice('Taxe de séjour Enfant'),
                    piscineAdulte: findPrice('Accès piscine Adulte'),
                    piscineEnfant: findPrice('Accès piscine Enfant')
                });

                // Optionnel: Ajuster les jours de piscine par défaut si non définis
                const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                if (poolOptions.poolDays === 1) {
                    updatePoolOptions({ poolDays: nights });
                }

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

    // 🧠 LE CALCUL SE FAIT EN UNE SEULE LIGNE MAINTENANT !
    const basePrice = product.prices?.[0]?.price ? product.prices[0].price / 100 : 0;
    const pricingDetails = calculateTripPrice(basePrice, start, end, adults, children, extras, poolOptions);

    const imagePath = product.media?.[0]?.path ? `${IMAGE_URL}/${product.media[0].path}` : null;

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800 pb-24">
            <button onClick={() => navigate(-1)} className="mb-8 font-bold text-amber-700 hover:text-amber-600 bg-amber-100 px-5 py-2 rounded-full flex items-center gap-2">
                ← Modifier ma recherche
            </button>

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
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
                                    <p className="font-bold text-slate-700">{adults} Adulte(s), {children} Enfant(s)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOC OPTIONS PISCINE */}
                    <div className="mt-8 bg-white rounded-[2rem] shadow-xl p-8 md:p-10 border border-emerald-50">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Options et Suppléments</h2>
                        <p className="text-slate-500 mb-6">L'accès à la piscine est valorisé sur les mêmes critères que la taxe de séjour.</p>

                        <label className={`flex items-start gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${poolOptions.wantsPool ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}`}>
                            <input
                                type="checkbox"
                                className="w-6 h-6 mt-1 accent-emerald-500 cursor-pointer"
                                checked={poolOptions.wantsPool}
                                onChange={(e) => updatePoolOptions({ wantsPool: e.target.checked })}
                            />
                            <div className="flex-1">
                                <p className="font-bold text-lg text-slate-800"> 🏊‍♂️​ Accès Espace Aquatique</p>

                                {poolOptions.wantsPool && (
                                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 w-max shadow-sm mt-4">
                                        <label className="text-sm font-bold text-slate-600">Jours d'accès :</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={pricingDetails.nights}
                                            value={poolOptions.poolDays}
                                            onChange={(e) => updatePoolOptions({ poolDays: Math.min(pricingDetails.nights, Math.max(1, e.target.value)) })}
                                            className="w-16 p-2 text-center font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="w-full lg:w-5/12">
                    {/* 🛑 On déverse toutes les données calculées dans le résumé d'un seul coup grâce au destructuring (les "...") */}
                    <BookingSummary
                        basePrice={basePrice}
                        extras={extras}
                        {...pricingDetails}
                    />
                </div>

            </div>
        </div>
    );
};

export default ProductId;