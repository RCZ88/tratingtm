import { redirect } from 'next/navigation';

export default function SuggestionsRedirectPage() {
  redirect('/forum?tab=suggestions');
}
