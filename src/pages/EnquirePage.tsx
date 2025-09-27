import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useActiveSpaces } from '@/hooks/useSpaces';
import { useCreateLead, type CreateLeadPayload } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

const enquirySchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().optional(),
  event_type: z.string().optional(),
  preferred_space: z.string().min(1, 'Please select a space'),
  preferred_date: z.string().optional(),
  date_flexible: z.boolean().default(false),
  headcount: z.coerce.number().min(1, 'Headcount must be at least 1').optional(),
  budget_low: z.coerce.number().min(0, 'Budget must be non-negative').optional(),
  budget_high: z.coerce.number().min(0, 'Budget must be non-negative').optional(),
  message: z.string().max(1000).optional(),
  privacy_accepted: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy to submit this form"
  }),
  consent_marketing: z.boolean().default(false),
  website: z.string().optional(), // Honeypot field
}).refine((data) => {
  if (data.budget_low && data.budget_high && data.budget_low > data.budget_high) {
    return false;
  }
  return true;
}, {
  message: 'Budget range is invalid',
  path: ['budget_high'],
}).refine((data) => {
  return data.preferred_date || data.date_flexible;
}, {
  message: 'Please provide a preferred date or indicate dates are flexible',
  path: ['preferred_date'],
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

const EVENT_TYPES = [
  'Corporate Event',
  'Private Dining',
  'Wedding Reception',
  'Birthday Party',
  'Meeting/Conference',
  'Product Launch',
  'Networking Event',
  'Workshop/Training',
  'Other'
];

export default function EnquirePage() {
  const [submitted, setSubmitted] = useState(false);
  const [submissionDelay, setSubmissionDelay] = useState(false);
  
  const { data: spaces, isLoading: spacesLoading } = useActiveSpaces();
  const createLead = useCreateLead();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      date_flexible: false,
      website: '', // Honeypot
    },
  });

  const watchDateFlexible = watch('date_flexible');
  const watchPreferredDate = watch('preferred_date');

  const onSubmit = async (data: EnquiryFormData) => {
    if (submitted) return;
    
    // Basic rate limiting - prevent double submission
    if (submissionDelay) {
      toast({
        title: "Please wait",
        description: "Form submission in progress...",
        variant: "destructive",
      });
      return;
    }

    setSubmissionDelay(true);
    setTimeout(() => setSubmissionDelay(false), 3000);

    try {
      // Clean the payload to remove empty strings and honeypot
      const { website, privacy_accepted, consent_marketing, ...cleanedData } = data;
      
      // Convert empty strings to undefined for optional fields
      const finalPayload: CreateLeadPayload = {
        first_name: cleanedData.first_name,
        last_name: cleanedData.last_name,
        email: cleanedData.email,
        preferred_space: cleanedData.preferred_space,
        phone: cleanedData.phone || undefined,
        event_type: cleanedData.event_type || undefined,
        preferred_date: cleanedData.preferred_date || undefined,
        date_flexible: cleanedData.date_flexible,
        headcount: cleanedData.headcount || undefined,
        budget_low: cleanedData.budget_low || undefined,
        budget_high: cleanedData.budget_high || undefined,
        message: cleanedData.message || undefined,
        source: 'enquiry_form',
        privacy_accepted,
        consent_marketing,
      };

      await createLead.mutateAsync(finalPayload);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting enquiry:', error);
      
      let errorMessage = "There was an error submitting your enquiry. Please try again.";
      
      if (error.message?.includes('rate_limit')) {
        errorMessage = "Too many submissions from your location. Please try again later.";
      } else if (error.message?.includes('spam_detected')) {
        errorMessage = "Invalid form submission detected.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Thank You - Croft Common</title>
          <meta name="description" content="Thank you for your enquiry. We'll be in touch soon to discuss your event at Croft Common." />
        </Helmet>
        
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Thank You!</CardTitle>
              <CardDescription>
                We've received your enquiry and will be in touch within 24 hours to discuss your event.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                In the meantime, feel free to explore our spaces and facilities.
              </p>
              <Button asChild className="w-full">
                <a href="/">Return to Homepage</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Make an Enquiry - Croft Common</title>
        <meta name="description" content="Get in touch to book your event at Croft Common. Private dining, corporate events, and special occasions in our beautiful spaces." />
        <meta name="keywords" content="croft common, event booking, private dining, corporate events, venue hire, enquiry" />
        <link rel="canonical" href={`${window.location.origin}/enquire`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CC</span>
                </div>
                <span className="font-bold text-xl">Croft Common</span>
              </a>
              <nav>
                <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Back to Homepage
                </a>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Make an Enquiry</h1>
            <p className="text-lg text-muted-foreground">
              Tell us about your event and we'll get back to you with availability and pricing.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Enquiry Form</CardTitle>
              <CardDescription>
                All fields marked with * are required. We'll respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Honeypot field */}
                <Input
                  {...register('website')}
                  type="text"
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        {...register('first_name')}
                        placeholder="Your first name"
                      />
                      {errors.first_name && (
                        <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        {...register('last_name')}
                        placeholder="Your last name"
                      />
                      {errors.last_name && (
                        <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="07123 456789"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Event Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Event Details</h3>
                  
                  <div>
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select onValueChange={(value) => setValue('event_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_space">Preferred Space *</Label>
                    <Select onValueChange={(value) => setValue('preferred_space', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a space" />
                      </SelectTrigger>
                      <SelectContent>
                        {spacesLoading ? (
                          <SelectItem value="loading" disabled>Loading spaces...</SelectItem>
                        ) : (
                          spaces?.map((space) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                              {space.capacity_seated && ` (seated: ${space.capacity_seated})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.preferred_space && (
                      <p className="text-sm text-destructive mt-1">{errors.preferred_space.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="preferred_date">Preferred Date</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      {...register('preferred_date')}
                      disabled={watchDateFlexible}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="date_flexible"
                        checked={watchDateFlexible}
                        onCheckedChange={(checked) => {
                          setValue('date_flexible', checked as boolean);
                          if (checked) {
                            setValue('preferred_date', '');
                          }
                        }}
                      />
                      <Label htmlFor="date_flexible" className="text-sm font-normal">
                        My dates are flexible
                      </Label>
                    </div>
                    
                    {errors.preferred_date && (
                      <p className="text-sm text-destructive mt-1">{errors.preferred_date.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="headcount">Expected Number of Guests</Label>
                    <Input
                      id="headcount"
                      type="number"
                      min="1"
                      {...register('headcount')}
                      placeholder="Number of guests"
                    />
                    {errors.headcount && (
                      <p className="text-sm text-destructive mt-1">{errors.headcount.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Budget Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Budget Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional but helps us tailor our recommendations.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_low">Budget From (£)</Label>
                      <Input
                        id="budget_low"
                        type="number"
                        min="0"
                        step="50"
                        {...register('budget_low')}
                        placeholder="0"
                      />
                      {errors.budget_low && (
                        <p className="text-sm text-destructive mt-1">{errors.budget_low.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="budget_high">Budget To (£)</Label>
                      <Input
                        id="budget_high"
                        type="number"
                        min="0"
                        step="50"
                        {...register('budget_high')}
                        placeholder="0"
                      />
                      {errors.budget_high && (
                        <p className="text-sm text-destructive mt-1">{errors.budget_high.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  
                  <div>
                    <Label htmlFor="message">Tell us more about your event</Label>
                    <Textarea
                      id="message"
                      {...register('message')}
                      placeholder="Any specific requirements, dietary restrictions, setup preferences, or questions..."
                      className="min-h-[100px]"
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
                    )}
                  </div>
                  </div>

                  {/* Honeypot field - hidden from users */}
                  <div style={{ display: 'none' }}>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register("website")}
                    />
                  </div>

                  {/* GDPR Compliance */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacy_accepted"
                        {...register("privacy_accepted")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="privacy_accepted"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I accept the privacy policy *
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Required: We need your consent to process your enquiry.
                        </p>
                      </div>
                    </div>
                    {errors.privacy_accepted && (
                      <p className="text-sm text-destructive">{errors.privacy_accepted.message}</p>
                    )}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="consent_marketing"
                        {...register("consent_marketing")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="consent_marketing"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Send me marketing updates
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Optional: Receive updates about our venues and events.
                        </p>
                      </div>
                    </div>
                  </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || submissionDelay}
                  size="lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}