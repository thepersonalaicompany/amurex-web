"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "novel-lightweight";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export default function FocusedEditor({ onSave, onClose }) {
  const [data, setData] = useState("");
  const editorRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("Unsaved");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  const handleUpdate = useCallback((editor) => {
    const content = editor?.storage.markdown.getMarkdown();
    editorRef.current = editor;
    setSaveStatus("Unsaved");
  }, []);

  const handleImageUpload = useCallback(async (file) => {
    const uploads = await startUpload([file]);
    if (uploads && uploads.length > 0) {
      return uploads[0].url;
    }
    return "www.example.com/failed-upload.png";
  }, []);

  const handleSave = useCallback(() => {
    const content = editorRef.current?.storage.markdown.getMarkdown();
    if (content) {
      onSave(content);
      setSaveStatus("Saved");
    }
  }, [onSave]);

  return (
    <div className="relative w-full max-w-screen-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-4 top-4"
      >
        <X className="h-6 w-6" />
      </Button>
      <div className="absolute right-5 top-5 z-10 mb-5 rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-400">
        {saveStatus}
      </div>
      <Editor
        defaultValue={data}
        disableLocalStorage={true}
        onUpdate={handleUpdate}
        handleImageUpload={handleImageUpload}
      />
      <Button onClick={handleSave} className="mt-4">
        Save Note
      </Button>
    </div>
  );
}
