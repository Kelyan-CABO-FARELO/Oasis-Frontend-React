import {createBrowserRouter} from "react-router-dom";
import ErrorPage from "../screens/ErrorScreens/ErrorPage.jsx";
import Home from "../screens/OfflineScreens/Home.jsx";
import Reserved from "../screens/OfflineScreens/Reserved.jsx";

const OfflineRouter = createBrowserRouter([
    {
        errorElement: <ErrorPage/>, // Élément retourné en cas d'erreur
        children: [
            {
                path: "/", // Chemin de la vue
                element: <Home/>, // Élément retourné
            },
            {
                path: "/reserved",
                element: <Reserved/>
            }
        ],
    },
]);

export default OfflineRouter;