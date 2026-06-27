import { PRIORITY_STYLES, STATUS_STYLES, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { TaskPriority, TaskStatus } from "@/types";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      label={TASK_PRIORITY_LABELS[priority]}
      className={PRIORITY_STYLES[priority]}
    />
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      label={TASK_STATUS_LABELS[status]}
      className={STATUS_STYLES[status]}
    />
  );
}

export function RoleBadge({ role }: { role: "CREATOR" | "MEMBER" }) {
  return (
    <Badge
      label={role === "CREATOR" ? "Creator" : "Member"}
      className={role === "CREATOR" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-700"}
    />
  );
}
