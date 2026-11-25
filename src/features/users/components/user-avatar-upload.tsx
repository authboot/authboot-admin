'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/avatar-upload';
import { uploadUserAvatarMutation } from '../api/mutations';
import { userKeys } from '../api/queries';

type UserAvatarUploadProps = {
  userId: number;
  name: string;
  initials: string;
  avatarUrl?: string;
};

/**
 * The user's avatar with a control to replace it. The selected image is
 * uploaded straight away through the admin avatar endpoint; the detail and
 * list queries are refreshed so the new avatar shows up everywhere.
 */
export function UserAvatarUpload({ userId, name, initials, avatarUrl }: UserAvatarUploadProps) {
  const queryClient = useQueryClient();

  // The local `onSuccess` overrides the mutation option's cache invalidation,
  // so refresh the user queries explicitly.
  const uploadMutation = useMutation({
    ...uploadUserAvatarMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Avatar updated');
    },
    onError: (error) =>
      toast.error("Couldn't update the avatar", {
        description: error instanceof Error ? error.message : undefined
      })
  });

  return (
    <AvatarUpload
      src={avatarUrl}
      name={name}
      initials={initials}
      isUploading={uploadMutation.isPending}
      onSelect={(file) => uploadMutation.mutate({ id: userId, file })}
    />
  );
}
