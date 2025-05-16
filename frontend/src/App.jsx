import IssueForm from "./pages/IssueForm";
import History from "./pages/History";
import LoginForm from "./pages/LoginForm";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from "./pages/Home";

import ProtectedRoute from "./pages/ProtectdRouter";
import AllLicenses from "./pages/AllLicenses";
import ExpiringLicenses from "./pages/ExpiringLicenses";
import LicenseUpload from "./pages/LicenseUpload";

function App(){
  return(
    <>
      {/* <IssueForm/> */}
      {/* <History/> */}
      {/* <LoginForm/> */}
      {/* <Register/>
      <Reports/>  
      <Home/>
      <AllLicenses/>
      <ExpiringLicenses/>
      <LicenseUpload/> */}

      <BrowserRouter>
        <Routes>
          
          <Route path="/" element={<LoginForm />} ></Route>
          <Route path="/register" element={<Register />} ></Route>
          <Route path="/issue-history" element={<ProtectedRoute element  = {<History/>}/>} el={"Hello"} ></Route>
          <Route path="/issue-form" element={<ProtectedRoute element = {<IssueForm />}/>} ></Route>
          <Route path="/reports" element={<ProtectedRoute element = {<Reports />}/>} ></Route>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          </Routes>
      </BrowserRouter>
    </>
  );
} 

export default App;