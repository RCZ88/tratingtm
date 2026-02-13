import { redirect } from 'next/navigation';

export default function SuggestionsCompletedRedirectPage() {
  redirect('/forum?tab=suggestions&view=past&status=completed');
}
