"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddMemberFormProps {
  onSubmit: (email: string) => Promise<void>;
}

export function AddMemberForm({ onSubmit }: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onSubmit(email.trim());
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          label="Member Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          required
        />
      </div>
      <Button type="submit" isLoading={isLoading}>
        Add Member
      </Button>
      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
