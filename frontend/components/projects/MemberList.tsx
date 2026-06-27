"use client";

import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { ProjectMember } from "@/types";

interface MemberListProps {
  members: ProjectMember[];
  isCreator: boolean;
  onRemove?: (userId: string) => void;
}

export function MemberList({ members, isCreator, onRemove }: MemberListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-gray-600">No members yet.</p>;
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-sm text-gray-600">{member.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <RoleBadge role={member.role} />
            {isCreator && member.role !== "CREATOR" && onRemove ? (
              <Button variant="danger" onClick={() => onRemove(member.userId)}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
