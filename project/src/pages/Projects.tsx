import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { FolderKanban, Plus, Calendar, List, LayoutGrid, X, Loader2, MoreVertical, Check, Clock, AlertCircle, Trash2, DollarSign, User, ChevronLeft, ChevronRight } from 'lucide-react';
import ProjectFormModal from '../components/ProjectFormModal';

export default function Projects() {
  const { projects, loading: projectsLoading, createProject, deleteProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [creating, setCreating] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

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
    { id: 'todo', name: 'To Do', icon: Clock, color: 'bg-gray-100 text-gray-700' },
    { id: 'in_progress', name: 'In Progress', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
    { id: 'review', name: 'Review', icon: MoreVertical, color: 'bg-yellow-100 text-yellow-700' },
    { id: 'done', name: 'Done', icon: Check, color: 'bg-green-100 text-green-700' },
  ];

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  if (projectsLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 lg:p-8 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedProject(project.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedProject === project.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {project.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-lg transition ${
                  view === 'kanban' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition ${
                  view === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg transition ${
                  view === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Project Header - Always visible on selected project */}
        {selectedProject && selectedProjectData && (
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProjectData.name}</h2>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedProjectData.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedProjectData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedProjectData.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProjectData.priority}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                    {selectedProjectData.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <p className="text-gray-900">
                      {selectedProjectData.estimated_completion ?
                        selectedProjectData.estimated_completion.replace('-', ' to ') :
                        'Not set'
                      }
                    </p>
                  </div>

                  {selectedProjectData.cost_to_operate && (
                    <div>
                      <span className="text-gray-500">Cost to Operate:</span>
                      <p className="text-gray-900 font-semibold text-green-600">
                        ${selectedProjectData.cost_to_operate.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedProjectData.gas_fee && (
                    <div>
                      <span className="text-gray-500">GAS Fee:</span>
                      <p className="text-gray-900 font-semibold text-blue-600">
                        ${selectedProjectData.gas_fee.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedProjectData.budget && (
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p className="text-gray-900 font-semibold text-purple-600">
                        ${selectedProjectData.budget.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-500">Tasks:</span>
                    <p className="text-gray-900 font-semibold">{tasks.length}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-900">
                      {new Date(selectedProjectData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedProjectData.description && (
                  <div className="mt-4">
                    <span className="text-gray-500 text-sm">Description:</span>
                    <p className="text-gray-900 mt-1">{selectedProjectData.description}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteProject(selectedProjectData.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-4"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No project selected</h3>
                <p className="text-gray-600 mb-4">Create a project or select one to get started</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
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
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${column.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <h3 className="font-semibold text-gray-900">{column.name}</h3>
                              <span className="text-sm text-gray-500">({columnTasks.length})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto">
                          {columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
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
                              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 transition"
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">All Tasks</h3>
                    <button
                      onClick={() => setShowNewTask(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {tasksLoading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="p-8 text-center text-gray-600">No tasks yet</div>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                          <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={task.status === 'done'} onChange={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{task.name}</h4>
                            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Calendar Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
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
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'border-gray-200 hover:border-blue-300'
                              } transition cursor-pointer`}
                            >
                              <div className="font-medium text-gray-900 mb-1">{i}</div>
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
                  <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
                      <div className="text-gray-600">
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTaskName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
