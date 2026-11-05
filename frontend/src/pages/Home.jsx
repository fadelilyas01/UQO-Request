import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const { isAuthenticated, isManager } = useAuth();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Normaliser la position de la souris entre -1 et 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="home-container">
            {/* 
                Parallax Layers avec mouvement calculé
                Chaque couche bouge à une vitesse différente (multiplicateur)
                pour créer la profondeur.
            */}
            <div
                className="parallax-layer layer-bg"
                style={{
                    transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`
                }}
            />
            <div
                className="parallax-layer layer-1"
                style={{
                    transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px) scale(1.1)`
                }}
            />
            <div
                className="parallax-layer layer-2"
                style={{
                    transform: `translate(${mousePos.x * -80}px, ${mousePos.y * -80}px) scale(1.2)`
                }}
            />

            {/* Lumière qui suit la souris */}
            <div
                className="mouse-light"
                style={{
                    left: `${(mousePos.x + 1) * 50}%`,
                    top: `${(mousePos.y + 1) * 50}%`
                }}
            />

            {/* Main Content */}
            <div className="home-content animate-in">
                <div className="hero-section">
                    <h1 className="hero-title">
                        Simplifiez vos <span className="gradient-text">Requêtes</span>
                    </h1>
                    <p className="hero-subtitle">
                        La plateforme centralisée pour la gestion des demandes académiques et administratives de l'UQO.
                    </p>

                    <div className="cta-group">
                        {isAuthenticated ? (
                            <Link to={isManager ? "/manager" : "/dashboard"} className="btn btn-primary btn-lg shine-effect">
                                Accéder au Dashboard 🚀
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary btn-lg shine-effect">
                                    Commencer
                                </Link>
                                <Link to="/register" className="btn btn-secondary btn-lg">
                                    Créer un compte
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Rapide</h3>
                        <p>Soumettez vos demandes en quelques clics et suivez leur état en temps réel.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Sécurisé</h3>
                        <p>Vos données sont protégées et accessibles uniquement par le personnel autorisé.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">📱</div>
                        <h3>Accessible</h3>
                        <p>Une interface moderne et responsive, disponible sur tous vos appareils.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
