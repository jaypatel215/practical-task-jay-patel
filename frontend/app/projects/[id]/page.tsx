"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { AddMemberForm } from "@/components/projects/AddMemberForm";
import { MemberList } from "@/components/projects/MemberList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskTable } from "@/components/tasks/TaskTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { Project, ProjectMember, Task, CreateProjectInput, CreateTaskInput, UpdateProjectInput, UpdateTaskInput } from "@/types";

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = project?.role === "CREATOR";

  async function loadProjectData() {
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
        err instanceof ApiClientError ? err.message : "Failed to load project"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function handleUpdateProject(data: CreateProjectInput | UpdateProjectInput) {
    try {
      const updated = await api.updateProject(projectId, data as UpdateProjectInput);
      setProject(updated);
      setIsEditOpen(false);
      showToast("Project updated");
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to update project");
    }
  }

  async function handleDeleteProject() {
    setIsDeleting(true);
    try {
      await api.deleteProject(projectId);
      showToast("Project deleted");
      window.location.href = "/projects";
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : "Failed to delete project",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAddMember(email: string) {
    try {
      await api.addMember(projectId, email);
      showToast("Member added");
      const membersData = await api.getMembers(projectId);
      setMembers(membersData.members);
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to add member");
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await api.removeMember(projectId, userId);
      showToast("Member removed");
      const membersData = await api.getMembers(projectId);
      setMembers(membersData.members);
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : "Failed to remove member",
        "error"
      );
    }
  }

  async function handleCreateTask(data: CreateTaskInput | UpdateTaskInput) {
    try {
      await api.createTask(projectId, data as CreateTaskInput);
      setIsTaskOpen(false);
      showToast("Task created");
      const tasksData = await api.getTasks(projectId);
      setTasks(tasksData.tasks);
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to create task");
    }
  }

  async function handleUpdateTask(data: CreateTaskInput | UpdateTaskInput) {
    if (!editingTask) {
      return;
    }

    try {
      await api.updateTask(projectId, editingTask.id, data as UpdateTaskInput);
      setEditingTask(null);
      showToast("Task updated");
      const tasksData = await api.getTasks(projectId);
      setTasks(tasksData.tasks);
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
      setEditingTask(null);
      showToast("Task deleted");
      const tasksData = await api.getTasks(projectId);
      setTasks(tasksData.tasks);
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
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-24 rounded-xl bg-gray-200" />
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
      <div className="space-y-8">
        <div>
          <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Projects
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              {project.description ? (
                <p className="mt-2 text-gray-600">{project.description}</p>
              ) : null}
            </div>
            {isCreator ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-4">
            <Link href={`/projects/${projectId}/board`}>
              <Button>Open Kanban Board</Button>
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          </div>
          {isCreator ? <AddMemberForm onSubmit={handleAddMember} /> : null}
          <MemberList
            members={members}
            isCreator={Boolean(isCreator)}
            onRemove={handleRemoveMember}
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <Button onClick={() => setIsTaskOpen(true)}>+ Create Task</Button>
          </div>
          <TaskTable tasks={tasks} onRowClick={setEditingTask} />
        </section>
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project"
      >
        <ProjectForm
          initialData={project}
          onSubmit={handleUpdateProject}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteOpen(false)}
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        title="Create Task"
      >
        <TaskForm
          members={members}
          onSubmit={handleCreateTask}
          onCancel={() => setIsTaskOpen(false)}
        />
      </Modal>

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
