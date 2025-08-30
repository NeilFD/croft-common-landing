import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowRight, Mail, Phone, MapPin, Clock, Users, Utensils, Star } from 'lucide-react';

// Import slide images
import slide1 from '@/assets/secretkitchens-slide1.png';
import slide2 from '@/assets/secretkitchens-slide2.png';
import slide3 from '@/assets/secretkitchens-slide3.png';
import slide4 from '@/assets/secretkitchens-slide4.png';
import slide5 from '@/assets/secretkitchens-slide5.png';
import slide6 from '@/assets/secretkitchens-slide6.png';
import slide7 from '@/assets/secretkitchens-slide7.png';
import slide8 from '@/assets/secretkitchens-slide8.png';
import slide9 from '@/assets/secretkitchens-slide9.png';
import slide10 from '@/assets/secretkitchens-slide10.png';

const SecretKitchens = () => {
  return (
    <div className="min-h-screen bg-background">
      <Carousel className="w-full h-screen">
        <CarouselContent>
          {/* Slide 1: Hero Section */}
          <CarouselItem>
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
              <OptimizedImage
                src={slide1}
                alt="Croft Common Kitchen Opportunities"
                className="absolute inset-0 w-full h-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/60"></div>
              <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
                <h1 className="text-6xl md:text-8xl font-brutalist mb-6 text-white">
                  SECRET KITCHENS
                </h1>
                <p className="text-xl md:text-2xl font-industrial mb-8 max-w-2xl mx-auto">
                  Join London's most exciting food destination in Camberwell
                </p>
                <Button 
                  size="lg" 
                  className="bg-accent-blood hover:bg-accent-blood/90 text-white font-brutalist text-lg px-8 py-6"
                >
                  Explore Opportunities
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 2: Venue Overview */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground">
                      Rooted in the neighbourhood
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6 font-industrial">
                      Croft Common is a vibrant community hub in the heart of Camberwell, 
                      bringing together exceptional food, craft beverages, and local culture 
                      in a beautifully restored space.
                    </p>
                    <p className="text-lg text-muted-foreground mb-8 font-industrial">
                      We're looking for passionate food entrepreneurs to join our kitchen 
                      collective and become part of South London's most exciting culinary destination.
                    </p>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-2 border-accent-blood text-accent-blood hover:bg-accent-blood hover:text-white font-brutalist"
                    >
                      Learn More About Our Story
                    </Button>
                  </div>
                  <div className="relative">
                    <OptimizedImage
                      src={slide2}
                      alt="Croft Common Interior"
                      className="w-full h-96 object-cover rounded-lg shadow-brutal"
                    />
                  </div>
                </div>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 3: Tenant Opportunity */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 bg-muted">
              <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground">
                    Kitchen Tenant Opportunity
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-industrial">
                    Join our curated selection of exceptional food vendors in London's 
                    most talked-about food destination
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Card className="border-2 border-black shadow-brutal">
                    <CardContent className="p-8">
                      <Utensils className="h-12 w-12 text-accent-blood mb-4" />
                      <h3 className="text-xl font-brutalist mb-3">Professional Kitchens</h3>
                      <p className="text-muted-foreground font-industrial">
                        Fully equipped commercial kitchen spaces with all necessary equipment and utilities
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-black shadow-brutal">
                    <CardContent className="p-8">
                      <Users className="h-12 w-12 text-accent-blood mb-4" />
                      <h3 className="text-xl font-brutalist mb-3">Built-in Audience</h3>
                      <p className="text-muted-foreground font-industrial">
                        Access to our established community of food lovers and local residents
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-black shadow-brutal">
                    <CardContent className="p-8">
                      <Star className="h-12 w-12 text-accent-blood mb-4" />
                      <h3 className="text-xl font-brutalist mb-3">Marketing Support</h3>
                      <p className="text-muted-foreground font-industrial">
                        Comprehensive promotion through our channels and local partnerships
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 4: Trading Details */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="relative">
                    <OptimizedImage
                      src={slide4}
                      alt="Kitchen Operations"
                      className="w-full h-96 object-cover rounded-lg shadow-brutal"
                    />
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground">
                      Trading Details
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <Clock className="h-6 w-6 text-accent-blood mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-brutalist mb-2">Operating Hours</h3>
                          <p className="text-muted-foreground font-industrial">
                            Tuesday - Sunday, 8am - 11pm<br />
                            Closed Mondays for maintenance
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <MapPin className="h-6 w-6 text-accent-blood mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-brutalist mb-2">Prime Location</h3>
                          <p className="text-muted-foreground font-industrial">
                            High-footfall Camberwell location with excellent transport links 
                            and established local customer base
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Utensils className="h-6 w-6 text-accent-blood mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-brutalist mb-2">Kitchen Specifications</h3>
                          <p className="text-muted-foreground font-industrial">
                            Commercial-grade equipment, refrigeration, prep areas, 
                            and all necessary health & safety certifications
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 5: Venue Spaces Gallery */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 bg-muted">
              <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground">
                    Our Spaces
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-industrial">
                    Explore the different areas of Croft Common where your culinary vision will come to life
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="relative group">
                    <OptimizedImage
                      src={slide6}
                      alt="Main Dining Area"
                      className="w-full h-64 object-cover rounded-lg shadow-brutal group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-end">
                      <div className="p-6">
                        <h3 className="text-white font-brutalist text-xl mb-2">Main Dining</h3>
                        <p className="text-white/90 font-industrial">Spacious seating for 120+ guests</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <OptimizedImage
                      src={slide7}
                      alt="Kitchen Areas"
                      className="w-full h-64 object-cover rounded-lg shadow-brutal group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-end">
                      <div className="p-6">
                        <h3 className="text-white font-brutalist text-xl mb-2">Kitchen Spaces</h3>
                        <p className="text-white/90 font-industrial">Multiple cooking stations available</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <OptimizedImage
                      src={slide8}
                      alt="Bar Area"
                      className="w-full h-64 object-cover rounded-lg shadow-brutal group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-end">
                      <div className="p-6">
                        <h3 className="text-white font-brutalist text-xl mb-2">Bar & Beverages</h3>
                        <p className="text-white/90 font-industrial">Complement your food with our drinks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 6: Promotion & Marketing */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground">
                      Marketing & Promotion
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6 font-industrial">
                      We don't just provide kitchen space - we actively promote our vendors 
                      through multiple channels to ensure your success.
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-accent-blood rounded-full"></div>
                        <span className="font-industrial">Social media promotion across all platforms</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-accent-blood rounded-full"></div>
                        <span className="font-industrial">Featured placement in our app and website</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-accent-blood rounded-full"></div>
                        <span className="font-industrial">Local press and media relationships</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-accent-blood rounded-full"></div>
                        <span className="font-industrial">Community events and collaborations</span>
                      </li>
                    </ul>
                  </div>
                  <div className="relative">
                    <OptimizedImage
                      src={slide9}
                      alt="Marketing Support"
                      className="w-full h-96 object-cover rounded-lg shadow-brutal"
                    />
                  </div>
                </div>
              </div>
            </section>
          </CarouselItem>

          {/* Slide 7: Call to Action */}
          <CarouselItem>
            <section className="h-screen flex items-center py-20 bg-accent-blood text-white">
              <div className="max-w-4xl mx-auto text-center px-6 w-full">
                <h2 className="text-4xl md:text-5xl font-brutalist mb-6">
                  Ready to Join Us?
                </h2>
                <p className="text-xl mb-8 font-industrial opacity-90">
                  Take the next step in your culinary journey and become part of 
                  the Croft Common family.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-8">
                  <div className="flex items-center justify-center space-x-3">
                    <Mail className="h-6 w-6" />
                    <span className="font-industrial">hello@croftcommon.co.uk</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <Phone className="h-6 w-6" />
                    <span className="font-industrial">020 7123 4567</span>
                  </div>
                </div>
                
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-accent-blood font-brutalist"
                  >
                    Download Full Proposal
                  </Button>
                  <Button 
                    size="lg" 
                    className="bg-white text-accent-blood hover:bg-white/90 font-brutalist"
                  >
                    Schedule a Visit
                  </Button>
                </div>
              </div>
            </section>
          </CarouselItem>
        </CarouselContent>
        
        <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
        <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
      </Carousel>
    </div>
  );
};

export default SecretKitchens;