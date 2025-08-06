import { eventCategoryColors } from '@/types/event';

export const EventColorLegend = () => {
  const categories = Object.entries(eventCategoryColors);

  return (
    <div className="md:hidden bg-background border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Event Categories</h3>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(([category, colors]) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{
                backgroundColor: `hsl(var(--accent-${colors.accent.replace('accent-', '')}))`
              }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};