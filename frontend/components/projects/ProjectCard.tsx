"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const isCreator = project.role === "CREATOR";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          {project.description ? (
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{project.memberCount ?? 0} members</span>
            <span>·</span>
            <span>{project.taskCount ?? 0} tasks</span>
            {project.role ? (
              <>
                <span>·</span>
                <RoleBadge role={project.role} />
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/projects/${project.id}`}>
          <Button variant="secondary">View</Button>
        </Link>
        {isCreator && onEdit ? (
          <Button variant="secondary" onClick={() => onEdit(project)}>
            Edit
          </Button>
        ) : null}
        {isCreator && onDelete ? (
          <Button variant="danger" onClick={() => onDelete(project)}>
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
