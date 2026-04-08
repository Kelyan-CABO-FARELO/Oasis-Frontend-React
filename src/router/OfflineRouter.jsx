import {createBrowserRouter} from "react-router-dom";
import ErrorPage from "../screens/ErrorScreens/ErrorPage.jsx";
import Home from "../screens/OfflineScreens/Home.jsx";
import Product from "../screens/OfflineScreens/Product.jsx";
import ProductId from "../screens/OfflineScreens/ProductId.jsx";
import Checkout from "../screens/OfflineScreens/Checkout.jsx";

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
            },
            {
                path: "/product/:id",
                element: <ProductId/>
            },
            {
                path: "/checkout",
                element: <Checkout/>
            }
        ],
    },
]);

export default OfflineRouter;