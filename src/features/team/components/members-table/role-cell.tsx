'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useAuth } from '@/components/auth/auth-provider';
import { setMemberRoleMutation } from '../../api/mutations';
import type { TeamMember, TeamRole } from '../../api/types';

const ASSIGNABLE_ROLES: TeamRole[] = ['admin', 'member'];

/** Inline role picker; owners and the signed-in admin are read-only. */
export function MemberRoleCell({ member }: { member: TeamMember }) {
  const { activeOrganizationId } = useAuth();
  const mutation = useMutation(setMemberRoleMutation);

  if (member.role === 'owner' || member.is_current_user) {
    return <Badge variant='outline'>{member.role}</Badge>;
  }

  async function change(role: TeamRole) {
    if (role === member.role || !activeOrganizationId) return;
    try {
      await mutation.mutateAsync({
        orgId: activeOrganizationId,
        membershipId: member.membership_id,
        role
      });
      toast.success(`${member.name} is now ${role}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <NativeSelect
      value={member.role}
      size='sm'
      disabled={mutation.isPending}
      aria-label={`Role of ${member.name}`}
      onChange={(event) => void change(event.target.value as TeamRole)}
    >
      {ASSIGNABLE_ROLES.map((r) => (
        <NativeSelectOption key={r} value={r}>
          {r}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
