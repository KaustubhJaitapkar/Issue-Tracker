import IssueForm from "./pages/IssueForm";
import History from "./pages/History";
import LoginForm from "./pages/LoginForm";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import ProtectedRoute from "./pages/ProtectdRouter";
import DepartmentForm from "./pages/DepartmentForm";
import { AuthProvider } from "./context/AuthContext";
import LicenseUpload from "./pages/LicenseUpload";
import AllLicenses from "./pages/AllLicenses";
import ExpiringLicenses from "./pages/ExpiringLicenses";

function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<ProtectedRoute element={<Register />} adminOnly={true} />} />
          <Route path="/issue-history" element={<ProtectedRoute element={<History />} />} />
          <Route path="/issue-form" element={<ProtectedRoute element={<IssueForm />} />} />
          <Route path="/reports" element={<ProtectedRoute element={<Reports />} adminOnly={true} />} />
          <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/add-department" element={<ProtectedRoute element={<DepartmentForm />} adminOnly={true} />} />
          
          {/* License management routes */}
          <Route path="/license-upload" element={<ProtectedRoute element={<LicenseUpload />} adminOnly={true} />} />
          <Route path="/all-licenses" element={<ProtectedRoute element={<AllLicenses />} adminOnly={true} />} />
          <Route path="/expiring-licenses" element={<ProtectedRoute element={<ExpiringLicenses />} adminOnly={true} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
} 

export default App;