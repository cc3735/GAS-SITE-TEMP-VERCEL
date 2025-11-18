import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';

interface ProjectFormData {
  name: string;
  description?: string;
  estimated_completion?: string;
  tools_used?: string[];
  proposed_tech?: string[];
  project_details?: any;
  cost_to_operate?: number;
  gas_fee?: number;
  budget?: number;
  start_date?: string;
  end_date?: string;
  priority?: string;
  assigned_to?: string;
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (projectData: Omit<ProjectFormData, 'name'> & { name: string }) => Promise<void>;
  initialData?: Partial<ProjectFormData>;
  title?: string;
  submitButtonText?: string;
  submitButtonAction?: () => void;
  showCreateButton?: boolean;
}

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title = "Create New Project",
  submitButtonText = "Create Project & Go to Projects",
  submitButtonAction
}: ProjectFormModalProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    estimated_completion: initialData.estimated_completion || '',
    tools_used: initialData.tools_used || [],
    proposed_tech: initialData.proposed_tech || [],
    project_details: initialData.project_details || '',
    cost_to_operate: initialData.cost_to_operate,
    gas_fee: initialData.gas_fee,
    budget: initialData.budget,
    priority: initialData.priority || 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    setCreating(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }

      if (submitButtonAction) {
        submitButtonAction();
      } else {
        // Default action: navigate to projects page
        navigate('/Projects');
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimated_completion: '',
      tools_used: [],
      proposed_tech: [],
      project_details: '',
      cost_to_operate: undefined,
      gas_fee: undefined,
      budget: undefined,
      priority: 'medium',
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Website Redesign Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
              placeholder="Brief description of the project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Details</label>
            <textarea
              value={formData.project_details}
              onChange={(e) => setFormData({ ...formData, project_details: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
              placeholder="Detailed project requirements and specifications..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time of Completion</label>
            <select
              value={formData.estimated_completion}
              onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">Select timeline</option>
              <option value="1-4-weeks">1-4 weeks</option>
              <option value="1-3-months">1-3 months</option>
              <option value="3-6-months">3-6 months</option>
              <option value="6-months-plus">6 months+</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost to Operate ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_to_operate || ''}
                onChange={(e) => setFormData({ ...formData, cost_to_operate: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GAS Fee ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.gas_fee || ''}
                onChange={(e) => setFormData({ ...formData, gas_fee: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Budget ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
