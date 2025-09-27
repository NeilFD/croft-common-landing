import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useSpace, useCreateSpace, useUpdateSpace, CreateSpaceData } from '@/hooks/useSpaces';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

const spaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  capacity_seated: z.number().min(0, 'Seated capacity must be 0 or greater').int(),
  capacity_standing: z.number().min(0, 'Standing capacity must be 0 or greater').int(),
  is_active: z.boolean(),
  display_order: z.number().min(0, 'Display order must be 0 or greater').int()
});

type SpaceFormData = z.infer<typeof spaceSchema>;

const SpaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useManagementAuth();
  const isEdit = !!id && id !== 'new';
  
  const { data: space, isLoading: spaceLoading } = useSpace(id || '');
  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      capacity_seated: 0,
      capacity_standing: 0,
      is_active: true,
      display_order: 0
    }
  });

  const watchName = watch('name');

  // Auto-generate slug from name (client-side preview only)
  // Server will normalize the final slug via trigger
  useEffect(() => {
    if (!isEdit && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [watchName, isEdit, setValue]);

  // Load existing space data
  useEffect(() => {
    if (space && isEdit) {
      setValue('name', space.name);
      setValue('slug', space.slug);
      setValue('description', space.description || '');
      setValue('capacity_seated', space.capacity_seated);
      setValue('capacity_standing', space.capacity_standing);
      setValue('is_active', space.is_active);
      setValue('display_order', space.display_order);
    }
  }, [space, isEdit, setValue]);

  if (!canEdit()) {
    return (
      <ManagementLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to edit spaces.</p>
          <Button asChild className="mt-4">
            <Link to="/management/spaces">Back to Spaces</Link>
          </Button>
        </div>
      </ManagementLayout>
    );
  }

  if (isEdit && spaceLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ManagementLayout>
    );
  }

  const onSubmit = async (data: SpaceFormData) => {
    try {
      if (isEdit && id) {
        // Update existing space - server normalizes slug
        await updateSpace.mutateAsync({ id, ...data });
      } else {
        // Create new space - server normalizes slug
        await createSpace.mutateAsync(data as CreateSpaceData);
      }
      // Navigate back to list - trust server-normalized data
      navigate('/management/spaces');
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <ManagementLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" asChild className="font-industrial">
              <Link to="/management/spaces/venues" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            </Button>
            
            <div>
              <h1 className="font-brutalist text-4xl font-black uppercase tracking-wider text-foreground">
                {isEdit ? 'EDIT VENUE' : 'NEW VENUE'}
              </h1>
              <p className="font-industrial text-muted-foreground">
                {isEdit ? 'Update venue details' : 'Add venue space'}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-industrial">
          <CardHeader>
            <CardTitle className="font-brutalist text-2xl font-black uppercase tracking-wide">VENUE DETAILS</CardTitle>
            <CardDescription className="font-industrial">
              Configure space information and capacities
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="font-industrial font-medium">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g. Main Hall"
                    className="font-industrial"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive font-industrial">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="slug" className="font-industrial font-medium">Identifier *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="e.g. main-hall"
                    className="font-mono text-sm"
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive font-industrial">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="font-industrial font-medium">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Space description..."
                  rows={3}
                  className="font-industrial"
                />
                {errors.description && (
                  <p className="text-sm text-destructive font-industrial">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="capacity_seated" className="font-industrial font-medium">Seated Capacity *</Label>
                  <Input
                    id="capacity_seated"
                    type="number"
                    min="0"
                    {...register('capacity_seated', { valueAsNumber: true })}
                    placeholder="0"
                    className="font-industrial"
                  />
                  {errors.capacity_seated && (
                    <p className="text-sm text-destructive font-industrial">{errors.capacity_seated.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="capacity_standing" className="font-industrial font-medium">Standing Capacity *</Label>
                  <Input
                    id="capacity_standing"
                    type="number"
                    min="0"
                    {...register('capacity_standing', { valueAsNumber: true })}
                    placeholder="0"
                    className="font-industrial"
                  />
                  {errors.capacity_standing && (
                    <p className="text-sm text-destructive font-industrial">{errors.capacity_standing.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="display_order" className="font-industrial font-medium">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    {...register('display_order', { valueAsNumber: true })}
                    placeholder="0"
                    className="font-industrial"
                  />
                  {errors.display_order && (
                    <p className="text-sm text-destructive font-industrial">{errors.display_order.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="is_active"
                  {...register('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active" className="font-industrial font-medium">Active (available for bookings)</Label>
              </div>

              <div className="flex items-center space-x-4 pt-6 border-t border-industrial">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary font-brutalist uppercase tracking-wide flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'SAVING...' : isEdit ? 'UPDATE' : 'CREATE'}</span>
                </Button>
                
                <Button variant="outline" asChild className="font-brutalist uppercase tracking-wide">
                  <Link to="/management/spaces/venues">CANCEL</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
};

export default SpaceForm;