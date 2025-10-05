import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useSpace, useCreateSpace, useUpdateSpace, CreateSpaceData, useActiveSpaces } from '@/hooks/useSpaces';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

const spaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  capacity_seated: z.number().min(0, 'Seated capacity must be 0 or greater').int(),
  capacity_standing: z.number().min(0, 'Standing capacity must be 0 or greater').int(),
  min_guests: z.number().min(0).int().optional(),
  max_guests: z.number().min(0).int().optional(),
  is_active: z.boolean(),
  display_order: z.number().min(0, 'Display order must be 0 or greater').int(),
  combinable_with: z.array(z.string()).optional(),
  ambience: z.string().optional(),
  natural_light: z.string().optional(),
  outdoor_access: z.boolean().optional(),
  av_capabilities: z.array(z.string()).optional(),
  layout_flexibility: z.string().optional(),
  catering_style: z.array(z.string()).optional(),
  ideal_event_types: z.array(z.string()).optional(),
  unique_features: z.array(z.string()).optional(),
  accessibility_features: z.array(z.string()).optional(),
  pricing_tier: z.string().optional(),
}).refine((data) => {
  if (data.min_guests && data.max_guests) {
    return data.min_guests <= data.max_guests;
  }
  return true;
}, {
  message: "Minimum guests must be less than or equal to maximum guests",
  path: ["min_guests"],
});

type SpaceFormData = z.infer<typeof spaceSchema>;

const SpaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useManagementAuth();
  const isEdit = !!id && id !== 'new';
  
  const { data: space, isLoading: spaceLoading } = useSpace(id || '');
  const { data: allSpaces } = useActiveSpaces();
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
      min_guests: undefined,
      max_guests: undefined,
      is_active: true,
      display_order: 0,
      combinable_with: [],
      outdoor_access: false,
      av_capabilities: [],
      catering_style: [],
      ideal_event_types: [],
      unique_features: [],
      accessibility_features: [],
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
      setValue('min_guests', (space as any).min_guests || undefined);
      setValue('max_guests', (space as any).max_guests || undefined);
      setValue('is_active', space.is_active);
      setValue('display_order', space.display_order);
      setValue('combinable_with', space.combinable_with || []);
      setValue('ambience', (space as any).ambience || '');
      setValue('natural_light', (space as any).natural_light || '');
      setValue('outdoor_access', (space as any).outdoor_access || false);
      setValue('av_capabilities', (space as any).av_capabilities || []);
      setValue('layout_flexibility', (space as any).layout_flexibility || '');
      setValue('catering_style', (space as any).catering_style || []);
      setValue('ideal_event_types', (space as any).ideal_event_types || []);
      setValue('unique_features', (space as any).unique_features || []);
      setValue('accessibility_features', (space as any).accessibility_features || []);
      setValue('pricing_tier', (space as any).pricing_tier || '');
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

              {/* Capacity & Guests Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">CAPACITY & GUESTS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="min_guests" className="font-industrial font-medium">Minimum Guests</Label>
                    <Input
                      id="min_guests"
                      type="number"
                      min="0"
                      {...register('min_guests', { valueAsNumber: true })}
                      placeholder="e.g. 10"
                      className="font-industrial"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="max_guests" className="font-industrial font-medium">Maximum Guests</Label>
                    <Input
                      id="max_guests"
                      type="number"
                      min="0"
                      {...register('max_guests', { valueAsNumber: true })}
                      placeholder="e.g. 200"
                      className="font-industrial"
                    />
                    {errors.min_guests && (
                      <p className="text-sm text-destructive font-industrial">{errors.min_guests.message}</p>
                    )}
                  </div>

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
                </div>
              </div>

              {/* Atmosphere & Character Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">ATMOSPHERE & CHARACTER</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="ambience" className="font-industrial font-medium">Ambience</Label>
                    <Input
                      id="ambience"
                      {...register('ambience')}
                      placeholder="e.g. Elegant, Industrial, Cosy"
                      className="font-industrial"
                    />
                    <p className="text-xs text-muted-foreground font-industrial">
                      Describe the overall atmosphere and feel
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="natural_light" className="font-industrial font-medium">Natural Light</Label>
                    <select
                      id="natural_light"
                      {...register('natural_light')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-industrial"
                    >
                      <option value="">Select...</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="moderate">Moderate</option>
                      <option value="limited">Limited</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="outdoor_access"
                    checked={watch('outdoor_access')}
                    onCheckedChange={(checked) => setValue('outdoor_access', checked)}
                  />
                  <Label htmlFor="outdoor_access" className="font-industrial font-medium">Has Outdoor Access</Label>
                </div>
              </div>

              {/* Technical Capabilities Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">TECHNICAL CAPABILITIES</h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="av_capabilities" className="font-industrial font-medium">AV Capabilities</Label>
                    <MultiSelect
                      options={[
                        { label: 'Projector', value: 'projector' },
                        { label: 'Sound System', value: 'sound_system' },
                        { label: 'Microphones', value: 'microphones' },
                        { label: 'LED Screen', value: 'led_screen' },
                        { label: 'Stage Lighting', value: 'stage_lighting' },
                        { label: 'Recording Equipment', value: 'recording' },
                      ]}
                      selected={Array.isArray(watch('av_capabilities')) ? watch('av_capabilities') : []}
                      onChange={(values) => setValue('av_capabilities', values)}
                      placeholder="Select AV equipment..."
                      className="font-industrial"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="layout_flexibility" className="font-industrial font-medium">Layout Flexibility</Label>
                    <select
                      id="layout_flexibility"
                      {...register('layout_flexibility')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-industrial"
                    >
                      <option value="">Select...</option>
                      <option value="highly_flexible">Highly Flexible</option>
                      <option value="moderately_flexible">Moderately Flexible</option>
                      <option value="fixed">Fixed Layout</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Catering & Events Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">CATERING & EVENTS</h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="catering_style" className="font-industrial font-medium">Catering Style</Label>
                    <MultiSelect
                      options={[
                        { label: 'Buffet', value: 'buffet' },
                        { label: 'Sit-down Meal', value: 'sit_down' },
                        { label: 'Canapés', value: 'canapes' },
                        { label: 'Cocktail Bar', value: 'cocktail_bar' },
                        { label: 'Street Food', value: 'street_food' },
                        { label: 'BBQ', value: 'bbq' },
                      ]}
                      selected={Array.isArray(watch('catering_style')) ? watch('catering_style') : []}
                      onChange={(values) => setValue('catering_style', values)}
                      placeholder="Select catering styles..."
                      className="font-industrial"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="ideal_event_types" className="font-industrial font-medium">Ideal Event Types</Label>
                    <MultiSelect
                      options={[
                        { label: 'Corporate Event', value: 'corporate' },
                        { label: 'Wedding', value: 'wedding' },
                        { label: 'Birthday Party', value: 'birthday' },
                        { label: 'Conference', value: 'conference' },
                        { label: 'Workshop', value: 'workshop' },
                        { label: 'Exhibition', value: 'exhibition' },
                        { label: 'Networking', value: 'networking' },
                        { label: 'Performance', value: 'performance' },
                      ]}
                      selected={Array.isArray(watch('ideal_event_types')) ? watch('ideal_event_types') : []}
                      onChange={(values) => setValue('ideal_event_types', values)}
                      placeholder="Select event types..."
                      className="font-industrial"
                    />
                  </div>
                </div>
              </div>

              {/* Features & Accessibility Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">FEATURES & ACCESSIBILITY</h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="unique_features" className="font-industrial font-medium">Unique Features</Label>
                    <MultiSelect
                      options={[
                        { label: 'Fireplace', value: 'fireplace' },
                        { label: 'High Ceilings', value: 'high_ceilings' },
                        { label: 'Historic Building', value: 'historic' },
                        { label: 'Waterfront Views', value: 'waterfront' },
                        { label: 'Private Bar', value: 'private_bar' },
                        { label: 'Kitchen Facilities', value: 'kitchen' },
                        { label: 'Dance Floor', value: 'dance_floor' },
                        { label: 'Garden Area', value: 'garden' },
                      ]}
                      selected={Array.isArray(watch('unique_features')) ? watch('unique_features') : []}
                      onChange={(values) => setValue('unique_features', values)}
                      placeholder="Select unique features..."
                      className="font-industrial"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="accessibility_features" className="font-industrial font-medium">Accessibility Features</Label>
                    <MultiSelect
                      options={[
                        { label: 'Wheelchair Access', value: 'wheelchair_access' },
                        { label: 'Lift', value: 'lift' },
                        { label: 'Accessible Toilets', value: 'accessible_toilets' },
                        { label: 'Hearing Loop', value: 'hearing_loop' },
                        { label: 'Braille Signage', value: 'braille' },
                        { label: 'Assistance Dogs Welcome', value: 'assistance_dogs' },
                      ]}
                      selected={Array.isArray(watch('accessibility_features')) ? watch('accessibility_features') : []}
                      onChange={(values) => setValue('accessibility_features', values)}
                      placeholder="Select accessibility features..."
                      className="font-industrial"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Settings Section */}
              <div className="space-y-6 pt-6 border-t border-industrial">
                <h3 className="font-brutalist text-xl font-bold uppercase tracking-wide">PRICING & SETTINGS</h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="pricing_tier" className="font-industrial font-medium">Pricing Tier</Label>
                    <select
                      id="pricing_tier"
                      {...register('pricing_tier')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-industrial"
                    >
                      <option value="">Select...</option>
                      <option value="budget">Budget</option>
                      <option value="mid_range">Mid Range</option>
                      <option value="premium">Premium</option>
                      <option value="luxury">Luxury</option>
                    </select>
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
                    <p className="text-xs text-muted-foreground font-industrial">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="combinable_with" className="font-industrial font-medium">Can be combined with</Label>
                <MultiSelect
                  options={allSpaces?.filter(s => s.id !== id).map(s => ({
                    label: s.name,
                    value: s.id
                  })) || []}
                  selected={Array.isArray(watch('combinable_with')) ? watch('combinable_with') : []}
                  onChange={(values) => setValue('combinable_with', values)}
                  placeholder="Select spaces that can be combined..."
                  className="font-industrial"
                />
                <p className="text-xs text-muted-foreground font-industrial">
                  Select other spaces that can be joined together for larger events
                </p>
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