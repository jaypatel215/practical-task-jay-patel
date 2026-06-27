"use client";

import { Draggable } from "@hello-pangea/dnd";
import { PriorityBadge } from "@/components/ui/Badge";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-200" : ""
          }`}
        >
          <p className="font-medium text-gray-900">{task.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.dueDate ? (
              <span className="text-xs text-gray-500">{task.dueDate}</span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {task.assignee?.name ?? "Unassigned"}
          </p>
        </div>
      )}
    </Draggable>
  );
}
