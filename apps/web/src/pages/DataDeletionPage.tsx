export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Data Deletion Instructions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 16, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <p>
            You can request deletion of all data InstaAuto holds about you and your connected
            Instagram account(s) at any time, using either of the methods below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Option 1 — Disconnect from Instagram directly
          </h2>
          <p className="mt-2">
            Open Instagram, go to <strong className="text-foreground">Settings → Apps and
            Websites</strong>, find <strong className="text-foreground">Dhandha App-IG</strong>,
            and remove its access. This immediately revokes the access token InstaAuto holds for
            your account. Then follow Option 2 to remove the remaining account data from our
            database.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Option 2 — Request full account deletion
          </h2>
          <p className="mt-2">
            Email{' '}
            <a href="mailto:vaibhav.hariramani01@gmail.com" className="text-foreground underline">
              vaibhav.hariramani01@gmail.com
            </a>{' '}
            from the email address on your InstaAuto account, with the subject line{' '}
            <strong className="text-foreground">&quot;Delete my data&quot;</strong>. We will:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Permanently delete your user account, connected Instagram account records, and encrypted access tokens.</li>
            <li>Permanently delete your automations, message logs, comment logs, and analytics.</li>
            <li>Cancel any active subscription and stop future billing.</li>
            <li>Confirm completion by email within 30 days, as required by Meta Platform policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What is not affected</h2>
          <p className="mt-2">
            Deleting your InstaAuto data does not delete the Reels, comments, or messages that
            already exist on Instagram itself — those are controlled by Instagram, not by us.
            Deleting your account only removes the copies of that data stored in InstaAuto&apos;s
            own database and revokes our ability to act on your Instagram account going forward.
          </p>
        </section>
      </div>
    </div>
  );
}
