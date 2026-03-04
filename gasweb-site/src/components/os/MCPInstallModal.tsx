import { useState } from 'react';
import { X, Loader2, ExternalLink, Shield, CheckCircle } from 'lucide-react';
import type { MCPCatalogEntry } from '../../data/mcpCatalog';
import { CATEGORY_LABELS } from '../../data/mcpCatalog';

interface MCPInstallModalProps {
  entry: MCPCatalogEntry;
  isInstalled: boolean;
  onInstall: (entry: MCPCatalogEntry, config: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

export default function MCPInstallModal({ entry, isInstalled, onInstall, onClose }: MCPInstallModalProps) {
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    entry.config_fields.forEach(f => { initial[f.key] = ''; });
    return initial;
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryInfo = CATEGORY_LABELS[entry.category];

  const allRequiredFilled = entry.config_fields
    .filter(f => f.required)
    .every(f => config[f.key]?.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInstalled) return;

    setInstalling(true);
    setError(null);

    try {
      await onInstall(entry, config);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-white">{entry.name}</h2>
              {entry.is_official && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">Official</span>
              )}
            </div>
            <p className="text-sm text-gray-400">{entry.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-xs px-2 py-1 rounded-full text-white ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
              <a
                href={entry.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" /> GitHub
              </a>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 ml-4">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Already installed */}
        {isInstalled && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-green-900/30 border border-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">This server is already installed.</span>
          </div>
        )}

        {/* Config form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {entry.config_fields.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Credentials are encrypted and stored securely in your organization's database.</span>
              </div>

              {entry.config_fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={config[field.key]}
                      onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      disabled={isInstalled}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                        value={config[field.key]}
                        onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        disabled={isInstalled}
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                        >
                          {showSecrets[field.key] ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-400">
              This server requires no additional configuration. Click Install to add it to your workspace.
            </p>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            {!isInstalled && (
              <button
                type="submit"
                disabled={installing || !allRequiredFilled}
                className={`px-5 py-2 text-sm rounded-lg transition flex items-center gap-2 ${
                  installing || !allRequiredFilled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {installing ? 'Installing...' : 'Install Server'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
