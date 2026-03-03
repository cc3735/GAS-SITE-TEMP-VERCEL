import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useCustomProjectRequests, type CustomProjectRequest } from '../../hooks/useCustomProjectRequests';
import { FolderKanban, Plus, Calendar, List, LayoutGrid, X, Loader2, MoreVertical, Check, Clock, AlertCircle, Trash2, DollarSign, User, ChevronLeft, ChevronRight, ChevronDown, Inbox, Send, MessageSquare } from 'lucide-react';
import ProjectFormModal from '../../components/os/ProjectFormModal';

// Status configs for custom requests
const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-800 text-gray-300' },
  reviewing: { label: 'Reviewing', color: 'bg-blue-900/30 text-blue-400' },
  approved: { label: 'Approved', color: 'bg-green-900/30 text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-900/30 text-red-400' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-900/30 text-yellow-400' },
  completed: { label: 'Completed', color: 'bg-green-900/30 text-green-400' },
};

const REQUEST_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-800 text-gray-300',
  medium: 'bg-blue-900/30 text-blue-400',
  high: 'bg-orange-900/30 text-orange-400',
  urgent: 'bg-red-900/30 text-red-400',
};

export default function OSProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topTab = searchParams.get('view') === 'custom' ? 'custom' : 'projects';
  const { projects, loading: projectsLoading, createProject, deleteProject } = useProjects();
  const { requests, loading: requestsLoading, updateRequest } = useCustomProjectRequests(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [creating, setCreating] = useState(false);

  // Custom requests state
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [requestSearch, setRequestSearch] = useState('');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const setTopTab = (tab: 'projects' | 'custom') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'custom') params.set('view', 'custom');
    else params.delete('view');
    setSearchParams(params);
  };

  const handleUpdateRequestStatus = async (id: string, newStatus: string) => {
    setUpdatingRequestId(id);
    try {
      await updateRequest(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
    setUpdatingRequestId(null);
  };

  const handleSaveResponse = async (id: string) => {
    const text = responseText[id];
    if (!text?.trim()) return;
    setUpdatingRequestId(id);
    try {
      await updateRequest(id, { admin_response: text.trim() });
    } catch (err) {
      console.error('Failed to save response:', err);
    }
    setUpdatingRequestId(null);
  };

  const filteredRequests = requests.filter(
    (r) =>
      !requestSearch ||
      r.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.email ?? '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.full_name ?? '').toLowerCase().includes(requestSearch.toLowerCase())
  );

  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks(selectedProject || undefined);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    setCreating(true);
    try {
      await createTask({ name: newTaskName });
      setNewTaskName('');
      setShowNewTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (confirm(`Are you sure you want to delete Project "${projectToDelete?.name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(projectId);
        if (selectedProject === projectId) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const statusColumns = [
    { id: 'todo', name: 'To Do', icon: Clock, color: 'bg-gray-800 text-gray-300' },
    { id: 'in_progress', name: 'In Progress', icon: AlertCircle, color: 'bg-blue-900/30 text-blue-400' },
    { id: 'review', name: 'Review', icon: MoreVertical, color: 'bg-yellow-900/30 text-yellow-400' },
    { id: 'done', name: 'Done', icon: Check, color: 'bg-green-900/30 text-green-400' },
  ];

  const priorityColors = {
    low: 'bg-gray-800 text-gray-300',
    medium: 'bg-blue-900/30 text-blue-400',
    high: 'bg-orange-900/30 text-orange-400',
    urgent: 'bg-red-100 text-red-400',
  };

  if (projectsLoading && topTab === 'projects') {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 lg:p-8 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          {topTab === 'projects' && (
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          )}
        </div>

        {/* Top-level tab bar */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTopTab('projects')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              topTab === 'projects'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setTopTab('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              topTab === 'custom'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Custom Requests
            {requests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {requests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {topTab === 'projects' && (
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedProject(project.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedProject === project.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {project.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-400 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="flex items-center gap-2 border-l border-gray-600 pl-4">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-lg transition ${
                  view === 'kanban' ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition ${
                  view === 'list' ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg transition ${
                  view === 'calendar' ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {topTab === 'projects' && (<>
      <div className="flex-1 flex flex-col bg-gray-950">
        {/* Project Header - Always visible on selected project */}
        {selectedProject && selectedProjectData && (
          <div className="p-6 bg-gray-900 border-b border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedProjectData.name}</h2>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedProjectData.priority === 'urgent' ? 'bg-red-100 text-red-400' :
                    selectedProjectData.priority === 'high' ? 'bg-orange-900/30 text-orange-400' :
                    selectedProjectData.priority === 'medium' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-gray-800 text-gray-100'
                  }`}>
                    {selectedProjectData.priority}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-100 capitalize">
                    {selectedProjectData.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <p className="text-white">
                      {selectedProjectData.estimated_completion ?
                        selectedProjectData.estimated_completion.replace('-', ' to ') :
                        'Not set'
                      }
                    </p>
                  </div>

                  {selectedProjectData.cost_to_operate && (
                    <div>
                      <span className="text-gray-500">Cost to Operate:</span>
                      <p className="text-white font-semibold text-green-400">
                        ${selectedProjectData.cost_to_operate.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedProjectData.gas_fee && (
                    <div>
                      <span className="text-gray-500">GAS Fee:</span>
                      <p className="text-white font-semibold text-blue-400">
                        ${selectedProjectData.gas_fee.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedProjectData.budget && (
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p className="text-white font-semibold text-purple-400">
                        ${selectedProjectData.budget.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-500">Tasks:</span>
                    <p className="text-white font-semibold">{tasks.length}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-white">
                      {new Date(selectedProjectData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedProjectData.description && (
                  <div className="mt-4">
                    <span className="text-gray-500 text-sm">Description:</span>
                    <p className="text-white mt-1">{selectedProjectData.description}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteProject(selectedProjectData.id)}
                className="p-2 text-red-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition ml-4"
                title="Delete project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Task Views Container */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {!selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No project selected</h3>
                <p className="text-gray-400 mb-4">Create a project or select one to get started</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
                >
                  Create Your First Project
                </button>
              </div>
            </div>
          ) : (
            <>
              {view === 'kanban' && (
                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                  {statusColumns.map((column) => {
                    const Icon = column.icon;
                    const columnTasks = tasks.filter((t) => t.status === column.id);

                    return (
                      <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
                        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${column.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <h3 className="font-semibold text-white">{column.name}</h3>
                              <span className="text-sm text-gray-500">({columnTasks.length})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto">
                          {columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:shadow-md transition cursor-pointer"
                            >
                              <h4 className="font-medium text-white mb-2">{task.name}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {column.id === 'todo' && (
                            <button
                              onClick={() => setShowNewTask(true)}
                              className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary-600 hover:text-primary-600 transition"
                            >
                              <Plus className="w-5 h-5 mx-auto" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === 'list' && (
                <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">All Tasks</h3>
                    <button
                      onClick={() => setShowNewTask(true)}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {tasksLoading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No tasks yet</div>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="p-4 hover:bg-gray-800 transition flex items-center gap-4">
                          <input type="checkbox" className="w-5 h-5 text-blue-400 rounded" checked={task.status === 'done'} onChange={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{task.name}</h4>
                            {task.description && <p className="text-sm text-gray-400 mt-1">{task.description}</p>}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority}
                          </span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{task.status.replace('_', ' ')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {view === 'calendar' && (
                <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700">
                  {/* Calendar Header */}
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="p-2 hover:bg-gray-800 rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                      </button>
                      <h3 className="text-lg font-semibold text-white">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="p-2 hover:bg-gray-800 rounded-lg transition"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="p-6">
                    {/* Day Labels */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Generate calendar dates */}
                      {(() => {
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const lastDate = new Date(year, month + 1, 0).getDate();
                        const prevMonthLastDate = new Date(year, month, 0).getDate();
                        const days = [];

                        // Previous month days
                        for (let i = firstDay - 1; i >= 0; i--) {
                          days.push(
                            <div key={`prev-${i}`} className="text-center text-sm text-gray-400 p-3">
                              {prevMonthLastDate - i}
                            </div>
                          );
                        }

                        // Current month days
                        for (let i = 1; i <= lastDate; i++) {
                          const date = new Date(year, month, i);
                          const today = new Date();
                          const isToday = date.toDateString() === today.toDateString();

                          // Group tasks by this date
                          const dayTasks = tasks.filter(task => {
                            if (!task.due_date) return false;
                            const taskDate = new Date(task.due_date);
                            return taskDate.toDateString() === date.toDateString();
                          });

                          days.push(
                            <div
                              key={`current-${i}`}
                              className={`text-center text-sm p-1 min-h-[80px] border rounded-lg ${
                                isToday
                                  ? 'bg-blue-900/20 border-blue-600'
                                  : 'border-gray-700 hover:border-blue-600'
                              } transition cursor-pointer`}
                            >
                              <div className="font-medium text-white mb-1">{i}</div>
                              <div className="space-y-1">
                                {dayTasks.slice(0, 3).map(task => (
                                  <div
                                    key={task.id}
                                    className={`text-xs px-1 py-0.5 rounded text-white ${
                                      task.priority === 'urgent' ? 'bg-red-500' :
                                      task.priority === 'high' ? 'bg-orange-500' :
                                      task.priority === 'medium' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    } truncate`}
                                    title={task.name}
                                  >
                                    {task.name}
                                  </div>
                                ))}
                                {dayTasks.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{dayTasks.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Next month days (fill remaining)
                        const remainingCells = 42 - days.length;
                        for (let i = 1; i <= remainingCells; i++) {
                          days.push(
                            <div key={`next-${i}`} className="text-center text-sm text-gray-400 p-3">
                              {i}
                            </div>
                          );
                        }

                        return days;
                      })()}
                    </div>
                  </div>

                  {/* Task Legend */}
                  <div className="p-6 border-t border-gray-700 bg-gray-950 rounded-b-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Urgent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded"></div>
                          <span>Low</span>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {tasks.length} total tasks
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <ProjectFormModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={async (projectData) => {
          try {
            const project = await createProject(projectData);
            setSelectedProject(project.id);
            setShowNewProject(false);
          } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project: ' + (error as Error).message);
          }
        }}
        submitButtonText="Create Project"
      />

      {showNewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create New Task</h2>
              <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task name"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none mb-4 bg-gray-800 text-white placeholder-gray-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTaskName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>)}

      {/* Custom Requests Tab */}
      {topTab === 'custom' && (
        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-950 space-y-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Inbox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search by project name, client..."
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-500">
              {requestsLoading ? '...' : `${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Requests Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {requestsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="mx-auto w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm">No custom project requests yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Project</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Client</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Priority</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredRequests.map((req) => {
                    const statusCfg = REQUEST_STATUS_CONFIG[req.status] ?? REQUEST_STATUS_CONFIG.pending;
                    const isExpanded = expandedRequestId === req.id;

                    return (
                      <>
                        <tr
                          key={req.id}
                          onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                          className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <p className="text-white font-medium truncate max-w-[220px]">{req.name}</p>
                            {req.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[220px] mt-0.5">{req.description}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <p className="text-white truncate max-w-[160px]">
                              {req.full_name || req.email || 'Unknown'}
                            </p>
                            {req.full_name && req.email && (
                              <p className="text-xs text-gray-500 truncate max-w-[160px]">{req.email}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs capitalize ${REQUEST_PRIORITY_COLORS[req.priority] ?? 'bg-gray-800 text-gray-300'}`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${req.id}-detail`} className="bg-gray-800/30">
                            <td colSpan={5} className="px-5 py-4">
                              <div className="space-y-4">
                                {/* Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {req.project_details && (
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project Details</p>
                                      <p className="text-sm text-gray-300 whitespace-pre-line">{req.project_details}</p>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    {req.estimated_completion && (
                                      <div>
                                        <span className="text-xs text-gray-500">Timeline: </span>
                                        <span className="text-sm text-white">{req.estimated_completion.replace(/-/g, ' ')}</span>
                                      </div>
                                    )}
                                    {req.budget != null && (
                                      <div>
                                        <span className="text-xs text-gray-500">Budget: </span>
                                        <span className="text-sm text-green-400 font-medium">${req.budget.toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status Update */}
                                <div className="flex items-center gap-3">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Update Status:</p>
                                  {['pending', 'reviewing', 'approved', 'rejected', 'in_progress', 'completed'].map((s) => {
                                    const cfg = REQUEST_STATUS_CONFIG[s];
                                    return (
                                      <button
                                        key={s}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateRequestStatus(req.id, s);
                                        }}
                                        disabled={req.status === s || updatingRequestId === req.id}
                                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                                          req.status === s
                                            ? cfg.color + ' font-semibold'
                                            : 'border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                      >
                                        {cfg.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Admin Response */}
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                    <MessageSquare className="w-3 h-3 inline mr-1" />
                                    Admin Response
                                  </p>
                                  <textarea
                                    value={responseText[req.id] ?? req.admin_response ?? ''}
                                    onChange={(e) => setResponseText((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                    onClick={(e) => e.stopPropagation()}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    placeholder="Write a response to the client..."
                                  />
                                  <div className="flex items-center gap-3 mt-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveResponse(req.id);
                                      }}
                                      disabled={updatingRequestId === req.id}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs transition disabled:opacity-50"
                                    >
                                      <Send className="w-3 h-3" />
                                      Save Response
                                    </button>
                                    {req.admin_responded_at && (
                                      <span className="text-xs text-gray-500">
                                        Last responded: {new Date(req.admin_responded_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
