# Project Management System

The Project Management module in AI-Operating Platform is designed to help teams organize, track, and manage their work efficiently. It provides a comprehensive set of tools for task management, collaboration, and project planning.

## Features

### 1. Project Organization
- **Projects:** Create and manage multiple projects with distinct goals and timelines.
- **Custom Fields:** Track specific metrics like "Cost to Operate", "GAS Fee", and "Budget" for financial oversight.
- **Project Status:** Monitor project health with statuses (Active, On Hold, Completed).

### 2. Task Management
- **Kanban Board:**
    - **Drag-and-Drop Interface:** Easily move tasks between "To Do", "In Progress", "Review", and "Done" columns.
    - **Visual Cards:** See task details, priority, and due dates at a glance.
- **List View:** A detailed list of all tasks for quick scanning and bulk updates.
- **Calendar View:** Visualize task deadlines on a monthly calendar.
- **Hierarchical Tasks:** Support for parent tasks and subtasks (backend schema ready).

### 3. Collaboration & History
- **Task History:** Automatically tracks all changes to a task (status updates, edits) for audit trails (Database schema `task_history` enabled).
- **Comments:** (Coming Soon) Discuss tasks directly on the card.
- **Attachments:** (Coming Soon) Upload relevant files to tasks.

### 4. Views & Filtering
- **Multiple Views:** Switch seamlessly between Kanban, List, and Calendar views.
- **Filtering:** (Planned) Filter tasks by assignee, priority, and due date.

## Technical Implementation

### Database Schema
The system relies on the following core tables in Supabase:
- `projects`: Stores high-level project data.
- `tasks`: Stores individual work items.
- `task_history`: Tracks the audit log of changes.
- `task_lists`: Manages column definitions (for potential custom workflows).

### Frontend Architecture
- **Drag-and-Drop:** Built using `@dnd-kit/core` and `@dnd-kit/sortable` for a performant and accessible drag-and-drop experience.
- **State Management:** `useProjects` and `useTasks` hooks manage real-time data synchronization with Supabase.
- **Components:** Modular components like `KanbanBoard`, `ProjectFormModal`, and `TaskCard` (internal to KanbanBoard) ensure maintainability.

## Future Enhancements
- **Subtasks UI:** Expose the subtask functionality in the frontend.
- **Rich Text Editor:** Add markdown support for task descriptions.
- **Time Tracking:** Implement the `time_entries` table in the UI for tracking actual hours vs estimated.
