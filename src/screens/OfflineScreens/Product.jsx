import React, { useState, useEffect } from 'react';
import { API_URL } from "../../constants/apiConstant.js";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";
import CampingMap from "../../components/CampingMap.jsx";

const Product = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 🛑 NOUVEAU : États pour le nombre de personnes
    const [nbAdults, setNbAdults] = useState(2);
    const [nbChildren, setNbChildren] = useState(0);

    const [catalogProducts, setCatalogProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);
            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe');
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
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erreur lors de la récupération des disponibilités.");
            const data = await response.json();
            let productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);
            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe');
            });
            setAvailableProducts(accommodationsOnly);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
        fetchAvailable();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (startDate && endDate && startDate >= endDate) {
            setError("La date de départ doit être après la date d'arrivée.");
            return;
        }
        fetchAvailable();
    };

    if (isLoading && catalogProducts.length === 0) return <PageLoader />;

    // Calcul du nombre total d'occupants
    const totalOccupants = Number(nbAdults) + Number(nbChildren);

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto mb-10 text-center">
                <span className="inline-block px-4 py-1 mb-4 text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-100 rounded-full">
                    Domaine L'Oasis
                </span>
                <h1 className="text-5xl font-black text-slate-900 drop-shadow-sm">
                    Plan <span className="text-amber-500">Interactif</span>
                </h1>
                <p className="mt-4 text-lg text-slate-600">Trouvez l'emplacement parfait pour votre séjour.</p>
            </div>

            {/* BARRE DE RECHERCHE (Avec Adultes et Enfants) */}
            <div className="max-w-5xl mx-auto mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50">
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

            {/* BOUTONS DE FILTRES PAR CATÉGORIE */}
            <div className="max-w-4xl mx-auto mb-10 flex flex-wrap justify-center gap-4">
                <button onClick={() => setSelectedCategory('all')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Tous</button>
                <button onClick={() => setSelectedCategory('mh')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'mh' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Mobil-Homes</button>
                <button onClick={() => setSelectedCategory('caravane')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'caravane' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Caravanes</button>
                <button onClick={() => setSelectedCategory('emplacement')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'emplacement' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Emplacements</button>
            </div>

            {error && <div className="max-w-2xl mx-auto mb-8"><ErrorMessage message={error} /></div>}

            <div className="max-w-7xl mx-auto mb-16">
                {/* On passe le nombre total d'occupants à la carte */}
                <CampingMap
                    allProducts={catalogProducts}
                    availableProducts={availableProducts}
                    selectedCategory={selectedCategory}
                    totalOccupants={totalOccupants}
                />
            </div>
        </div>
    );
};

export default Product;