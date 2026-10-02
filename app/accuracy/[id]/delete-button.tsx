"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, LoaderCircle } from "lucide-react";

export function DeleteEvaluationButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this evaluation snapshot?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accuracy-tests/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.push("/experiments");
        router.refresh();
      } else {
        alert("Failed to delete evaluation");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={deleting} 
      className="button button-ghost text-slate-500 hover:text-red-600 hover:bg-red-50"
    >
      {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
      Delete
    </button>
  );
}
