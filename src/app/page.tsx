import { redirect } from 'next/navigation';
import { currentUser, profileOf } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role === 'parent') redirect('/parent');

  const profile = await profileOf(user.id);
  // The prologue is the gate: no profile, no campaign. Onboarding comes first
  // because the baseline is dressed as the opening chapter of a chosen genre.
  if (!profile?.heroName) redirect('/onboarding');
  if (!profile.baselineCompletedAt) redirect('/prologue');
  redirect('/play');
}
