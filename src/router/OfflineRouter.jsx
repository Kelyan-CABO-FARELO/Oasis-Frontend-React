import {createBrowserRouter} from "react-router-dom";
import ErrorPage from "../screens/ErrorScreens/ErrorPage.jsx";
import Home from "../screens/OfflineScreens/Home.jsx";
import Product from "../screens/OfflineScreens/Product.jsx";

const OfflineRouter = createBrowserRouter([
    {
        errorElement: <ErrorPage/>, // Élément retourné en cas d'erreur
        children: [
            {
                path: "/", // Chemin de la vue
                element: <Home/>, // Élément retourné
            },
            {
                path: "/product",
                element: <Product/>
            }
        ],
    },
]);

export default OfflineRouter;