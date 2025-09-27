import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpaces, useUpdateSpace, useDeleteSpace } from '@/hooks/useSpaces';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Edit, Trash2, Users, User, HelpCircle, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const VenuesList = () => {
  const { data: spaces, isLoading } = useSpaces();
  const { canEdit } = useManagementAuth();
  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!canEdit()) return;
    
    updateSpace.mutate({
      id,
      is_active: !currentActive
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    deleteSpace.mutate(id, {
      onSettled: () => setDeletingId(null)
    });
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <TooltipProvider>
        <div className="space-y-4 md:space-y-6 p-3 md:p-6">
          {/* Header with Back Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <Button variant="ghost" size="sm" asChild className="font-industrial">
                <Link to="/management/spaces" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Link>
              </Button>
              <div>
                <h1 className="font-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider text-foreground">VENUES</h1>
                <p className="font-industrial text-muted-foreground text-sm md:text-base">
                  Physical spaces & capacities
                </p>
              </div>
            </div>
            
            {canEdit() && (
              <Button asChild className="btn-primary font-brutalist uppercase tracking-wide h-10 md:h-11 text-sm">
                <Link to="/management/spaces/venues/new" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>ADD</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {spaces?.map((space) => (
              <Card key={space.id} className="border-industrial">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={`/management/spaces/venues/${space.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {space.name}
                      </Link>
                      <code className="bg-muted px-2 py-1 rounded text-xs block mt-1 truncate">
                        {space.slug}
                      </code>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {canEdit() ? (
                        <Switch
                          checked={space.is_active}
                          onCheckedChange={() => handleToggleActive(space.id, space.is_active)}
                          disabled={updateSpace.isPending}
                        />
                      ) : (
                        <Badge variant={space.is_active ? "default" : "secondary"} className="text-xs">
                          {space.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Seated:</span>
                      <span className="font-medium">{space.capacity_seated}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Standing:</span>
                      <span className="font-medium">{space.capacity_standing}</span>
                    </div>
                  </div>

                  {canEdit() && (
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs"
                      >
                        <Link to={`/management/spaces/venues/${space.id}/edit`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        
                        <AlertDialogContent className="mx-4 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{space.name}"? This action cannot be undone 
                              and will also delete all associated trading hours.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(space.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingId === space.id}
                            >
                              {deletingId === space.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Identifier</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>URL-friendly identifier used in booking links and internal references</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Seated</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Standing</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Status</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Controls whether this venue is available for new bookings</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  {canEdit() && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {spaces?.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <Link 
                        to={`/management/spaces/venues/${space.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {space.name}
                      </Link>
                    </TableCell>
                    
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {space.slug}
                      </code>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {space.capacity_seated}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {space.capacity_standing}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {canEdit() ? (
                          <Switch
                            checked={space.is_active}
                            onCheckedChange={() => handleToggleActive(space.id, space.is_active)}
                            disabled={updateSpace.isPending}
                          />
                        ) : (
                          <Badge variant={space.is_active ? "default" : "secondary"}>
                            {space.is_active ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    {canEdit() && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/management/spaces/venues/${space.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{space.name}"? This action cannot be undone 
                                  and will also delete all associated trading hours.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(space.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === space.id}
                                >
                                  {deletingId === space.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!spaces?.length && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No venues found</p>
              {canEdit() && (
                <Button asChild>
                  <Link to="/management/spaces/venues/new">Create your first venue</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </TooltipProvider>
    </ManagementLayout>
  );
};

export default VenuesList;