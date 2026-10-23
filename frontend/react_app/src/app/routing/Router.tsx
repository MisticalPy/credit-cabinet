import { Routes, Route, Navigate } from "react-router-dom";
import MainPage from "../../pages/MainPage";
import ChatView from "../../widgets/Footer/Chat";
import DashboardView from "../../widgets/Footer/Dashboard";
import FaqView from "../../widgets/Footer/FAQ";
// import Smart_calculator from "../../widgets/Footer/Smart_calculator";

const NotFound = () => (
    <div>
        <h1 style={{ color: "#FF0000" }}>404 page not found</h1>
    </div>
);

const Router = () => (
    <Routes>
        <Route path="/" element={<MainPage />}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="faq" element={<FaqView />} />
            {/*<Route path="calculator" element={<Smart_calculator />} />*/}
        </Route>
        <Route path="*" element={<NotFound />} />
    </Routes>
);

export default Router;