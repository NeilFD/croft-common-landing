import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import CroftLogo from '@/components/CroftLogo';

const vendorInquirySchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  businessType: z.string().min(1, "Please select a business type"),
  yearsExperience: z.string().optional(),
  currentLocation: z.string().optional(),
  cuisineStyle: z.string().optional(),
  teamSize: z.string().optional(),
  dailyCoversTarget: z.string().optional(),
  previousFoodHallExperience: z.boolean(),
  socialMediaHandles: z.string().optional(),
  uniqueSellingPoint: z.string().optional(),
  questionsComments: z.string().optional(),
});

type VendorInquiryData = z.infer<typeof vendorInquirySchema>;

export const QuestionnaireSlide: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<VendorInquiryData>({
    resolver: zodResolver(vendorInquirySchema),
    defaultValues: {
      businessName: '',
      contactName: '',
      email: user?.email || '',
      phone: '',
      businessType: '',
      yearsExperience: '',
      currentLocation: '',
      cuisineStyle: '',
      teamSize: '',
      dailyCoversTarget: '',
      previousFoodHallExperience: false,
      socialMediaHandles: '',
      uniqueSellingPoint: '',
      questionsComments: '',
    },
  });

  const onSubmit = async (data: VendorInquiryData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit your inquiry.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('kitchen_vendor_inquiries')
        .insert({
          business_name: data.businessName,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone,
          business_type: data.businessType,
          years_experience: data.yearsExperience ? parseInt(data.yearsExperience) : null,
          current_location: data.currentLocation || null,
          cuisine_style: data.cuisineStyle || null,
          team_size: data.teamSize ? parseInt(data.teamSize) : null,
          daily_covers_target: data.dailyCoversTarget ? parseInt(data.dailyCoversTarget) : null,
          previous_food_hall_experience: data.previousFoodHallExperience,
          social_media_handles: data.socialMediaHandles || null,
          unique_selling_point: data.uniqueSellingPoint || null,
          questions_comments: data.questionsComments || null,
          submitted_by_user_id: user.id,
        });

      if (error) {
        console.error('Error submitting inquiry:', error);
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "There was an error submitting your inquiry. Please try again.",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Inquiry Submitted",
          description: "Thank you for your interest! We'll be in touch soon. You can now book a meeting using the calendar below.",
        });
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your inquiry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="h-full bg-black flex flex-col">
        <div className="flex-shrink-0 p-8 text-center">
          <CroftLogo className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Thank You!
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Your inquiry has been submitted successfully. Book a meeting below to discuss your kitchen concept.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-4xl w-full max-h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Book Your Kitchen Consultation
            </h2>
            
            {/* Calendly Inline Widget */}
            <div 
              className="calendly-inline-widget bg-white rounded-lg overflow-hidden"
              data-url="https://calendly.com/your-calendly-link/kitchen-vendor-consultation"
              style={{ minWidth: '320px', height: '630px' }}
            >
              {/* Fallback content */}
              <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                  <p className="mb-4">Calendar widget loading...</p>
                  <a 
                    href="https://calendly.com/your-calendly-link/kitchen-vendor-consultation"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to schedule directly
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col">
      <div className="flex-shrink-0 p-8 text-center">
        <CroftLogo className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Kitchen Vendor Application
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Tell us about your kitchen concept and let's explore how you could be part of The Kitchens at Croft Common.
        </p>
      </div>

      <div className="flex-1 flex justify-center pb-8 px-8 min-h-0">
        <Card className="w-full max-w-4xl bg-white/10 backdrop-blur-sm border-white/20 flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-2xl text-white">Your Kitchen Concept</CardTitle>
            <CardDescription className="text-white/80">
              Help us understand your business and how we can support your success.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 overflow-y-auto flex-1 min-h-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    Business Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Business/Brand Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your business name" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Your Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your full name" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="your@email.com" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel"
                              placeholder="Your phone number" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Business Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Street Food">Street Food</SelectItem>
                              <SelectItem value="Restaurant">Restaurant</SelectItem>
                              <SelectItem value="Bakery">Bakery</SelectItem>
                              <SelectItem value="Specialty Cuisine">Specialty Cuisine</SelectItem>
                              <SelectItem value="Pop-up">Pop-up</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Experience & Background Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    Experience & Background
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Years in Food Business</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Years of experience" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Current Trading Location(s)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Where do you currently operate?" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cuisineStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Cuisine Style/Specialty</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Modern British, Korean Street Food" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Current Team Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Number of team members" 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Operational Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    Operational Details
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="dailyCoversTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Target Daily Covers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="How many customers do you aim to serve daily?" 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousFoodHallExperience"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-white">
                            I have operated in a food hall before
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="uniqueSellingPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What makes your food concept unique?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what sets your concept apart from others..." 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Marketing & Following Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    Marketing & Following
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="socialMediaHandles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Social Media Handles</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="@instagram, @tiktok, website, etc." 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Questions for Us Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    Questions for Us
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="questionsComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What questions do you have about The Kitchens?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ask us anything about the space, terms, support, or what you'd like to know in our meeting..." 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application & Book Meeting'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};