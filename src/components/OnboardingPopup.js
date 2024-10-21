import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const OnboardingPopup = ({ onClose, onImport }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Welcome to The Thing!</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <p className="mb-6">Get started by importing your documents to create pins.</p>
        <div className="space-y-4">
          <Button onClick={() => onImport('google')} className="w-full">
            Import Google Docs
          </Button>
          <Button onClick={() => onImport('notion')} className="w-full">
            Import Notion Pages
          </Button>
        </div>
      </div>
    </div>
  );
};
