import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';
// 👇 1. ON IMPORTE LA CARTE
import CampingMap from '../Map/CampingMap.jsx';

const OwnerRequests = () => {
    const [prospects, setProspects] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // États pour la modale de vente
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null); // 👈 On stocke l'objet complet du bien choisi
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        // 1. Récupérer les prospects
        fetch(`${API_ROOT}/api/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
                'Accept': 'application/ld+json'
            }
        })
            .then(res => res.json())
            .then(data => {
                let allUsers = data['hydra:member'] || data.member || (Array.isArray(data) ? data : []);
                const filteredProspects = allUsers.filter(user =>
                    user.wantsToBecomeOwner === true && user.isOwner === false
                );
                setProspects(filteredProspects);
                setLoading(false);
            });

        // 2. Récupérer les biens
        fetch(`${API_ROOT}/api/products`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
                'Accept': 'application/ld+json'
            }
        })
            .then(res => res.json())
            .then(data => {
                let allProducts = data['hydra:member'] || data.member || (Array.isArray(data) ? data : []);
                setProducts(allProducts);
            });
    }, []);

    const handleGeneratePayment = async () => {
        if(!amount || amount <= 0) return alert("Veuillez saisir un montant valide.");
        if(!selectedProduct) return alert("Veuillez sélectionner un emplacement sur la carte.");

        const res = await fetch(`${API_ROOT}/api/users/${selectedUser.id}/make-owner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
            },
            body: JSON.stringify({
                amount: amount,
                productId: selectedProduct.id // 👈 On envoie l'ID du produit sélectionné sur la carte
            })
        });

        const data = await res.json();

        if (res.ok) {
            setClientSecret(data.clientSecret);
        } else {
            alert(data.message || "Erreur lors de la génération du paiement.");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Recherche des opportunités... 🔍</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-800">Demandes Propriétaires 🔑</h2>

            <div className="grid gap-4">
                {prospects.length > 0 ? prospects.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-emerald-200 transition-all">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{user.firstname} {user.lastname}</h4>
                            <p className="text-sm text-slate-500">{user.email} • {user.mobile || 'Pas de téléphone'}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedUser(user);
                                setSelectedProduct(null); // On réinitialise la sélection à l'ouverture
                                setAmount('');
                                setClientSecret('');
                            }}
                            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg"
                        >
                            Conclure la vente
                        </button>
                    </div>
                )) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
                        <span className="text-4xl block mb-3">☕</span>
                        <p className="text-slate-500 font-bold text-lg">Aucune demande en attente pour le moment.</p>
                    </div>
                )}
            </div>

            {/* MODALE DE VENTE GÉANTE */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    {/* 👇 2. ON AGRANDIT LA MODALE (max-w-6xl) POUR FAIRE DE LA PLACE À LA CARTE */}
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-6xl shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto flex flex-col">

                        <div className="text-center mb-6 shrink-0">
                            <h3 className="text-2xl font-black text-slate-800">Finaliser la vente</h3>
                            <p className="text-slate-500">Client : <span className="font-bold text-slate-700">{selectedUser.firstname} {selectedUser.lastname}</span></p>
                        </div>

                        {!clientSecret ? (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">

                                {/* 🗺️ COLONNE GAUCHE : LA CARTE INTERACTIVE (Prend 2/3 de l'espace) */}
                                <div className="lg:col-span-2 bg-slate-50 rounded-3xl border-2 border-slate-200 overflow-hidden relative flex flex-col">
                                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-xl font-bold text-slate-700 shadow-sm">
                                        Étape 1 : Choisissez l'emplacement
                                    </div>
                                    <div className="flex-1 w-full h-full min-h-[400px]">
                                        {/* 👇 TON COMPOSANT CARTE EST ICI */}
                                        <CampingMap
                                            allProducts={products}
                                            availableProducts={products}
                                            selectedCategory="all"
                                            totalOccupants={0}
                                            onProductSelect={(product) => setSelectedProduct(product)}
                                        />
                                    </div>
                                </div>

                                {/* 💰 COLONNE DROITE : LE PRIX ET LA VALIDATION (Prend 1/3 de l'espace) */}
                                <div className="space-y-6 flex flex-col justify-center bg-white p-2">

                                    {/* Résumé de la sélection */}
                                    <div className={`p-5 rounded-2xl border-2 transition-all ${selectedProduct ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                        <h4 className="font-black text-slate-700 mb-1">Bien sélectionné :</h4>
                                        {selectedProduct ? (
                                            <p className="text-xl font-bold text-emerald-700">{selectedProduct.title}</p>
                                        ) : (
                                            <p className="text-slate-400 italic">Cliquez sur un emplacement sur la carte...</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-slate-700 mb-2">Étape 2 : Prix de vente (€ TTC)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Ex: 35000"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none text-2xl font-black text-slate-800 transition-colors"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={handleGeneratePayment}
                                            disabled={!selectedProduct || !amount}
                                            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Générer le paiement
                                        </button>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center py-10">
                                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl max-w-lg w-full">
                                    <div className="text-5xl mb-4">💳</div>
                                    <h4 className="font-black text-emerald-800 text-xl mb-2">Prêt pour l'encaissement</h4>
                                    <p className="text-emerald-700 font-medium">Le client a bien été rattaché à son bien ({selectedProduct?.title}) et est officiellement enregistré comme propriétaire.</p>
                                </div>

                                {/* Ici tu pourras afficher le module Stripe Elements plus tard */}

                                <button onClick={() => window.location.reload()} className="max-w-lg w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-transform">
                                    Terminer & Recharger la page
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRequests;