import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  met: boolean;
  text: string;
}

interface PasswordStrengthIndicatorProps {
  requirements: PasswordRequirement[];
}

export const PasswordStrengthIndicator = ({ requirements }: PasswordStrengthIndicatorProps) => {
  const allMet = requirements.every(r => r.met);
  const strength = requirements.filter(r => r.met).length / requirements.length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-1">
        {requirements.map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              i < strength * requirements.length
                ? strength < 0.5
                  ? 'bg-destructive'
                  : strength < 0.75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="space-y-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
