"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SupabaseSession as Session, supabase } from "@amurex/supabase";
import { Button } from "@amurex/ui/components";
import { X } from "lucide-react";

interface FocusedEditorProps {
  onSave: (content: string) => void;
  onClose: () => void;
}

export const FocusedEditor = ({ onSave, onClose }: FocusedEditorProps) => {
  const [data, setData] = useState<string>("");
  const editorRef = useRef<{
    storage: { markdown: { getMarkdown: () => string } };
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("Unsaved");
  const [session, setSession] = useState<Session | null>(null);
  const [Editor, setEditor] = useState<any>(null);

  // TODO?: had to use this as a fix to get the editor to load (Editor from novel is not functional)
  useEffect(() => {
    import("novel").then((mod) => {
      setEditor(() => mod.EditorInstance);
    });
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  const handleUpdate = useCallback((editor: any) => {
    const content = editor?.storage.markdown.getMarkdown();
    editorRef.current = editor;
    setSaveStatus("Unsaved");
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    // TODO?: Following function `startUpload` is never implemented
    // const uploads = await startUpload([file]);
    // if (uploads && uploads.length > 0) {
    //   return uploads[0].url;
    // }
    return "www.example.com/failed-upload.png";
  }, []);

  const handleSave = useCallback(() => {
    const content = editorRef.current?.storage.markdown.getMarkdown();
    if (content) {
      onSave(content);
      setSaveStatus("Saved");
    }
  }, [onSave]);

  if (!Editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="relative w-full max-w-screen-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4"
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
};
