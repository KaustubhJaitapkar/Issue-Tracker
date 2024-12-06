import React, { useState } from "react";
import axios from "axios";

const DepartmentForm = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (error) {
      console.error("Error adding department:", error);
      setMessage("Failed to add department. Please try again.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Add Department</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Department Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Department Type
          </label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white text-base px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Add Department
        </button>
      </form>
      {message && (
        <p className="mt-4 text-green-500 font-medium">{message}</p>
      )}
    </div>
  );
};

export default DepartmentForm;
