import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const OwnerRequests = () => {
    const [prospects, setProspects] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // États pour la modale de vente
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        // 1. Récupérer les prospects (users)
        fetch(`${API_ROOT}/api/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
        })
            .then(res => res.json())
            .then(data => {
                const allUsers = data['hydra:member'] || [];
                // On ne garde que les prospects non-propriétaires
                const filteredProspects = allUsers.filter(user =>
                    user.wantsToBecomeOwner === true && user.isOwner === false
                );
                setProspects(filteredProspects);
                setLoading(false);
            });

        // 2. Récupérer les biens disponibles (products)
        fetch(`${API_ROOT}/api/products`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
        })
            .then(res => res.json())
            .then(data => setProducts(data['hydra:member'] || []));
    }, []);

    const handleGeneratePayment = async () => {
        if(!amount || amount <= 0) return alert("Veuillez saisir un montant valide.");
        if(!selectedProduct) return alert("Veuillez sélectionner un bien à lier.");

        const res = await fetch(`${API_ROOT}/api/users/${selectedUser.id}/make-owner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
            },
            body: JSON.stringify({
                amount: amount,
                productId: selectedProduct
            })
        });

        const data = await res.json();

        if (res.ok) {
            setClientSecret(data.clientSecret);
        } else {
            alert(data.message || "Erreur lors de la génération du paiement.");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Chargement des opportunités...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-800">Demandes Propriétaires 🔑</h2>

            <div className="grid gap-4">
                {prospects.length > 0 ? prospects.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-emerald-200 transition-all">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{user.firstname} {user.lastname}</h4>
                            <p className="text-sm text-slate-500">{user.email} • {user.mobile || 'Pas de téléphone'}</p>
                        </div>
                        <button
                            onClick={() => setSelectedUser(user)}
                            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg"
                        >
                            Conclure la vente
                        </button>
                    </div>
                )) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
                        <p className="text-slate-400 font-bold text-lg">Aucune demande en attente pour le moment. ☕</p>
                    </div>
                )}
            </div>

            {/* MODALE DE VENTE */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">🏠</div>
                            <h3 className="text-2xl font-black text-slate-800">Finaliser la vente</h3>
                            <p className="text-slate-500">Client : <span className="font-bold text-slate-700">{selectedUser.firstname} {selectedUser.lastname}</span></p>
                        </div>

                        {!clientSecret ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionner le bien (Mobil-home/Parcelle)</label>
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-700"
                                    >
                                        <option value="">-- Choisir un bien --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-2">Prix de vente final (€ TTC)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Ex: 35000"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none text-xl font-black text-emerald-700"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleGeneratePayment}
                                        className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all"
                                    >
                                        Générer le paiement
                                    </button>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="px-6 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center">
                                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                                    <h4 className="font-black text-emerald-800 mb-2">Prêt pour l'encaissement</h4>
                                    <p className="text-emerald-700 font-medium text-sm">Le client a bien été rattaché à son bien et est officiellement enregistré comme propriétaire.</p>
                                </div>

                                {/* Ici tu pourras afficher le module Stripe Elements plus tard */}

                                <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg">
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