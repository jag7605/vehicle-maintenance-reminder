import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StaffHomepage from './pages/StaffHomepage';
import CustomerHomepage from './pages/CustomerHomepage';
import AdminBookingsPage from "./pages/AdminBookingPage";
import AdminNotificationsPage from "./pages/AdminNotificationPage";
import AdminTaskTrackerPage from "./pages/AdminTaskTrackerPage";
import AdminJobsPage from "./pages/AdminJobsPage";
import AdminCustomerPage from './pages/AdminCustomersPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/admin/home" element={
          <ProtectedRoute requiredRole="admin">
            <StaffHomepage />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/jobs" element={<AdminJobsPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/tasks" element={<AdminTaskTrackerPage />} />
        <Route path="/admin/customers" element={<AdminCustomerPage />} />

        <Route path="/customer/home" element={
          <ProtectedRoute requiredRole="customer">
            <CustomerHomepage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;