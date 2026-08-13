export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 16, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Who we are</h2>
          <p className="mt-2">
            InstaAuto (&quot;we&quot;, &quot;us&quot;) provides a tool that lets creators and
            businesses automatically reply to comments on their Instagram Reels with a direct
            message, using Meta&apos;s official Instagram Graph API and Instagram Messaging API.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Information we collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Account information</strong> you provide when
              signing up: name, email address, and profile details from Google Sign-In.
            </li>
            <li>
              <strong className="text-foreground">Instagram account data</strong> you explicitly
              connect via Instagram&apos;s OAuth login: your Instagram user ID, username, display
              name, profile picture, and follower count.
            </li>
            <li>
              <strong className="text-foreground">Access tokens</strong> issued by Instagram when
              you connect your account, so we can act on your behalf (reading comments, sending
              replies). Tokens are encrypted at rest (AES-256-GCM) and never shown in plaintext
              after initial connection.
            </li>
            <li>
              <strong className="text-foreground">Comment and message data</strong> needed to run
              your automations: the text of comments on your Reels, the commenter&apos;s Instagram
              username and user ID, and the content of automated replies we send on your behalf.
            </li>
            <li>
              <strong className="text-foreground">Usage and billing data</strong>: automation
              configuration, delivery logs, and (if you subscribe to a paid plan) billing
              information processed by Stripe. We do not store your card details ourselves.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. How we use your information</h2>
          <p className="mt-2">We use the data above only to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Detect comments matching your configured trigger keywords.</li>
            <li>Send the automated private reply or public comment reply you configured.</li>
            <li>Show you analytics about your automations (comments detected, DMs sent).</li>
            <li>Operate your account: authentication, billing, and product notifications.</li>
          </ul>
          <p className="mt-2">
            We do not sell your data, and we do not use your Instagram data for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. How we share information</h2>
          <p className="mt-2">
            We share data only with the service providers required to run the product: Meta
            (Instagram Graph API, to send the replies you configure), our database host, and
            Stripe (for billing, only if you subscribe to a paid plan). We do not share your data
            with any other third party.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Data retention</h2>
          <p className="mt-2">
            We retain your account and automation data for as long as your account is active.
            Disconnecting an Instagram account revokes our stored access token immediately. You can
            request full deletion of your data at any time — see our{' '}
            <a href="/data-deletion" className="text-foreground underline">
              Data Deletion Instructions
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Your rights</h2>
          <p className="mt-2">
            You can access, correct, export, or delete your data at any time from your account
            settings, or by contacting us at the email below. You can revoke InstaAuto&apos;s
            access to your Instagram account at any time from Instagram&apos;s own Settings →
            Apps and Websites page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Contact us</h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to{' '}
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
