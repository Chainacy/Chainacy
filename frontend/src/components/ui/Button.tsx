import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
  position?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

const buttonVariants = {
  primary: `bg-[${COLORS.primary}]`,
  secondary: `bg-[${COLORS.secondary}]`,
  tertiary: `bg-[${COLORS.tertiary}]`,
  error: `bg-[${COLORS.error}]`,
};

const buttonPositions = {
  left: 'rounded-l border-r-0',
  center: 'rounded-none border-r-0',
  right: 'rounded-r',
};

export const Button = ({ 
  variant = 'primary', 
  position = 'left',
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) => {
  
  return (
    <button
      className={cn(
        'flex-1 h-[38px] sm:h-[42px] px-3 sm:px-4 py-2 text-white font-semibold text-xs sm:text-sm',
        'font-sans transition-colors duration-200 border-none cursor-pointer',
        variant !== 'error' && 'disabled:opacity-50',
        'disabled:cursor-not-allowed',
        'hover:opacity-90',
        buttonVariants[variant],
        buttonPositions[position],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
