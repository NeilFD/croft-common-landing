import { ReactNode } from 'react';
import CroftLogo from './CroftLogo';

interface PersonalizedMessageBoxProps {
  firstName?: string | null;
  children?: ReactNode;
}

const PersonalizedMessageBox = ({ firstName, children }: PersonalizedMessageBoxProps) => {
  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <div className="max-w-3xl mx-6 pointer-events-auto">
        <div className="bg-background/80 backdrop-blur-md border border-charcoal/20 p-10 md:p-16 rounded-lg shadow-2xl relative">
          <div className="absolute top-4 right-4">
            <CroftLogo className="w-28 h-28 opacity-20" />
          </div>
          <h1 className="font-brutalist text-3xl md:text-4xl text-foreground mb-6 leading-tight">
            {greeting}
          </h1>
          
          <div className="font-industrial text-lg md:text-xl text-muted-foreground space-y-4">
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
                <p className="mt-8 text-right font-industrial text-base">
                  - Croft Common
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedMessageBox;