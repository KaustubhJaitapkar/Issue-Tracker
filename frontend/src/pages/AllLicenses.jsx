import React, { useEffect, useState } from 'react';

const AllLicenses = () => {
    const [licenses, setLicenses] = useState([]);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        expiry_date: '',
        department_id: '',
        file: null,
    });

    useEffect(() => {
        fetchLicenses();
    }, []);

    const fetchLicenses = () => {
        fetch('http://localhost:5000/all-licenses')
            .then(response => response.json())
            .then(data => setLicenses(data))
            .catch(error => console.error('Error fetching data:', error));
    };

    const handleEdit = (license) => {
        setEditId(license.id);
        setFormData({
            expiry_date: license.expiry_date,
            department_id: license.department_id,
            file: null, // Reset file
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleUpdate = async (id) => {
        const formDataObj = new FormData();
        formDataObj.append('expiry_date', formData.expiry_date);
        formDataObj.append('department_id', formData.department_id);
        if (formData.file) {
            formDataObj.append('file', formData.file);
        }

        try {
            const response = await fetch(`http://localhost:5000/update-license/${id}`, {
                method: 'PUT',
                body: formDataObj
            });

            if (response.ok) {
                alert('License updated successfully');
                fetchLicenses();
                setEditId(null);
            } else {
                console.error('Error updating license');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        // <div className="container mx-auto p-4">
        //     <h2 className="text-2xl font-semibold mb-4">Licenses</h2>
        //     {licenses.length === 0 ? (
        //         <p className="text-gray-600">No licenses expiring soon.</p>
        //     ) : (
        //         <table className="w-full border-collapse border border-gray-300">
        //             <thead>
        //                 <tr className="bg-gray-200">
        //                     <th className="border p-2">File Name</th>
        //                     <th className="border p-2">Expiry Date</th>
        //                     <th className="border p-2">Department</th>
        //                     <th className="border p-2">Download</th>
        //                     <th className="border p-2">Actions</th>
        //                 </tr>
        //             </thead>
        //             <tbody>
        //                 {licenses.map(license => (
        //                     <tr key={license.id} className="text-center">
        //                         {editId === license.id ? (
        //                             <>
        //                                 <td className="border p-2">
        //                                     <input
        //                                         type="file"
        //                                         onChange={handleFileChange}
        //                                         className="border p-1"
        //                                     />
        //                                 </td>
        //                                 <td className="border p-2">
        //                                     <input
        //                                         type="date"
        //                                         name="expiry_date"
        //                                         value={formData.expiry_date}
        //                                         onChange={handleChange}
        //                                         className="border p-1"
        //                                     />
        //                                 </td>
        //                                 <td className="border p-2">
        //                                     <input
        //                                         type="text"
        //                                         name="department_id"
        //                                         value={formData.department_id}
        //                                         onChange={handleChange}
        //                                         className="border p-1"
        //                                     />
        //                                 </td>
        //                                 <td className="border p-2">-</td>
        //                                 <td className="border p-2">
        //                                     <button
        //                                         onClick={() => handleUpdate(license.id)}
        //                                         className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        //                                     >
        //                                         Save
        //                                     </button>
        //                                     <button
        //                                         onClick={() => setEditId(null)}
        //                                         className="ml-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
        //                                     >
        //                                         Cancel
        //                                     </button>
        //                                 </td>
        //                             </>
        //                         ) : (
        //                             <>
        //                                 <td className="border p-2">{license.file_name}</td>
        //                                 <td className="border p-2">{license.expiry_date}</td>
        //                                 <td className="border p-2">{license.department_id}</td>
        //                                 <td className="border p-2">
        //                                     <a
        //                                         href={`http://localhost:5000/${license.file_path}`}
        //                                         download
        //                                         className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        //                                     >
        //                                         Download
        //                                     </a>
        //                                 </td>
        //                                 <td className="border p-2">
        //                                     <button
        //                                         onClick={() => handleEdit(license)}
        //                                         className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
        //                                     >
        //                                         Edit
        //                                     </button>
        //                                 </td>
        //                             </>
        //                         )}
        //                     </tr>
        //                 ))}
        //             </tbody>
        //         </table>
        //     )}
        // </div>

        <div className="min-h-screen flex justify-center bg-gray-100 p-4">
    <div className="w-full max-w-6xl bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Licenses</h2>

        {licenses.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">No licenses expiring soon.</p>
        ) : (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full text-sm md:text-base border border-gray-300 rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-blue-100 text-gray-700">
                            <th className="px-4 py-3 border border-gray-300 text-center">File Name</th>
                            <th className="px-4 py-3 border border-gray-300 text-center">Expiry Date</th>
                            <th className="px-4 py-3 border border-gray-300 text-center">Department</th>
                            <th className="px-4 py-3 border border-gray-300 text-center">View Document</th>
                            <th className="px-4 py-3 border border-gray-300 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {licenses.map((license) => (
                            <tr key={license.id} className="hover:bg-gray-50 transition duration-200">
                                {editId === license.id ? (
                                    <>
                                        <td className="border px-4 py-2 text-center">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-gray-700"
                                            />
                                        </td>
                                        <td className="border px-4 py-2 text-center">
                                            <input
                                                type="date"
                                                name="expiry_date"
                                                value={formData.expiry_date}
                                                onChange={handleChange}
                                                className="border rounded p-1 w-full"
                                            />
                                        </td>
                                        <td className="border px-4 py-2 text-center">
                                            <input
                                                type="text"
                                                name="department_id"
                                                value={formData.department_id}
                                                onChange={handleChange}
                                                className="border rounded p-1 w-full"
                                            />
                                        </td>
                                        <td className="border px-4 py-2 text-center text-gray-400">—</td>
                                        <td className="border px-4 py-2 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleUpdate(license.id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditId(null)}
                                                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="border px-4 py-2 text-center">{license.file_name}</td>
                                        <td className="border px-4 py-2 text-center">{license.expiry_date}</td>
                                        <td className="border px-4 py-2 text-center">{license.department_id}</td>
                                        <td className="border px-4 py-2 text-center">
                                            <a
                                                href={`http://localhost:5000/${license.file_path}`}
                                                download
                                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                            >
                                                View
                                            </a>
                                        </td>
                                        <td className="border px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleEdit(license)}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
</div>

    );
};

export default AllLicenses;
