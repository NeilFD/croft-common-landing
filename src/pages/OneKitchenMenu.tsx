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
                OneKitchen
              </h1>
              <h2 className="font-brutalist text-2xl md:text-3xl tracking-wider uppercase mb-8">
                Menu
              </h2>
              <div className="w-24 h-0.5 bg-white mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Menu Content */}
        <main className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto space-y-16">
            {oneKitchenMenuData.map((section, sectionIndex) => (
              <section key={section.title} className="space-y-8">
                {/* Section Title */}
                <div className="text-center">
                  <h3 className="font-brutalist text-3xl md:text-4xl tracking-wider uppercase text-foreground mb-6">
                    {section.title}
                  </h3>
                  <div className="w-16 h-0.5 bg-accent-pink mx-auto"></div>
                </div>

                {/* Menu Items */}
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 pb-4 border-b border-border/30 last:border-b-0"
                    >
                      <div className="flex-1 space-y-1">
                        <h4 className="font-industrial text-lg md:text-xl font-medium text-foreground leading-tight">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="font-industrial text-sm md:text-base text-muted-foreground italic">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 md:ml-4">
                        <span className="font-brutalist text-lg md:text-xl font-bold text-accent-pink">
                          {item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Divider */}
                {sectionIndex < oneKitchenMenuData.length - 1 && (
                  <div className="flex justify-center pt-8">
                    <div className="w-32 h-0.5 bg-border"></div>
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