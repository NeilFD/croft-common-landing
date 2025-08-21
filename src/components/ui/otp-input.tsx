import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  ({ length = 6, value, onChange, disabled = false, className }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (index: number, digit: string) => {
      if (digit.length > 1) {
        // Handle paste
        const newValue = digit.slice(0, length);
        onChange(newValue);
        const nextIndex = Math.min(newValue.length, length - 1);
        setActiveIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      const newValue = value.split('');
      newValue[index] = digit;
      onChange(newValue.join('').slice(0, length));

      if (digit && index < length - 1) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          setActiveIndex(index - 1);
          inputRefs.current[index - 1]?.focus();
        } else {
          const newValue = value.split('');
          newValue[index] = '';
          onChange(newValue.join(''));
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleFocus = (index: number) => {
      setActiveIndex(index);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
      if (pasteData) {
        onChange(pasteData.slice(0, length));
        const nextIndex = Math.min(pasteData.length, length - 1);
        setActiveIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "h-12 w-12 text-center text-lg font-semibold",
              "border border-input rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              activeIndex === index && "ring-2 ring-ring ring-offset-2"
            )}
          />
        ))}
      </div>
    );
  }
);

OTPInput.displayName = "OTPInput";