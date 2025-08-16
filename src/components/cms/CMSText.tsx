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
      
      // Check if this element is inside a button (common for floating buttons)
      const isInButton = originalElementRef.current.closest('button') !== null;
      
      let editPosition = {};
      
      if (isInButton) {
        // For buttons, position the editor well above and to the side for visibility
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate optimal position - prefer above and to the left, but adjust if needed
        let topPos = rect.top - 120; // More space above
        let leftPos = rect.left - 100; // More space to the left
        
        // Adjust if it would go off screen
        if (topPos < 20) {
          topPos = rect.bottom + 20; // Position below if no room above
        }
        if (leftPos < 20) {
          leftPos = 20; // Ensure minimum left margin
        }
        if (leftPos + 320 > viewportWidth) {
          leftPos = viewportWidth - 340; // Ensure it fits on screen
        }
        
        editPosition = {
          position: 'fixed',
          top: `${topPos}px`,
          left: `${leftPos}px`,
          width: '320px', // Wider for better usability
          zIndex: 10000,
        };
      } else {
        // For other elements, overlay in place
        editPosition = {
          position: 'absolute',
          top: `${rect.top + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${Math.max(rect.width, 200)}px`,
          zIndex: 9999,
        };
      }
      
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
        ...editPosition,
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
        
        {/* Editing container positioned optimally */}
        <div 
          className="bg-background border-2 border-primary rounded-lg shadow-xl p-3 space-y-3"
          style={originalStyles}
        >
          <div className="text-xs text-muted-foreground font-medium border-b pb-2">
            Editing: {page} / {section} / {contentKey}
          </div>
          
          <div className="relative">
            {isMultiline ? (
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-2 border-muted bg-background text-foreground resize-none min-h-[80px]"
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            ) : (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-2 border-muted bg-background text-foreground"
                disabled={isSaving}
                placeholder="Enter your text..."
              />
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || editValue === displayText}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
          
          {/* Helper text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-t">
            💡 Press <kbd className="px-1 bg-background border rounded">Enter</kbd> to save, <kbd className="px-1 bg-background border rounded">Esc</kbd> to cancel
          </div>
          
          {isSaving && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
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