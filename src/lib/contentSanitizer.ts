/**
 * Content sanitization utilities for cleaning HTML tags and formatting text content
 */

/**
 * Clean HTML tags from content and convert basic formatting to plain text
 */
export const sanitizeContentText = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // Convert <br> and <br/> tags to line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert <p> tags to line breaks (with double break for paragraphs)
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Convert HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up excess whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .replace(/[ \t]+/g, ' '); // Normalize spaces
};

/**
 * Process content for display with proper line break handling
 */
export const processContentForDisplay = (content: string): string => {
  const cleaned = sanitizeContentText(content);
  return cleaned;
};

/**
 * Bulk clean content in database records
 */
export const bulkCleanContent = async (
  records: Array<{ id: string; content: string }>,
  updateCallback: (id: string, cleanedContent: string) => Promise<void>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const cleanedContent = sanitizeContentText(record.content);
      if (cleanedContent !== record.content) {
        await updateCallback(record.id, cleanedContent);
        success++;
      }
    } catch (error) {
      console.error(`Failed to clean content for record ${record.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
};