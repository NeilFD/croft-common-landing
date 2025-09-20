import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface PersonalizationHelperProps {
  onInsertCode: (code: string) => void;
  isVisible: boolean;
}

const PERSONALIZATION_CODES = [
  {
    code: '{{first_name}}',
    description: 'Member\'s first name',
    example: 'John',
    icon: User
  }
];

export const PersonalizationHelper: React.FC<PersonalizationHelperProps> = ({
  onInsertCode,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-900">
          Personalisation Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-blue-700">
          Click to insert personalisation codes into your message:
        </p>
        
        <div className="grid gap-2">
          {PERSONALIZATION_CODES.map(({ code, description, example, icon: Icon }) => (
            <div key={code} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3 text-blue-600" />
                <div>
                  <code className="text-xs bg-blue-100 px-1 py-0.5 rounded text-blue-800">
                    {code}
                  </code>
                  <p className="text-xs text-blue-600">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                  ex: {example}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onInsertCode(code)}
                  className="h-7 px-2 text-xs border-blue-200 hover:bg-blue-100"
                >
                  Insert
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
          <strong>Example:</strong> "Welcome {'{{first_name}}'} to our exclusive club!"
          <br />
          <strong>Becomes:</strong> "Welcome John to our exclusive club!"
        </div>
      </CardContent>
    </Card>
  );
};