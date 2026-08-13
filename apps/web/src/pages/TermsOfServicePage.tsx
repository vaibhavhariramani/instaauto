export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 17, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Agreement to these terms</h2>
          <p className="mt-2">
            These Terms of Service govern your use of InstaAuto, a tool that lets you automatically
            reply to comments on your Instagram Reels with a direct message, built on Meta&apos;s
            official Instagram Graph API and Instagram Messaging API. By creating an account or
            connecting an Instagram account, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Who can use InstaAuto</h2>
          <p className="mt-2">
            You must be at least 18 years old, able to form a binding contract, and the owner or
            authorized administrator of the Instagram Professional (Business or Creator) account you
            connect. You&apos;re responsible for keeping your Google Sign-In credentials and connected
            Instagram access secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Acceptable use</h2>
          <p className="mt-2">You agree to use InstaAuto only to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Automate replies to comments on Reels and accounts you own or are authorized to manage.</li>
            <li>Send messages that comply with Meta&apos;s Platform Policies, Instagram&apos;s Community Guidelines, and applicable law (including anti-spam and data protection law).</li>
          </ul>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Use InstaAuto to send unsolicited, deceptive, or harassing messages, or to message anyone who has not commented your configured trigger keyword on your own Reel.</li>
            <li>Scrape, reverse-engineer, or access Instagram outside of the official APIs InstaAuto uses.</li>
            <li>Use another person&apos;s Instagram account without authorization.</li>
            <li>Attempt to disrupt, overload, or gain unauthorized access to InstaAuto&apos;s systems.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Your content and Instagram data</h2>
          <p className="mt-2">
            You retain ownership of your automation configurations, message templates, and any
            content you create in InstaAuto. We access and store Instagram data (profile info,
            comments, message content) strictly as described in our{' '}
            <a href="/privacy" className="text-foreground underline">
              Privacy Policy
            </a>{' '}
            — solely to operate the automations you configure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Subscriptions and billing</h2>
          <p className="mt-2">
            Some features require a paid subscription plan (Starter, Pro, or Business), billed
            monthly or yearly through Stripe. Prices and plan limits are shown in-app before you
            subscribe. You can cancel at any time from Settings; cancellation takes effect at the
            end of the current billing period. Fees already paid are non-refundable except where
            required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Suspension and termination</h2>
          <p className="mt-2">
            We may suspend or terminate your access if you violate these terms, Meta&apos;s
            policies, or applicable law, or if your connected Instagram account loses the
            permissions InstaAuto needs to operate. You may stop using InstaAuto and disconnect
            your Instagram account at any time — see our{' '}
            <a href="/data-deletion" className="text-foreground underline">
              Data Deletion Instructions
            </a>{' '}
            to also remove your stored data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Disclaimers</h2>
          <p className="mt-2">
            InstaAuto is provided &quot;as is.&quot; We don&apos;t guarantee that Instagram will
            always deliver comments, webhooks, or messages without delay or interruption, since
            InstaAuto depends on Meta&apos;s platform and APIs operating normally. InstaAuto is not
            affiliated with, endorsed by, or sponsored by Meta or Instagram.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Limitation of liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, InstaAuto and its operator are not liable for
            indirect, incidental, or consequential damages arising from your use of the service,
            including lost profits, lost data, or Instagram account restrictions imposed by Meta.
            Our total liability for any claim is limited to the amount you paid us in the 12 months
            before the claim arose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Changes to these terms</h2>
          <p className="mt-2">
            We may update these terms from time to time. If we make material changes, we&apos;ll
            notify you in-app or by email before they take effect. Continuing to use InstaAuto
            after changes take effect means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Governing law</h2>
          <p className="mt-2">
            These terms are governed by the laws of Ireland, without regard to conflict-of-law
            principles. Any dispute arising from these terms will be subject to the exclusive
            jurisdiction of the courts of Ireland.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Contact us</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{' '}
            <a href="mailto:vaibhav.hariramani01@gmail.com" className="text-foreground underline">
              vaibhav.hariramani01@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
