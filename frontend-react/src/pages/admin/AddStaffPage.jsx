import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import useAuth from '../../hooks/useAuth';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

// ── Validation rules ──────────────────────────────────────────────
const IFSC_REGEX  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const NAME_REGEX  = /^[a-zA-Z\s]*$/;
const EMPID_REGEX = /^[A-Z0-9]*$/;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const today  = new Date();
const minDOB = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
const maxDOB = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────
const AddStaffPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        name:               '',
        email:              '',
        password:           '',
        role:               'Employee',
        empId:              '',
        dob:                '',
        designation:        '',
        aadharNo:           '',
        contactNo:          '',
        emergencyContactNo: '',
        bankName:           '',
        acNo:               '',
        ifscCode:           '',
        category:           '',
        seniorName:         '',
        bloodGroup:         '',
        currentAddress:     '',
        permanentAddress:   '',
        sameAsCurrent:      false,
    });

    const [fieldErrors,  setFieldErrors]  = useState({});
    const [submitting,   setSubmitting]   = useState(false);
    const [error,        setError]        = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ── Per-field error helpers ────────────────────────────────────
    const setFieldError   = (name, msg) => setFieldErrors(prev => ({ ...prev, [name]: msg }));
    const clearFieldError = (name)      => setFieldErrors(prev => ({ ...prev, [name]: '' }));

    // ── Master change handler ──────────────────────────────────────
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // 1. Digit-only fields — NO maxLength on Input, handler controls length
        const digitOnlyFields = {
            contactNo:          10,
            emergencyContactNo: 10,
            aadharNo:           12,
        };
        if (digitOnlyFields[name] !== undefined) {
            const maxLen = digitOnlyFields[name];
            const digits = value.replace(/\D/g, '').slice(0, maxLen);
            setFormData(prev => ({ ...prev, [name]: digits }));
            if (digits.length > 0 && digits.length < maxLen)
                setFieldError(name, `Must be exactly ${maxLen} digits (${digits.length}/${maxLen})`);
            else
                clearFieldError(name);
            return;
        }

        // 2. Bank A/C — digits only, 9–18 chars
        if (name === 'acNo') {
            const digits = value.replace(/\D/g, '').slice(0, 18);
            setFormData(prev => ({ ...prev, [name]: digits }));
            if (digits.length > 0 && digits.length < 9)
                setFieldError(name, `Account number must be at least 9 digits (${digits.length}/18)`);
            else
                clearFieldError(name);
            return;
        }

        // 3. IFSC Code — uppercase, alphanumeric, max 11
        if (name === 'ifscCode') {
            const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
            setFormData(prev => ({ ...prev, [name]: cleaned }));
            if (cleaned.length > 0 && !IFSC_REGEX.test(cleaned))
                setFieldError(name, 'Format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)');
            else
                clearFieldError(name);
            return;
        }

        // 4. Name fields — letters & spaces only
        const nameFields = ['name', 'seniorName', 'bankName', 'designation'];
        if (nameFields.includes(name)) {
            if (!NAME_REGEX.test(value)) {
                setFieldError(name, 'Only letters and spaces are allowed');
                return;
            }
            clearFieldError(name);
            setFormData(prev => ({ ...prev, [name]: value }));
            return;
        }

        // 5. Emp ID — uppercase alphanumeric only
        if (name === 'empId') {
            const upper = value.toUpperCase();
            if (!EMPID_REGEX.test(upper)) {
                setFieldError(name, 'Only letters and numbers are allowed');
                return;
            }
            clearFieldError(name);
            setFormData(prev => ({ ...prev, [name]: upper }));
            return;
        }

        // 6. DOB — age 18–65
        if (name === 'dob') {
            if (value < minDOB || value > maxDOB)
                setFieldError(name, 'Employee must be between 18 and 65 years old');
            else
                clearFieldError(name);
        }

        // Default / checkbox / address mirror
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'sameAsCurrent') {
                newData.permanentAddress = checked ? newData.currentAddress : '';
            }
            if (name === 'currentAddress' && prev.sameAsCurrent) {
                newData.permanentAddress = value;
            }
            return newData;
        });
    };

    // ── Generate ID ────────────────────────────────────────────────
    const handleGenerateID = () => {
        const randomId = 'EMP' + Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({ ...prev, empId: randomId }));
        clearFieldError('empId');
    };

    // ── Submit validation ──────────────────────────────────────────
    const validate = () => {
        const errors = {};
        if (formData.contactNo && formData.contactNo.length !== 10)
            errors.contactNo = 'Contact No must be exactly 10 digits';
        if (formData.emergencyContactNo && formData.emergencyContactNo.length !== 10)
            errors.emergencyContactNo = 'Emergency Contact No must be exactly 10 digits';
        if (formData.aadharNo && formData.aadharNo.length !== 12)
            errors.aadharNo = 'Aadhar No must be exactly 12 digits';
        if (formData.acNo && formData.acNo.length < 9)
            errors.acNo = 'Account number must be at least 9 digits';
        if (formData.ifscCode && !IFSC_REGEX.test(formData.ifscCode))
            errors.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234)';
        if (formData.dob && (formData.dob < minDOB || formData.dob > maxDOB))
            errors.dob = 'Employee must be between 18 and 65 years old';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Please fix the errors above before submitting.');
            return;
        }

        setSubmitting(true);
        setError('');

        const payload = {
            name:             formData.name,
            email:            formData.email,
            password:         formData.password,
            role:             formData.role,
            employeeCode:     formData.empId,
            dateOfBirth:      formData.dob || null,
            designation:      formData.designation,
            aadharNumber:     formData.aadharNo,
            phone:            formData.contactNo,
            emergencyContact: formData.emergencyContactNo,
            bankName:         formData.bankName,
            accountNumber:    formData.acNo,
            ifscCode:         formData.ifscCode,
            category:         formData.category,
            seniorName:       formData.seniorName,
            bloodGroup:       formData.bloodGroup,
            currentAddress:   formData.currentAddress,
            permanentAddress: formData.permanentAddress,
        };

        try {
            const res = await fetch(`${ADMIN_API}/api/admin/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                const msg = errData?.message ?? errData?.title ?? `Error ${res.status}`;
                throw new Error(msg);
            }

            navigate('/admin/staff');
        } catch (err) {
            console.error('Add staff error:', err);
            setError(err.message || 'Failed to add staff. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => navigate('/admin/staff');

    // ── Reusable field error display ───────────────────────────────
    const FieldError = ({ name }) =>
        fieldErrors[name] ? (
            <p className="text-red-500 text-xs mt-1">{fieldErrors[name]}</p>
        ) : null;

    // ── Eye icon components ────────────────────────────────────────
    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const EyeOffIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
    );

    // ─────────────────────────────────────────────────────────────
    return (
        <div>
            <Breadcrumb />

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-8 border-b pb-2 inline-block">ADD STAFF</h2>

                {error && (
                    <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">

                        {/* ══ LEFT COLUMN ══════════════════════════════════════════ */}
                        <div className="space-y-6">

                            {/* Emp ID */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Emp ID :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="empId"
                                        value={formData.empId}
                                        onChange={handleChange}
                                        placeholder="Type manually or click Generate ID"
                                    />
                                    <FieldError name="empId" />
                                </div>
                            </div>

                            {/* Emp Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Emp Name :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Letters and spaces only"
                                    />
                                    <FieldError name="name" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Email :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <FieldError name="email" />
                                </div>
                            </div>

                            {/* Password with eye toggle */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Password :</label>
                                <div className="sm:col-span-2 relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Initial password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {/* DOB */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">DOB :</label>
                                <div className="sm:col-span-2 relative">
                                    <Input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        min={minDOB}
                                        max={maxDOB}
                                    />
                                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <FieldError name="dob" />
                                </div>
                            </div>

                            {/* Designation */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Designation</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleChange}
                                        placeholder="Letters and spaces only"
                                    />
                                    <FieldError name="designation" />
                                </div>
                            </div>

                            {/* Aadhar No — NO maxLength, handler slices to 12 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Aadhar No :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="aadharNo"
                                        value={formData.aadharNo}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        placeholder="12-digit number"
                                    />
                                    <FieldError name="aadharNo" />
                                </div>
                            </div>

                            {/* Contact No — NO maxLength, handler slices to 10 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Contact No :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="contactNo"
                                        value={formData.contactNo}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        placeholder="10-digit number"
                                    />
                                    <FieldError name="contactNo" />
                                </div>
                            </div>

                            {/* Emergency Contact No — NO maxLength, handler slices to 10 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Emergency Contact No. :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="emergencyContactNo"
                                        value={formData.emergencyContactNo}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        placeholder="10-digit number"
                                    />
                                    <FieldError name="emergencyContactNo" />
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Bank Name:</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        placeholder="Letters and spaces only"
                                    />
                                    <FieldError name="bankName" />
                                </div>
                            </div>

                            {/* A/C No — NO maxLength, handler slices to 18 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">A/C No :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="acNo"
                                        value={formData.acNo}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        placeholder="9–18 digit account number"
                                    />
                                    <FieldError name="acNo" />
                                </div>
                            </div>

                            {/* IFSC Code — NO maxLength, handler slices to 11 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">IFSC Code :</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="ifscCode"
                                        value={formData.ifscCode}
                                        onChange={handleChange}
                                        placeholder="e.g. SBIN0001234"
                                    />
                                    <FieldError name="ifscCode" />
                                </div>
                            </div>

                            {/* Current Address */}
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-semibold text-gray-700">Current Address :</label>
                                    <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="sameAsCurrent"
                                            checked={formData.sameAsCurrent}
                                            onChange={handleChange}
                                            className="rounded border-gray-300 text-gray-700 focus:ring-gray-500 h-4 w-4"
                                        />
                                        <span>Same for Permanent</span>
                                    </label>
                                </div>
                                <textarea
                                    name="currentAddress"
                                    value={formData.currentAddress}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* ══ RIGHT COLUMN ═════════════════════════════════════════ */}
                        <div className="space-y-6 flex flex-col">

                            {/* Role */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1">Role :</label>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="sm:col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Admin">Admin</option>
                                </Select>
                            </div>

                            {/* Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1">Category:</label>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="sm:col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    <option value="IT Staff">IT Staff</option>
                                    <option value="Non-IT Staff">Non-IT Staff</option>
                                </Select>
                            </div>

                            {/* Senior Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1 pt-2">Senior Name:</label>
                                <div className="sm:col-span-2">
                                    <Input
                                        name="seniorName"
                                        value={formData.seniorName}
                                        onChange={handleChange}
                                        placeholder="Letters and spaces only"
                                    />
                                    <FieldError name="seniorName" />
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                <label className="font-semibold text-gray-700 sm:col-span-1">Blood Group:</label>
                                <Select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className="sm:col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Blood Group</option>
                                    {bloodGroups.map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </Select>
                            </div>

                            {/* Permanent Address */}
                            <div className="mt-4 lg:mt-0">
                                <label className="font-semibold text-gray-700 mb-2 block">Permanent Address :</label>
                                <textarea
                                    name="permanentAddress"
                                    value={formData.permanentAddress}
                                    onChange={handleChange}
                                    readOnly={formData.sameAsCurrent}
                                    rows={4}
                                    className={`w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        formData.sameAsCurrent ? 'bg-gray-50' : ''
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-between items-center mt-12 gap-4">
                        <Button
                            type="button"
                            onClick={handleGenerateID}
                            className="bg-gray-700 hover:bg-gray-800 text-white w-full sm:w-auto"
                        >
                            Generate ID
                        </Button>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-gray-700 hover:bg-gray-800 text-white px-8 flex-1 sm:flex-none disabled:opacity-60"
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCancel}
                                disabled={submitting}
                                className="bg-gray-700 hover:bg-gray-800 text-white px-8 flex-1 sm:flex-none"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaffPage;