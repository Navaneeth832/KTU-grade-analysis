import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const [ktuId, setKtuId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/login', {
        ktuId,
        password,
      });
      localStorage.setItem('token', response.data.token);
      navigate('/home'); // Redirect to dashboard after successful login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="ktuId" className="block text-sm font-medium text-gray-700 mb-2">
              KTU ID
            </label>
            <input
              type="text"
              id="ktuId"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-300 ease-in-out transform hover:scale-105"
              value={ktuId}
              onChange={(e) => setKtuId(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-300 ease-in-out transform hover:scale-105"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-300 ease-in-out"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;