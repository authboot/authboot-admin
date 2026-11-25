import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

// Brighter semantic colors so each status is easy to scan in dense tables.
const TONE_CLASS_NAMES: Record<StatusTone, string> = {
  success:
    'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning:
    'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger:
    'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
  neutral: 'border-border bg-muted text-muted-foreground'
};

// Keyed by lowercased status so 'Active' (users) and 'active' (team) share a
// tone. Statuses that aren't listed fall back to neutral.
const STATUS_TONES: Record<string, StatusTone> = {
  active: 'success',
  invited: 'warning',
  inactive: 'danger',
  suspended: 'danger'
};

type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, 'variant' | 'children'> & {
  status: string;
  /** Overrides the default label (the status with its first letter capitalized). */
  label?: React.ReactNode;
  /** Overrides the tone looked up from the status. */
  tone?: StatusTone;
};

function defaultLabel(status: string): string {
  const value = status.trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

/** Shared status pill for account-like entities (users, team members, …). */
export function StatusBadge({ status, label, tone, className, ...props }: StatusBadgeProps) {
  const resolvedTone = tone ?? STATUS_TONES[status.trim().toLowerCase()] ?? 'neutral';

  return (
    <Badge variant='outline' className={cn(TONE_CLASS_NAMES[resolvedTone], className)} {...props}>
      {label ?? defaultLabel(status)}
    </Badge>
  );
}
