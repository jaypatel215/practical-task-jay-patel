"use client";

import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { Project, CreateProjectInput, UpdateProjectInput } from "@/types";

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.getProjects();
      setProjects(response.projects);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to load projects"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(data: CreateProjectInput | UpdateProjectInput) {
    try {
      await api.createProject(data as CreateProjectInput);
      setIsCreateOpen(false);
      showToast("Project created");
      await loadProjects();
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to create project");
    }
  }

  async function handleUpdate(data: CreateProjectInput | UpdateProjectInput) {
    if (!editingProject) {
      return;
    }

    try {
      await api.updateProject(editingProject.id, data as UpdateProjectInput);
      setEditingProject(null);
      showToast("Project updated");
      await loadProjects();
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error("Failed to update project");
    }
  }

  async function handleDelete() {
    if (!deletingProject) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteProject(deletingProject.id);
      setDeletingProject(null);
      showToast("Project deleted");
      await loadProjects();
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : "Failed to delete project",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your projects and team work
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>+ Create Project</Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button className="mt-3" variant="secondary" onClick={loadProjects}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start managing tasks."
            action={<Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>}
          />
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={setEditingProject}
                onDelete={setDeletingProject}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Project"
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
      >
        {editingProject ? (
          <ProjectForm
            initialData={editingProject}
            onSubmit={handleUpdate}
            onCancel={() => setEditingProject(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This will remove all members and tasks.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingProject(null)}
        isLoading={isDeleting}
      />
    </ProtectedLayout>
  );
}
