import React from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

export const NotionConnectModal = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Connect Notion</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <p className="mb-6">Connect your Notion account to import your documents and create pins.</p>
        <Button onClick={onConnect} className="w-full">
          Connect Notion
        </Button>
      </div>
    </div>
  );
};