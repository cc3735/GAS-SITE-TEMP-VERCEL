import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { FolderKanban, Plus, Calendar, List, LayoutGrid, X, Loader2, MoreVertical, Check, Clock, AlertCircle } from 'lucide-react';

export default function Projects() {
  const { projects, loading: projectsLoading, createProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [creating, setCreating] = useState(false);

  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks(selectedProject);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const project = await createProject({ name: newProjectName });
      if (project) {
        setSelectedProject(project.id);
        setNewProjectName('');
        setShowNewProject(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

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
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedProject === project.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {project.name}
              </button>
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

      <div className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50">
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
        ) : view === 'kanban' ? (
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
        ) : view === 'list' ? (
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
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Calendar view coming soon</p>
          </div>
        )}
      </div>

      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
