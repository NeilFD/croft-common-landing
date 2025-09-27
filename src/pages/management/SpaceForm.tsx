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

  // Auto-generate slug from name
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
        await updateSpace.mutateAsync({ id, ...data });
      } else {
        await createSpace.mutateAsync(data as CreateSpaceData);
      }
      navigate('/management/spaces');
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <ManagementLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/management/spaces">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? 'Edit Space' : 'Create Space'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update space details and capacities' : 'Add a new venue space'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Space Details</CardTitle>
            <CardDescription>
              Configure the basic information and capacities for this space
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g. Main Hall"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="e.g. main-hall"
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the space..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity_seated">Seated Capacity *</Label>
                  <Input
                    id="capacity_seated"
                    type="number"
                    min="0"
                    {...register('capacity_seated', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.capacity_seated && (
                    <p className="text-sm text-destructive">{errors.capacity_seated.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity_standing">Standing Capacity *</Label>
                  <Input
                    id="capacity_standing"
                    type="number"
                    min="0"
                    {...register('capacity_standing', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.capacity_standing && (
                    <p className="text-sm text-destructive">{errors.capacity_standing.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  {...register('display_order', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.display_order && (
                  <p className="text-sm text-destructive">{errors.display_order.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  {...register('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Space' : 'Create Space'}</span>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link to="/management/spaces">Cancel</Link>
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