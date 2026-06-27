"use client";

import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Task } from "@/types";

interface TaskTableProps {
  tasks: Task[];
  onRowClick: (task: Task) => void;
}

export function TaskTable({ tasks, onRowClick }: TaskTableProps) {
  if (tasks.length === 0) {
    return <p className="text-sm text-gray-600">No tasks yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Assignee</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Due Date</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onRowClick(task)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
              <td className="px-4 py-3 text-gray-600">
                {task.assignee?.name ?? "Unassigned"}
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 text-gray-600">{task.dueDate ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
