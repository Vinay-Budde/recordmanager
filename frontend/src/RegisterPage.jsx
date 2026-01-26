import React, { useState } from 'react';
import axios from 'axios';
import { LockClosedIcon, UserIcon, EnvelopeIcon, AcademicCapIcon, ChartBarIcon, ShieldCheckIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:5000/api/auth/register';

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await axios.post(API_URL, {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            onRegisterSuccess();
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
            {/* Left Column - Info Section */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-900 to-purple-800 text-white flex-col justify-center px-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-600 opacity-20 blur-3xl"></div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm">
                            <AcademicCapIcon className="h-10 w-10 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200">EduManager</span>
                        </h1>
                        <p className="mt-4 text-lg text-indigo-200 leading-relaxed font-light">
                            Create your admin account to start managing your institution effectively. secure, fast, and reliable.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ChartBarIcon className="h-6 w-6 text-pink-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Real-time Performance Analytics</span>
                        </div>
                        <div className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Comprehensive Grade Management</span>
                        </div>
                        <div className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ShieldCheckIcon className="h-6 w-6 text-green-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Secure Data Architecture</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Register Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Create Account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Sign up to get started
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        <div className="space-y-4">
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
                                    <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                                </span>
                                <input
                                    name="username"
                                    autoComplete="off"
                                    type="text"
                                    required
                                    className="appearance-none rounded-lg block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                                </span>
                                <input
                                    name="email"
                                    autoComplete="off"
                                    type="email"
                                    required
                                    className="appearance-none rounded-lg block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                                </span>
                                <input
                                    name="password"
                                    autoComplete="new-password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-lg block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                                </span>
                                <input
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-lg block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3">
                                <div className="flex">
                                    <div className="text-sm text-red-700 font-medium">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95 shadow-md"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
                                </span>
                                Register
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Already a member?</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <button onClick={onSwitchToLogin} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign in to your account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
