import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Plus, Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
    onSuccess: () => void;
    className?: string;
}

export default function PlaidLinkButton({ onSuccess, className }: PlaidLinkButtonProps) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate link token on component mount
    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await fetch('/api/plaid/link/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        redirectUri: 'http://localhost:5173/bookkeeping/accounts',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setToken(data.data.linkToken);
                } else {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to initialize Plaid');
                }
            } catch (error) {
                console.error('Error creating link token:', error);
                setError('Failed to load bank connection. Check API keys.');
            }
        };

        createLinkToken();
    }, []);

    const onExchange = useCallback(
        async (publicToken: string, metadata: any) => {
            setLoading(true);
            try {
                const response = await fetch('/api/plaid/link/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        publicToken,
                        institutionId: metadata.institution.institution_id,
                        institutionName: metadata.institution.name,
                    }),
                });

                if (response.ok) {
                    onSuccess();
                } else {
                    console.error('Failed to exchange public token');
                    alert('Failed to connect account. Please try again.');
                }
            } catch (error) {
                console.error('Error exchanging token:', error);
                alert('An error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        [onSuccess]
    );

    const config: Parameters<typeof usePlaidLink>[0] = {
        token,
        onSuccess: onExchange,
    };

    const { open, ready } = usePlaidLink(config);

    if (error) {
        return (
            <button
                disabled
                className={`flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg cursor-not-allowed border border-red-200 ${className}`}
                title={error}
            >
                <Loader2 className="w-4 h-4 text-red-600" />
                Connection Error
            </button>
        );
    }

    if (!token) {
        return (
            <button
                disabled
                className={`flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed ${className}`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
            </button>
        );
    }

    return (
        <button
            onClick={() => open()}
            disabled={!ready || loading}
            className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Plus className="w-4 h-4" />
            )}
            Connect Bank
        </button>
    );
}
