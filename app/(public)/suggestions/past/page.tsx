import { redirect } from 'next/navigation';

export default function SuggestionsPastRedirectPage() {
  redirect('/forum?tab=suggestions&view=past');
}
