"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "novel-lightweight";
import { supabase } from '@/lib/supabaseClient';

export default function FocusedEditor({ onSave }) {
  const [data, setData] = useState("");
  const editorRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("Unsaved");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  return (
    <div className="relative w-full max-w-screen-lg">
      <div className="absolute right-5 top-5 z-10 mb-5 rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-400">
        {saveStatus}
      </div>
      <Editor
        defaultValue={data}
        disableLocalStorage={true}
        onUpdate={handleUpdate}
        handleImageUpload={handleImageUpload}
      />
    </div>
  );
}
