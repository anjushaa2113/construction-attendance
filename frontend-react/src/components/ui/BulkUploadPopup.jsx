import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const BulkUploadPopup = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
            setFile(selectedFile);
            setStatus('idle');
        } else {
            alert('Please upload a valid CSV or Excel file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        setProgress(0);

        // Simulate upload progress for premium UX
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 5;
            });
        }, 100);

        try {
            // In a real scenario, we'd call the service here
            // const formData = new FormData();
            // formData.append('file', file);
            // await bulkUploadStaff(formData);

            // Simulating success
            setTimeout(() => {
                clearInterval(interval);
                setProgress(100);
                setStatus('success');
                if (onUploadSuccess) onUploadSuccess();
            }, 2000);
        } catch (error) {
            clearInterval(interval);
            setStatus('error');
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Upload Staff" maxWidth="max-w-xl">
            <div className="space-y-6">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                        }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".csv, .xlsx, .xls"
                    />

                    {status === 'idle' && !file && (
                        <>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">Click to upload or drag and drop</p>
                            <p className="text-gray-500 text-sm mt-1">CSV or Excel files (MAX. 10MB)</p>
                        </>
                    )}

                    {file && status !== 'success' && (
                        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 w-full animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); reset(); }}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center py-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">Upload Successful!</h4>
                            <p className="text-gray-500 mt-1">Your staff records have been imported.</p>
                        </div>
                    )}
                </div>

                {status === 'uploading' && (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-medium flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                Uploading records...
                            </span>
                            <span className="text-blue-600 font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <a
                        href="#"
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-2"
                        onClick={(e) => e.preventDefault()}
                    >
                        Download template
                    </a>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleClose}>
                            {status === 'success' ? 'Close' : 'Cancel'}
                        </Button>
                        {status !== 'success' && (
                            <Button
                                onClick={handleUpload}
                                disabled={!file || status === 'uploading'}
                                className="bg-gray-800 hover:bg-gray-900 text-white min-w-[100px]"
                            >
                                {status === 'uploading' ? 'Uploading...' : 'Upload'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BulkUploadPopup;
