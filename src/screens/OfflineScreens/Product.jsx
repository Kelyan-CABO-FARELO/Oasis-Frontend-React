import React, { useState, useEffect } from 'react';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";

const Product = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);

    // LA CATÉGORIE SÉLECTIONNÉE
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 9;

    // ==========================================
    // 1. CALCUL DES LIMITES DE SAISON
    // ==========================================
    const getSeasonLimits = () => {
        const today = new Date();
        const currentYear = today.getFullYear();

        let seasonStart = new Date(`${currentYear}-05-05`);
        let seasonEnd = new Date(`${currentYear}-10-10`);

        if (today > seasonEnd) {
            seasonStart = new Date(`${currentYear + 1}-05-05`);
            seasonEnd = new Date(`${currentYear + 1}-10-10`);
        }

        const minSelectable = today > seasonStart ? today : seasonStart;
        const formatDate = (date) => date.toISOString().split('T')[0];

        return {
            minDate: formatDate(minSelectable),
            maxDate: formatDate(seasonEnd)
        };
    };

    const { minDate, maxDate } = getSeasonLimits();

    // ==========================================
    // 2. CALCULATEUR DE PRIX DYNAMIQUE
    // ==========================================
    const calculatePriceInfo = (basePriceCents, startStr, endStr) => {
        if (!basePriceCents) return { display: "N/A" };
        const basePrice = basePriceCents / 100;

        if (!startStr || !endStr || startStr >= endStr) {
            return { display: `${basePrice.toFixed(2)} €`, suffix: "/ nuit", hasDiscount: false };
        }

        const start = new Date(startStr);
        const end = new Date(endStr);
        const totalNights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

        let subTotal = 0;

        for (let i = 0; i < totalNights; i++) {
            const currentNight = new Date(start.getTime() + i * (1000 * 60 * 60 * 24));
            const month = currentNight.getMonth() + 1;
            const day = currentNight.getDate();

            const isHighSeason = (month === 6 && day >= 21) || month === 7 || month === 8;

            if (isHighSeason) {
                subTotal += basePrice * 1.15;
            } else {
                subTotal += basePrice;
            }
        }

        const discountSlices = Math.floor(totalNights / 7);
        let discountPercentage = discountSlices * 0.05;

        const MAX_DISCOUNT = 0.25;
        discountPercentage = Math.min(discountPercentage, MAX_DISCOUNT);

        const finalTotal = subTotal * (1 - discountPercentage);
        const displayDiscount = Math.round(discountPercentage * 100);

        return {
            display: `${finalTotal.toFixed(2)} €`,
            suffix: `pour ${totalNights} nuit(s)`,
            hasDiscount: discountSlices > 0,
            discountText: `-${displayDiscount}% appliqué`,
            originalPrice: discountSlices > 0 ? `${subTotal.toFixed(2)} €` : null
        };
    };

    // ==========================================
    // 3. RÉCUPÉRATION DES PRODUITS
    // ==========================================
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let url = `${API_URL}/products`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error("Erreur lors de la récupération des hébergements.");

            const data = await response.json();
            let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);

            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe');
            });

            setAllProducts(accommodationsOnly);
            // Pas besoin de calculer les pages ici, le useEffect de tri va s'en occuper !

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // ==========================================
    // 4. TRI ET DÉCOUPAGE EN PAGES
    // ==========================================
    useEffect(() => {
        // A. On filtre selon la catégorie choisie
        const categoryFiltered = allProducts.filter(product => {
            if (selectedCategory === 'all') return true;

            const title = product.title.toLowerCase();
            if (selectedCategory === 'mh') return title.startsWith('m-h');
            if (selectedCategory === 'caravane') return title.startsWith('caravane');
            if (selectedCategory === 'emplacement') return title.startsWith('emplacement');

            return true;
        });

        // B. On met à jour le nombre total de pages pour cette catégorie
        setTotalPages(Math.ceil(categoryFiltered.length / ITEMS_PER_PAGE) || 1);

        // C. On découpe pour la page actuelle
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        setDisplayedProducts(categoryFiltered.slice(startIndex, endIndex));

        // On remonte la page, sauf au tout premier chargement
        if (categoryFiltered.length > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, allProducts, selectedCategory]);

    // Fonction pour changer de catégorie et revenir à la page 1
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (startDate && endDate && startDate >= endDate) {
            setError("La date de départ doit être après la date d'arrivée.");
            return;
        }
        fetchProducts();
    };

    if (isLoading && allProducts.length === 0) return <PageLoader />;

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto mb-10 text-center">
                <span className="inline-block px-4 py-1 mb-4 text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-100 rounded-full">
                    Domaine L'Oasis
                </span>
                <h1 className="text-5xl font-black text-slate-900 drop-shadow-sm">
                    Nos <span className="text-amber-500">Hébergements</span>
                </h1>
                <p className="mt-4 text-lg text-slate-600">Sélectionnez vos dates pour voir nos disponibilités.</p>
            </div>

            {/* BARRE DE RECHERCHE DE DATES */}
            <div className="max-w-4xl mx-auto mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full flex flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Arrivée</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={minDate} max={maxDate} className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer" required />
                    </div>
                    <div className="hidden md:block w-px h-12 bg-slate-100"></div>
                    <div className="flex-1 w-full flex flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Départ</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || minDate} max={maxDate} className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer" required />
                    </div>
                    <div className="w-full md:w-auto px-4 mt-4 md:mt-0">
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-1">
                            Rechercher
                        </button>
                    </div>
                </form>
            </div>

            {/* BOUTONS DE FILTRES PAR CATÉGORIE */}
            <div className="max-w-4xl mx-auto mb-10 flex flex-wrap justify-center gap-4">
                <button
                    onClick={() => handleCategoryChange('all')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}
                >
                    Tous
                </button>
                <button
                    onClick={() => handleCategoryChange('mh')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'mh' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}
                >
                    Mobil-Homes
                </button>
                <button
                    onClick={() => handleCategoryChange('caravane')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'caravane' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}
                >
                    Caravanes
                </button>
                <button
                    onClick={() => handleCategoryChange('emplacement')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'emplacement' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}
                >
                    Emplacements
                </button>
            </div>

            {error && (
                <div className="max-w-2xl mx-auto mb-8">
                    <ErrorMessage message={error} />
                </div>
            )}

            {/* GRILLE DES PRODUITS */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300">
                {displayedProducts.length > 0 ? (
                    displayedProducts.map((product) => {
                        const imagePath = product.media && product.media.length > 0 ? product.media[0].path : null;
                        const productPriceCents = product.prices && product.prices.length > 0 ? product.prices[0].price : null;

                        const priceInfo = calculatePriceInfo(productPriceCents, startDate, endDate);

                        return (
                            <div key={product.id} className="bg-white rounded-[2rem] shadow-lg shadow-amber-900/5 border border-amber-50 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
                                <div className="h-60 bg-slate-100 relative group">
                                    {imagePath ? (
                                        <img src={`${IMAGE_URL}/${imagePath}`} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-amber-50/50">📷 Image indisponible</div>
                                    )}
                                </div>
                                <div className="p-8 flex flex-col grow">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{product.title}</h2>
                                    <p className="text-slate-600 mb-6 grow line-clamp-3 leading-relaxed">{product.description || "Aucune description disponible."}</p>

                                    <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Tarif</span>
                                            {priceInfo.originalPrice && <span className="text-sm text-slate-400 line-through">{priceInfo.originalPrice}</span>}
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-amber-500 font-black text-2xl">{priceInfo.display}</span>
                                                <span className="text-sm text-slate-500 font-medium">{priceInfo.suffix}</span>
                                            </div>
                                            {priceInfo.hasDiscount && <span className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max border border-emerald-100">🎁 {priceInfo.discountText}</span>}
                                        </div>
                                        <button className="px-6 py-3 rounded-xl font-bold transition-all shadow-sm bg-amber-400 hover:bg-amber-500 text-slate-900 hover:shadow-md">
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    !isLoading && !error && (
                        <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-amber-200">
                            <span className="text-4xl block mb-4">🏜️</span>
                            <p className="text-xl font-medium text-slate-500">Aucun hébergement de ce type n'est disponible.</p>
                        </div>
                    )
                )}
            </div>

            {/* CONTRÔLES DE PAGINATION */}
            {!error && totalPages > 1 && (
                <div className="max-w-7xl mx-auto flex justify-center items-center gap-6 mt-16 pb-8">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`px-6 py-3 rounded-xl font-bold transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm'}`}>&larr; Précédent</button>
                    <span className="font-medium text-slate-600 bg-white px-6 py-3 rounded-xl shadow-sm border border-amber-50">Page <span className="font-black text-amber-600">{currentPage}</span> sur {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`px-6 py-3 rounded-xl font-bold transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm'}`}>Suivant &rarr;</button>
                </div>
            )}
        </div>
    );
};

export default Product;