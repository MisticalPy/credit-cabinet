import { Routes, Route, Navigate } from "react-router-dom";
import MainPage from "../../pages/MainPage";
import ChatView from "../../widgets/Footer/Chat";
import DashboardView from "../../widgets/Footer/Dashboard";
import FaqView from "../../widgets/Footer/FAQ";
import { RequireAuth } from "./Guards";
// import Smart_calculator from "../../widgets/Footer/Smart_calculator";
import AccountPage from "../../pages/Account";
import ArchiveView from "../../widgets/Footer/Archive";
import RequestsView from "../../widgets/Footer/RequestClients";

const NotFound = () => (
    <div>
        <h1 style={{ color: "#FF0000" }}>404 page not found</h1>
    </div>
);

const Router = () => (
    <Routes>
        {/* Shell (sidebar, header) is always visible; the content is guarded */}
        <Route path="/" element={<MainPage />}>
            <Route element={<RequireAuth />}>
                <Route index element={<Navigate to="chat" replace />} />
                <Route path="chat" element={<ChatView />} />
                <Route path="dashboard" element={<DashboardView />} />
                <Route path="archive" element={<ArchiveView />}/>
                <Route path="faq" element={<FaqView />} />
                <Route path="requests" element={<RequestsView />} />
                {/*<Route path="calculator" element={<Smart_calculator />} />*/}
            </Route>
        </Route>
        <Route path="/account" element={<AccountPage />} />

        <Route path="*" element={<NotFound />} />
    </Routes>
);

export default Router;
