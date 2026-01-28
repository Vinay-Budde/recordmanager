import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import LandingPage from './LandingPage';
import Settings from './Settings';

import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/students`;

// Helper to calculate percentage and grade
const calculateStats = (marks) => {
  if (!marks) return { percentage: '0.00', grade: 'F' };
  const values = Object.values(marks);
  if (values.length === 0) return { percentage: '0.00', grade: 'F' };

  const total = values.reduce((a, b) => a + Number(b), 0);
  const percentage = (total / values.length).toFixed(2);

  let grade = 'F';
  const pVal = parseFloat(percentage);
  if (pVal >= 90) grade = 'A+';
  else if (pVal >= 80) grade = 'A';
  else if (pVal >= 70) grade = 'B';
  else if (pVal >= 60) grade = 'C';
  else if (pVal >= 50) grade = 'D';

  return { percentage, grade };
};

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem('token');
  });

  // Set Auth Header on Load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'
  const [resetToken, setResetToken] = useState(null);

  const [isResetPage, setIsResetPage] = useState(false);

  useEffect(() => {
    // Check for reset password URL
    const path = window.location.pathname;
    if (path.includes('reset-password')) {
      setIsResetPage(true);
      if (path.startsWith('/reset-password/')) {
        const token = path.split('/')[2];
        if (token) setResetToken(token);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Settings State
  const [darkMode, setDarkMode] = useState(false);

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState(() => {
    const stored = localStorage.getItem('user');
    try {
      return stored ? JSON.parse(stored) : { name: '', email: '', role: '' };
    } catch {
      return { name: '', email: '', role: '' };
    }
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditingProfile) {
      setEditFormData({ name: adminProfile.name, email: adminProfile.email });
    }
  }, [isEditingProfile, adminProfile]);

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/auth/profile/${adminProfile.name}`, {
        username: editFormData.name,
        email: editFormData.email
      });
      setAdminProfile(res.data.user);
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update profile");
    }
  };

  // Load students only if authenticated
  const fetchStudents = async () => {
    try {
      const res = await axios.get(API_URL);
      // Pre-calculate stats for consistency if missing
      const augmented = res.data.map(s => {
        if (!s.percentage || !s.grade) {
          return { ...s, ...calculateStats(s.marks) };
        }
        return s;
      });
      setStudents(augmented);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const handleLogin = (data) => {
    const { token, user } = data;
    setIsAuthenticated(true);

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    if (user) {
      const profile = {
        name: user.name || 'Admin',
        email: user.email || 'admin@edu.com',
        role: user.role || 'Admin'
      };
      setAdminProfile(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
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

  if (showLanding) {
    return <LandingPage onFinish={() => {
      setShowLanding(false);
    }} />;
  }

  // --- Render Layout ---

  if (isResetPage) {
    return <ResetPasswordPage token={resetToken} onUpdated={() => { setResetToken(null); setIsResetPage(false); window.history.pushState({}, '', '/'); setAuthMode('login'); }} />;
  }

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <RegisterPage
        onRegisterSuccess={() => { setAuthMode('login'); alert("Registration Successful! Please Login."); }}
        onSwitchToLogin={() => setAuthMode('login')}
      />;
    }
    if (authMode === 'forgot') {
      return <ForgotPasswordPage onBackToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage
      onLogin={handleLogin}
      onSwitchToRegister={() => setAuthMode('register')}
      onForgot={() => setAuthMode('forgot')}
    />;
  }

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      const avgPerformance = students.length > 0
        ? (students.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0) / students.length).toFixed(2) + '%'
        : '0.00%';

      const topPerformer = students.length > 0
        ? students.reduce((max, curr) => (parseFloat(max.percentage) || 0) > (parseFloat(curr.percentage) || 0) ? max : curr).name
        : '-';

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
                {avgPerformance}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl text-amber-600">🏆</span>
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Top Performer</p>
              <p className="mt-2 text-xl font-bold text-amber-600 truncate">
                {topPerformer}
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
                  {adminProfile.name ? adminProfile.name.charAt(0) : 'A'}
                </div>
              </div>
              <div className="flex space-x-3">
                {isEditingProfile && (
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-md font-medium text-sm hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm ${isEditingProfile ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                >
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>

            <div className="mb-6">
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="block w-full text-2xl font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none px-1 py-1"
                  placeholder="Username"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{adminProfile.name}</h2>
              )}
              <p className="text-gray-500 mt-1">{adminProfile.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</label>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="block w-full font-medium text-gray-900 border-b-2 border-indigo-500 focus:outline-none px-1 py-1"
                    placeholder="Email Address"
                  />
                ) : (
                  <p className="text-gray-700 font-medium">{adminProfile.email}</p>
                )}
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
