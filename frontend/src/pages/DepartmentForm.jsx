import React, { useState } from "react";
import axios from "axios";
import AlertBox from '../components/AlertBox';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const DepartmentForm = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.post("http://localhost:8000/api/v1/departments", 
        {
          name,
          type,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true
        }
      );
      
      // Reset form fields
      setName("");
      setType("");
      AlertBox(1,"Department added successfully");
      
      // Navigate to the history page
      navigate('/issue-history');
    } catch (error) {
      console.error("Error adding department:", error);
      AlertBox(0, "Failed to add department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-8">Add Department</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Department Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter department name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Department Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Select department type</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Regular">Regular</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-white font-medium rounded-lg shadow-md 
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-300 transform hover:-translate-y-0.5'
              }`}
          >
            {loading ? 'Adding Department...' : 'Add Department'}
          </button>
        </form>
      </div>
    </>
  );
};

export default DepartmentForm;
