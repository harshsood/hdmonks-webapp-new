import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { PartnerAuthProvider } from "./contexts/PartnerAuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ServicesManagement from "./pages/admin/ServicesManagement";
import StagesManagement from "./pages/admin/StagesManagement";
import InquiriesManagement from "./pages/admin/InquiriesManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import TimeSlotsManagement from "./pages/admin/TimeSlotsManagement";
import TestimonialsManagement from "./pages/admin/TestimonialsManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import FAQManagement from "./pages/admin/FAQManagement";
import PackagesManagement from "./pages/admin/PackagesManagement";
import EmailTemplatesManagement from "./pages/admin/EmailTemplatesManagement";
import SettingsManagement from "./pages/admin/SettingsManagement";
import AnalyticsManagement from "./pages/admin/AnalyticsManagement";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/Dashboard";
import ClientsManagement from "./pages/partner/ClientsManagement";
import ClientDetail from "./pages/partner/ClientDetail";
import ProtectedPartnerRoute from "./components/ProtectedPartnerRoute";

function App() {
  return (
    <SettingsProvider>
      <PartnerAuthProvider>
      <AdminAuthProvider>
        <div className="App">
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/service/:serviceId" element={<ServiceDetail />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="stages" element={<StagesManagement />} />
              <Route path="inquiries" element={<InquiriesManagement />} />
              <Route path="bookings" element={<BookingsManagement />} />
              <Route path="timeslots" element={<TimeSlotsManagement />} />
              <Route path="testimonials" element={<TestimonialsManagement />} />
              <Route path="blogs" element={<BlogManagement />} />
              <Route path="faqs" element={<FAQManagement />} />
              <Route path="packages" element={<PackagesManagement />} />
              <Route path="templates" element={<EmailTemplatesManagement />} />
              <Route path="settings" element={<SettingsManagement />} />
              <Route path="analytics" element={<AnalyticsManagement />} />
            </Route>
            {/* Partner Routes */}
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route
              path="/partner"
              element={
                <ProtectedPartnerRoute>
                  <PartnerLayout />
                </ProtectedPartnerRoute>
              }
            >
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="clients" element={<ClientsManagement />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </div>
      </AdminAuthProvider>
      </PartnerAuthProvider>
    </SettingsProvider>
  );
}

export default App;
