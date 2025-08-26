import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isAutopopulated?: boolean;
}

export const ProfileFormSection: React.FC<ProfileFormSectionProps> = ({
  title,
  description,
  children,
  isAutopopulated = false,
}) => {
  return (
    <Card className="border-2 border-black shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground font-brutalist text-lg">
            {title}
          </CardTitle>
          {isAutopopulated && (
            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full border border-pink-300">
              Pre-filled from signup
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};