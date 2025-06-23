import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { HomePage } from "@/pages/HomePage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ReceiptsPage } from "@/pages/ReceiptsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNavigation />
      </div>
    </Router>
  );
}

export default App;
