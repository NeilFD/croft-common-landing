import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface AIActionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: {
    type: string;
    params: any;
    reasoning: string;
  };
  onConfirm: () => void;
}

export const AIActionConfirmation = ({
  open,
  onOpenChange,
  action,
  onConfirm,
}: AIActionConfirmationProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Confirm AI Action
            <Badge variant="secondary" className="text-xs">
              Requires Approval
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div>
              <p className="font-medium text-foreground mb-2">AI Reasoning:</p>
              <p className="text-sm">{action.reasoning}</p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-2">Action Details:</p>
              <div className="bg-muted p-3 rounded-md text-sm font-mono">
                <p className="mb-1">
                  <span className="text-muted-foreground">Type:</span> {action.type}
                </p>
                <p className="text-muted-foreground">Parameters:</p>
                <pre className="mt-1 text-xs overflow-auto">
                  {JSON.stringify(action.params, null, 2)}
                </pre>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This action will be logged in the audit trail with your approval.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm & Execute</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
