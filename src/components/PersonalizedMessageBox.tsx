import { ReactNode } from 'react';
import CroftLogo from './CroftLogo';

interface PersonalizedMessageBoxProps {
  firstName?: string | null;
  children?: ReactNode;
}

const PersonalizedMessageBox = ({ firstName, children }: PersonalizedMessageBoxProps) => {
  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';

  return (
    <div className="absolute inset-x-0 top-20 bottom-20 md:top-24 md:bottom-24 flex items-center justify-center z-30 pointer-events-none px-4">
      <div className="max-w-3xl w-full mx-auto pointer-events-auto">
        <div className="bg-background/80 backdrop-blur-md border border-charcoal/20 rounded-lg shadow-2xl relative min-h-[400px] md:min-h-[500px] flex flex-col justify-center p-6 md:p-10 lg:p-16">
          <div className="absolute top-2 right-2 md:top-4 md:right-4">
            <CroftLogo className="w-16 h-16 md:w-28 md:h-28 brightness-0" />
          </div>
          <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
            <a 
              href="/book"
              className="inline-block bg-foreground text-background px-3 py-1.5 md:px-4 md:py-2 rounded-full font-industrial text-xs md:text-sm tracking-wide hover:bg-accent-pink transition-colors duration-200 no-underline"
            >
              Book
            </a>
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <h1 className="font-brutalist text-2xl md:text-3xl lg:text-4xl text-foreground mb-4 md:mb-6 leading-tight pr-16 md:pr-32">
              {greeting}
            </h1>
            
            <div className="font-industrial text-base md:text-lg lg:text-xl text-muted-foreground space-y-3 md:space-y-4">
              {children || (
                <>
                  <p>
                    We've got a few tables left tonight — want to come see us?
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <a 
                      href="/book"
                      className="inline-block bg-foreground text-background px-6 py-3 font-industrial text-sm tracking-wide hover:bg-accent-pink transition-colors duration-200"
                    >
                      BOOK
                    </a>
                  </div>
                  <p className="mt-6 md:mt-8 text-right font-industrial text-sm md:text-base">
                    - Croft Common
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedMessageBox;