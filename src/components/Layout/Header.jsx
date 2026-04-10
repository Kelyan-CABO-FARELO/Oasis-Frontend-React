import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    // Détecte le scroll pour ajouter un fond blanc quand on descend
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Si on n'est pas sur la page d'accueil, le header a toujours un fond blanc
    const isHome = location.pathname === '/';
    const headerClass = isScrolled || !isHome
        ? "bg-white/90 backdrop-blur-md shadow-sm"
        : "bg-transparent";

    const textColor = isScrolled || !isHome ? "text-slate-800" : "text-white drop-shadow-md";

    return (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${headerClass}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className={`text-2xl font-black tracking-tight ${textColor}`}>
                    L'Oasis<span className="text-amber-500">.</span>
                </Link>

                {/* Navigation principale */}
                <nav className="hidden md:flex gap-8 items-center font-bold">
                    <Link to="/" className={`${textColor} hover:text-amber-500 transition-colors`}>
                        Accueil
                    </Link>
                    <Link to="/product" className={`${textColor} hover:text-amber-500 transition-colors`}>
                        Hébergements
                    </Link>
                    <a href="mailto:kelyan.cf@gmail.com" className={`${textColor} hover:text-amber-500 transition-colors`}>
                        Contact
                    </a>
                </nav>

                {/* Bouton d'action (Réserver) */}
                <Link
                    to="/product"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-lg transition-transform hover:-translate-y-0.5"
                >
                    Réserver
                </Link>
            </div>
        </header>
    );
};

export default Header;