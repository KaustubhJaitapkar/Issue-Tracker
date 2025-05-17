import { useState, useEffect } from 'react';
import axios from 'axios';
import AlertBox from '../components/AlertBox';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    phone: '',
    department: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigateToAboutPage = () => {
    navigate('/issue-history');
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        // Use the token in the request headers
        const res = await axios.get('http://localhost:8000/api/v1/departments', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true
        });
        
        console.log('Departments data:', res.data);
        if (res.data.data) {
          setDepartments(res.data.data);
        }
      } catch (e) {
        console.error('Error fetching departments:', e);
      }
    };

    fetchDepartments();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Handle form submission
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const res = await axios.post('http://localhost:8000/api/v1/users/register', {
        fullName: formData.name,
        email: formData.email, 
        username: formData.userId, 
        password: formData.password, 
        department: formData.department, 
        phoneNumber: formData.phone
      }, { 
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true 
      });
      
      console.log(res);
      if (res.data.statusCode === 200 || res.data.statusCode === 201) {
        console.log("Success on registration");
        AlertBox(1, "User registered successfully!!");
        navigateToAboutPage();
      } else {
        console.log("Error on registration");
        AlertBox(2, "Registration failed!");
      }

    } catch (e) {
      console.log(e);
      AlertBox(2, e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-8">Register New Employee</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Create a user ID"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Department</option>
                {departments && departments.map((dept, idx) => (
                  <option key={idx} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email address"
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
                placeholder="Create a password"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 text-white font-medium rounded-lg shadow-md 
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-300 transform hover:-translate-y-0.5'
                }`}
            >
              {loading ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;