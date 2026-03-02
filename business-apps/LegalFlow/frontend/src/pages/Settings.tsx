import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MfaFactor {
    id: string;
    status: 'verified' | 'unverified';
    friendly_name: string;
}

interface MfaEnrollData {
    id: string;
    totp: {
        qr_code: string;
        secret: string;
    }
}

export default function Settings() {
    const queryClient = useQueryClient();
    const [enrolling, setEnrolling] = useState(false);
    const [enrollData, setEnrollData] = useState<MfaEnrollData | null>(null);
    const [verificationCode, setVerificationCode] = useState('');

    const { data: factors, isLoading: isLoadingFactors } = useQuery({
        queryKey: ['mfaFactors'],
        queryFn: async () => {
            // This endpoint needs to be created on the backend
            // It should return the user's MFA factors
            const response = await api.get<{ data: { factors: MfaFactor[] } }>('/mfa/factors');
            return response.data?.data.factors;
        }
    });

    const enrollMutation = useMutation({
        mutationFn: () => api.post<MfaEnrollData>('/mfa/enroll'),
        onSuccess: (data) => {
            setEnrollData(data.data!);
            setEnrolling(true);
        }
    });

    const enableMutation = useMutation({
        mutationFn: (data: { factorId: string; code: string }) => api.post('/mfa/enable', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mfaFactors'] });
            setEnrolling(false);
            setEnrollData(null);
            setVerificationCode('');
        }
    });

    const disableMutation = useMutation({
        mutationFn: (factorId: string) => api.post('/mfa/unenroll', { factorId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mfaFactors'] });
        }
    });

    const handleEnable = () => {
        if (enrollData) {
            enableMutation.mutate({ factorId: enrollData.id, code: verificationCode });
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <div className="mt-4 p-4 border rounded">
                <h2 className="text-xl font-bold">Multi-Factor Authentication (MFA)</h2>
                {isLoadingFactors ? (
                    <p>Loading MFA status...</p>
                ) : factors && factors.length > 0 ? (
                    <div>
                        <p className="text-green-600">MFA is enabled on your account.</p>
                        <ul>
                            {factors.map(factor => (
                                <li key={factor.id} className="flex justify-between items-center mt-2">
                                    <span>{factor.friendly_name || 'Authenticator App'}</span>
                                    <button
                                        onClick={() => disableMutation.mutate(factor.id)}
                                        className="px-4 py-2 rounded bg-red-500 text-white"
                                        disabled={disableMutation.isPending}
                                    >
                                        {disableMutation.isPending ? 'Disabling...' : 'Disable'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div>
                        <p>MFA is not enabled on your account.</p>
                        {!enrolling ? (
                            <button
                                onClick={() => enrollMutation.mutate()}
                                className="mt-2 px-4 py-2 rounded bg-blue-500 text-white"
                                disabled={enrollMutation.isPending}
                            >
                                {enrollMutation.isPending ? 'Starting...' : 'Enable MFA'}
                            </button>
                        ) : (
                            <div className="mt-4">
                                <p>Scan the QR code with your authenticator app:</p>
                                <div dangerouslySetInnerHTML={{ __html: enrollData?.totp.qr_code || '' }} />
                                <div className="mt-4">
                                    <label htmlFor="code" className="block font-bold mb-1">Verification Code</label>
                                    <input
                                        type="text"
                                        id="code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    />
                                    <button
                                        onClick={handleEnable}
                                        className="mt-2 px-4 py-2 rounded bg-green-500 text-white"
                                        disabled={enableMutation.isPending}
                                    >
                                        {enableMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
