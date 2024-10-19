"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [text, setText] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, text }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Document uploaded successfully!');
        setUrl('');
        setTitle('');
        setText('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Upload Document</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="url" className="block mb-2">Document URL:</label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://docs.google.com/... or https://www.notion.so/..."
          />
        </div>
        <div>
          <label htmlFor="title" className="block mb-2">Document Title:</label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter document title"
          />
        </div>
        <div>
          <label htmlFor="text" className="block mb-2">Document Text:</label>
          <Input
            id="text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            placeholder="Enter document text body"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>
      {message && (
        <p className={`mt-4 ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

