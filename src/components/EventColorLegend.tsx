import { eventCategoryColors } from '@/types/event';

export const EventColorLegend = ({ className }: { className?: string }) => {
  const categories = Object.entries(eventCategoryColors);

  return (
    <div className={`bg-background border border-border rounded-lg p-4 mb-4 ${className || ''}`}>
      <h3 className="text-sm font-medium text-foreground mb-3">Event Categories</h3>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(([category, colors]) => (
          <div key={category} className="flex items-center justify-center">
            <div
              className="w-16 h-8 rounded flex items-center justify-center"
              style={{
                backgroundColor: `hsl(var(--accent-${colors.accent.replace('accent-', '')}))`
              }}
            >
              <span className="text-xs font-bold text-white capitalize">
                {category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};