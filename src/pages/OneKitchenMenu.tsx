import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { oneKitchenMenuData } from '@/data/oneKitchenMenuData';

const OneKitchenMenu = () => {
  return (
    <>
      <Helmet>
        <title>OneKitchen Menu - Croft</title>
        <meta 
          name="description" 
          content="Explore OneKitchen's full menu featuring bites, small plates, wood-fired pizzas, charcoal grill dishes, sharing boards, beer food, sides and puddings." 
        />
        <meta name="keywords" content="OneKitchen, menu, wood-fired pizza, charcoal grill, restaurant, Croft" />
        <link rel="canonical" href="/onekitchen-menu" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative bg-[hsl(var(--accent-pink))] py-16 md:py-24">
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
          <div className="max-w-4xl space-y-12 ml-4 md:ml-8 lg:ml-12">
            {oneKitchenMenuData.map((section, sectionIndex) => (
              <section key={section.title} className="space-y-6">
                {/* Section Title */}
                <div className="text-left">
                  <h3 className="font-brutalist text-2xl md:text-3xl tracking-wide uppercase text-foreground mb-4">
                    {section.title}
                  </h3>
                  <div className="w-12 h-0.5 bg-accent-pink"></div>
                </div>

                {/* Menu Items */}
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

                {/* Section Divider */}
                {sectionIndex < oneKitchenMenuData.length - 1 && (
                  <div className="flex justify-start pt-6">
                    <div className="w-24 h-0.5 bg-border/40"></div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OneKitchenMenu;