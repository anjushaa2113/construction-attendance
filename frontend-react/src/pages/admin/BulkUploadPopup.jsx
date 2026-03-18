import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Download, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── CSV/Excel parser ──
async function parseFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/).filter(Boolean);
                    if (lines.length < 2) return resolve([]);

                    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
                    const rows = lines.slice(1).map((line) => {
                        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
                        return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {});
                    });
                    resolve(rows);
                } catch (err) {
                    reject(new Error('Failed to parse CSV file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        } else {
            // Excel — use SheetJS via CDN
            reader.onload = async (e) => {
                try {
                    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
                    const wb = XLSX.read(e.target.result, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
                    const rows = json.map((row) =>
                        Object.fromEntries(
                            Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), String(v)])
                        )
                    );
                    resolve(rows);
                } catch {
                    reject(new Error('Failed to parse Excel file. Please use .csv or .xlsx format.'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        }
    });
}

// Map flexible column names to API field names
function mapRow(row) {
    const get = (...keys) => {
        for (const k of keys) {
            if (row[k] !== undefined && row[k] !== '') return row[k];
        }
        return '';
    };

    return {
        name: get('name', 'full name', 'employee name', 'fullname'),
        email: get('email', 'email address', 'mail'),
        password: get('password', 'pass') || 'Welcome@123',
        role: get('role') || 'Employee',
        employeeCode: get('employeecode', 'employee code', 'emp id', 'empid', 'code'),
        designation: get('designation', 'title', 'job title'),
        phone: get('phone', 'mobile', 'contact', 'phone number'),
        bloodGroup: get('bloodgroup', 'blood group', 'blood'),
        category: get('category'),
        seniorName: get('seniorname', 'senior name', 'senior'),
        emergencyContact: get('emergencycontact', 'emergency contact'),
        bankName: get('bankname', 'bank name', 'bank'),
        accountNumber: get('accountnumber', 'account number', 'account'),
        ifscCode: get('ifsccode', 'ifsc code', 'ifsc'),
        aadharNumber: get('aadharnumber', 'aadhar number', 'aadhar'),
        currentAddress: get('currentaddress', 'current address', 'address'),
        permanentAddress: get('permanentaddress', 'permanent address'),
        isActive: true,
    };
}

// Generate and download a template CSV
function downloadTemplate() {
    const headers = [
        'name', 'email', 'password', 'role', 'employeeCode',
        'designation', 'phone', 'bloodGroup', 'category', 'seniorName',
        'emergencyContact', 'bankName', 'accountNumber', 'ifscCode',
        'aadharNumber', 'currentAddress', 'permanentAddress'
    ];
    const sample = [
        'John Doe', 'john@example.com', 'Welcome@123', 'Employee', 'EMP001',
        'Software Engineer', '9876543210', 'O+', 'General', 'Jane Smith',
        '9876543211', 'HDFC Bank', '123456789012', 'HDFC0001234',
        '123456789012', '123 Main St, City', '456 Home St, City'
    ];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_bulk_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ── Main Component ──
const BulkUploadPopup = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null); // { success, failed, errors }
    const inputRef = useRef();

    const reset = () => {
        setFile(null);
        setParseError(null);
        setResults(null);
        setUploading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFile = (f) => {
        setParseError(null);
        setResults(null);
        if (!f) return;
        const maxSize = 10 * 1024 * 1024;
        if (f.size > maxSize) {
            setParseError('File size exceeds 10MB limit.');
            return;
        }
        const allowed = ['.csv', '.xlsx', '.xls'];
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
            setParseError('Only CSV or Excel files are allowed.');
            return;
        }
        setFile(f);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, []);

    const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setParseError(null);

        let rows;
        try {
            rows = await parseFile(file);
        } catch (err) {
            setParseError(err.message);
            setUploading(false);
            return;
        }

        if (rows.length === 0) {
            setParseError('No data rows found in the file.');
            setUploading(false);
            return;
        }

        let success = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const mapped = mapRow(rows[i]);
            if (!mapped.name || !mapped.email) {
                errors.push({ row: i + 2, name: mapped.name || '(no name)', reason: 'Missing name or email' });
                continue;
            }
            try {
                const res = await fetch(`${ADMIN_API}/api/admin/employees`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(mapped),
                });
                if (!res.ok) {
                    const msg = await res.text();
                    errors.push({ row: i + 2, name: mapped.name, reason: msg || `HTTP ${res.status}` });
                } else {
                    success++;
                }
            } catch (err) {
                errors.push({ row: i + 2, name: mapped.name, reason: err.message });
            }
        }

        setResults({ total: rows.length, success, failed: errors.length, errors });
        setUploading(false);
        if (success > 0) onUploadSuccess?.();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Bulk Upload Staff</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Results view */}
                    {results ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-slate-700">{results.total}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Total Rows</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-emerald-600">{results.success}</div>
                                    <div className="text-xs text-emerald-500 mt-0.5">Uploaded</div>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${results.failed > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                                    <div className={`text-2xl font-bold ${results.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{results.failed}</div>
                                    <div className={`text-xs mt-0.5 ${results.failed > 0 ? 'text-red-400' : 'text-slate-400'}`}>Failed</div>
                                </div>
                            </div>

                            {/* Status message */}
                            {results.failed === 0 ? (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-emerald-700 font-medium">
                                        All {results.success} employee{results.success !== 1 ? 's' : ''} uploaded successfully!
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-amber-700">
                                        {results.success} uploaded, {results.failed} failed. Check errors below.
                                    </span>
                                </div>
                            )}

                            {/* Error list */}
                            {results.errors.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1.5">
                                    {results.errors.map((e, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                            <span className="text-red-400 font-medium flex-shrink-0">Row {e.row}:</span>
                                            <span className="text-red-600 font-medium flex-shrink-0">{e.name}</span>
                                            <span className="text-red-400">— {e.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Drop zone */}
                            <div
                                onClick={() => inputRef.current?.click()}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                                    dragging
                                        ? 'border-blue-400 bg-blue-50'
                                        : file
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />

                                {file ? (
                                    <>
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB — Click to change
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Upload className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">CSV or Excel files (MAX. 10MB)</p>
                                    </>
                                )}
                            </div>

                            {/* Parse error */}
                            {parseError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <span className="text-sm text-red-600">{parseError}</span>
                                </div>
                            )}

                            {/* Upload progress */}
                            {uploading && (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                                    <span className="text-sm text-blue-600">Uploading employees, please wait...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <button
                        onClick={downloadTemplate}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors flex items-center gap-1.5"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download template
                    </button>

                    <div className="flex gap-3">
                        {results ? (
                            <>
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium"
                                >
                                    Upload More
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-medium"
                                >
                                    Done
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleClose}
                                    disabled={uploading}
                                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="px-5 py-2 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:opacity-40 font-medium flex items-center gap-2"
                                >
                                    {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Upload
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadPopup;