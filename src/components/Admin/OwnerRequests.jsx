import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api.js'; // Utilise votre service sécurisé
import CampingMap from '../Map/CampingMap.jsx';

const OwnerRequests = () => {
    // Données
    const [prospects, setProspects] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // État de la vente en cours
    const [selectedUser, setSelectedUser] = useState(null);
    const [saleStep, setSaleStep] = useState(1);

    // Formulaire de vente
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [amount, setAmount] = useState('');
    const [contractSigned, setContractSigned] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Récupération avec apiFetch (gère le token auto)
            const dataUsers = await apiFetch('/users?pagination=false');
            const allUsers = dataUsers['hydra:member'] || dataUsers.member || (Array.isArray(dataUsers) ? dataUsers : []);

            // Filtre les prospects (ceux qui veulent devenir proprio mais ne le sont pas encore)
            const filtered = allUsers.filter(u => Boolean(u.wantsToBecomeOwner) && !u.isOwner);
            setProspects(filtered);

            const dataProducts = await apiFetch('/products?pagination=false');
            const allProducts = dataProducts['hydra:member'] || dataProducts.member || (Array.isArray(dataProducts) ? dataProducts : []);
            setProducts(allProducts);

        } catch (error) {
            console.error("Erreur de chargement :", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * ❌ NOUVELLE FONCTION : Refuser une demande
     */
    const handleRejectRequest = async (userId) => {
        if (!window.confirm("Voulez-vous vraiment refuser cette demande ? L'utilisateur ne sera plus considéré comme un prospect.")) return;

        try {
            // On met à jour l'utilisateur via l'API Platform (méthode PATCH)
            await apiFetch(`/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/merge-patch+json' },
                body: JSON.stringify({ wantsToBecomeOwner: false })
            });

            // On met à jour la liste locale pour faire disparaître la ligne
            setProspects(prev => prev.filter(u => u.id !== userId));
            alert("La demande a été refusée avec succès.");
        } catch (error) {
            alert("Erreur lors du refus de la demande.");
        }
    };

    // Calcul automatique du prix de vente
    const calculateEstimatedPrice = (product) => {
        if (!product.prices || product.prices.length === 0) return '';
        const nightlyPriceEuro = product.prices[0].price / 100;
        const title = product.title.toLowerCase();
        let multiplier = 1000;

        if (title.includes('mobilehome') || title.includes('mobile')) multiplier = 1500;
        else if (title.includes('caravane')) multiplier = 600;
        else if (title.includes('emplacement')) multiplier = 800;

        return Math.round(nightlyPriceEuro * multiplier);
    };

    // Génération PDF
    const handleDownloadContract = async () => {
        setIsGeneratingPdf(true);
        try {
            const data = await apiFetch(`/users/${selectedUser.id}/generate-contract`, {
                method: 'POST',
                body: JSON.stringify({ amount, productId: selectedProduct.id })
            });
            window.open(data.pdfUrl, '_blank');
        } catch (e) {
            alert("Erreur lors de la génération du contrat.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Finalisation (Make Owner)
    const handleFinalizeSale = async () => {
        try {
            const data = await apiFetch(`/users/${selectedUser.id}/make-owner`, {
                method: 'POST',
                body: JSON.stringify({ amount, productId: selectedProduct.id })
            });
            setClientSecret(data.clientSecret);
            setSaleStep(3);
        } catch (e) {
            alert(e.message || "Erreur de connexion.");
        }
    };

    const closeModale = () => {
        setSelectedUser(null);
        setSelectedProduct(null);
        setAmount('');
        setSaleStep(1);
        setContractSigned(false);
        setClientSecret('');
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Analyse des opportunités... 🔍</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-800">Demandes Propriétaires 🔑</h2>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold">
                    {prospects.length} demande(s) en attente
                </span>
            </div>

            <div className="grid gap-4">
                {prospects.length > 0 ? prospects.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-emerald-200 transition-all group">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{user.firstname} {user.lastname}</h4>
                            <p className="text-sm text-slate-500">{user.email} • {user.mobile || 'Pas de téléphone'}</p>
                        </div>
                        <div className="flex gap-3">
                            {/* BOUTON REFUSER */}
                            <button
                                onClick={() => handleRejectRequest(user.id)}
                                className="px-5 py-3 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Refuser
                            </button>

                            {/* BOUTON VALIDER / VENDRE */}
                            <button
                                onClick={() => setSelectedUser(user)}
                                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all group-hover:scale-105"
                            >
                                Démarrer la vente
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-[3rem] text-center">
                        <span className="text-5xl block mb-4">☕</span>
                        <p className="text-slate-500 font-bold text-lg">Aucune demande en attente pour le moment.</p>
                    </div>
                )}
            </div>

            {/* MODALE DE VENTE (inchangée) */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-6xl shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto flex flex-col">
                        {/* ... contenu de la modale ... */}
                        <div className="text-center mb-8 shrink-0">
                            <h3 className="text-2xl font-black text-slate-800">Dossier d'acquisition : {selectedUser.firstname} {selectedUser.lastname}</h3>
                            <div className="flex justify-center items-center gap-6 mt-6">
                                <div className={`flex items-center gap-2 ${saleStep >= 1 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${saleStep >= 1 ? 'bg-emerald-100' : 'bg-slate-100'}`}>1</span>
                                    <span className="font-bold">Sélection</span>
                                </div>
                                <div className="h-px w-10 bg-slate-200" />
                                <div className={`flex items-center gap-2 ${saleStep >= 2 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${saleStep >= 2 ? 'bg-emerald-100' : 'bg-slate-100'}`}>2</span>
                                    <span className="font-bold">Contrat</span>
                                </div>
                                <div className="h-px w-10 bg-slate-200" />
                                <div className={`flex items-center gap-2 ${saleStep === 3 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${saleStep === 3 ? 'bg-emerald-100' : 'bg-slate-100'}`}>3</span>
                                    <span className="font-bold">Paiement</span>
                                </div>
                            </div>
                        </div>

                        {saleStep === 1 && (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 bg-slate-50 rounded-[2rem] border-2 border-slate-100 overflow-hidden relative min-h-[450px]">
                                    <CampingMap
                                        allProducts={products}
                                        availableProducts={products}
                                        selectedCategory="all"
                                        totalOccupants={0}
                                        onProductSelect={(product) => {
                                            setSelectedProduct(product);
                                            setAmount(calculateEstimatedPrice(product));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col justify-center space-y-6">
                                    <div className={`p-6 rounded-3xl border-2 transition-all ${selectedProduct ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Emplacement choisi</label>
                                        {selectedProduct ? <p className="text-2xl font-black text-emerald-800">{selectedProduct.title}</p> : <p className="text-slate-400 font-bold italic">Sélectionnez sur la carte</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Prix de vente final (€)</label>
                                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none text-3xl font-black text-slate-800 transition-all" />
                                    </div>
                                    <div className="pt-6 space-y-3">
                                        <button onClick={() => setSaleStep(2)} disabled={!selectedProduct || !amount} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 disabled:opacity-30">Étape suivante : Contrat</button>
                                        <button onClick={closeModale} className="w-full py-4 text-slate-400 font-bold">Abandonner</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {saleStep === 2 && (
                            <div className="flex-1 flex flex-col items-center justify-center py-10">
                                <div className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[3rem] max-w-2xl w-full shadow-sm">
                                    <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><span className="text-3xl">📄</span> Signature des documents</h3>
                                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 mb-8">
                                        <div className="space-y-1"><p className="text-sm font-bold text-slate-400 uppercase">Document officiel</p><p className="font-black text-slate-700 text-lg">Contrat de vente & Règlement</p></div>
                                        <button onClick={handleDownloadContract} disabled={isGeneratingPdf} className="px-6 py-4 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50">{isGeneratingPdf ? 'Génération...' : 'Télécharger & Imprimer'}</button>
                                    </div>
                                    <label className="flex items-start gap-4 p-6 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer">
                                        <input type="checkbox" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} className="w-6 h-6 mt-1 accent-emerald-600" />
                                        <span className="text-slate-600 font-bold leading-tight">Je confirme avoir reçu les documents signés et certifie l'acceptation du règlement intérieur.</span>
                                    </label>
                                    <div className="flex gap-4 mt-10">
                                        <button onClick={() => setSaleStep(1)} className="px-8 py-5 bg-slate-200 text-slate-600 font-black rounded-2xl">Retour</button>
                                        <button onClick={handleFinalizeSale} disabled={!contractSigned} className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-2xl disabled:opacity-30">Valider et passer au paiement</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {saleStep === 3 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[3rem] max-w-xl w-full">
                                    <div className="text-7xl mb-6 animate-bounce">💳</div>
                                    <h4 className="font-black text-emerald-900 text-3xl mb-4">Prêt pour l'encaissement</h4>
                                    <p className="text-emerald-700 text-lg font-medium mb-8">L'intention de paiement de <strong>{amount} €</strong> a été générée sur Stripe.</p>
                                    <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg">Terminer la procédure</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRequests;