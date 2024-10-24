import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PinPopover({ pin, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-3/4 h-3/4 flex">
        <div className="w-3/4 pr-4 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">{pin.title}</h2>
          <p>{pin.content || 'No content available'}</p>
        </div>
        <div className="w-1/4 pl-4 border-l">
          <h3 className="text-xl font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap">
            {pin.tags && pin.tags.length > 0 ? (
              pin.tags.map((tag, index) => (
                <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                  {tag}
                </span>
              ))
            ) : (
              <p>No tags available</p>
            )}
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          className="absolute top-4 right-4"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
