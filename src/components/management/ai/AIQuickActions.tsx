import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, TrendingUp, Search, Sparkles } from 'lucide-react';

interface AIQuickActionsProps {
  onActionClick: (prompt: string) => void;
}

export const AIQuickActions = ({ onActionClick }: AIQuickActionsProps) => {
  const quickActions = [
    {
      icon: Calendar,
      label: 'Check today\'s bookings',
      prompt: 'Show me all bookings scheduled for today',
    },
    {
      icon: TrendingUp,
      label: 'Revenue summary',
      prompt: 'Give me a revenue summary for this month',
    },
    {
      icon: Users,
      label: 'Upcoming events',
      prompt: 'What events are coming up in the next week?',
    },
    {
      icon: FileText,
      label: 'Pending BEOs',
      prompt: 'Show me events that need BEO generation',
    },
    {
      icon: Search,
      label: 'Search conflicts',
      prompt: 'Are there any booking conflicts I should know about?',
    },
    {
      icon: Sparkles,
      label: 'Optimisation tips',
      prompt: 'Give me insights on how to optimise our space utilisation',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant="outline"
            className="h-auto flex-col gap-2 p-3 text-left"
            onClick={() => onActionClick(action.prompt)}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-normal">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
