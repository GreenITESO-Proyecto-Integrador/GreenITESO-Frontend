import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  /** Hide from assistive tech when adjacent text already says "GreenITESO". */
  decorative?: boolean;
}

export function BrandLogo({ className, decorative = false }: BrandLogoProps) {
  return (
    <img
      src="/logo-greeniteso.svg"
      alt={decorative ? '' : 'GreenITESO'}
      className={cn('w-auto', className)}
    />
  );
}
