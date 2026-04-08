import React, { useState, useEffect } from 'react';
import { API_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";
import CampingMap from "../../components/CampingMap.jsx";

const Product = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [nbAdults, setNbAdults] = useState(2);
    const [nbChildren, setNbChildren] = useState(0);

    const [catalogProducts, setCatalogProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🛑 LA NOUVELLE VARIABLE MAGIQUE :
    const [hasSearched, setHasSearched] = useState(false);

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
        return { minDate: minSelectable.toISOString().split('T')[0], maxDate: seasonEnd.toISOString().split('T')[0] };
    };

    const { minDate, maxDate } = getSeasonLimits();

    const fetchCatalog = async () => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                headers: { 'Accept': 'application/ld+json' }
            });
            const data = await response.json();
            let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);

            // On filtre pour ne garder que les vrais hébergements
            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe') && !titleLowerCase.includes('tarif');
            });
            setCatalogProducts(accommodationsOnly);
        } catch (err) {
            console.error("Erreur chargement catalogue :", err);
        }
    };

    const fetchAvailable = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let url = `${API_URL}/products`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }
            const response = await fetch(url, {
                headers: { 'Accept': 'application/ld+json' }
            });
            if (!response.ok) throw new Error("Erreur lors de la récupération des disponibilités.");

            const data = await response.json();
            let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);

            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe') && !titleLowerCase.includes('tarif');
            });
            setAvailableProducts(accommodationsOnly);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Au chargement de la page, on récupère juste le catalogue complet pour avoir la liste des IDs
    useEffect(() => {
        fetchCatalog();
        // On peut appeler fetchAvailable pour initialiser, mais on n'affichera pas la carte de toute façon
        fetchAvailable();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (startDate && endDate && startDate >= endDate) {
            setError("La date de départ doit être après la date d'arrivée.");
            setHasSearched(false); // On recache la carte en cas d'erreur
            return;
        }

        fetchAvailable();
        // 🛑 ON AFFICHE LA CARTE :
        setHasSearched(true);
    };

    // On cache le loader général que si on n'a vraiment pas le catalogue
    if (isLoading && catalogProducts.length === 0) return <PageLoader />;

    const totalOccupants = Number(nbAdults) + Number(nbChildren);

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800 pb-24">
            <div className="max-w-7xl mx-auto mb-10 text-center">
                <span className="inline-block px-4 py-1 mb-4 text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-100 rounded-full">
                    Domaine L'Oasis
                </span>
                <h1 className="text-5xl font-black text-slate-900 drop-shadow-sm">
                    Plan <span className="text-amber-500">Interactif</span>
                </h1>
                <p className="mt-4 text-lg text-slate-600">Trouvez l'emplacement parfait pour votre séjour.</p>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="max-w-5xl mx-auto mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50 relative z-20">
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
                    <div className="hidden md:block w-px h-12 bg-slate-100"></div>
                    <div className="flex w-full md:w-1/4 flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Adultes</label>
                        <input type="number" min="1" max="8" value={nbAdults} onChange={(e) => setNbAdults(e.target.value)} className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer" required />
                    </div>
                    <div className="hidden md:block w-px h-12 bg-slate-100"></div>
                    <div className="flex w-full md:w-1/4 flex-col px-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enfants</label>
                        <input type="number" min="0" max="6" value={nbChildren} onChange={(e) => setNbChildren(e.target.value)} className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer" required />
                    </div>
                    <div className="w-full md:w-auto px-4 mt-4 md:mt-0">
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-1">
                            Rechercher
                        </button>
                    </div>
                </form>
            </div>

            {error && <div className="max-w-2xl mx-auto mb-8"><ErrorMessage message={error} /></div>}

            {/* 🛑 LOGIQUE D'AFFICHAGE CONDITIONNEL */}
            {hasSearched ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* BOUTONS DE FILTRES */}
                    <div className="max-w-4xl mx-auto mb-10 flex flex-wrap justify-center gap-4">
                        <button onClick={() => setSelectedCategory('all')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Tous</button>
                        <button onClick={() => setSelectedCategory('mh')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'mh' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Mobil-Homes</button>
                        <button onClick={() => setSelectedCategory('caravane')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'caravane' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Caravanes</button>
                        <button onClick={() => setSelectedCategory('emplacement')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'emplacement' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Emplacements</button>
                    </div>

                    <div className="max-w-7xl mx-auto mb-16 relative z-10">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-[2rem]">
                                <span className="font-bold text-amber-600 animate-pulse text-lg">Recherche des disponibilités...</span>
                            </div>
                        )}
                        <CampingMap
                            allProducts={catalogProducts}
                            availableProducts={availableProducts}
                            selectedCategory={selectedCategory}
                            totalOccupants={totalOccupants}
                            startDate={startDate}
                            endDate={endDate}
                            nbAdults={nbAdults}
                            nbChildren={nbChildren}
                        />
                    </div>
                </div>
            ) : (
                /* MESSAGE D'ATTENTE TANT QU'ON A PAS CHERCHÉ */
                <div className="max-w-4xl mx-auto mt-16 py-24 text-center bg-white/40 border-2 border-dashed border-amber-200 rounded-[3rem] px-6">
                    <span className="text-6xl block mb-6 opacity-80">🗺️</span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">À vous de jouer !</h2>
                    <p className="text-lg text-slate-600 font-medium max-w-lg mx-auto">
                        Sélectionnez vos dates de séjour et le nombre de voyageurs ci-dessus, puis cliquez sur <span className="font-bold text-amber-600">Rechercher</span> pour dévoiler la carte des disponibilités.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Product;