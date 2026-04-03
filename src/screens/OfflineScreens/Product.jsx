import React, { useState, useEffect } from 'react';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";

const Product = () => {
    // États pour les dates de recherche
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [allProducts, setAllProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 9;

    // ==========================================
    // CALCUL DES LIMITES DE SAISON
    // ==========================================
    const getSeasonLimits = () => {
        const today = new Date();
        const currentYear = today.getFullYear();

        let seasonStart = new Date(`${currentYear}-05-05`);
        let seasonEnd = new Date(`${currentYear}-10-10`);

        // Si la saison de cette année est terminée (on est après le 10 octobre)
        // On prépare les réservations pour l'année prochaine !
        if (today > seasonEnd) {
            seasonStart = new Date(`${currentYear + 1}-05-05`);
            seasonEnd = new Date(`${currentYear + 1}-10-10`);
        }

        // La date minimum cliquable : on ne peut pas réserver dans le passé.
        // C'est donc soit l'ouverture de la saison, soit aujourd'hui si on est déjà en saison.
        const minSelectable = today > seasonStart ? today : seasonStart;

        // Fonction pour formater en YYYY-MM-DD (format requis par les inputs HTML)
        const formatDate = (date) => date.toISOString().split('T')[0];

        return {
            minDate: formatDate(minSelectable),
            maxDate: formatDate(seasonEnd)
        };
    };

    const { minDate, maxDate } = getSeasonLimits();

    // On sort la fonction fetchProducts du useEffect pour pouvoir l'appeler quand on clique sur "Rechercher"
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // On prépare l'URL. Si on a des dates, on les envoie à Symfony !
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
            setTotalPages(Math.ceil(accommodationsOnly.length / ITEMS_PER_PAGE));
            setCurrentPage(1); // On revient à la page 1 après une recherche

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Chargement initial (au montage de la page)
    useEffect(() => {
        fetchProducts();
    }, []);

    // Découpage en pages
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setDisplayedProducts(allProducts.slice(startIndex, endIndex));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, allProducts]);

    // Fonction déclenchée quand on clique sur le bouton de recherche
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

            {/* ========================================== */}
            {/* 🗓️ BARRE DE RECHERCHE DE DATES */}
            {/* ========================================== */}
            <div className="max-w-4xl mx-auto mb-12 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    <div className="flex-1 w-full flex flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Arrivée</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={minDate} // Bloque avant le 05 Mai (ou aujourd'hui)
                            max={maxDate} // Bloque après le 10 Octobre
                            className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                            required
                        />
                    </div>

                    <div className="hidden md:block w-px h-12 bg-slate-100"></div>

                    <div className="flex-1 w-full flex flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Départ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            // Le départ doit être au minimum le jour de l'arrivée (ou minDate si arrivée non remplie)
                            min={startDate || minDate}
                            max={maxDate} // Bloque après le 10 Octobre
                            className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                            required
                        />
                    </div>

                    <div className="w-full md:w-auto px-4 mt-4 md:mt-0">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-1"
                        >
                            Rechercher
                        </button>
                    </div>
                </form>
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
                        const productPrice = product.prices && product.prices.length > 0 ? product.prices[0].price : null;

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
                                    <div className="flex justify-between items-center mt-auto pt-6 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Tarif</span>
                                            <span className="text-amber-500 font-black text-2xl">
                                                {productPrice ? (productPrice / 100).toFixed(2) : "N/A"} €
                                            </span>
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
                            <p className="text-xl font-medium text-slate-500">Aucun hébergement n'est disponible pour ces dates.</p>
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