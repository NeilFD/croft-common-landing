import { ReactNode, useState, useRef, useEffect } from 'react';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CMSTextProps {
  page: string;
  section: string;
  contentKey: string;
  fallback: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  children?: ReactNode;
}

export const CMSText = ({
  page,
  section,
  contentKey,
  fallback,
  className = '',
  as: Component = 'div'
}: CMSTextProps) => {
  const { content, loading, error } = useCMSContent(page, section, contentKey);
  const { isEditMode, incrementPendingChanges, decrementPendingChanges } = useEditMode();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show fallback while loading, or if no content after loading
  const displayText = loading ? fallback : (content ?? fallback);

  useEffect(() => {
    if (isEditing) {
      const isMultiline = editValue.length > 100 || editValue.includes('\n');
      const currentRef = isMultiline ? textareaRef.current : inputRef.current;
      if (currentRef) {
        currentRef.focus();
        currentRef.select();
      }
    }
  }, [isEditing, editValue]);

  const handleEdit = () => {
    if (!isEditMode) return;
    setEditValue(displayText);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === displayText) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    incrementPendingChanges();

    try {
      // Check if content exists
      const { data: existingContent } = await supabase
        .from('cms_content')
        .select('id')
        .eq('page', page)
        .eq('section', section)
        .eq('content_key', contentKey)
        .maybeSingle();

      const contentData = { text: editValue };

      if (existingContent) {
        // Update existing content
        await supabase
          .from('cms_content')
          .update({ 
            content_data: contentData,
            published: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContent.id);
      } else {
        // Create new content
        await supabase
          .from('cms_content')
          .insert({
            page,
            section,
            content_key: contentKey,
            content_type: 'text',
            content_data: contentData,
            published: true
          });
      }

      toast({
        title: "Content Updated",
        description: "Your changes have been saved.",
      });
      
      setIsEditing(false);
      // Force refresh of content
      window.location.reload();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      decrementPendingChanges();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const isMultiline = editValue.length > 100 || editValue.includes('\n');
    
    return (
      <div className="relative">
        {isMultiline ? (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${className} min-h-[100px]`}
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={className}
            disabled={isSaving}
          />
        )}
        {isSaving && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Saving...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Component 
      className={`${className} ${isEditMode ? 'cursor-pointer hover:bg-accent/20 transition-colors duration-200 rounded px-1 border-2 border-transparent hover:border-accent/30' : ''}`}
      onClick={handleEdit}
      title={isEditMode ? 'Click to edit' : undefined}
    >
      {displayText}
    </Component>
  );
};