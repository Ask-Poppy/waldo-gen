import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMessage } from './SortableMessage';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onReorder: (messages: Message[]) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function MessageList({ messages, onReorder, onEdit, onDelete }: MessageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = messages.findIndex((m) => m.id === active.id);
      const newIndex = messages.findIndex((m) => m.id === over.id);
      
      onReorder(arrayMove(messages, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={messages}
          strategy={verticalListSortingStrategy}
        >
          {messages.map((message) => (
            <SortableMessage
              key={message.id}
              message={message}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {messages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Start your conversation by adding a message below
        </div>
      )}
    </div>
  );
}