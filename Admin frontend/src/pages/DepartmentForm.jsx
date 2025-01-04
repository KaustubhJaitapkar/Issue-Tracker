import React, { useState } from "react";
import axios from "axios";
import AlertBox from '../components/AlertBox';
import { useNavigate } from 'react-router-dom';

const DepartmentForm = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const navigateToAboutPage = () => {
    navigate('/issue-history');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/api/v1/users/departments", {
        name,
        type,
      });
      
      setMessage(response.data.message);
      setName(""); // Reset the form fields
      setType("");

      AlertBox(1,"Department added successfully!!");
      navigateToAboutPage();
    } catch (error) {
      console.error("Error adding department:", error);
      setMessage("Failed to add department. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white">
  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-2xl border border-blue-700">
    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center font-serif text-orange-500 mb-2 md:mb-4">Add Department</h2>
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
        >
          Department Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="type"
          className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
        >
          Department Type
        </label>
        <input
          type="text"
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 sm:py-3 md:py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300 md:text-lg"
      >
        Add Department
      </button>
    </form>
    {message && (
      <p className="mt-4 text-green-500 font-medium text-center">{message}</p>
    )}
  </div>
</div>

  );
};

export default DepartmentForm;
