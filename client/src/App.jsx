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
import CustomerLayout from './components/CustomerLayout';

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
        
        <Route path="/admin/notifications" element={
          <ProtectedRoute requiredRole="admin">
          <AdminNotificationsPage />
          </ProtectedRoute>} />
        <Route path="/admin/jobs" element={
          <ProtectedRoute requiredRole="admin">
          <AdminJobsPage />
          </ProtectedRoute>} />
        <Route path="/admin/bookings" element={
          <ProtectedRoute requiredRole="admin">
          <AdminBookingsPage />
          </ProtectedRoute>} />
        <Route path="/admin/tasks" element={
          <ProtectedRoute requiredRole="admin">
          <AdminTaskTrackerPage />
          </ProtectedRoute>} />
        <Route path="/admin/customers" element={
          <ProtectedRoute requiredRole="admin">
          <AdminCustomerPage /></ProtectedRoute>} />

        <Route path="/customer" element={
          <ProtectedRoute requiredRole="customer">
          <CustomerLayout />
        </ProtectedRoute>}>
          <Route path="home" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerHomepage />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerNotifications />
            </ProtectedRoute>
          } />
          <Route path="appointments" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerAppointments />
            </ProtectedRoute>
          } />
          <Route path="vehicles" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerVehicles />
            </ProtectedRoute>
          } />
          <Route path="history" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerHistory />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerProfile />
            </ProtectedRoute>
          } />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;