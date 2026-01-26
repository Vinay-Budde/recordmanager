import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Settings from './Settings';

const API_URL = 'http://localhost:8080/api/students';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Settings State
  const [darkMode, setDarkMode] = useState(false);

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({ name: '', email: '', role: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Load students only if authenticated
  const fetchStudents = async () => {
    try {
      const res = await axios.get(API_URL);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    if (user) {
      setAdminProfile({
        name: user.name || 'Admin',
        email: user.email || 'admin@edu.com',
        role: user.role || 'Admin'
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuccess = () => {
    setSelectedStudent(null);
    setShowForm(false);
    fetchStudents();
  };

  // --- Render Layout ---

  if (!isAuthenticated) {
    if (showRegister) {
      return <RegisterPage
        onRegisterSuccess={() => { setShowRegister(false); alert("Registration Successful! Please Login."); }}
        onSwitchToLogin={() => setShowRegister(false)}
      />;
    }
    return <LoginPage
      onLogin={handleLogin}
      onSwitchToRegister={() => setShowRegister(true)}
    />;
  }

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl text-indigo-600">👥</span>
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Students</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{students.length}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl text-blue-600">📈</span>
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Average Performance</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {students.length > 0
                  ? (students.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / students.length).toFixed(2) + '%'
                  : '0.00%'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl text-amber-600">🏆</span>
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Top Performer</p>
              <p className="mt-2 text-xl font-bold text-amber-600 truncate">
                {students.length > 0
                  ? students.reduce((max, curr) => (max.percentage || 0) > (curr.percentage || 0) ? max : curr).name
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Manage Students</h3>
            <button
              onClick={() => { setSelectedStudent(null); setShowForm(true); }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              + Add New Student
            </button>
          </div>
        </>
      );
    }

    if (activeTab === 'settings') {
      return <Settings darkMode={darkMode} setDarkMode={setDarkMode} />;
    }

    if (activeTab === 'profile') {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-indigo-600 relative">
            <button
              onClick={handleLogout}
              className="absolute top-4 right-4 bg-white/20 text-white px-3 py-1 rounded text-sm hover:bg-white/30"
            >
              Logout
            </button>
          </div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="h-24 w-24 rounded-full bg-white p-1 ring-4 ring-white">
                <div className="h-full w-full rounded-full bg-indigo-500 flex items-center justify-center text-3xl text-white font-bold">
                  {adminProfile.name.charAt(0)}
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md font-medium text-sm hover:bg-indigo-100 transition-colors"
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{adminProfile.name}</h2>
              <p className="text-gray-500">{adminProfile.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</label>
                <p className="text-gray-700 font-medium">{adminProfile.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Status</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null; // Fallback
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-indigo-900'} text-white flex flex-col hidden md:flex`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-indigo-800'}`}>
          <h1 className="text-2xl font-bold tracking-tight">EduManager</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-indigo-300'} text-sm mt-1`}>Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {['dashboard', 'students', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center px-4 py-3 rounded-lg font-medium shadow-sm transition-all capitalize 
                    ${activeTab === tab
                  ? (darkMode ? 'bg-gray-700 text-white' : 'bg-indigo-800 text-white')
                  : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-indigo-100 hover:bg-indigo-800')}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-indigo-800'}`}>
          <div
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-800'}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
              {adminProfile.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{adminProfile.name}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-indigo-300'}`}>View Profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b h-16 flex items-center justify-between px-8 transition-colors duration-300`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}

          {(activeTab === 'dashboard' || activeTab === 'students') && (
            <>
              {showForm ? (
                <StudentForm
                  selectedStudent={selectedStudent}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <StudentList
                  students={students}
                  fetchStudents={fetchStudents}
                  onEdit={handleEditStudent}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
