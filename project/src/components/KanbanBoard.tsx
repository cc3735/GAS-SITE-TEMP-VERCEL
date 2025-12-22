import React, { useState } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../hooks/useTasks';
import { Clock, AlertCircle, MoreVertical, Check, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onNewTask: (status: string) => void;
  priorityColors: Record<string, string>;
}

const statusColumns = [
  { id: 'todo', name: 'To Do', icon: Clock, color: 'bg-gray-500/10 text-gray-500' },
  { id: 'in_progress', name: 'In Progress', icon: AlertCircle, color: 'bg-blue-500/10 text-blue-500' },
  { id: 'review', name: 'Review', icon: MoreVertical, color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 'done', name: 'Done', icon: Check, color: 'bg-green-500/10 text-green-500' },
];

function SortableTask({ task, priorityColors }: { task: Task; priorityColors: Record<string, string> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface rounded-lg border border-border p-4 hover:shadow-md transition cursor-grab active:cursor-grabbing mb-3"
    >
      <h4 className="font-medium text-primary mb-2">{task.name}</h4>
      {task.description && (
        <p className="text-sm text-secondary mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-xs text-subtle">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, priorityColors, onNewTask }: { column: any, tasks: Task[], priorityColors: Record<string, string>, onNewTask: (status: string) => void }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const Icon = column.icon;

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col h-full">
      <div className="bg-surface rounded-lg border border-border p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${column.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-primary">{column.name}</h3>
            <span className="text-sm text-subtle">({tasks.length})</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} priorityColors={priorityColors} />
          ))}
        </SortableContext>
        
        {column.id === 'todo' && (
            <button
              onClick={() => onNewTask(column.id)}
              className="w-full p-4 border-2 border-dashed border-border rounded-lg text-secondary hover:border-accent hover:text-accent transition mt-2"
            >
              <Plus className="w-5 h-5 mx-auto" />
            </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onStatusChange, onNewTask, priorityColors }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current?.type === 'Task') {
        setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
      // We can implement reordering logic here for optimistic updates if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeTask = active.data.current?.task as Task;
    const overId = over.id as string;
    
    // Check if dropped over a column
    const overColumn = statusColumns.find(c => c.id === overId);
    
    // Check if dropped over another task
    const overTask = tasks.find(t => t.id === overId);

    let newStatus = activeTask.status;

    if (overColumn) {
        newStatus = overColumn.id;
    } else if (overTask) {
        newStatus = overTask.status;
    }

    if (newStatus !== activeTask.status) {
        onStatusChange(activeTask.id, newStatus);
    }
  };

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {statusColumns.map((column) => (
          <KanbanColumn 
            key={column.id} 
            column={column} 
            tasks={tasks.filter(t => t.status === column.id)}
            priorityColors={priorityColors}
            onNewTask={onNewTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
           <div className="bg-surface rounded-lg border border-accent p-4 shadow-xl cursor-grabbing opacity-90 rotate-2 w-80">
             <h4 className="font-medium text-primary mb-2">{activeTask.name}</h4>
             <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${priorityColors[activeTask.priority as keyof typeof priorityColors]}`}>
                  {activeTask.priority}
                </span>
             </div>
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
