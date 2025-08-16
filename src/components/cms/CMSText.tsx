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
    
    console.log('🎯 CMS: Edit clicked, current target:', e.currentTarget);
    
    // Stop propagation to prevent parent button/link clicks
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🎯 CMS: originalElementRef.current:', originalElementRef.current);
    
    // Capture original element styles and position before editing
    if (originalElementRef.current) {
      const computedStyles = window.getComputedStyle(originalElementRef.current);
      const rect = originalElementRef.current.getBoundingClientRect();
      
      console.log('🎯 CMS: Element rect:', rect);
      
      // Check if this element is inside a button (common for floating buttons)
      const buttonParent = originalElementRef.current.closest('button');
      const isInButton = buttonParent !== null;
      
      console.log('🎯 CMS: Is in button:', isInButton, 'Button parent:', buttonParent);
      
      // Simple positioning - always above the element
      const topPos = Math.max(rect.top - 180, 20); // Above with fallback
      const leftPos = Math.max(rect.left - 50, 20); // Slightly left with fallback
      
      console.log('🎯 CMS: Calculated position:', { topPos, leftPos });
      
      const editPosition = {
        position: 'fixed' as const,
        top: `${topPos}px`,
        left: `${leftPos}px`,
        width: '300px',
        zIndex: 99999,
        backgroundColor: 'white',
        border: '2px solid #007acc',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      };
      
      console.log('🎯 CMS: Final edit position:', editPosition);
      
      setOriginalStyles(editPosition);
    } else {
      console.log('🎯 CMS: originalElementRef.current is null!');
      // Fallback positioning if ref is null
      setOriginalStyles({
        position: 'fixed' as const,
        top: '100px',
        left: '100px',
        width: '300px',
        zIndex: 99999,
        backgroundColor: 'white',
        border: '2px solid #007acc',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      });
    }
    
    console.log('🎯 CMS: About to set edit state...');
    setEditValue(displayText);
    setIsEditing(true);
    console.log('🎯 CMS: Set editing to true, edit value:', displayText);
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