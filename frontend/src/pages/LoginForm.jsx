import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertBox from '../components/AlertBox';
import { useAuth } from '../context/AuthContext';

function LoginForm() {
  const [formData, setFormData] = useState({
    userid: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(formData.userid, formData.password);
      
      if (result.success) {
        AlertBox(1, "Login Successful");
        navigate('/home');
      } else {
        console.log("Error");
        AlertBox(2, result.message);
      }
    } catch (e) {
      console.log(e);
      AlertBox(2, "User ID or Password incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-auto my-8 p-8 bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">UIAMS</h2>
          <h3 className="text-xl font-medium text-gray-600">Login to your account</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userid" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              id="userid"
              name="userid"
              value={formData.userid}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your user ID"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-white font-medium rounded-lg shadow-md ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-300 transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;