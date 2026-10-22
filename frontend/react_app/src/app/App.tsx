import { BrowserRouter } from "react-router-dom";
import "./Styles/index.css";
import Router from "./routing/Router.tsx";
import {ChatProvider} from "../widgets/Footer/Chat/ChatContext.tsx";

const App = () => (
    <BrowserRouter>
        <ChatProvider>
            <Router />
        </ChatProvider>
    </BrowserRouter>
);

export default App;