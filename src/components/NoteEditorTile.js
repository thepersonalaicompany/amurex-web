import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Maximize2 } from "lucide-react";

export function NoteEditorTile({ onSave, onOpenFocusMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState("");

  const handleSave = useCallback(() => {
    onSave(note);
    setNote("");
    setIsEditing(false);
  }, [note, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  if (!isEditing) {
    return (
      <div
        className="flex h-[300px] cursor-pointer items-center justify-center rounded-lg bg-white shadow-md transition-shadow duration-300 ease-in-out hover:shadow-xl"
        onClick={() => setIsEditing(true)}
      >
        <Plus className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[300px] flex-col rounded-lg bg-white p-4 shadow-md">
      <textarea
        className="flex-grow resize-none border-none text-sm focus:ring-0"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing your note..."
        autoFocus
      />
      <div className="mt-2 flex justify-between">
        <Button
          onClick={onOpenFocusMode}
          variant="ghost"
          className="absolute right-2 top-2"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div>
          <Button
            onClick={() => setIsEditing(false)}
            variant="ghost"
            className="mr-2"
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
