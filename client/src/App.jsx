import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StaffHomepage from './pages/StaffHomepage';
import CustomerHomepage from './pages/CustomerHomepage';
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

        <Route path="/staff/home" element={
          <ProtectedRoute requiredRole="staff">
            <StaffHomepage />
          </ProtectedRoute>
        } />

        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="home" element={
            //<ProtectedRoute requiredRole="customer">
            <CustomerHomepage />
            //</ProtectedRoute>
          } />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="appointments" element={<CustomerAppointments />} />
          <Route path="vehicles" element={<CustomerVehicles />} />
          <Route path="history" element={<CustomerHistory />} />
          <Route path="profile" element={<CustomerProfile />} />
          </Route> 
      
    </Routes>
    </BrowserRouter >
  );
}

export default App;