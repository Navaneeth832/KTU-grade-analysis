import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Start } from './pages/Start';
import Login from './pages/Login';
import Register from './pages/Register';
import { OverallAnalysis } from './pages/OverallAnalysis';
import { SemesterAnalysis } from './pages/SemesterAnalysis';
import { CustomQueries } from './pages/CustomQueries';
import AddSemester from './pages/AddSemester';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const showSidebar = !['/', '/login', '/register'].includes(location.pathname);

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="flex pt-20">
          {showSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
          
          <main className={`flex-1 ${showSidebar && sidebarOpen ? 'lg:ml-72' : ''} transition-all duration-300`}>
            <div className="p-6">
              <Routes>
                <Route path="/" element={<Start />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/overall-analysis" element={<OverallAnalysis />} />
                  <Route path="/semester-analysis" element={<SemesterAnalysis />} />
                  <Route path="/custom-queries" element={<CustomQueries />} />
                  <Route path="/add-semester" element={<AddSemester />} />
                </Route>
              </Routes>
            </div>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
  );
}

export default App;
