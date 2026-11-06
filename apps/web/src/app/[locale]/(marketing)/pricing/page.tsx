import { redirect } from 'next/navigation';
import { localizedHref } from '@/lib/i18n/paths';
import { localeFromParams } from '@/lib/i18n/server';

/** Packages live on Services — keep old /pricing URLs working. */
export default function PricingRedirectPage({ params }: { params: { locale: string } }) {
  const locale = localeFromParams(params);
  redirect(localizedHref('/services', locale));
}
