import { redirect } from 'next/navigation';

// Legal documents moved into Workspace Settings; keep the old address working
// for bookmarks and links.
export default function LegalPage() {
  redirect('/dashboard/workspaces/settings?tab=legal');
}
