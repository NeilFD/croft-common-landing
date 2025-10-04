import { useEffect, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';

interface MentionSuggestion {
  id: string;
  name: string;
  display: string;
}

interface MentionAutocompleteProps {
  query: string;
  chatMembers: Array<{ user_id: string; user_name: string }>;
  onSelect: (name: string) => void;
  open: boolean;
  position: { top: number; left: number };
  onOpenChange: (open: boolean) => void;
}

export const MentionAutocomplete = ({
  query,
  chatMembers,
  onSelect,
  open,
  position,
  onOpenChange,
}: MentionAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);

  useEffect(() => {
    // Build suggestions list
    const allSuggestions: MentionSuggestion[] = [
      {
        id: 'cleo',
        name: 'Cleo',
        display: 'Cleo (AI Assistant)',
      },
      ...chatMembers.map((member) => ({
        id: member.user_id,
        name: member.user_name,
        display: member.user_name,
      })),
    ];

    // Filter based on query
    const filtered = query
      ? allSuggestions.filter((s) =>
          s.name.toLowerCase().includes(query.toLowerCase())
        )
      : allSuggestions;

    setSuggestions(filtered);
  }, [query, chatMembers]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }}
    >
      <div className="w-64 rounded-md border bg-popover shadow-md">
        <Command className="bg-transparent">
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.id}
                  value={suggestion.name}
                  onSelect={() => {
                    onSelect(suggestion.name);
                    onOpenChange(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="font-industrial">{suggestion.display}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};
