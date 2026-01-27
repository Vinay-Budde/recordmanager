import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { TrashIcon, PencilSquareIcon, ArrowsUpDownIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:5000/api/students';

// Helper to extract all unique subjects from student data
const getAllSubjects = (students) => {
    const subjects = new Set();
    students.forEach(s => {
        if (s.marks) {
            Object.keys(s.marks).forEach(sub => subjects.add(sub));
        }
    });
    return Array.from(subjects).sort();
};

const calculateClientSideStats = (marks) => {
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

// Helper to download CSV
const downloadCSV = (students, allSubjects) => {
    if (!students || students.length === 0) {
        alert("No data to download!");
        return;
    }

    // Define headers
    const headers = ["Roll Number", "Name", "Course", ...allSubjects, "Total", "Percentage", "Grade"];

    // Create CSV rows
    const rows = students.map(s => {
        const marks = s.marks || {};
        const total = Object.values(marks).reduce((a, b) => a + b, 0);
        return [
            s.rollNumber,
            `"${s.name}"`,
            `"${s.course}"`,
            ...allSubjects.map(sub => marks[sub] || 0),
            total,
            s.percentage ? s.percentage + '%' : '0%',
            s.grade
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function StudentList({ students, fetchStudents, onEdit }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending', isSubject: false });
    const [searchTerm, setSearchTerm] = useState('');

    const deleteStudent = async (roll) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await axios.delete(`${API_URL}/${roll}`);
                fetchStudents();
            } catch (err) {
                alert("Failed to delete student");
                console.error(err);
            }
        }
    };

    const requestSort = (key, isSubject = false) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction, isSubject });
    };

    const processedStudents = useMemo(() => {
        let items = students.map(s => {
            // Calculate if missing
            if (!s.percentage || !s.grade) {
                const { percentage, grade } = calculateClientSideStats(s.marks);
                return { ...s, percentage: s.percentage || percentage, grade: s.grade || grade };
            }
            return s;
        });

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(s =>
                (s.name || '').toLowerCase().includes(lowerTerm) ||
                (s.course || '').toLowerCase().includes(lowerTerm) ||
                (s.rollNumber || '').toString().includes(lowerTerm) ||
                (s.grade && s.grade.toLowerCase().includes(lowerTerm))
            );
        }

        // 2. Sort
        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.isSubject) {
                    aValue = a.marks ? (a.marks[sortConfig.key] || 0) : 0;
                    bValue = b.marks ? (b.marks[sortConfig.key] || 0) : 0;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];

                    if (sortConfig.key === 'percentage') {
                        aValue = parseFloat(a.percentage) || 0;
                        bValue = parseFloat(b.percentage) || 0;
                    }
                }

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [students, sortConfig, searchTerm]);

    const allSubjects = useMemo(() => getAllSubjects(students), [students]);

    const getSortIcon = (columnKey) => {
        const isActive = sortConfig.key === columnKey;
        return (
            <ArrowsUpDownIcon
                className={`h-4 w-4 ml-1 inline transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-300'}`}
            />
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-8">
            {/* Header / Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-700">All Records</h3>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, roll, course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <button
                        onClick={() => downloadCSV(processedStudents, allSubjects)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            {processedStudents.length === 0 ? (
                <div className="text-center p-12">
                    <p className="text-gray-500 text-lg">
                        {students.length === 0 ? "No students found. Add one to get started!" : "No matches found."}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort('rollNumber')}>
                                    Roll {getSortIcon('rollNumber')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort('name')}>
                                    Name {getSortIcon('name')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort('course')}>
                                    Branch {getSortIcon('course')}
                                </th>
                                {/* Dynamic Subject Columns */}
                                {allSubjects.map(sub => (
                                    <th key={sub} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort(sub, true)}>
                                        {sub} {getSortIcon(sub)}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort('percentage')}>
                                    % {getSortIcon('percentage')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => requestSort('grade')}>
                                    Grd {getSortIcon('grade')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedStudents.map((student) => (
                                <tr key={student.rollNumber} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {student.rollNumber}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {student.name}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                                            {student.course}
                                        </span>
                                    </td>
                                    {/* Subject Marks */}
                                    {allSubjects.map(sub => (
                                        <td key={sub} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.marks ? student.marks[sub] || '-' : '-'}
                                        </td>
                                    ))}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {student.percentage || 0}%
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full 
                     ${['A', 'A+'].includes(student.grade) ? 'bg-green-100 text-green-800' :
                                                student.grade === 'B' ? 'bg-teal-100 text-teal-800' :
                                                    student.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {student.grade || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => onEdit(student)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteStudent(student.rollNumber)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                            title="Delete"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
