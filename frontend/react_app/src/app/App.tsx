import { BrowserRouter } from "react-router-dom";
import "./Styles/index.css";
import Router from "./routing/Router.tsx";
import { AuthProvider } from "./providers/AuthProvider.tsx";
import {ChatProvider} from "../widgets/Footer/Chat/ChatContext.tsx";

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <ChatProvider>
                <Router />
            </ChatProvider>
        </AuthProvider>
    </BrowserRouter>
);

export default App;