import Image from 'next/image';
import { cn } from '@/lib/utils';
// Imported (rather than referenced as "/logo-transparent.png") so Next.js reads
// the dimensions itself and the URL changes whenever the file is replaced.
import brandLogo from '../../public/logo-transparent.png';

const BRAND_NAME = 'AuthBoot';
const BRAND_URL = 'https://github.com/authboot';

type PoweredBySize = 'sm' | 'lg';

// Rendered logo height per size in px (Tailwind h-7 / h-9). Passing the
// matching width keeps next/image from generating full-resolution variants of
// the 2172px source. The artwork has transparent padding above and below (it
// fills ~56% of its height), so the visible mark is roughly half of this.
const SIZES: Record<PoweredBySize, { height: number; logo: string; text: string; gap: string }> = {
  sm: { height: 28, logo: 'h-7', text: 'text-xs', gap: 'gap-1' },
  lg: { height: 36, logo: 'h-9', text: 'text-xs', gap: 'gap-1' }
};

function logoWidth(height: number): number {
  return Math.round((height * brandLogo.width) / brandLogo.height);
}

type PoweredByProps = {
  /** Lead-in text, e.g. "Powered by" or "Secured by". */
  label?: string;
  /** Where the logo links to (opens in a new tab). Defaults to AuthBoot on GitHub. */
  href?: string;
  /** `sm` for the bottom of forms; `lg` fills the width of the sidebar. */
  size?: PoweredBySize;
  className?: string;
};

/**
 * Small, muted "Powered by AuthBoot" attribution: lead-in text followed by the
 * brand logo (mark + wordmark), which links to the project. Meant for the
 * bottom of auth forms and similar low-emphasis spots.
 */
export function PoweredBy({
  label = 'Powered by',
  href = BRAND_URL,
  size = 'sm',
  className
}: PoweredByProps) {
  const s = SIZES[size];
  return (
    <p
      className={cn(
        'text-muted-foreground inline-flex items-center font-medium select-none',
        s.gap,
        s.text,
        className
      )}
    >
      <span>{label}</span>
      {/* The artwork has transparent padding above and below (it fills ~56% of
          the height), so the logo is taller than the text line and the
          negative margin keeps the badge's own height unchanged. The focus
          ring is inset so containers that clip overflow don't cut it off. */}
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        title={`${BRAND_NAME} on GitHub`}
        className='focus-visible:ring-ring -my-1.5 shrink-0 rounded-sm transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-inset'
      >
        <Image
          src={brandLogo}
          alt={BRAND_NAME}
          width={logoWidth(s.height)}
          height={s.height}
          className={cn('w-auto', s.logo)}
        />
      </a>
    </p>
  );
}
