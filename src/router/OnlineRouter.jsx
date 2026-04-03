// src/router/OnlineRouter.jsx
import { createBrowserRouter } from "react-router-dom";
import React from "react";
// Vous pourrez importer vos futures pages privées ici (ex: Dashboard)

const OnlineRouter = createBrowserRouter([
    {
        path: "/",
        element: (
            <div className="p-10 text-center">
                <h1 className="text-3xl font-bold text-emerald-600">Espace Connecté</h1>
                <p>Bienvenue dans votre espace privé !</p>
            </div>
        ),
    }
]);

export default OnlineRouter;