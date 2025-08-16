import { ReactNode, useState, useRef, useEffect } from 'react';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

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
  const { isEditMode, incrementPendingChanges, decrementPendingChanges } = useEditMode();
  const { content, loading, error } = useCMSContent(page, section, contentKey, isEditMode);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalStyles, setOriginalStyles] = useState<any>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalElementRef = useRef<any>(null);

  // Show fallback while loading, or if no content after loading
  const displayText = loading ? fallback : (content ?? fallback);

  useEffect(() => {
    if (isEditing) {
      const isMultiline = editValue.length > 100 || editValue.includes('\n');
      const currentRef = isMultiline ? textareaRef.current : inputRef.current;
      if (currentRef) {
        currentRef.focus();
        // Position cursor at end instead of selecting all text
        setTimeout(() => {
          if (currentRef) {
            currentRef.setSelectionRange(currentRef.value.length, currentRef.value.length);
          }
        }, 0);
      }
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (!isEditMode) return;
    
    // Capture original element styles before editing
    if (originalElementRef.current) {
      const computedStyles = window.getComputedStyle(originalElementRef.current);
      setOriginalStyles({
        fontSize: computedStyles.fontSize,
        lineHeight: computedStyles.lineHeight,
        textAlign: computedStyles.textAlign,
        fontWeight: computedStyles.fontWeight,
        fontFamily: computedStyles.fontFamily,
        height: originalElementRef.current.offsetHeight,
        width: originalElementRef.current.offsetWidth,
      });
    }
    
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
        // Update existing content as draft
        await supabase
          .from('cms_content')
          .update({ 
            content_data: contentData,
            published: false, // Save as draft
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContent.id);
      } else {
        // Create new content as draft
        await supabase
          .from('cms_content')
          .insert({
            page,
            section,
            content_key: contentKey,
            content_type: 'text',
            content_data: contentData,
            published: false // Save as draft
          });
      }

      toast({
        title: "Content Saved",
        description: "Your changes have been saved as draft.",
      });
      
      setIsEditing(false);
      // Update display text immediately instead of reloading
      // Note: This is a simplification - in a real app you'd refetch the content
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
    const minHeight = Math.max(parseInt(originalStyles.height) || 40, 40);
    
    const editingStyles = {
      fontSize: originalStyles.fontSize || 'inherit',
      fontWeight: originalStyles.fontWeight || 'inherit',
      fontFamily: originalStyles.fontFamily || 'inherit',
      textAlign: originalStyles.textAlign || 'inherit',
      lineHeight: originalStyles.lineHeight || 'inherit',
      minHeight: `${minHeight}px`,
      width: originalStyles.width ? `${originalStyles.width}px` : 'auto',
    };
    
    return (
      <>
        {/* Backdrop to prevent interaction with other elements */}
        <div className="fixed inset-0 bg-black/10 z-40" onClick={handleCancel} />
        
        {/* Editing container with high z-index */}
        <div className="relative z-50 space-y-2">
          <div className="relative">
            {isMultiline ? (
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${className} pr-20 resize-none`}
                style={editingStyles}
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            ) : (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${className} pr-20`}
                style={editingStyles}
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            )}
            
            {/* Save/Cancel buttons with high z-index */}
            <div className="absolute right-2 top-2 flex gap-1 z-60 bg-background rounded border shadow-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving || editValue === displayText}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Helper text */}
          <div className="text-xs text-muted-foreground bg-background/80 p-1 rounded">
            Press Enter to save, Esc to cancel, or use the buttons above
          </div>
          
          {isSaving && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded z-70">
              <div className="text-sm text-muted-foreground">Saving...</div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <Component 
      ref={originalElementRef}
      className={`${className} ${isEditMode ? 'cursor-pointer hover:bg-accent/20 transition-colors duration-200 rounded px-1 border-2 border-transparent hover:border-accent/30' : ''}`}
      onClick={handleEdit}
      title={isEditMode ? 'Click to edit' : undefined}
    >
      {displayText}
    </Component>
  );
};