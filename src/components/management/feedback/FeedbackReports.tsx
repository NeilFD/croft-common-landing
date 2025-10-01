import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Share2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShareFeedbackDialog } from './ShareFeedbackDialog';

interface FeedbackReportsProps {
  data: any[];
  dateRange: string;
}

export function FeedbackReports({ data, dateRange }: FeedbackReportsProps) {
  const [reportType, setReportType] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data: report, error } = await supabase.functions.invoke('generate-feedback-report', {
        body: {
          feedbackData: data,
          reportType,
          dateRange
        }
      });

      if (error) throw error;

      setReportData(report);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (reportData) {
      setShareDialogOpen(true);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Create comprehensive feedback analysis reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="trends">Trend Analysis</SelectItem>
                  <SelectItem value="sentiment">Sentiment Deep Dive</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={generateReport} disabled={isGenerating || !data.length}>
                <FileText className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>

            {reportData && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{reportData.title}</h3>
                    <p className="text-sm text-muted-foreground">{reportData.period}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: reportData.content }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Report Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-sm text-muted-foreground">Total Feedback</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(data.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / data.length || 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.filter(f => f.message?.trim()).length}
                </div>
                <div className="text-sm text-muted-foreground">With Comments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.filter(f => f.is_anonymous).length}
                </div>
                <div className="text-sm text-muted-foreground">Anonymous</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ShareFeedbackDialog
        feedback={reportData}
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        isReport={true}
      />
    </>
  );
}
