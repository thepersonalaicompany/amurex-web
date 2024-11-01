import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

export function PinPopover({ pin, onClose }) {
  const popoverRef = useRef(null);
  const [newTag, setNewTag] = useState('');
  const [currentTagPage, setCurrentTagPage] = useState(0);

  useEffect(() => {
    console.log('PinPopover mounted');
    console.log('Pin:', pin);
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      try {
        const updatedTags = [...(pin.tags || []), newTag.trim()];
        const { data, error } = await supabase
          .from('documents')
          .update({ tags: updatedTags })
          .eq('id', pin.id);

        if (error) throw error;

        // Update the pin state locally
        pin.tags = updatedTags;
        setNewTag('');
      } catch (error) {
        console.error('Error adding tag:', error);
      }
    }
  };

  const tagsPerPage = 5;
  const totalPages = Math.ceil((pin.tags?.length || 0) / tagsPerPage);

  const handleNextPage = () => {
    setCurrentTagPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentTagPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={popoverRef} className="bg-white rounded-lg p-6 w-full sm:w-3/4 h-full sm:h-3/4 flex flex-col sm:flex-row">
        <div className="w-full sm:w-3/4 pr-4 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">{pin.title}</h2>
          <p>{pin.text || 'No content available'}</p>
        </div>
        <div className="w-full sm:w-1/4 mt-4 sm:mt-0 sm:pl-4 sm:border-l">
          <h3 className="text-xl font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap mb-4 h-[120px] mt-4">
            {pin.tags && pin.tags.length > 0 ? (
              <>
                {pin.tags.slice(currentTagPage * tagsPerPage, (currentTagPage + 1) * tagsPerPage).map((tag, index) => (
                  <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {tag}
                  </span>
                ))}
              </>
            ) : (
              <p>No tags available</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between mb-4">
              <Button
                onClick={handlePrevPage}
                disabled={currentTagPage === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{`${currentTagPage + 1} / ${totalPages}`}</span>
              <Button
                onClick={handleNextPage}
                disabled={currentTagPage === totalPages - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleAddTag} className="flex items-center pt-4">
            <Input
              type="text"
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="mr-2"
            />
            <Button type="submit" variant="outline" size="sm">
              Add
            </Button>
          </form>
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
