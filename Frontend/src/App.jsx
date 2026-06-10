import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./component/Navbar";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

function App() {
  useEffect(() => {
    try {
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue.includes("EventHub")) {
            node.nodeValue = node.nodeValue.replace(/EventHub/g, "TicketMandu");
          }
        } else {
          node.childNodes.forEach(walk);
        }
      };
      walk(document.body);
    } catch (e) {
      // no-op in non-browser environments
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/tickets" element={<MyTicketsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
