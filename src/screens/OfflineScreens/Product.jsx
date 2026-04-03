import React, { useState, useEffect } from 'react';
import { API_URL, IMAGE_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";

const Product = () => {
    // Nouveaux états pour gérer la pagination locale
    const [allProducts, setAllProducts] = useState([]); // Stocke tous les produits filtrés
    const [displayedProducts, setDisplayedProducts] = useState([]); // Stocke les 9 produits de la page active

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 9; // Nombre d'éléments par page

    // 1. FETCH ET FILTRAGE INITIAL
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // On récupère tout d'un coup (sans le ?page=)
                const response = await fetch(`${API_URL}/products`);

                if (!response.ok) throw new Error("Erreur lors de la récupération des hébergements.");

                const data = await response.json();

                let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);

                // On filtre pour enlever Piscines et Taxes
                const accommodationsOnly = productsList.filter(product => {
                    const titleLowerCase = product.title.toLowerCase();
                    return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe');
                });

                // On sauvegarde la liste propre et on calcule le vrai nombre de pages !
                setAllProducts(accommodationsOnly);
                setTotalPages(Math.ceil(accommodationsOnly.length / ITEMS_PER_PAGE));

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // 2. DÉCOUPAGE EN PAGES CÔTÉ REACT
    // Ce hook se déclenche à chaque fois qu'on change de page
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        // On isole les 9 éléments correspondants à la page actuelle
        setDisplayedProducts(allProducts.slice(startIndex, endIndex));

        // Petite astuce UX : ramener l'utilisateur en haut de la page quand il clique sur "Suivant"
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, allProducts]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <span className="inline-block px-4 py-1 mb-4 text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-100 rounded-full">
                    Domaine L'Oasis
                </span>
                <h1 className="text-5xl font-black text-slate-900 drop-shadow-sm">
                    Nos <span className="text-amber-500">Hébergements</span>
                </h1>
                <p className="mt-4 text-lg text-slate-600">Découvrez nos mobil-homes et emplacements disponibles.</p>
            </div>

            {error && (
                <div className="max-w-2xl mx-auto mb-8">
                    <ErrorMessage message={error} />
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300">
                {/* ON AFFICHE DÉSORMAIS displayedProducts AU LIEU DE products */}
                {displayedProducts.length > 0 ? (
                    displayedProducts.map((product) => {

                        const imagePath = product.media && product.media.length > 0 ? product.media[0].path : null;
                        const productPrice = product.prices && product.prices.length > 0 ? product.prices[0].price : null;

                        return (
                            <div key={product.id} className="bg-white rounded-[2rem] shadow-lg shadow-amber-900/5 border border-amber-50 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">

                                <div className="h-60 bg-slate-100 relative group">
                                    {imagePath ? (
                                        <img
                                            src={`${IMAGE_URL}/${imagePath}`}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-amber-50/50">
                                            📷 Image indisponible
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 flex flex-col grow">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{product.title}</h2>
                                    <p className="text-slate-600 mb-6 grow line-clamp-3 leading-relaxed">
                                        {product.description || "Aucune description disponible."}
                                    </p>

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
                            <p className="text-xl font-medium text-slate-500">
                                Aucun hébergement n'est disponible pour le moment.
                            </p>
                        </div>
                    )
                )}
            </div>

            {/* --- CONTRÔLES DE PAGINATION --- */}
            {!error && totalPages > 1 && (
                <div className="max-w-7xl mx-auto flex justify-center items-center gap-6 mt-16 pb-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            currentPage === 1
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm'
                        }`}
                    >
                        &larr; Précédent
                    </button>

                    <span className="font-medium text-slate-600 bg-white px-6 py-3 rounded-xl shadow-sm border border-amber-50">
                        Page <span className="font-black text-amber-600">{currentPage}</span> sur {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            currentPage === totalPages
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm'
                        }`}
                    >
                        Suivant &rarr;
                    </button>
                </div>
            )}
        </div>
    );
};

export default Product;