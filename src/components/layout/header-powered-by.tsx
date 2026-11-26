'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { PoweredBy } from '@/components/powered-by';

/**
 * Shows the "Powered by" badge in the header while the sidebar is collapsed to
 * icons, where the sidebar's own badge is hidden. On mobile the sidebar is a
 * sheet and keeps its badge, so nothing is shown here.
 */
export function HeaderPoweredBy() {
  const { state, isMobile } = useSidebar();
  if (isMobile || state !== 'collapsed') return null;

  return (
    <>
      <Separator orientation='vertical' className='mx-1 h-4 data-vertical:self-center' />
      <PoweredBy className='hidden lg:inline-flex' />
    </>
  );
}
