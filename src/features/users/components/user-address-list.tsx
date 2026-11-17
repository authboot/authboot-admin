'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { userAddressesOptions } from '../api/queries';
import type { UserAddress } from '../api/types';
import { UserAddressSheet } from './user-address-sheet';

type UserAddressListProps = {
  userId: string;
};

export default function UserAddressList({ userId }: UserAddressListProps) {
  const { data } = useSuspenseQuery(userAddressesOptions(Number(userId)));
  const addresses = data?.addresses ?? [];
  const [editing, setEditing] = useState<UserAddress | null>(null);

  return (
    <Card className='flex flex-1 flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.workspace className='size-5' />
          Addresses
          {addresses.length > 0 && <Badge variant='secondary'>{addresses.length}</Badge>}
        </CardTitle>
        <CardDescription>Saved delivery addresses for this user.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col'>
        {addresses.length === 0 ? (
          // 无数据时占满剩余高度，避免卡片被压扁
          <div className='text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm'>
            <Icons.workspace className='size-6' />
            <p>{data?.success === false ? data.message : 'No addresses found.'}</p>
          </div>
        ) : (
          <div className='divide-y rounded-lg border px-4 py-4'>
            {addresses.map((address) => {
              const region = [address.province, address.city, address.district]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={address.id}
                  className='flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0'
                >
                  <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
                    <Icons.workspace className='size-4' />
                  </div>

                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-medium'>{address.receiver_name || '—'}</span>
                      {address.is_default && <Badge variant='secondary'>Default</Badge>}
                      <span className='text-muted-foreground text-xs'>#{address.id}</span>
                    </div>
                    {address.receiver_phone && (
                      <p className='text-muted-foreground text-sm'>{address.receiver_phone}</p>
                    )}
                    {region && <p className='text-sm'>{region}</p>}
                    {address.detail && (
                      <p className='text-muted-foreground text-sm'>{address.detail}</p>
                    )}
                  </div>

                  <div className='flex flex-col items-end gap-2'>
                    {address.created_at && (
                      <span className='text-muted-foreground text-xs whitespace-nowrap'>
                        Added {formatDate(address.created_at)}
                      </span>
                    )}
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setEditing(address)}
                    >
                      <Icons.edit className='size-3.5' />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {editing && (
        <UserAddressSheet
          userId={Number(userId)}
          address={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}
