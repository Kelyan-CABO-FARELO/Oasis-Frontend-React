import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";
import AdminDashboard from "../screens/OnlineScreens/AdminDashboard.jsx";

const OnlineRouter = createBrowserRouter([
    {
        path: "/",
        element: <AdminDashboard />,
    },
    //ROUTE ATTRAPE-TOUT : Redirige vers le Dashboard si l'URL est inconnue (ex: /login)
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

export default OnlineRouter;