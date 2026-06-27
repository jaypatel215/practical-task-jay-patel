"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { Project, ProjectMember, Task, CreateTaskInput, UpdateTaskInput } from "@/types";

export default function KanbanBoardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  async function loadBoardData() {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, membersData, tasksData] = await Promise.all([
        api.getProject(projectId),
        api.getMembers(projectId),
        api.getTasks(projectId),
      ]);

      setProject(projectData);
      setMembers(membersData.members);
      setTasks(tasksData.tasks);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to load kanban board"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBoardData();
  }, [projectId]);

  async function handleUpdateTask(data: CreateTaskInput | UpdateTaskInput) {
    if (!editingTask) {
      return;
    }

    try {
      const updated = await api.updateTask(projectId, editingTask.id, data as UpdateTaskInput);
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task))
      );
      setEditingTask(null);
      showToast("Task updated");
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to update task");
    }
  }

  async function handleDeleteTask() {
    if (!editingTask) {
      return;
    }

    try {
      await api.deleteTask(projectId, editingTask.id);
      setTasks((current) => current.filter((task) => task.id !== editingTask.id));
      setEditingTask(null);
      showToast("Task deleted");
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to delete task");
    }
  }

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !project) {
    return (
      <ProtectedLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error || "Project not found"}</p>
          <Link href="/projects" className="mt-3 inline-block text-sm text-blue-600">
            Back to Projects
          </Link>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Project Details
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Kanban: {project.name}
          </h1>
        </div>

        <KanbanBoard
          projectId={projectId}
          tasks={tasks}
          onTaskClick={setEditingTask}
          onTasksChange={setTasks}
        />
      </div>

      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        {editingTask ? (
          <TaskForm
            members={members}
            initialData={editingTask}
            onSubmit={handleUpdateTask}
            onDelete={handleDeleteTask}
            onCancel={() => setEditingTask(null)}
          />
        ) : null}
      </Modal>
    </ProtectedLayout>
  );
}
