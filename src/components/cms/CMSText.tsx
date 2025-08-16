import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Check, X, AlignLeft, AlignCenter, AlignRight, Move, Layout } from 'lucide-react';

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
  const [positioning, setPositioning] = useState({
    alignment: 'left',
    containerPosition: 'default',
    marginTop: '0',
    marginBottom: '0',
    marginLeft: '0',
    marginRight: '0'
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalElementRef = useRef<any>(null);

  // Show fallback while loading, or if no content after loading
  const displayText = loading ? fallback : (content?.content_data?.text ?? fallback);
  
  // Get positioning from content data
  const currentPositioning = content?.content_data?.positioning || {
    alignment: 'left',
    containerPosition: 'default',
    marginTop: '0',
    marginBottom: '0',
    marginLeft: '0',
    marginRight: '0'
  };

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
    setPositioning(currentPositioning);
    setIsEditing(true);
    console.log('🎯 CMS: Set editing to true, edit value:', displayText);
  };

  const handleSave = async () => {
    console.log('🎯 CMS: SAVE STARTED - editValue:', editValue, 'displayText:', displayText);
    
    const hasTextChanged = editValue !== displayText;
    const hasPositioningChanged = JSON.stringify(positioning) !== JSON.stringify(currentPositioning);
    
    if (!hasTextChanged && !hasPositioningChanged) {
      console.log('🎯 CMS: No changes detected, skipping save');
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    incrementPendingChanges();

    try {
      // Check current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🎯 CMS: Current user:', user, 'Error:', userError);
      
      if (!user) {
        console.log('🎯 CMS: No user authenticated - this is the problem!');
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to edit content.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('🎯 CMS: User email:', user.email);
      console.log('🎯 CMS: User ID:', user.id);
      
      console.log('🎯 CMS: Checking for existing content...', { page, section, contentKey });
      
      // Check if content exists
      const { data: existingContent, error: selectError } = await supabase
        .from('cms_content')
        .select('id, created_by')
        .eq('page', page)
        .eq('section', section)
        .eq('content_key', contentKey)
        .maybeSingle();

      console.log('🎯 CMS: Existing content query result:', existingContent, 'Error:', selectError);

      const contentData = { text: editValue, positioning };
      console.log('🎯 CMS: Content data to save:', contentData);

      if (existingContent) {
        console.log('🎯 CMS: Updating existing content with ID:', existingContent.id);
        console.log('🎯 CMS: Original creator:', existingContent.created_by, 'Current user:', user.id);
        
        // Update existing content as draft
        const { data: updateData, error: updateError } = await supabase
          .from('cms_content')
          .update({ 
            content_data: contentData,
            published: false, // Save as draft
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContent.id)
          .select();
          
        console.log('🎯 CMS: Update result:', updateData, 'Error:', updateError);
        
        if (updateError) {
          console.log('🎯 CMS: Update failed:', updateError);
          throw updateError;
        }
      } else {
        console.log('🎯 CMS: Creating new content entry with created_by:', user.id);
        
        // Create new content as draft
        const { data: insertData, error: insertError } = await supabase
          .from('cms_content')
          .insert({
            page,
            section,
            content_key: contentKey,
            content_type: 'text',
            content_data: contentData,
            published: false, // Save as draft
            created_by: user.id  // Set the creator
          })
          .select();
          
        console.log('🎯 CMS: Insert result:', insertData, 'Error:', insertError);
        
        if (insertError) {
          console.log('🎯 CMS: Insert failed:', insertError);
          throw insertError;
        }
      }

      console.log('🎯 CMS: Save successful, showing toast and refreshing content');

      toast({
        title: "Content Saved",
        description: "Your changes have been saved as draft.",
      });
      
      setIsEditing(false);
      
      // Refresh content to show the saved changes
      console.log('🎯 CMS: Calling refreshContent...');
      refreshContent();
      
      console.log('🎯 CMS: Save process completed successfully');
    } catch (error) {
      console.error('🎯 CMS: Error saving content:', error);
      toast({
        title: "Save Failed",
        description: `Error: ${error.message || 'Unknown error'}`,
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

  // Render editing interface using React Portal
  const renderEditingInterface = () => {
    if (!isEditing) return null;
    
    const isMultiline = editValue.length > 100 || editValue.includes('\n');
    
    console.log('🎯 CMS: Rendering editing interface via portal');
    
    return createPortal(
      <>
        {/* Backdrop to prevent interaction with other elements */}
        <div 
          className="fixed inset-0 bg-black/20 z-[99998]" 
          onClick={handleCancel}
        />
        
          {/* Editing container positioned optimally */}
        <div 
          className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 space-y-4 z-[99999] max-w-md"
          style={originalStyles}
        >
          <div className="text-xs text-gray-600 font-medium border-b pb-2">
            ✏️ Editing: {page} / {section} / {contentKey}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Content</Label>
              {isMultiline ? (
                <Textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-2 border-gray-300 bg-white text-gray-900 resize-none min-h-[80px] w-full mt-1"
                  disabled={isSaving}
                  placeholder="Enter your text..."
                />
              ) : (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-2 border-gray-300 bg-white text-gray-900 w-full mt-1"
                  disabled={isSaving}
                  placeholder="Enter your text..."
                />
              )}
            </div>

            {/* Positioning Controls */}
            <div className="space-y-3 border-t pt-3">
              <div>
                <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Layout className="h-3 w-3" />
                  Page Position
                </Label>
                <Select value={positioning.containerPosition} onValueChange={(value) => setPositioning(prev => ({ ...prev, containerPosition: value }))}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Position</SelectItem>
                    <SelectItem value="page-left">Page Left</SelectItem>
                    <SelectItem value="page-center">Page Center</SelectItem>
                    <SelectItem value="page-right">Page Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <AlignLeft className="h-3 w-3" />
                  Text Alignment
                </Label>
                <Select value={positioning.alignment} onValueChange={(value) => setPositioning(prev => ({ ...prev, alignment: value }))}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">
                      <div className="flex items-center gap-2">
                        <AlignLeft className="h-3 w-3" />
                        Left
                      </div>
                    </SelectItem>
                    <SelectItem value="center">
                      <div className="flex items-center gap-2">
                        <AlignCenter className="h-3 w-3" />
                        Center
                      </div>
                    </SelectItem>
                    <SelectItem value="right">
                      <div className="flex items-center gap-2">
                        <AlignRight className="h-3 w-3" />
                        Right
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Margin Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Top Margin</Label>
                  <Select value={positioning.marginTop} onValueChange={(value) => setPositioning(prev => ({ ...prev, marginTop: value }))}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">Small</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="4">Large</SelectItem>
                      <SelectItem value="8">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Bottom Margin</Label>
                  <Select value={positioning.marginBottom} onValueChange={(value) => setPositioning(prev => ({ ...prev, marginBottom: value }))}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">Small</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="4">Large</SelectItem>
                      <SelectItem value="8">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-900 border-gray-300"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || (editValue === displayText && JSON.stringify(positioning) === JSON.stringify(currentPositioning))}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
          
          {/* Helper text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-t">
            💡 Press <kbd className="px-1 bg-white border rounded">Enter</kbd> to save, <kbd className="px-1 bg-white border rounded">Esc</kbd> to cancel
          </div>
          
          {isSaving && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            </div>
          )}
        </div>
      </>,
      document.body
    );
  };

  // Generate positioning classes
  const getPositioningClasses = () => {
    const classes = [];
    
    // Text alignment
    if (currentPositioning.alignment === 'center') classes.push('text-center');
    else if (currentPositioning.alignment === 'right') classes.push('text-right');
    else classes.push('text-left');
    
    // Margins (using Tailwind spacing scale)
    if (currentPositioning.marginTop !== '0') classes.push(`mt-${currentPositioning.marginTop}`);
    if (currentPositioning.marginBottom !== '0') classes.push(`mb-${currentPositioning.marginBottom}`);
    if (currentPositioning.marginLeft !== '0') classes.push(`ml-${currentPositioning.marginLeft}`);
    if (currentPositioning.marginRight !== '0') classes.push(`mr-${currentPositioning.marginRight}`);
    
    return classes.join(' ');
  };

  // Apply container positioning to parent elements
  const applyContainerPositioning = () => {
    if (!originalElementRef.current) return;
    
    const containerPosition = currentPositioning.containerPosition;
    if (containerPosition === 'default') return;
    
    // Find the positioned parent container (absolute, relative, fixed)
    let container = originalElementRef.current.parentElement;
    while (container && container !== document.body) {
      const computedStyle = window.getComputedStyle(container);
      if (['absolute', 'relative', 'fixed'].includes(computedStyle.position)) {
        break;
      }
      container = container.parentElement;
    }
    
    if (!container || container === document.body) {
      container = originalElementRef.current.parentElement;
    }
    
    if (container) {
      // Remove ALL positioning and transform related classes comprehensively
      const classesToRemove = Array.from(container.classList).filter((className: string) => {
        return className.match(/^(left-|right-|top-|bottom-|translate-|transform|md:|lg:|xl:|sm:)/) ||
               className.includes('left-') ||
               className.includes('right-') ||
               className.includes('translate') ||
               className.includes('transform') ||
               className.includes('text-left') ||
               className.includes('text-center') ||
               className.includes('text-right');
      });
      
      classesToRemove.forEach(className => container.classList.remove(className));
      
      // Force override with inline styles to ensure precedence
      container.style.removeProperty('left');
      container.style.removeProperty('right');
      container.style.removeProperty('transform');
      container.style.removeProperty('text-align');
      
      // Apply new positioning based on selection
      switch (containerPosition) {
        case 'page-left':
          container.style.left = '1rem';
          container.style.right = 'auto';
          container.style.transform = 'none';
          container.style.textAlign = 'left';
          break;
        case 'page-center':
          container.style.left = '50%';
          container.style.right = 'auto';
          container.style.transform = 'translateX(-50%)';
          container.style.textAlign = 'center';
          break;
        case 'page-right':
          container.style.left = 'auto';
          container.style.right = '1rem';
          container.style.transform = 'none';
          container.style.textAlign = 'right';
          break;
      }
    }
  };

  // Apply positioning when content changes
  useEffect(() => {
    if (currentPositioning.containerPosition !== 'default') {
      applyContainerPositioning();
    }
  }, [currentPositioning.containerPosition]);

  return (
    <>
      <Component 
        ref={originalElementRef}
        className={`${className} ${getPositioningClasses()} ${isEditMode ? 'cursor-pointer hover:bg-accent/20 transition-colors duration-200 rounded px-1 border-2 border-transparent hover:border-accent/30 relative' : ''}`}
        onClick={handleEdit}
        title={isEditMode ? 'Click to edit (CMS)' : undefined}
      >
        {displayText}
        {isEditMode && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full opacity-60" />
        )}
      </Component>
      
      {/* Render editing interface via portal */}
      {renderEditingInterface()}
    </>
  );
};