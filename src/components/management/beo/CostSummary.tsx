import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PoundSterling, Calculator, TrendingUp } from 'lucide-react';
import { EventEquipment, EventStaffing, EventMenu } from '@/hooks/useBEOData';

interface CostSummaryProps {
  eventId: string;
  eventData: any;
  equipment: EventEquipment[];
  staffing: EventStaffing[];
  menus: EventMenu[];
  venueHire: any;
}

export const CostSummary: React.FC<CostSummaryProps> = ({ 
  eventData, 
  equipment, 
  staffing,
  menus,
  venueHire
}) => {
  // Calculate venue hire cost from dedicated table
  const venueCost = venueHire?.hire_cost || 0;
  
  // Calculate equipment costs
  const equipmentCost = equipment.reduce((sum, item) => sum + (item.hire_cost || 0), 0);

  // Calculate staffing costs (estimated based on hourly rates and 8-hour shifts)
  const staffingCost = staffing.reduce((sum, staff) => {
    const hours = 8; // Default to 8-hour shifts
    return sum + (staff.qty * (staff.hourly_rate || 0) * hours);
  }, 0);

  // Calculate menu costs (price per head * headcount)
  const headcount = eventData?.headcount || 1;
  const menuCost = menus.reduce((sum, menu) => sum + ((menu.price || 0) * headcount), 0);

  // Service charge
  const serviceChargeRate = eventData?.service_charge_pct || 0;
  const serviceCharge = (venueCost + equipmentCost + staffingCost + menuCost) * (serviceChargeRate / 100);

  const subtotal = venueCost + equipmentCost + staffingCost + menuCost;
  const total = subtotal + serviceCharge;

  const costBreakdown = [
    { label: 'Venue Hire', amount: venueCost, category: 'venue' },
    { label: 'Menu & Catering', amount: menuCost, category: 'menu' },
    { label: 'Equipment Hire', amount: equipmentCost, category: 'equipment' },
    { label: 'Staffing', amount: staffingCost, category: 'staffing' },
    { label: 'Service Charge', amount: serviceCharge, category: 'service', rate: serviceChargeRate }
  ];

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <PoundSterling className="h-5 w-5" />
            Cost Summary
          </CardTitle>
          <CardDescription>Complete financial breakdown for operational planning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-['Work_Sans'] font-medium">{item.label}</span>
                  {item.rate && (
                    <Badge variant="outline" className="ml-2">
                      {item.rate}%
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-lg">
                  £{item.amount.toFixed(2)}
                </span>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-['Work_Sans'] font-semibold">
                <span>Total</span>
                <span className="font-mono">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="font-['Work_Sans'] font-medium text-2xl text-primary">
                £{venueCost.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Venue</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((venueCost / total) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="font-['Work_Sans'] font-medium text-2xl text-secondary">
                £{menuCost.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Menu</div>
              <div className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((menuCost / total) * 100).toFixed(1) : 0}% of total
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="font-['Work_Sans'] font-medium text-2xl text-accent">
                £{equipmentCost.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Equipment</div>
              <div className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((equipmentCost / total) * 100).toFixed(1) : 0}% of total
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="font-['Work_Sans'] font-medium text-2xl text-primary">
                £{staffingCost.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Staffing</div>
              <div className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((staffingCost / total) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Equipment Costs */}
      {equipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Equipment Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipment
                .filter(item => item.hire_cost && item.hire_cost > 0)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div>
                      <span className="font-medium">{item.item_name}</span>
                      <Badge variant="outline" className="ml-2">
                        {item.quantity}x
                      </Badge>
                    </div>
                    <span className="font-mono">£{(item.hire_cost || 0).toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Menu Costs */}
      {menus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Menu Costs</CardTitle>
            <CardDescription>Per person pricing (× {headcount} guests)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menus
                .filter(menu => menu.price && menu.price > 0)
                .map((menu) => (
                  <div key={menu.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div>
                      <span className="font-medium">{menu.course}</span>
                      {menu.item_name && <span className="text-muted-foreground ml-2">- {menu.item_name}</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-mono">£{((menu.price || 0) * headcount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">£{(menu.price || 0).toFixed(2)} pp</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Staffing Costs */}
      {staffing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Staffing Costs</CardTitle>
            <CardDescription>Based on 8-hour shifts (estimates)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staffing
                .filter(staff => staff.hourly_rate && staff.hourly_rate > 0)
                .map((staff) => {
                  const hours = 8;
                  const totalCost = staff.qty * staff.hourly_rate! * hours;
                  return (
                    <div key={staff.id} className="flex items-center justify-between text-sm p-2 border rounded">
                      <div>
                        <span className="font-medium">{staff.role}</span>
                        <Badge variant="outline" className="ml-2">
                          {staff.qty}x @ £{staff.hourly_rate}/hr
                        </Badge>
                      </div>
                      <span className="font-mono">£{totalCost.toFixed(2)}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Equipment costs are based on hire charges specified in equipment records</p>
            <p>• Staffing costs are estimated using 8-hour shifts; adjust based on actual requirements</p>
            <p>• Service charges are calculated on the subtotal of all costs</p>
            <p>• Additional costs may apply for extended hours, overtime, or special requirements</p>
            <p>• All costs are excluding VAT unless otherwise specified</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};