import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";

const ProductId = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSingleProduct = async () => {
            try {
                const response = await fetch(`${API_URL}/products/${id}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/ld+json'
                    }
                });

                if (!response.ok) {
                    throw new Error("L'hébergement demandé est introuvable ou indisponible.");
                }

                const data = await response.json();
                setProduct(data);

            } catch (err) {
                console.error("Erreur de chargement :", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSingleProduct();
    }, [id]);

    if (isLoading) return <PageLoader />;

    if (error) {
        return (
            <div className="min-h-screen bg-[#fffdf0] flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <ErrorMessage message={error} />
                    <button onClick={() => navigate('/product')} className="mt-6 w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors">
                        Retourner au plan du camping
                    </button>
                </div>
            </div>
        );
    }

    if (!product) return null;

    // --- FORMATAGE DES PRIX ---
    const basePrice = product.prices?.[0]?.price ? (product.prices[0].price / 100).toFixed(2) : "0.00";
    const adultPrice = product.prices?.[0]?.adultPrice ? (product.prices[0].adultPrice / 100).toFixed(2) : null;
    const childPrice = product.prices?.[0]?.childPrice ? (product.prices[0].childPrice / 100).toFixed(2) : null;
    const hasExtraFees = adultPrice > 0 || childPrice > 0;

    // 🛑 LECTURE DE L'IMAGE DEPUIS LA BASE DE DONNÉES
    // On vérifie s'il y a un média, et on construit l'URL complète vers le backend
    const imagePath = product.media?.[0]?.path ? `${IMAGE_URL}/${product.media[0].path}` : null;

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-amber-700 font-bold hover:text-amber-600 transition-colors bg-amber-100 hover:bg-amber-200 px-5 py-2 rounded-full w-max"
                >
                    <span>←</span> Retour au plan interactif
                </button>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-amber-900/5 border border-amber-50 overflow-hidden">
                <div className="flex flex-col lg:flex-row">

                    {/* COLONNE GAUCHE : IMAGE DE LA BDD */}
                    <div className="w-full lg:w-1/2 relative bg-slate-100 min-h-[300px] lg:min-h-full flex items-center justify-center">
                        {imagePath ? (
                            <img
                                src={imagePath}
                                alt={product.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-slate-400 font-bold">Aucune image disponible</span>
                        )}
                        <div className="absolute top-6 left-6">
                            <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-emerald-700 font-black text-sm uppercase tracking-widest rounded-full shadow-lg">
                                Disponible
                            </span>
                        </div>
                    </div>

                    {/* COLONNE DROITE : INFOS & PRIX */}
                    <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                                {product.title}
                            </h1>

                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                {product.description || "Profitez de cet hébergement de qualité pour vos vacances dans notre domaine."}
                            </p>

                            <div className="flex flex-wrap gap-3 mb-10">
                                <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-100"><span className="text-amber-500">☀️</span> Terrasse</span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-100"><span className="text-emerald-500">🌳</span> Cadre nature</span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-100"><span className="text-blue-500">🏊‍♂️</span> Accès Piscine</span>
                            </div>
                        </div>

                        {/* BLOC DE PRIX */}
                        <div className="bg-amber-50/50 p-6 md:p-8 rounded-[2rem] border border-amber-100">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Tarif de base</p>
                                    <p className="text-4xl font-black text-amber-600">
                                        {basePrice} € <span className="text-lg text-slate-500 font-medium">/ nuit</span>
                                    </p>
                                </div>
                            </div>

                            {hasExtraFees && (
                                <div className="pt-4 border-t border-amber-200/60 mb-6 space-y-2">
                                    <p className="text-sm font-semibold text-slate-600 flex justify-between">
                                        <span>Adulte supplémentaire</span>
                                        <span className="font-bold text-slate-800">+{adultPrice} € / nuit</span>
                                    </p>
                                    <p className="text-sm font-semibold text-slate-600 flex justify-between">
                                        <span>Enfant supplémentaire</span>
                                        <span className="font-bold text-slate-800">+{childPrice} € / nuit</span>
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => alert("Direction le panier ! 🛒")}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                Passer à la réservation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductId;