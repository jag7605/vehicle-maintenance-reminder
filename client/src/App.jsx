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
import CustomerNotifications from './pages/CustomerNotificationPage';
import CustomerAppointments from './pages/CustomerAppointmentsPage';
import CustomerVehicles from './pages/CustomerVehiclesPage';
import CustomerHistory from './pages/CustomerServiceHistoryPage';
import CustomerProfile from './pages/CustomerProfilePage';
import CustomerLayout from './component/CustomerLayout';
import CustomerNotificationPreferencePage from "./pages/CustomerNotificationPreferencePage";
import AdminNotificationPreferencePage from "./pages/AdminNotificationPreferencePage";

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
        <Route path="/admin/notification-preferences" element={<AdminNotificationPreferencePage />}/>

        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="home" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerHomepage />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="appointments" element={<CustomerAppointments />} />
          <Route path="vehicles" element={<CustomerVehicles />} />
          <Route path="history" element={<CustomerHistory />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="notification-preferences" element={<CustomerNotificationPreferencePage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;