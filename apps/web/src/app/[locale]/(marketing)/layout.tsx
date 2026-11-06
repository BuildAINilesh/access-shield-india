import { SkipLink } from '@accessshield/ui';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingWidgetEmbed } from '@/components/marketing/MarketingWidgetEmbed';
import { MarketingChatbotLazy } from '@/components/marketing/chat/MarketingChatbotLazy';
import '@/styles/marketing-dark.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-dark min-h-screen bg-[#07070c] text-[#f4f4f5]">
      <SkipLink href="#main-content" />
      <MarketingNav />
      <main id="main-content">{children}</main>
      <MarketingFooter />
      <MarketingChatbotLazy />
      <MarketingWidgetEmbed />
    </div>
  );
}
