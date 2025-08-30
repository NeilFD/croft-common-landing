import React from 'react';
import CroftLogo from '@/components/CroftLogo';

interface SplitLayoutSlideProps {
  title: string;
  rightTitle?: string;
  leftContent: string;
  rightContent?: string;
  rightImage?: string;
}

export const SplitLayoutSlide: React.FC<SplitLayoutSlideProps> = ({
  title,
  rightTitle,
  leftContent,
  rightContent,
  rightImage,
}) => {
  return (
    <div className="relative w-full h-screen flex overflow-hidden">
      {/* Left Side - Pink Background */}
      <div className="w-1/2 bg-[hsl(var(--accent-pink))] text-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
        <div className="text-sm md:text-base leading-relaxed max-w-xl">
          {leftContent ? (
            leftContent.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 md:mb-6">
                {paragraph}
              </p>
            ))
          ) : (
            <h1 className="font-brutalist text-4xl md:text-5xl leading-tight mb-6 md:mb-8 tracking-tight text-center">
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* Right Side - Image or Content */}
      <div className="w-1/2 relative">
        {rightImage ? (
          <div className="h-full relative">
            <img 
              src={rightImage} 
              alt="Interior space" 
              className="w-full h-full object-cover"
            />
            {rightTitle && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <h2 className="font-industrial text-3xl md:text-4xl text-white text-center leading-tight tracking-tight px-8">
                  {rightTitle}
                </h2>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white text-black p-8 md:p-12 flex flex-col justify-center h-full">
            <h2 className="font-industrial text-2xl md:text-3xl leading-tight mb-6 md:mb-8 tracking-tight">
              {rightTitle}
            </h2>
            <div className="text-sm md:text-base leading-relaxed max-w-xl">
              <p className="mb-4 md:mb-6">
                {rightContent ? rightContent.split('neil@cityandsanctuary.com')[0] : ''}
              </p>
              <div className="mb-4 md:mb-6">
                <p className="font-semibold mb-2">Neil Fincham-Dukes</p>
                <p className="mb-2">Founding Partner, Croft Common and City & Sanctuary</p>
                <p className="text-blue-600 underline">neil@cityandsanctuary.com</p>
              </div>
              <p>
                We look forward to welcoming the first wave of partners to Croft Common and creating something extraordinary together.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20">
        <CroftLogo className="h-12 w-12" />
      </div>
    </div>
  );
};