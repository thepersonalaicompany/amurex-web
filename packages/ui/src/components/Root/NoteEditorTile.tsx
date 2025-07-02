"use client";

import React, { useState, useCallback } from "react";
import { Plus, Maximize2 } from "lucide-react";
import { Button } from "@amurex/ui/components";
import { NoteChangeEvent, NoteKeyDownEvent } from "./types";
import { NoteEditorTileProps } from "@amurex/types";

export const NoteEditorTile: React.FC<NoteEditorTileProps> = ({
  onSave,
  onOpenFocusMode,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  const handleSave = useCallback((): void => {
    onSave(note);
    setNote("");
    setIsEditing(false);
  }, [note, onSave]);

  const handleKeyDown = useCallback(
    (e: NoteKeyDownEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  const handleNoteChange = useCallback((e: NoteChangeEvent): void => {
    setNote(e.target.value);
  }, []);

  if (!isEditing) {
    return (
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-[300px] flex items-center justify-center cursor-pointer"
        onClick={(): void => setIsEditing(true)}
      >
        <Plus className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-[300px] flex flex-col relative">
      <textarea
        className="flex-grow resize-none border-none focus:ring-0 text-sm"
        value={note}
        onChange={handleNoteChange}
        onKeyDown={handleKeyDown}
        placeholder="Start typing your note..."
        autoFocus
      />
      <div className="flex justify-between mt-2">
        <Button
          onClick={onOpenFocusMode}
          variant="ghost"
          className="absolute top-2 right-2"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div>
          <Button
            onClick={(): void => setIsEditing(false)}
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
};
