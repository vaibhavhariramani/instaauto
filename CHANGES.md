# Follow-gated DM sequence

## New workflow

An automation can now run a 3-stage DM sequence instead of a single reply:

1. **Opening DM** — sent immediately when someone comments a trigger keyword. If
   "Require follow before sending the DM" is off, this is the real message (with
   an optional button: a plain tappable button, or a real link button if a URL
   is set). If gating is on, this is a generic pre-check message instead (e.g.
   "Thanks for stopping by! Tap below and I'll send you access shortly") with a
   button whose tap satisfies Instagram's inbound-message requirement for
   checking follow status.
2. **Follow check** — triggered the moment they tap the opening button (or send
   any reply). If they already follow the account, the real message (with its
   own link button) is sent immediately. If not, a follow-reminder is sent with
   two buttons: "Visit Profile" (opens the creator's Instagram profile) and
   "I'm following ✅" (rechecks follow status on tap).
3. **Loop or fallback** — tapping "I'm following ✅" re-checks their follow
   status and either sends the real message or repeats the reminder. If
   "sendCtaIfNeverFollows" is enabled, a scheduled job force-sends the real
   message after 24 hours regardless of follow status.

All buttons render as boxed, full-width buttons (Instagram's button-template
style) rather than quick-reply chips, so the opening button and both
follow-step buttons look visually identical.

## Key implementation details

- **Button rendering**: buttons are sent via a Messenger/Instagram
  button-template attachment with `web_url` buttons (real links) and
  `postback` buttons (fire a webhook event on tap, no URL) combined in one
  card — up to 3 per message. Quick-reply chips were dropped: live testing
  showed they render as a separate colored pill and don't reliably appear at
  all when sent alongside a template attachment.
- **Postback webhook handling**: a tapped `postback` button arrives on a
  different webhook field (`messaging[].postback`) than a text reply
  (`messaging[].message`). `webhookService.ts` now parses both and routes
  either into the same inbound-message handling, so a button tap re-triggers
  the follow-gate check exactly like a text reply would.
- **Schema**: `Automation` gained `followGateMessage`, `followButtonLabel`,
  `openingButtonLabel`, `ctaLinkButtons` (JSON, up to 3 `{label, url}` pairs),
  `sendCtaIfNeverFollows`, and `publicReplyMessages` (array, replacing a single
  message with rotating variations). A new `FollowGateState` table tracks open
  follow-checks per participant/automation.
- **Scheduled job**: `resolveStaleFollowGates` (hourly) force-resolves any
  follow-gate older than 24 hours whose automation has `sendCtaIfNeverFollows`
  on.
- **Mobile UI**: the automation editor now clearly separates "Opening DM"
  (sent first) from the follow-gate's pre-check message when gating is on, so
  it's obvious which message is sent when — this replaces a prior layout where
  a single ambiguous "DM reply message" field was reused for both roles
  depending on a toggle elsewhere on the screen.
