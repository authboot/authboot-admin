'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { updateUserAddressMutation } from '../api/mutations';
import { userKeys } from '../api/queries';
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
  address: UserAddress;
  onClose: () => void;
};

/**
 * Edit one saved address. Rendering is conditional in the parent (mount per
 * address), so the form's default values always match the row being edited.
 */
export function UserAddressSheet({ userId, address, onClose }: UserAddressSheetProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateUserAddressMutation.mutationFn,
    onError: () => toast.error("Couldn't update the address. Try again.")
  });

  const form = useAppForm({
    defaultValues: {
      receiver_name: address.receiver_name,
      receiver_phone: address.receiver_phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      is_default: address.is_default
    },
    validators: { onSubmit: addressSchema },
    onSubmit: async ({ value }) => {
      const result = await mutation.mutateAsync({
        id: userId,
        address: { ...address, ...value }
      });

      if (!result?.success) {
        toast.error(result?.message || 'Failed to update the address');
        return;
      }

      queryClient.invalidateQueries({ queryKey: userKeys.addresses(userId) });
      toast.success('Address updated');
      onClose();
    }
  });

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit address</SheetTitle>
          <SheetDescription>Update the delivery details for #{address.id}.</SheetDescription>
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
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton form='user-address-form'>Save changes</form.SubmitButton>
          </form.AppForm>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
