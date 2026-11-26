'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { userAddressesOptions } from '../api/queries';
import { deleteUserAddressMutation, setDefaultUserAddressMutation } from '../api/mutations';
import type { UserAddress } from '../api/types';
import { UserAddressSheet } from './user-address-sheet';

const ADDRESS_LIMIT = 10;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

type UserAddressListProps = {
  userId: string;
};

export default function UserAddressList({ userId }: UserAddressListProps) {
  const { data } = useSuspenseQuery(userAddressesOptions(Number(userId)));
  const addresses = data?.addresses ?? [];
  // `sheet` is null (closed), 'new' (create) or the address being edited.
  const [sheet, setSheet] = useState<UserAddress | 'new' | null>(null);
  const [removing, setRemoving] = useState<UserAddress | null>(null);
  const id = Number(userId);

  const setDefaultMutation = useMutation(setDefaultUserAddressMutation);
  const deleteMutation = useMutation(deleteUserAddressMutation);
  const busy = setDefaultMutation.isPending || deleteMutation.isPending;

  async function handleSetDefault(address: UserAddress) {
    try {
      await setDefaultMutation.mutateAsync({ id, addressId: address.id });
      toast.success('Default address updated');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleDelete(address: UserAddress) {
    setRemoving(null);
    try {
      await deleteMutation.mutateAsync({ id, addressId: address.id });
      toast.success('Address deleted');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Card className='flex flex-1 flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.workspace className='size-5' />
          Addresses
          {addresses.length > 0 && <Badge variant='secondary'>{addresses.length}</Badge>}
        </CardTitle>
        <CardDescription>Saved delivery addresses for this user.</CardDescription>
        <CardAction>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={addresses.length >= ADDRESS_LIMIT}
            onClick={() => setSheet('new')}
          >
            <Icons.add />
            Add address
          </Button>
        </CardAction>
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
                    <div className='flex items-center gap-1'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={busy}
                        onClick={() => setSheet(address)}
                      >
                        <Icons.edit className='size-3.5' />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              disabled={busy}
                              aria-label={`More actions for address #${address.id}`}
                            />
                          }
                        >
                          <Icons.ellipsis />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='min-w-44'>
                          {!address.is_default && (
                            <DropdownMenuItem onClick={() => void handleSetDefault(address)}>
                              <Icons.check />
                              Set as default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => setRemoving(address)}
                          >
                            <Icons.trash />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {sheet && (
        <UserAddressSheet
          key={sheet === 'new' ? 'new' : sheet.id}
          userId={id}
          address={sheet === 'new' ? undefined : sheet}
          onClose={() => setSheet(null)}
        />
      )}

      {removing && (
        <AlertDialog open onOpenChange={(open) => !open && setRemoving(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this address?</AlertDialogTitle>
              <AlertDialogDescription>
                {removing.receiver_name},{' '}
                {[removing.province, removing.city, removing.district].filter(Boolean).join(' ')}{' '}
                {removing.detail}.
                {removing.is_default && addresses.length > 1
                  ? ' Another address becomes the default.'
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={() => void handleDelete(removing)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
