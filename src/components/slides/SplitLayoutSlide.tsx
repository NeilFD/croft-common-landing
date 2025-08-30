import React from 'react';
import CroftLogo from '@/components/CroftLogo';

interface SplitLayoutSlideProps {
  title: string;
  rightTitle: string;
  leftContent: string;
  rightContent: string;
}

export const SplitLayoutSlide: React.FC<SplitLayoutSlideProps> = ({
  title,
  rightTitle,
  leftContent,
  rightContent,
}) => {
  return (
    <div className="relative w-full h-screen flex">
      {/* Left Side - Black Background */}
      <div className="w-1/2 bg-black text-white p-16 flex flex-col justify-center">
        <h1 className="font-industrial text-6xl md:text-8xl leading-none mb-12 tracking-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl leading-relaxed max-w-2xl">
          {leftContent}
        </p>
      </div>

      {/* Right Side - White Background */}
      <div className="w-1/2 bg-white text-black p-16 flex flex-col justify-center">
        <h2 className="font-industrial text-4xl md:text-6xl leading-none mb-12 tracking-tight">
          {rightTitle}
        </h2>
        <div className="text-lg md:text-xl leading-relaxed max-w-2xl">
          <p className="mb-8">
            {rightContent.split('neil@cityandsanctuary.com')[0]}
          </p>
          <div className="mb-8">
            <p className="font-semibold mb-2">Neil Fincham-Dukes</p>
            <p className="mb-2">Founding Partner, Croft Common and City & Sanctuary</p>
            <p className="text-blue-600 underline">neil@cityandsanctuary.com</p>
          </div>
          <p>
            We look forward to welcoming the first wave of partners to Croft Common and creating something extraordinary together.
          </p>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20">
        <CroftLogo className="h-12 w-12" />
      </div>
    </div>
  );
};