import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShoppingBag } from 'lucide-react';

interface SpendingAnalysisItem {
  itemName: string;
  totalQuantity: number;
  totalSpend: number;
  averagePrice: number;
  timesOrdered: number;
}

interface SpendingAnalysisTableProps {
  data: SpendingAnalysisItem[];
  loading: boolean;
}

const SpendingAnalysisTable: React.FC<SpendingAnalysisTableProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-destructive" />
            Table of Danger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading spending analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-destructive" />
            Table of Danger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No receipt items found for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-destructive" />
          Table of Danger
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your most expensive items ranked by total spending
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Total Qty</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
              <TableHead className="text-right">Times Ordered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.itemName}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <Badge 
                        variant={index === 0 ? "destructive" : index === 1 ? "secondary" : "outline"}
                        className="w-6 h-6 text-xs p-0 flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                    )}
                    <span className={index < 3 ? "font-semibold" : ""}>{item.itemName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.totalQuantity}</TableCell>
                <TableCell className="text-right font-semibold">
                  £{item.totalSpend.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  £{item.averagePrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{item.timesOrdered}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SpendingAnalysisTable;