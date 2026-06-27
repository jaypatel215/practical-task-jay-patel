"use client";

import { useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { Task, TaskStatus } from "@/types";
import { KanbanColumn, groupTasksByStatus } from "@/components/kanban/KanbanColumn";
import * as api from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTasksChange: (tasks: Task[]) => void;
}

export function KanbanBoard({
  projectId,
  tasks,
  onTaskClick,
  onTasksChange,
}: KanbanBoardProps) {
  const { showToast } = useToast();
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const previousTasks = tasks;

    const updatedTasks = tasks.map((task) =>
      task.id === draggableId ? { ...task, status: newStatus } : task
    );

    onTasksChange(updatedTasks);

    try {
      await api.updateTask(projectId, draggableId, { status: newStatus });
      showToast("Task status updated");
    } catch (error) {
      onTasksChange(previousTasks);
      showToast(
        error instanceof ApiClientError ? error.message : "Failed to update task",
        "error"
      );
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            tasks={groupedTasks[column.status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
