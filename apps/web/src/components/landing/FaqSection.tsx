import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'Does this work with regular Instagram accounts?',
    a: 'InstaAuto requires an Instagram Professional (Business or Creator) account connected to a Facebook Page. This is a requirement of Meta\'s Instagram Messaging API, not a limitation we added — personal accounts cannot use commenting/DM automation APIs.',
  },
  {
    q: 'Will this get my account banned?',
    a: 'No. InstaAuto exclusively uses Meta\'s official Graph API, Instagram Messaging API, and the Private Replies endpoint that Meta built specifically for comment-triggered DMs. We never use browser automation or scraping.',
  },
  {
    q: 'What happens if someone comments the keyword twice?',
    a: 'Each automation sends at most one DM per commenter by default (configurable per automation), so you never spam the same follower twice.',
  },
  {
    q: 'Can I use multiple keywords per Reel?',
    a: 'Yes — add as many trigger keywords as you like per automation, and choose whether to match exact phrases, substrings, or any whole word.',
  },
  {
    q: 'What if a DM fails to send?',
    a: 'Failed sends (e.g. a user has DMs restricted) are logged with the reason, retried automatically with backoff, and you can manually retry from the Messages inbox.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
