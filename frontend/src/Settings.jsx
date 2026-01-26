import React, { useState } from 'react';
import { Switch } from '@headlessui/react';

export default function Settings({ darkMode, setDarkMode }) {
    const [notifications, setNotifications] = useState(true);
    const [autoSave, setAutoSave] = useState(false);

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">System Preferences</h2>
                <p className="text-gray-500 text-sm">Manage your application settings</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-medium text-gray-900">Dark Mode</h3>
                        <p className="text-sm text-gray-500">Enable dark theme for the interface (Coming Soon)</p>
                    </div>
                    <Switch
                        checked={darkMode}
                        onChange={setDarkMode}
                        className={`${darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                        <span
                            className={`${darkMode ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </Switch>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive alerts when students are added</p>
                    </div>
                    <Switch
                        checked={notifications}
                        onChange={setNotifications}
                        className={`${notifications ? 'bg-green-600' : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                    >
                        <span
                            className={`${notifications ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </Switch>
                </div>

                {/* Auto Save */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-medium text-gray-900">Auto-Save Forms</h3>
                        <p className="text-sm text-gray-500">Automatically save draft student data</p>
                    </div>
                    <Switch
                        checked={autoSave}
                        onChange={setAutoSave}
                        className={`${autoSave ? 'bg-blue-600' : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                        <span
                            className={`${autoSave ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </Switch>
                </div>
            </div>
        </div>
    );
}
