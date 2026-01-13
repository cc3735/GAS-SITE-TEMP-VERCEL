/**
 * Bank Statement Upload Component
 *
 * Drag-and-drop file upload for bank statements
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BankStatementUpload() {
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/bookkeeping/statements/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.data);
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('An error occurred during upload');
            console.error(err);
        } finally {
            setUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <Link to="/bookkeeping" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upload Bank Statement</h1>
                        <p className="text-gray-600">Import transactions from PDF or CSV files</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {!success ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${isDragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <input {...getInputProps()} />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                    <p className="text-lg font-medium text-gray-900">Processing file...</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Analyzing transactions and auto-categorizing
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                        <Upload className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {isDragActive ? 'Drop file here' : 'Click or drag file to upload'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Supports PDF and CSV bank statements
                                    </p>
                                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors pointer-events-none">
                                        Select File
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful</h3>
                            <p className="text-gray-600 mb-6">
                                Successfully imported {success.transactionCount} transactions from{' '}
                                <span className="font-semibold">{success.filename}</span>
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto mb-8">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Date Range</span>
                                    <span className="font-medium">
                                        {success.dateRange.start} - {success.dateRange.end}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Upload Another
                                </button>
                                <Link
                                    to="/bookkeeping/transactions"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    View Transactions
                                </Link>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Instructions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">CSV Format</p>
                                    <p className="text-sm text-gray-500">
                                        Standard export from your bank. Must contain Date, Description, and Amount columns.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">PDF Statements</p>
                                    <p className="text-sm text-gray-500">
                                        Official monthly statements. Best for verifying balances and tax records.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
