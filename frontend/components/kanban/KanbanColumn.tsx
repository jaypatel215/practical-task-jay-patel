"use client";

import { Droppable } from "@hello-pangea/dnd";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "@/components/tasks/TaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ status, label, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="min-w-[280px] flex-1 rounded-xl border border-gray-200 bg-gray-100 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] space-y-3 rounded-lg p-1 ${
              snapshot.isDraggingOver ? "bg-blue-50" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onClick={onTaskClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export function groupTasksByStatus(tasks: Task[]) {
  return KANBAN_COLUMNS.reduce<Record<TaskStatus, Task[]>>(
    (acc, column) => {
      acc[column.status] = tasks.filter((task) => task.status === column.status);
      return acc;
    },
    {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    }
  );
}
