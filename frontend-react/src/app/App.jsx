import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext"; // 👈 add this

function App() {
    return (
        <LanguageProvider>        {/* 👈 wrap here */}
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;