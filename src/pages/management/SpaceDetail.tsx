import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSpace, useSpaceHours, useUpdateSpaceHours } from '@/hooks/useSpaces';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Save, Clock, Users, User } from 'lucide-react';

const DAYS = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const SpaceDetail = () => {
  const { id } = useParams();
  const { canEdit, canEditHours } = useManagementAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hoursData, setHoursData] = useState<any[]>([]);

  const { data: space, isLoading: spaceLoading } = useSpace(id || '');
  const { data: spaceHours, isLoading: hoursLoading } = useSpaceHours(id || '');
  const updateHours = useUpdateSpaceHours();

  // Initialize hours data when space hours load
  useEffect(() => {
    if (spaceHours) {
      const fullWeek = DAYS.map((_, dayIndex) => {
        const existingHour = spaceHours.find(h => h.day_of_week === dayIndex);
        return existingHour || {
          day_of_week: dayIndex,
          open_time: '09:00',
          close_time: '23:00',
          late_close_allowed: false,
          buffer_before_min: 30,
          buffer_after_min: 60
        };
      });
      setHoursData(fullWeek);
    }
  }, [spaceHours]);

  if (spaceLoading || hoursLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ManagementLayout>
    );
  }

  if (!space) {
    return (
      <ManagementLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Space not found</p>
          <Button asChild className="mt-4">
            <Link to="/management/spaces">Back to Spaces</Link>
          </Button>
        </div>
      </ManagementLayout>
    );
  }

  const handleSaveHours = async () => {
    if (!canEditHours() || !id) return;

    try {
      await updateHours.mutateAsync({
        spaceId: id,
        hours: hoursData.map(hour => ({
          day_of_week: hour.day_of_week,
          open_time: hour.open_time || null,
          close_time: hour.close_time || null,
          late_close_allowed: hour.late_close_allowed,
          buffer_before_min: hour.buffer_before_min,
          buffer_after_min: hour.buffer_after_min
        }))
      });
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const updateHourField = (dayIndex: number, field: string, value: any) => {
    setHoursData(prev => prev.map((hour, index) => 
      index === dayIndex ? { ...hour, [field]: value } : hour
    ));
  };

  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/management/spaces">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-foreground">{space.name}</h1>
              <p className="text-muted-foreground">Space details and trading hours</p>
            </div>
          </div>

          {canEdit() && (
            <Button asChild>
              <Link to={`/management/spaces/${space.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Space
              </Link>
            </Button>
          )}
        </div>

        {/* Space Details */}
        <Card>
          <CardHeader>
            <CardTitle>Space Information</CardTitle>
            <CardDescription>Basic details and capacity information</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold">{space.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
                <code className="bg-muted px-2 py-1 rounded text-sm">{space.slug}</code>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div>
                  <Badge variant={space.is_active ? "default" : "secondary"}>
                    {space.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Display Order</Label>
                <p className="text-lg font-semibold">{space.display_order}</p>
              </div>
            </div>

            {space.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-foreground">{space.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Seated Capacity</Label>
                  <p className="text-lg font-semibold">{space.capacity_seated}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Standing Capacity</Label>
                  <p className="text-lg font-semibold">{space.capacity_standing}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Trading Hours</span>
                </CardTitle>
                <CardDescription>Configure opening hours and buffers for each day</CardDescription>
              </div>
              
              {canEditHours() && (
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={updateHours.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveHours}
                        disabled={updateHours.isPending}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updateHours.isPending ? 'Saving...' : 'Save'}</span>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Hours
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead>Close</TableHead>
                    <TableHead>Late Close</TableHead>
                    <TableHead>Buffer Before (min)</TableHead>
                    <TableHead>Buffer After (min)</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {hoursData.map((hour, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {DAYS[hour.day_of_week]}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={hour.open_time || ''}
                            onChange={(e) => updateHourField(index, 'open_time', e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <span>{hour.open_time || '—'}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={hour.close_time || ''}
                            onChange={(e) => updateHourField(index, 'close_time', e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <span>{hour.close_time || '—'}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Switch
                            checked={hour.late_close_allowed}
                            onCheckedChange={(checked) => updateHourField(index, 'late_close_allowed', checked)}
                          />
                        ) : (
                          <Badge variant={hour.late_close_allowed ? "default" : "secondary"}>
                            {hour.late_close_allowed ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={hour.buffer_before_min}
                            onChange={(e) => updateHourField(index, 'buffer_before_min', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        ) : (
                          <span>{hour.buffer_before_min}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={hour.buffer_after_min}
                            onChange={(e) => updateHourField(index, 'buffer_after_min', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        ) : (
                          <span>{hour.buffer_after_min}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
};

export default SpaceDetail;