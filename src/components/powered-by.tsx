import Image from 'next/image';
import { cn } from '@/lib/utils';
// Imported (rather than referenced as "/logo-transparent.png") so Next.js reads
// the dimensions itself and the URL changes whenever the file is replaced.
import brandLogo from '../../public/logo-transparent.png';

const BRAND_NAME = 'AuthBoot';
const BRAND_URL = 'https://github.com/authboot';

// Rendered height in px (Tailwind h-7). Passing the matching width keeps
// next/image from generating full-resolution variants of the 2172px source.
const LOGO_HEIGHT = 28;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * brandLogo.width) / brandLogo.height);

type PoweredByProps = {
  /** Lead-in text, e.g. "Powered by" or "Secured by". */
  label?: string;
  /** Where the logo links to (opens in a new tab). Defaults to AuthBoot on GitHub. */
  href?: string;
  className?: string;
};

/**
 * Small, muted "Powered by AuthBoot" attribution: lead-in text followed by the
 * brand logo (mark + wordmark), which links to the project. Meant for the
 * bottom of auth forms and similar low-emphasis spots.
 */
export function PoweredBy({ label = 'Powered by', href = BRAND_URL, className }: PoweredByProps) {
  return (
    <p
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1 text-xs font-medium select-none',
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
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className='h-7 w-auto'
        />
      </a>
    </p>
  );
}
