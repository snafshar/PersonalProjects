# FramePilot Web

**[Open the live website](https://framepilot-web.afsharsn.chatgpt.site)** · **[View the shared source](../../mobile/framepilot)**

I implemented the web edition of FramePilot from the same Expo, React Native, and strict TypeScript codebase used for the iOS and Android application. This keeps the photography logic, routes, scenario library, accessibility work, and interface behaviour aligned across all three platforms instead of maintaining a reduced browser clone.

## What is available in the website

- Sign-in, account creation, demo access, and sign-out flows
- A protected dashboard after authentication or explicit demo entry
- 27 scenarios, including individual and group portraits, wildlife, sport, landscape, macro, astrophotography, events, commercial work, creative techniques, and video
- Detailed recommendations for exposure, autofocus, capture, colour, files, lenses, stabilisation, lighting, flash, image safeguards, video, and field readiness
- Live adjustment for light, movement, intent, sensor format, focal length, lens aperture, stabilisation, tripod use, flash availability, and output size
- Saved-setup workflow, gear profile, explanations, cautions, and field checklists
- Responsive layouts for phones, tablets, laptops, and desktop browsers

## Use it

1. Open the live website.
2. Choose **Explore demo** to enter immediately, or configure the supplied Supabase integration for real email/password accounts.
3. Select a scenario from the dashboard or scenario library.
4. Review the complete recommendation and the reason behind every setting.
5. Use **Adjust** when light, movement, equipment, or creative intent changes.
6. Save useful setups during the current demo session, or use the included row-level-secured database schema for persistent account saves.

## Source and validation

The public source is deliberately shared with the mobile project at [`mobile/framepilot`](../../mobile/framepilot). Run:

```bash
cd mobile/framepilot
npm install
npm run validate
npm run web
```

`npm run validate` performs strict TypeScript checking, five recommendation-engine tests, and a production static web export. The live release was produced from that validated export.

## Authentication scope

The deployed website always provides a working demo dashboard. Real account creation, email/password sign-in, and cloud-synchronised saves become active when the documented public Supabase URL and publishable client key are configured. No service-role secret belongs in browser or mobile code.
