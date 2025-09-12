import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { oneKitchenMenuData } from '@/data/oneKitchenMenuData';

const OneKitchenMenu = () => {
  return (
    <>
      <Helmet>
        <title>OneKitchen Menu - Croft</title>
        <meta 
          name="description" 
          content="Explore OneKitchen's complete menu collection: Main dining with wood-fired pizzas and charcoal grill, Café for breakfast and lunch, Sunday roasts and brunch, plus The Hideout private dining experience." 
        />
        <meta name="keywords" content="OneKitchen, menu, wood-fired pizza, charcoal grill, restaurant, Croft" />
        <link rel="canonical" href="/onekitchen-menu" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative bg-[hsl(var(--accent-pink))] pt-20 pb-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center text-white">
              <div className="w-24 h-0.5 bg-white mx-auto mb-8"></div>
              <h1 className="font-brutalist text-4xl md:text-6xl lg:text-7xl tracking-wider uppercase mb-4">
                Croft Common Kitchen
              </h1>
              <div className="w-24 h-0.5 bg-white mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Menu Content */}
        <main className="px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="main" className="w-full">
              {/* Tab Navigation */}
              <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm pb-6 mb-8">
                <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto h-12">
                  <TabsTrigger 
                    value="main" 
                    className="font-brutalist text-xs md:text-sm tracking-wide data-[state=active]:bg-accent-pink data-[state=active]:text-white"
                  >
                    MAIN
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cafe" 
                    className="font-brutalist text-xs md:text-sm tracking-wide data-[state=active]:bg-accent-pink data-[state=active]:text-white"
                  >
                    CAFÉ
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sunday" 
                    className="font-brutalist text-xs md:text-sm tracking-wide data-[state=active]:bg-accent-pink data-[state=active]:text-white"
                  >
                    SUNDAY
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hideout" 
                    className="font-brutalist text-xs md:text-sm tracking-wide data-[state=active]:bg-accent-pink data-[state=active]:text-white"
                  >
                    HIDEOUT
                  </TabsTrigger>
                  <TabsTrigger 
                    value="halls" 
                    className="font-brutalist text-xs md:text-sm tracking-wide data-[state=active]:bg-accent-pink data-[state=active]:text-white"
                  >
                    HALLS
                  </TabsTrigger>
                </TabsList>
              </div>

                {/* Main Menu Tab */}
              <TabsContent value="main" className="space-y-0">
                <div className="text-center space-y-6 mb-12">
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                  <div className="space-y-2">
                    <h2 className="font-brutalist text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-foreground">
                      Croft Common Kitchen
                    </h2>
                    <p className="font-industrial text-lg md:text-xl text-muted-foreground italic">
                      Evening. Dark. Bold.
                    </p>
                  </div>
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
                  {oneKitchenMenuData.slice(0, 9).map((section, sectionIndex) => (
                    <section key={section.title} className="space-y-6">
                      <div className="text-left">
                        <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                          {section.title}
                        </h3>
                        <div className="w-12 h-0.5 bg-accent-pink"></div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex justify-between items-start gap-4 pb-2 border-b border-border/20 last:border-b-0"
                          >
                            <div className="flex-1 space-y-0.5">
                              <h4 className="font-industrial text-base md:text-lg font-medium text-foreground leading-snug">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="font-industrial text-sm text-muted-foreground italic leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-6">
                              <span className="font-brutalist text-base md:text-lg font-bold text-accent-pink">
                                {item.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {sectionIndex < 8 && (
                        <div className="flex justify-start pt-6">
                          <div className="w-24 h-0.5 bg-border/40"></div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </TabsContent>

              {/* Cafe Menu Tab */}
              <TabsContent value="cafe" className="space-y-0">
                <div className="text-center space-y-6 mb-12">
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                  <div className="space-y-2">
                    <h2 className="font-brutalist text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-foreground">
                      Croft Common Café
                    </h2>
                    <p className="font-industrial text-lg md:text-xl text-muted-foreground italic">
                      Daytime. Bright. Vibrant.
                    </p>
                  </div>
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
                  {oneKitchenMenuData.slice(9, 15).map((section, sectionIndex) => (
                    <section key={section.title} className="space-y-6">
                      <div className="text-left">
                        <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                          {section.title}
                        </h3>
                        <div className="w-12 h-0.5 bg-accent-pink"></div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex justify-between items-start gap-4 pb-2 border-b border-border/20 last:border-b-0"
                          >
                            <div className="flex-1 space-y-0.5">
                              <h4 className="font-industrial text-base md:text-lg font-medium text-foreground leading-snug">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="font-industrial text-sm text-muted-foreground italic leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-6">
                              <span className="font-brutalist text-base md:text-lg font-bold text-accent-pink">
                                {item.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {sectionIndex < 6 && (
                        <div className="flex justify-start pt-6">
                          <div className="w-24 h-0.5 bg-border/40"></div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </TabsContent>

              {/* Sunday Menu Tab */}
              <TabsContent value="sunday" className="space-y-0">
                <div className="text-center space-y-6 mb-12">
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                  <div className="space-y-2">
                    <h2 className="font-brutalist text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-foreground">
                      Croft Common Sunday
                    </h2>
                    <p className="font-industrial text-lg md:text-xl text-muted-foreground italic">
                      Breakfast. Brunch. Roasts.
                    </p>
                  </div>
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
                  {oneKitchenMenuData.slice(15, 21).map((section, sectionIndex) => (
                    <section key={section.title} className="space-y-6">
                      <div className="text-left">
                        <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                          {section.title}
                        </h3>
                        <div className="w-12 h-0.5 bg-accent-pink"></div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex justify-between items-start gap-4 pb-2 border-b border-border/20 last:border-b-0"
                          >
                            <div className="flex-1 space-y-0.5">
                              <h4 className="font-industrial text-base md:text-lg font-medium text-foreground leading-snug">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="font-industrial text-sm text-muted-foreground italic leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-6">
                              <span className="font-brutalist text-base md:text-lg font-bold text-accent-pink">
                                {item.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {sectionIndex < 7 && (
                        <div className="flex justify-start pt-6">
                          <div className="w-24 h-0.5 bg-border/40"></div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </TabsContent>

              {/* The Hideout Menu Tab */}
              <TabsContent value="hideout" className="space-y-0">
                <div className="text-center space-y-6 mb-12">
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                  <div className="space-y-2">
                    <h2 className="font-brutalist text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-foreground">
                      The Hideout
                    </h2>
                    <p className="font-industrial text-lg md:text-xl text-muted-foreground italic">
                      Private. Elevated. Off the radar.
                    </p>
                  </div>
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
                  {oneKitchenMenuData.slice(0, 0).map((section, sectionIndex) => (
                    <section key={section.title} className="space-y-6">
                      <div className="text-left">
                        <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                          {section.title}
                        </h3>
                        <div className="w-12 h-0.5 bg-accent-pink"></div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex justify-between items-start gap-4 pb-2 border-b border-border/20 last:border-b-0"
                          >
                            <div className="flex-1 space-y-0.5">
                              <h4 className="font-industrial text-base md:text-lg font-medium text-foreground leading-snug">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="font-industrial text-sm text-muted-foreground italic leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.price && (
                              <div className="flex-shrink-0 ml-6">
                                <span className="font-brutalist text-base md:text-lg font-bold text-accent-pink">
                                  {item.price}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {sectionIndex < 6 && (
                        <div className="flex justify-start pt-6">
                          <div className="w-24 h-0.5 bg-border/40"></div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </TabsContent>

              {/* The Halls Events Menu Tab */}
              <TabsContent value="halls" className="space-y-0">
                <div className="text-center space-y-6 mb-12">
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                  <div className="space-y-2">
                    <h2 className="font-brutalist text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-foreground">
                      The Halls — Events Menu
                    </h2>
                    <p className="font-industrial text-lg md:text-xl text-muted-foreground italic">
                      Bold food. Built for a crowd.
                    </p>
                  </div>
                  <div className="w-32 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
                  {oneKitchenMenuData.slice(21).map((section, sectionIndex) => (
                    <section key={section.title} className="space-y-6">
                      <div className="text-left">
                        <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                          {section.title}
                        </h3>
                        <div className="w-12 h-0.5 bg-accent-pink"></div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex}
                            className="flex justify-between items-start gap-4 pb-2 border-b border-border/20 last:border-b-0"
                          >
                            <div className="flex-1 space-y-0.5">
                              <h4 className="font-industrial text-base md:text-lg font-medium text-foreground leading-snug">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="font-industrial text-sm text-muted-foreground italic leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.price && (
                              <div className="flex-shrink-0 ml-6">
                                <span className="font-brutalist text-base md:text-lg font-bold text-accent-pink">
                                  {item.price}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {sectionIndex < 3 && (
                        <div className="flex justify-start pt-6">
                          <div className="w-24 h-0.5 bg-border/40"></div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OneKitchenMenu;