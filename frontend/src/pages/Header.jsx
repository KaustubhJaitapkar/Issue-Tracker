import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { isAdmin, logout } = useAuth();

    const handleLogOut = async () => {
        await logout();
        navigate("/");
    };
    
    return (
        <header className="bg-gradient-to-r from-blue-700 to-blue-500 border-b border-blue-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <div className="flex items-center">
                        <span className="font-bold text-2xl text-white tracking-tight">UIAMS</span>
                    </div>
                    
                    {/* Navigation for desktop */}
                    <nav className="hidden md:flex items-center space-x-1">
                        <Link to="/home" className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 hover:shadow-md transition duration-150 rounded-md">Home</Link>
                        <Link to="/issue-history" className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 hover:shadow-md transition duration-150 rounded-md">Issue Tracker</Link>
                        <Link to="/issue-form" className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 hover:shadow-md transition duration-150 rounded-md">Report Issue</Link>
                        
                        {isAdmin && (
                            <div className="relative group">
                                <button className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 hover:shadow-md transition duration-150 rounded-md flex items-center">
                                    Admin
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <Link to="/add-department" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">Manage Departments</Link>
                                        <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">Manage Employees</Link>
                                        <Link to="/reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">View Reports</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isAdmin && (
                            <div className="relative group">
                                <button className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 hover:shadow-md transition duration-150 rounded-md flex items-center">
                                    Licenses
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <Link to="/license-upload" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">Upload License</Link>
                                        <Link to="/all-licenses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">All Licenses</Link>
                                        <Link to="/expiring-licenses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">Expiring Licenses</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleLogOut} 
                            className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition duration-150"
                        >
                            Logout
                        </button>
                    </nav>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button 
                            className="text-white focus:outline-none"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Mobile menu */}
                {menuOpen && (
                    <div className="px-2 pt-2 pb-4 bg-blue-600 md:hidden rounded-b-lg shadow-lg">
                        <Link to="/home" className="block px-3 py-2 text-white hover:bg-blue-700 rounded mb-1">Home</Link>
                        <Link to="/issue-history" className="block px-3 py-2 text-white hover:bg-blue-700 rounded mb-1">Issue Tracker</Link>
                        <Link to="/issue-form" className="block px-3 py-2 text-white hover:bg-blue-700 rounded mb-1">Report Issue</Link>
                        
                        {isAdmin && (
                            <>
                                <div className="px-3 py-2 text-white font-medium border-t border-blue-500 mt-2 pt-2">Admin</div>
                                <Link to="/add-department" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">Manage Departments</Link>
                                <Link to="/register" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">Manage Employees</Link>
                                <Link to="/reports" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">View Reports</Link>
                                
                                <div className="px-3 py-2 text-white font-medium border-t border-blue-500 mt-2 pt-2">Licenses</div>
                                <Link to="/license-upload" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">Upload License</Link>
                                <Link to="/all-licenses" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">All Licenses</Link>
                                <Link to="/expiring-licenses" className="block px-3 py-2 pl-6 text-white hover:bg-blue-700 rounded mb-1">Expiring Licenses</Link>
                            </>
                        )}
                        
                        <button 
                            onClick={handleLogOut} 
                            className="block w-full text-left px-3 py-2 text-white bg-red-600 hover:bg-red-700 rounded mt-3"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;