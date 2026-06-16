import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StaffHomepage from './pages/StaffHomepage';
import CustomerHomepage from './pages/CustomerHomepage';

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

        <Route path="/customer/home" element={
          //<ProtectedRoute requiredRole="customer">
            <CustomerHomepage />
          //</ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;