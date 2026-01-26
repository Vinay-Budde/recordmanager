import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:8080/api/students';

export default function StudentForm({ selectedStudent, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        rollNumber: '',
        name: '',
        course: '',
        // marks is now an array of { subject: '', score: '' } for UI
        marks: [{ subject: '', score: '' }]
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedStudent && selectedStudent.marks) {
            // Convert object marks back to array
            const marksArray = Object.entries(selectedStudent.marks).map(([key, val]) => ({
                subject: key,
                score: val
            }));

            if (marksArray.length === 0) marksArray.push({ subject: '', score: '' });

            setFormData({
                rollNumber: selectedStudent.rollNumber,
                name: selectedStudent.name,
                course: selectedStudent.course,
                marks: marksArray
            });
        }
    }, [selectedStudent]);

    const handleBasicChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubjectChange = (index, field, value) => {
        const newMarks = [...formData.marks];
        newMarks[index][field] = value;
        setFormData({ ...formData, marks: newMarks });
    };

    const addSubject = () => {
        setFormData({ ...formData, marks: [...formData.marks, { subject: '', score: '' }] });
    };

    const removeSubject = (index) => {
        const newMarks = formData.marks.filter((_, i) => i !== index);
        setFormData({ ...formData, marks: newMarks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate marks
        const marksPayload = {};
        for (const item of formData.marks) {
            if (!item.subject.trim()) continue; // skip empty rows

            const score = parseFloat(item.score);
            if (isNaN(score) || score < 0 || score > 100) {
                setError(`Score for ${item.subject} must be between 0 and 100`);
                return;
            }
            marksPayload[item.subject.trim()] = score;
        }

        if (Object.keys(marksPayload).length === 0) {
            setError("Please add at least one subject with valid marks.");
            return;
        }

        try {
            if (selectedStudent) {
                // Update
                await axios.put(`${API_URL}/${selectedStudent.rollNumber}`, {
                    ...formData,
                    marks: marksPayload
                });
            } else {
                // Create
                await axios.post(API_URL, {
                    ...formData,
                    marks: marksPayload
                });
            }
            onSuccess();
            // Reset
            setFormData({
                rollNumber: '',
                name: '',
                course: '',
                marks: [{ subject: '', score: '' }]
            });
        } catch (err) {
            setError(err.response?.data || "An error occurred. If ID exists, try editing instead.");
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">
                {selectedStudent ? 'Edit Student' : 'Add New Student'}
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                        {selectedStudent ? (
                            <input
                                type="number"
                                name="rollNumber"
                                value={formData.rollNumber}
                                disabled
                                className="mt-1 block w-full rounded-md bg-gray-100 border-gray-200 text-gray-500 shadow-sm sm:text-sm p-2 border cursor-not-allowed"
                            />
                        ) : (
                            <div className="mt-1 block w-full rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm sm:text-sm p-2 font-medium">
                                Auto-assigned
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleBasicChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Course / Branch</label>
                    <input
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleBasicChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Subjects & Marks</label>
                        <button
                            type="button"
                            onClick={addSubject}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" /> Add Subject
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.marks.map((mark, index) => (
                            <div key={index} className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Subject (e.g. Math)"
                                    value={mark.subject}
                                    onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Score"
                                    value={mark.score}
                                    onChange={(e) => handleSubjectChange(index, 'score', e.target.value)}
                                    className="w-24 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    required
                                    min="0"
                                    max="100"
                                />
                                {formData.marks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSubject(index)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Remove"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                    {selectedStudent && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm"
                    >
                        {selectedStudent ? 'Update Student' : 'Save Student'}
                    </button>
                </div>
            </form>
        </div>
    );
}
