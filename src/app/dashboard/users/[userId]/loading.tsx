import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Loading() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading user details'
      className='grid flex-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]'
    >
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='from-primary/15 via-primary/5 h-24 bg-gradient-to-br to-transparent' />
        <CardContent className='-mt-10 space-y-4 px-4 pb-4'>
          <Skeleton className='ring-background size-20 rounded-full ring-4' />
          <div className='space-y-1'>
            <Skeleton className='h-7 w-32' />
            <Skeleton className='h-5 w-16' />
          </div>
          <Skeleton className='h-5 w-16 rounded-full' />
          <div className='flex gap-2'>
            <Skeleton className='h-8 flex-1' />
            <Skeleton className='size-8' />
          </div>
          <Separator />
          <div className='space-y-3'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='flex items-start gap-3'>
                <Skeleton className='mt-0.5 size-4' />
                <div className='space-y-1'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-5 w-28' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className='min-w-0 space-y-4'>
        <div className='flex h-9 items-center gap-2 overflow-hidden'>
          {['Profile', 'Addresses', 'Security'].map((tab) => (
            <Skeleton key={tab} className='h-7 w-20' />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-96 max-w-full' />
          </CardHeader>
          <CardContent className='space-y-6'>
            {[
              { title: 'Contact', count: 2, grid: 'grid gap-4 sm:grid-cols-2' },
              { title: 'Account', count: 5, grid: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' }
            ].map(({ title, count, grid }) => (
              <section key={title} className='space-y-3'>
                <h3 className='text-sm font-medium'>{title}</h3>
                <div className={grid}>
                  {Array.from({ length: count }, (_, i) => (
                    <div key={i} className='space-y-1 rounded-lg border p-3'>
                      <Skeleton className='h-3 w-12' />
                      <Skeleton className='h-5 w-2/3' />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <section className='space-y-3'>
              <h3 className='text-sm font-medium'>About</h3>
              <Skeleton className='h-16 w-full' />
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
