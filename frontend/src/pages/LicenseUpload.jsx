import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const LicenseUpload = () => {
    const [file, setFile] = useState(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [licenses, setLicenses] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/licenses').then(res => setLicenses(res.data));
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('expiry_date', expiryDate);
        formData.append('department_id', departmentId);

        try {
            await axios.post('http://localhost:5000/upload', formData);
            toast.success('File uploaded successfully!');
        } catch (error) {
            toast.error('Upload failed');
        }
    };

    return (
        // <div>
        //     <h2>Upload License</h2>
        //     <form onSubmit={handleUpload}>
        //         <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        //         <input type="date" onChange={(e) => setExpiryDate(e.target.value)} required />
        //         <input type="number" placeholder="Department ID" onChange={(e) => setDepartmentId(e.target.value)} required />
        //         <button type="submit">Upload</button>
        //     </form>

        //     <h2>Licenses</h2>
        //     <ul>
        //         {licenses.map(license => (
        //             <li key={license.id}>{license.file_name} - Expires on {license.expiry_date}</li>
        //         ))}
        //     </ul>
        // </div>

        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 p-4">
    <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Upload License</h2>
        <form onSubmit={handleUpload} className="space-y-4">
            <div>
                <label className="block text-gray-700 mb-1 font-medium">License File</label>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    className="block w-full text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <div>
                <label className="block text-gray-700 mb-1 font-medium">Expiry Date</label>
                <input
                    type="date"
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <div>
                <label className="block text-gray-700 mb-1 font-medium">Department ID</label>
                <input
                    type="number"
                    placeholder="Enter Department ID"
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                    className="block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition duration-200"
            >
                Upload
            </button>
        </form>
    </div>

    <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Licenses</h2>
        {licenses.length === 0 ? (
            <p className="text-gray-500 text-center">No licenses uploaded yet.</p>
        ) : (
            <ul className="space-y-3">
                {licenses.map((license) => (
                    <li
                        key={license.id}
                        className="bg-gray-50 p-3 rounded border flex flex-col md:flex-row justify-between items-start md:items-center"
                    >
                        <span className="font-medium text-gray-800">{license.file_name}</span>
                        <span className="text-sm text-gray-600">Expires on {license.expiry_date}</span>
                    </li>
                ))}
            </ul>
        )}
    </div>
</div>

    );
};

export default LicenseUpload;
