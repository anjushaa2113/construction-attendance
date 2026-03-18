import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MoreVertical, Plus, Upload, RotateCcw, Users, RefreshCw } from 'lucide-react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import BulkUploadPopup from '../../components/ui/BulkUploadPopup';
import useAuth from '../../hooks/useAuth';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

function RowActionMenu({ employee, onEdit, onDelete, onToggleStatus }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen((v) => !v)}
                className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44">
                        <button onClick={() => { onEdit(employee); setOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            Edit Employee
                        </button>
                        <button onClick={() => { onToggleStatus(employee); setOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            {employee.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => { onDelete(employee); setOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function RollBackModal({ token, onClose, onRestored }) {
    const [deletedList, setDeletedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchDeleted = async () => {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`${ADMIN_API}/api/admin/employees?isActive=false`, { headers });
                if (!res.ok) throw new Error(`Failed to load (${res.status})`);
                const data = await res.json();
                setDeletedList(Array.isArray(data) ? data : data.employees || data.data || []);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        };
        fetchDeleted();
    }, []);

    const handleRestore = async (emp) => {
        setRestoring(emp.employeeId); setError(null);
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/employees/${emp.employeeId}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ ...emp, isActive: true }),
            });
            if (!res.ok) throw new Error(`Failed to restore (${res.status})`);
            setDeletedList((prev) => prev.filter((e) => e.employeeId !== emp.employeeId));
            setSuccessMsg(`${emp.name} restored successfully.`);
            setTimeout(() => setSuccessMsg(''), 3000);
            onRestored();
        } catch (err) { setError(err.message); }
        finally { setRestoring(null); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Roll Back — Restore Employees</h2>
                            <p className="text-xs text-slate-400">Reactivate previously deactivated employees</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {successMsg && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl">✓ {successMsg}</div>
                    )}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
                    )}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading deleted employees...</span>
                        </div>
                    ) : deletedList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                            <Users className="h-10 w-10" strokeWidth={1} />
                            <span className="text-sm font-medium">No deleted employees found</span>
                            <span className="text-xs text-slate-300">All employees are currently active</span>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left">Employee</th>
                                    <th className="px-4 py-3 text-left">Emp Code</th>
                                    <th className="px-4 py-3 text-left">Designation</th>
                                    <th className="px-4 py-3 text-center">Restore</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {deletedList.map((emp) => (
                                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">
                                                    {emp.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{emp.name || '—'}</div>
                                                    <div className="text-xs text-slate-400">{emp.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{emp.employeeCode || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{emp.designation || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRestore(emp)}
                                                disabled={restoring === emp.employeeId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                            >
                                                {restoring === emp.employeeId
                                                    ? <div className="w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                    : <RefreshCw className="h-3 w-3" />}
                                                Restore
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        {!loading && `${deletedList.length} inactive employee${deletedList.length !== 1 ? 's' : ''} found`}
                    </span>
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">Close</button>
                </div>
            </div>
        </div>
    );
}

const StaffDirectoryPage = () => {
    const { token } = useAuth();
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [isRollBackOpen, setIsRollBackOpen] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [editEmployee, setEditEmployee] = useState(null);
    const [deleteEmployee, setDeleteEmployee] = useState(null);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchEmployees = useCallback(async (searchTerm = '') => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const res = await fetch(`${ADMIN_API}/api/admin/employees?${params.toString()}`, { headers });
            if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
            const data = await res.json();
            setStaffList(Array.isArray(data) ? data : data.employees || data.data || []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const t = setTimeout(() => { fetchEmployees(search); setSelectedRows([]); }, 300);
        return () => clearTimeout(t);
    }, [search, fetchEmployees, token]);

    const toggleSelectAll = () =>
        setSelectedRows(selectedRows.length === staffList.length ? [] : staffList.map((s) => s.employeeId));

    const toggleSelectRow = (id) =>
        setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

    const handleToggleStatus = async (emp) => {
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/employees/${emp.employeeId}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ ...emp, isActive: !emp.isActive }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchEmployees(search);
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async () => {
        if (!deleteEmployee) return;
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/employees/${deleteEmployee.employeeId}`, {
                method: 'DELETE', headers,
            });
            if (!res.ok) throw new Error('Failed to delete employee');
            setDeleteEmployee(null);
            fetchEmployees(search);
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="space-y-6 animate-slide-up">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <Breadcrumb />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500">
                        {loading ? '...' : `${staffList.length} Employees`}
                    </span>
                </div>
            </div>

            <Card className="p-0 overflow-hidden" hover={false}>

                {/* ── Toolbar ── */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-3 flex-wrap">
                        <Link to="/admin/staff/add">
                            <Button variant="accent" size="sm">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Staff
                            </Button>
                        </Link>
                        <Button variant="primary" size="sm" onClick={() => setIsBulkUploadOpen(true)}>
                            <Upload className="h-4 w-4 mr-1.5" />
                            Bulk Upload
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsRollBackOpen(true)}>
                            <RotateCcw className="h-4 w-4 mr-1.5" />
                            Roll Back
                        </Button>
                    </div>

                    <div className="w-full sm:w-72 relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading employees...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <span className="text-sm text-red-500 font-medium">{error}</span>
                            <button onClick={() => fetchEmployees(search)} className="text-sm text-blue-600 hover:underline">Retry</button>
                        </div>
                    ) : staffList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <Users className="h-7 w-7" strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-medium">No employees found</span>
                            {search && <span className="text-xs text-slate-300">Try a different search term</span>}
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-3.5 text-left w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                            checked={selectedRows.length === staffList.length && staffList.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Emp ID</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {staffList.map((staff) => (
                                    <tr key={staff.employeeId} className="hover:bg-slate-50/60 transition-colors group bg-white">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                                checked={selectedRows.includes(staff.employeeId)}
                                                onChange={() => toggleSelectRow(staff.employeeId)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                                                    {staff.name ? staff.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{staff.name || '—'}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{staff.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-500">
                                            {staff.employeeCode || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {staff.phone || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {staff.designation ? (
                                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                                                    {staff.designation}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                staff.isActive
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-red-50 text-red-500'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                                {staff.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <RowActionMenu
                                                employee={staff}
                                                onEdit={setEditEmployee}
                                                onDelete={setDeleteEmployee}
                                                onToggleStatus={handleToggleStatus}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Footer ── */}
                {!loading && !error && staffList.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {selectedRows.length > 0
                                ? `${selectedRows.length} of ${staffList.length} selected`
                                : `${staffList.length} employee${staffList.length !== 1 ? 's' : ''} total`}
                        </span>
                        {selectedRows.length > 0 && (
                            <button onClick={() => setSelectedRows([])} className="text-xs text-blue-600 hover:underline font-medium">
                                Clear selection
                            </button>
                        )}
                    </div>
                )}
            </Card>

            {/* ── Modals ── */}
            <BulkUploadPopup
                isOpen={isBulkUploadOpen}
                onClose={() => setIsBulkUploadOpen(false)}
                onUploadSuccess={() => { setIsBulkUploadOpen(false); fetchEmployees(search); }}
            />

            {isRollBackOpen && (
                <RollBackModal
                    token={token}
                    onClose={() => setIsRollBackOpen(false)}
                    onRestored={() => fetchEmployees(search)}
                />
            )}

            {deleteEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-5 w-5 text-red-500" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Employee</h2>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Are you sure you want to delete <strong className="text-slate-700">{deleteEmployee.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteEmployee(null)}
                                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium">
                                Cancel
                            </button>
                            <button onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editEmployee && (
                <EditEmployeeModal
                    token={token}
                    employee={editEmployee}
                    onClose={() => setEditEmployee(null)}
                    onSaved={() => { setEditEmployee(null); fetchEmployees(search); }}
                />
            )}
        </div>
    );
};

export default StaffDirectoryPage;

function EditEmployeeModal({ token, employee, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'Employee',
        designation: employee.designation || '',
        employeeCode: employee.employeeCode || '',
        phone: employee.phone || '',
        aadharNumber: employee.aadharNumber || '',
        accountNumber: employee.accountNumber || '',
        bankName: employee.bankName || '',
        ifscCode: employee.ifscCode || '',
        bloodGroup: employee.bloodGroup || '',
        emergencyContact: employee.emergencyContact || '',
        currentAddress: employee.currentAddress || '',
        permanentAddress: employee.permanentAddress || '',
        category: employee.category || '',
        seniorName: employee.seniorName || '',
        isActive: employee.isActive ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSave = async () => {
        setSaving(true); setError(null);
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/employees/${employee.employeeId}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ ...form, employeeId: employee.employeeId }),
            });
            if (!res.ok) { const msg = await res.text(); throw new Error(msg || `Failed (${res.status})`); }
            onSaved();
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    const Field = ({ label, fieldKey, type = 'text', span2 = false }) => (
        <div className={span2 ? 'col-span-2' : ''}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type} value={form[fieldKey]} onChange={set(fieldKey)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                            {employee.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Edit Employee</h2>
                            <p className="text-xs text-slate-400">{employee.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Info</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Full Name" fieldKey="name" span2 />
                            <Field label="Email" fieldKey="email" type="email" />
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                                <select value={form.role} onChange={set('role')}
                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                    <option>Employee</option>
                                    <option>Admin</option>
                                    <option>Manager</option>
                                    <option>HR</option>
                                </select>
                            </div>
                            <Field label="Employee Code" fieldKey="employeeCode" />
                            <Field label="Designation" fieldKey="designation" />
                            <Field label="Phone" fieldKey="phone" />
                            <Field label="Emergency Contact" fieldKey="emergencyContact" />
                            <Field label="Blood Group" fieldKey="bloodGroup" />
                            <Field label="Category" fieldKey="category" />
                            <Field label="Senior Name" fieldKey="seniorName" />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bank Details</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Bank Name" fieldKey="bankName" />
                            <Field label="Account Number" fieldKey="accountNumber" />
                            <Field label="IFSC Code" fieldKey="ifscCode" />
                            <Field label="Aadhar Number" fieldKey="aadharNumber" />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Address</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Current Address" fieldKey="currentAddress" span2 />
                            <Field label="Permanent Address" fieldKey="permanentAddress" span2 />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-1">Active Status</span>
                        <button type="button"
                            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                            className={`relative inline-flex h-5 w-10 rounded-full transition-colors ${form.isActive ? 'bg-blue-500' : 'bg-slate-200'}`}>
                            <span className={`inline-block w-4 h-4 mt-0.5 rounded-full bg-white shadow transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`text-sm font-medium ${form.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
                    <button onClick={handleSave} disabled={saving || !form.name || !form.email}
                        className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                        {saving && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}