"use client";
import { useState, useCallback, useRef } from "react";
import { Editor } from "novel-lightweight";


export default function Page() {
  console.log("Rendering Page");
  const [data, setData] = useState("");
  const editorRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("Saved");

  const handleUpdate = useCallback((editor) => {
    const content = editor?.storage.markdown.getMarkdown();
    console.log('onUpdate', content);
    editorRef.current = editor;
    setSaveStatus("Unsaved");
  }, []);

  const handleDebouncedUpdate = useCallback(() => {
    const content = editorRef.current?.storage.markdown.getMarkdown();
    console.log('onDebouncedUpdate', content);
    if (content !== data) {
      setData(content);
      setSaveStatus("Saving...");
      // Simulate a delay in saving.
      setTimeout(() => {
        setSaveStatus("Saved");
      }, 500);
    }
  }, [data]);

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
        onDebouncedUpdate={handleDebouncedUpdate}
        handleImageUpload={handleImageUpload}
      />
    </div>
  );
}