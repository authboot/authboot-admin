'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAppForm } from '@/lib/form';
import { createUserAddressMutation, updateUserAddressMutation } from '../api/mutations';
import type { UserAddress } from '../api/types';

const addressSchema = z.object({
  receiver_name: z.string().min(1, { message: 'Receiver name is required' }),
  receiver_phone: z.string().min(1, { message: 'Phone number is required' }),
  province: z.string().min(1, { message: 'Province is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  district: z.string(),
  detail: z.string().min(1, { message: 'Street address is required' }),
  is_default: z.boolean()
});

type UserAddressSheetProps = {
  userId: number;
  /** The address to edit; omit to create a new one. */
  address?: UserAddress;
  onClose: () => void;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

/**
 * Create or edit one saved address. Rendering is conditional in the parent
 * (mount per address), so the form's default values always match the row.
 */
export function UserAddressSheet({ userId, address, onClose }: UserAddressSheetProps) {
  const editing = Boolean(address);
  const createMutation = useMutation(createUserAddressMutation);
  const updateMutation = useMutation(updateUserAddressMutation);
  const pending = createMutation.isPending || updateMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      receiver_name: address?.receiver_name ?? '',
      receiver_phone: address?.receiver_phone ?? '',
      province: address?.province ?? '',
      city: address?.city ?? '',
      district: address?.district ?? '',
      detail: address?.detail ?? '',
      is_default: address?.is_default ?? false
    },
    validators: { onSubmit: addressSchema },
    onSubmit: async ({ value }) => {
      try {
        if (address) {
          await updateMutation.mutateAsync({ id: userId, addressId: address.id, values: value });
          toast.success('Address updated');
        } else {
          await createMutation.mutateAsync({ id: userId, values: value });
          toast.success('Address added');
        }
        onClose();
      } catch (error) {
        toast.error(errorMessage(error));
      }
    }
  });

  return (
    <Sheet open onOpenChange={(open) => !open && !pending && onClose()}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{editing ? 'Edit address' : 'Add address'}</SheetTitle>
          <SheetDescription>
            {editing
              ? `Update the delivery details for #${address?.id}.`
              : 'Add a delivery address to this user. Each user can have up to 10.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='user-address-form'
            className='space-y-4 p-4'
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='receiver_name'
                  children={(field) => (
                    <field.TextField label='Receiver name' required placeholder='Chen Peng' />
                  )}
                />
                <form.AppField
                  name='receiver_phone'
                  children={(field) => (
                    <field.TextField
                      label='Phone'
                      required
                      type='tel'
                      placeholder='138 0000 1234'
                    />
                  )}
                />
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <form.AppField
                  name='province'
                  children={(field) => (
                    <field.TextField label='Province' required placeholder='Zhejiang' />
                  )}
                />
                <form.AppField
                  name='city'
                  children={(field) => (
                    <field.TextField label='City' required placeholder='Hangzhou' />
                  )}
                />
                <form.AppField
                  name='district'
                  children={(field) => <field.TextField label='District' placeholder='Xihu' />}
                />
              </div>

              <form.AppField
                name='detail'
                children={(field) => (
                  <field.TextareaField
                    label='Street address'
                    required
                    placeholder='Building, street, room number'
                    rows={3}
                  />
                )}
              />

              <form.AppField
                name='is_default'
                children={(field) => (
                  <field.SwitchField
                    label='Default address'
                    description='Use this address by default for new orders.'
                  />
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton form='user-address-form'>
              {editing ? 'Save changes' : 'Add address'}
            </form.SubmitButton>
          </form.AppForm>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
