"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTodayDateString, KANBAN_COLUMNS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import {
  CreateTaskInput,
  ProjectMember,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "@/types";

interface TaskFormProps {
  members: ProjectMember[];
  initialData?: Task;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  members,
  initialData,
  onSubmit,
  onDelete,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? "BACKLOG");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDone = initialData?.status === "DONE";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || null,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <div className="space-y-1">
        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {KANBAN_COLUMNS.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((value) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          min={getTodayDateString()}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <div className="space-y-1">
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
            Assignee
          </label>
          <select
            id="assignee"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          {initialData && onDelete && !isDone ? (
            <Button type="button" variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete Task
            </Button>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
