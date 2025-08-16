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
  const { content, loading, error, refreshContent } = useCMSContent(page, section, contentKey, isEditMode);
  
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
        // Select all text for better editing experience
        currentRef.select();
      }
    }
  }, [isEditing]);

  const handleEdit = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    // Stop propagation to prevent parent button/link clicks
    e.stopPropagation();
    e.preventDefault();
    
    // Capture original element styles and position before editing
    if (originalElementRef.current) {
      const computedStyles = window.getComputedStyle(originalElementRef.current);
      const rect = originalElementRef.current.getBoundingClientRect();
      setOriginalStyles({
        fontSize: computedStyles.fontSize,
        lineHeight: computedStyles.lineHeight,
        textAlign: computedStyles.textAlign,
        fontWeight: computedStyles.fontWeight,
        fontFamily: computedStyles.fontFamily,
        color: computedStyles.color,
        padding: computedStyles.padding,
        margin: computedStyles.margin,
        borderRadius: computedStyles.borderRadius,
        position: 'absolute',
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        height: `${rect.height}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
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
      // Refresh content to show the saved changes
      refreshContent();
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
      <>
        {/* Backdrop to prevent interaction with other elements */}
        <div className="fixed inset-0 bg-black/20 z-[9998]" onClick={handleCancel} />
        
        {/* Editing container positioned exactly where the original text was */}
        <div 
          className="space-y-2"
          style={originalStyles}
        >
          <div className="relative">
            {isMultiline ? (
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-2 border-primary bg-background text-foreground pr-20 resize-none"
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            ) : (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-2 border-primary bg-background text-foreground pr-20"
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            )}
            
            {/* Save/Cancel buttons */}
            <div className="absolute right-2 top-2 flex gap-1 bg-background rounded border shadow-lg p-1">
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
          <div className="text-xs text-muted-foreground bg-background/90 p-2 rounded border shadow-sm">
            Press Enter to save, Esc to cancel, or use the buttons above
          </div>
          
          {isSaving && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded">
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
      className={`${className} ${isEditMode ? 'cursor-pointer hover:bg-accent/20 transition-colors duration-200 rounded px-1 border-2 border-transparent hover:border-accent/30 relative' : ''}`}
      onClick={handleEdit}
      title={isEditMode ? 'Click to edit (CMS)' : undefined}
    >
      {displayText}
      {isEditMode && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full opacity-60" />
      )}
    </Component>
  );
};