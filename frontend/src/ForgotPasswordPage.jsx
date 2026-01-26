import React, { useState } from 'react';
import axios from 'axios';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/solid';

const API_URL = 'http://localhost:5000/api/auth/reset-password-direct';

export default function ForgotPasswordPage({ onBackToLogin }) {
    const [email, setEmail] = useState('');
    // const [oldPassword, setOldPassword] = useState(''); // Removed as per request
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            if (newPassword !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            // Only sending email and newPassword
            await axios.post(API_URL, { email, newPassword });

            setMessage("Password changed successfully! You can now login.");
            setSuccess(true);
            setEmail('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || "Failed to reset password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Change Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email and new password.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="off"
                                className="appearance-none rounded-md block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Old Password Field Removed */}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="newPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="appearance-none rounded-md block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="appearance-none rounded-md block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {message && <div className={`text-sm text-center font-medium ${success ? 'text-green-600' : 'text-indigo-600'}`}>{message}</div>}
                    {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Reset Password
                    </button>
                    <div className="text-center mt-4">
                        <button type="button" onClick={onBackToLogin} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
