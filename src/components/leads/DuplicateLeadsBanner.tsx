import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useDuplicateLeads } from "@/hooks/useDuplicateLeads";
import { Link } from "react-router-dom";

interface DuplicateLeadsBannerProps {
  leadId: string;
}

export const DuplicateLeadsBanner = ({ leadId }: DuplicateLeadsBannerProps) => {
  const { data: duplicates, isLoading } = useDuplicateLeads(leadId);

  if (isLoading || !duplicates || duplicates.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Possible duplicate leads detected:</strong> Found {duplicates.length} lead(s) with the same email address.{' '}
        {duplicates.map((duplicate, index) => (
          <span key={duplicate.possible_duplicate_id}>
            <Link 
              to={`/management/leads/${duplicate.possible_duplicate_id}`}
              className="underline hover:no-underline"
            >
              {duplicate.leads?.[0]?.first_name} {duplicate.leads?.[0]?.last_name} ({duplicate.leads?.[0]?.status})
            </Link>
            {index < duplicates.length - 1 && ', '}
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
};