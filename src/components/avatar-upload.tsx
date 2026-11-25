'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_REQUIREMENTS,
  getAvatarFileError
} from '@/lib/avatar-upload';

type AvatarUploadProps = {
  /** Current avatar URL; the initials are shown when it is empty or fails to load. */
  src?: string;
  name: string;
  initials: string;
  /** Shows a spinner over the avatar and disables the control. */
  isUploading?: boolean;
  /** Called with an image that already passed the type and size checks. */
  onSelect: (file: File) => void;
};

/**
 * An avatar with a control to replace it. It only picks and validates the
 * image — the caller decides where to upload it (a managed user's avatar, or
 * the signed-in admin's own).
 */
export function AvatarUpload({
  src,
  name,
  initials,
  isUploading = false,
  onSelect
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file.
    event.target.value = '';
    if (!file) return;

    const fileError = getAvatarFileError(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    onSelect(file);
  }

  return (
    <div className='relative w-fit'>
      <Avatar className='ring-background size-20 shadow-sm ring-4'>
        <AvatarImage src={src || ''} alt={name} />
        <AvatarFallback className='text-xl font-semibold'>{initials}</AvatarFallback>
      </Avatar>

      {isUploading && (
        <div className='bg-background/70 absolute inset-0 flex items-center justify-center rounded-full'>
          <Icons.spinner className='size-5 animate-spin' />
        </div>
      )}

      <Button
        type='button'
        variant='outline'
        size='icon-xs'
        className='bg-background absolute -right-1 -bottom-1 rounded-full shadow-sm'
        aria-label='Change avatar'
        title={`Change avatar — ${AVATAR_REQUIREMENTS}`}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Icons.camera className='size-3.5' />
      </Button>

      <input
        ref={inputRef}
        type='file'
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  );
}
