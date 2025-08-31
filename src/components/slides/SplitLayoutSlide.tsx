import React from 'react';

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
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Pink Background */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[hsl(var(--accent-pink))] text-white p-4 md:p-6 lg:p-8 flex flex-col justify-center overflow-y-auto max-h-screen">
        <div className="text-sm md:text-lg lg:text-xl xl:text-2xl leading-relaxed max-w-xl">
          {leftContent ? (
            leftContent.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-2 md:mb-3 lg:mb-4 text-sm md:text-lg lg:text-xl xl:text-2xl">
                {paragraph}
              </p>
            ))
          ) : (
            <h1 className="font-brutalist text-2xl md:text-4xl lg:text-5xl leading-tight mb-4 md:mb-6 lg:mb-8 tracking-tight text-center">
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* Right Side - Image or Content */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        {rightImage ? (
          <div className="h-full relative">
            <img 
              src={rightImage} 
              alt="Interior space" 
              className="w-full h-full object-cover"
            />
            {rightTitle && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <h2 className="font-industrial text-xl md:text-3xl lg:text-4xl text-white text-center leading-tight tracking-tight px-4 md:px-8">
                  {rightTitle}
                </h2>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white text-black p-4 md:p-8 lg:p-12 flex flex-col justify-center h-full overflow-y-auto">
            <h2 className="font-industrial text-lg md:text-2xl lg:text-3xl leading-tight mb-4 md:mb-6 lg:mb-8 tracking-tight">
              {rightTitle}
            </h2>
            <div className="text-xs md:text-sm lg:text-base leading-relaxed max-w-xl">
              <p className="mb-3 md:mb-4 lg:mb-6">
                {rightContent ? rightContent.split('neil@cityandsanctuary.com')[0] : ''}
              </p>
              <div className="mb-3 md:mb-4 lg:mb-6">
                <p className="font-semibold mb-1 md:mb-2">Neil Fincham-Dukes</p>
                <p className="mb-1 md:mb-2 text-xs md:text-sm">Founding Partner, Croft Common and City & Sanctuary</p>
                <p className="text-blue-600 underline text-xs md:text-sm">neil@cityandsanctuary.com</p>
              </div>
              <p className="text-xs md:text-sm">
                We look forward to welcoming the first wave of partners to Croft Common and creating something extraordinary together.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};