# QuickShop10 Mobile App - CLAUDE.md

## Project Overview
Expo React Native mobile app for QuickShop10 staff (store owners, managers, agents). Hebrew-first, RTL throughout. Connects to the QuickShop10 backend at `/Users/tadmitinteractive/Desktop/quickshop10`.

- **Audience**: Staff (not customers) — owners/managers running stores
- **Language**: Hebrew (RTL), all user-facing text in Hebrew
- **Platform**: iOS + Android via Expo
- **Backend**: Next.js app at `/Users/tadmitinteractive/Desktop/quickshop10` — you have permission to edit it when a mobile bug requires server-side changes

## Tech Stack
- **Expo SDK 54**, **React Native 0.81.5**, **React 19.1**, **TypeScript 5.9**
- **Routing**: expo-router 6 (file-based)
- **State**: Zustand 5 (auth, app)
- **Data fetching**: TanStack React Query 5
- **Validation**: Zod 4
- **Storage**: expo-secure-store (tokens), AsyncStorage (cache)
- **Animations**: react-native-reanimated 4
- **Notifications**: expo-notifications + Expo Push Service
- **Build**: EAS (project ID `46d095a6-3316-471d-bb1c-343391981373`)
- **No i18n library** — all text hardcoded in Hebrew

## Project Structure
```
app/
├── _layout.tsx              # Root layout, RTL forcing, providers
├── (auth)/
│   ├── login.tsx            # Login screen
│   └── store-select.tsx     # Multi-store picker
└── (tabs)/
    ├── _layout.tsx          # Tabs: בית / הזמנות / מוצרים / לקוחות / pos / עוד
    ├── index.tsx            # Home dashboard
    ├── orders/              # Orders list + [id] detail
    ├── products/            # Products list, [id], create, scanner (barcode)
    ├── customers/           # Customers list, [id], create
    ├── analytics/           # Analytics dashboard
    ├── pos/                 # POS quick-sale flow
    ├── discounts/           # Discounts management
    └── more.tsx             # Settings, logout, etc.

components/ui/               # Design system primitives
├── Button.tsx               # Button (variants, sizes)
├── Card.tsx
├── Input.tsx
├── Text.tsx                 # Custom Text with assistive text
├── Badge.tsx, StatusBadge.tsx
├── SearchBar.tsx, FilterTabs.tsx
├── StatCard.tsx, SectionHeader.tsx
├── Skeleton.tsx, Toast.tsx, EmptyState.tsx, LoadingScreen.tsx
└── theme.ts                 # Design tokens (colors, spacing, type, shadows)

hooks/                       # React Query hooks per domain
├── useDashboard.ts, useOrders.ts, useProducts.ts
├── useCustomers.ts, useAnalytics.ts, useDiscounts.ts
├── usePOS.ts, useWebhooks.ts
└── index.ts

lib/
├── api/
│   ├── client.ts            # Base fetch wrapper, ApiError, AuthError
│   ├── auth.ts              # Login, refresh, logout
│   ├── products.ts, orders.ts, customers.ts
│   ├── analytics.ts, pos.ts
└── utils/
    ├── format.ts            # Currency (₪), dates (Hebrew)
    ├── haptics.ts           # iOS/Android haptic feedback
    └── toast.ts             # Toast helpers

stores/
├── auth.ts                  # Zustand auth store (token, user, store)
└── app.ts

plugins/
└── withForcedRTL.js         # Native config plugin — sets RTL at iOS/Android level

locales/he.json              # Currently empty (no i18n keys yet)
```

## Backend Mapping (when a bug requires server-side fix)
The backend is at `/Users/tadmitinteractive/Desktop/quickshop10`. Mobile API surface lives under `src/app/api/mobile/*`:

| Mobile feature | Backend file |
|---|---|
| Login | `src/app/api/mobile/auth/login/route.ts` |
| Token refresh | `src/app/api/mobile/auth/refresh/route.ts` |
| Auth validation (Bearer) | `src/lib/mobile-auth.ts` |
| Products list/CRUD | `src/app/api/mobile/products/...` |
| Orders | `src/app/api/mobile/orders/...` |
| Customers | `src/app/api/mobile/customers/...` |
| POS | `src/app/api/mobile/pos/...` |
| Push notifications | `src/app/api/mobile/notifications/...` + `device/register` |
| Analytics | `src/app/api/mobile/analytics/...` |
| Discounts | `src/app/api/mobile/discounts/...` |
| Categories | `src/app/api/mobile/categories/...` |
| Store config | `src/app/api/mobile/store/...` |

Auth: `Authorization: Bearer qs_mobile_<token>` (30-day, refreshable). DB: PostgreSQL (Neon) via Drizzle. Schema in `src/lib/db/schema.ts`. Always scope by `storeId`.

When fixing across both repos, commit to each separately with clear messages.

## RTL Guidelines — CRITICAL
The hardest part of Expo + Hebrew. The app forces RTL natively (see `plugins/withForcedRTL.js` and `app/_layout.tsx`), but **component styles must still be RTL-aware**:

### ✅ DO
- Use `marginStart` / `marginEnd` / `paddingStart` / `paddingEnd` instead of `Left`/`Right`
- Use `textAlign: 'auto'` (RN default — flips automatically) or `'right'` only when intentional
- Use `flexDirection: 'row'` — it auto-flips in RTL
- For directional icons (chevrons, arrows): flip them in RTL or use `transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }]`
- For absolute positioning, use `start` / `end` instead of `left` / `right` when supported, or branch on `I18nManager.isRTL`

### ❌ DON'T
- Hard-code `textAlign: 'left'` or `'right'` unless you mean it visually
- Hard-code `marginLeft`, `paddingLeft`, `left:`, `right:` in absolute styles — they will NOT flip
- Assume `flexDirection: 'row-reverse'` is correct in RTL — usually `'row'` is right (it already flips)

### Known RTL bug hotspots (audit before changing)
- `app/(tabs)/products/[id].tsx` — many hardcoded `textAlign` and `left/right`
- `app/(tabs)/products/create.tsx`, `scanner.tsx`
- `app/(tabs)/pos/index.tsx`
- `app/(tabs)/customers/index.tsx`, `create.tsx`
- `app/(tabs)/more.tsx`

### RTL setup files
- `app.json` — `supportsRTL: true`, `forcesRTL: true`, `locales.he`
- `plugins/withForcedRTL.js` — iOS Info.plist + Android manifest
- `app/_layout.tsx` — `I18nManager.forceRTL(true)` at module level + `useLayoutEffect`

## Conventions
- All user-facing text in Hebrew
- Currency: `₪` (ILS) — use `lib/utils/format.ts`
- Dates: Hebrew locale via `date-fns/locale/he`
- Tabs/screens use Hebrew labels (בית, הזמנות, מוצרים, לקוחות)
- Server state via React Query hooks (`hooks/use*.ts`) — don't fetch directly in components
- Auth token via Zustand `stores/auth.ts` + `expo-secure-store`
- New API endpoints: add to `lib/api/<domain>.ts` and a hook in `hooks/use<Domain>.ts`

## Commands
```bash
npm start                    # expo start (dev menu)
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm run eas:update:preview   # OTA update to preview channel
npm run eas:update:production # OTA update to production
npx tsc --noEmit             # Type check
```

## Specialist subagents (`.claude/agents/`)

This project ships a small set of focused subagents you can hand off narrow tasks to via the `Agent` tool. Each one is loaded with the patterns and rules already validated in this codebase, so handing them a diff or a question is faster than re-explaining context.

| Agent | Use when |
|---|---|
| `rtl-auditor` | Reviewing UI changes / screenshots for RTL+Hebrew layout regressions (textAlign, marginLeft/Right, icon flipping, the standalone-Text right-align trap). |
| `pos-specialist` | Anything touching `app/(tabs)/pos/**`, `hooks/usePOS.ts`, `lib/api/pos.ts`, or `quickshop10/src/app/api/mobile/pos/**` — cart, checkout, payments, variants, returns/exchanges. |
| `mobile-api-bridge` | Cross-repo bugs/features that span the mobile app and the backend's `src/app/api/mobile/*`. Use when a response shape, auth, or new endpoint is involved. |
| `hebrew-copy-editor` | Reviewing or writing user-facing Hebrew strings — gender agreement, terminology lockdowns (`וריאציה`, `המשך לתשלום`), tone, register. |
| `mobile-design-system` | New components, restyling, or token consistency in `components/ui/`. Catches drift like `colors.semantic.warning.subtle` (which doesn't exist — use `.light`). |

For independent reviews you can launch any of these in parallel with the `Agent` tool. Don't invoke them for tasks outside their scope (each agent's `description` documents what to skip). When a task spans multiple agents (e.g., a POS UI change with new Hebrew copy), launch them in parallel and synthesize.

---

# Telegram Bot Instructions

## Team
- **yogev** (יוגב) - Lead developer, project owner
- **maria** (מריה) - QA / tester, sends bug reports and fix requests

## How to handle messages

### When someone says "תנסח" (formulate)
You are a prompt formulator. Take the raw bug description (text + screenshot + screen/route) and restructure it into a clear, actionable prompt that Claude Code can execute. Format:

```
## Bug Report
**Screen/Route**: [e.g. app/(tabs)/products/[id].tsx]
**Component**: [identify the relevant component/file]
**Current behavior**: [what's happening now]
**Expected behavior**: [what should happen]
**Steps to reproduce**: [if clear from the description]
**Likely layer**: [mobile / backend / both]

## Fix Prompt
[A clear, concise instruction for Claude Code to fix this bug, referencing the specific file paths and component names from the codebase. If the fix likely needs the backend, name the backend route under quickshop10/src/app/api/mobile/* too.]
```

Guidelines:
- Identify the relevant files from the screen description (e.g., "in the products list" → `app/(tabs)/products/index.tsx`)
- Name the specific components/hooks involved
- For RTL bugs, flag them explicitly — these are common and need careful style review
- For data/API bugs, note whether the fix is in mobile (`lib/api/*`, `hooks/use*`) or backend (`quickshop10/src/app/api/mobile/*`)
- Be precise about what needs to change

### When someone says "תתקן" (fix)
You are a bug fixer. Read the bug description, find the relevant code, diagnose the issue, and fix it. Steps:
1. Identify the relevant files from the screen/description
2. Read the code to understand the current behavior
3. Find the root cause
4. Apply the fix — in the mobile app and/or in the quickshop10 backend if needed
5. Run `npx tsc --noEmit` to type-check before committing
6. Commit + push to the relevant repo(s)
7. Report what you changed (and which repos)

### When someone sends a screenshot
- Analyze the screenshot to understand the visual bug
- Cross-reference with the screen description to find the relevant component
- Identify RTL/layout/style issues from the visual — RTL anti-patterns are common (text aligned wrong, icons not flipped, padding on wrong side)

### When someone describes a screen/route
Map the description to the file structure:
- "מסך מוצר" / "דף מוצר" → `app/(tabs)/products/[id].tsx`
- "רשימת מוצרים" → `app/(tabs)/products/index.tsx`
- "סורק ברקוד" → `app/(tabs)/products/scanner.tsx`
- "הזמנות" → `app/(tabs)/orders/`
- "לקוחות" → `app/(tabs)/customers/`
- "POS" / "קופה" → `app/(tabs)/pos/`
- "אנליטיקס" / "דשבורד" → `app/(tabs)/analytics/` or `app/(tabs)/index.tsx`
- "הנחות" → `app/(tabs)/discounts/`
- "הגדרות" / "עוד" → `app/(tabs)/more.tsx`
- "התחברות" → `app/(auth)/login.tsx`
- Read the relevant file and its imported components

### Cross-repo fixes
Many bugs are mobile-only (UI/RTL/style/state). Some require backend changes (wrong API response shape, missing field, auth issue). When the root cause is in the backend:
1. State this clearly in your Telegram update
2. Fix in `/Users/tadmitinteractive/Desktop/quickshop10` — usually under `src/app/api/mobile/*`
3. Commit + push from BOTH repos if both changed
4. Mention both commit hashes in the final report

### Deployment rules — CRITICAL
**Backend changes (quickshop10):**
- Always `git push` after committing — the backend is hosted on Vercel and auto-deploys from git
- Without push, the fix is NOT live
- Telegram update: "🚀 דוחף לגיט - וורסל יעלה אוטומטית"

**Mobile app changes (quick10mobileApp):**
- Default: ship via **OTA update** (no app store submission needed)
  - Run `npm run eas:update:production` (or `eas:update:preview` for testing)
  - Telegram update: "📲 שולח OTA update לפרודקשן..."
- **When a new build IS required — try auto-build first, fall back to manual only if it asks for input:**
  - Triggers: native code changes (`ios/`, `android/`, `plugins/`), `app.json` native config (`supportsRTL`, `permissions`, `plugins`), new native dependency (anything requiring `expo prebuild`), Expo SDK upgrade, bundle identifier change, app icon/splash/name change
  - The user is already logged into the App Store / EAS on this machine — credentials should resolve automatically
  - Run: `eas build --platform all --profile production --non-interactive --no-wait`
    - `--non-interactive` = fails fast instead of prompting (so we know immediately if input is needed)
    - `--no-wait` = submits the build to EAS cloud and returns; the build itself runs there for ~15-25 min
  - If submission **succeeds**: Telegram update: "🏗️ בילד יצא לדרך (פלטפורמה X) - ייקח 15-25 דק', תקבל מייל מ-EAS כשמוכן"
  - If submission **fails because input is needed** (Apple 2FA, keystore prompt, version bump confirmation, etc.): Telegram update: "⚠️ הבילד דורש קלט שאני לא יכול להזין: [הודעת השגיאה הספציפית]. תריץ ידנית: `eas build --platform <X> --profile production`"
  - Do NOT wait for the build to finish — EAS notifies the user by email
  - Always state in the Telegram update which platform(s) the build is for

Pure JS/TS changes (components, hooks, screens, styles, lib/) → OTA always works.

### Progress updates — CRITICAL
You MUST send a separate Telegram reply at EVERY step of your work. The team watches Telegram, not the terminal. They need to see exactly what you're doing in real-time.

Send a Telegram reply for EACH of these moments:
1. **Received task**: "📩 קיבלתי - [תיאור קצר]"
2. **Starting investigation**: "🔍 בודק את [שם הקובץ/קומפוננטה]..."
3. **Reading code**: "📖 קורא [file.tsx] שורות X-Y..."
4. **Found the issue**: "✅ מצאתי את הבעיה: [תיאור ספציפי]"
5. **Making the fix**: "🔧 מתקן - [מה בדיוק משתנה]"
6. **Cross-repo (if needed)**: "🔁 צריך גם תיקון בבקאנד - מתקן ב-quickshop10..."
7. **Type check**: "🏗️ מריץ tsc לוודא שאין שגיאות..."
8. **Committing**: "📦 שומר ודוחף לgit..."
9. **Done**: "✅ סיום! [סיכום + קבצים שנערכו + commit hashes]"

Minimum 5 Telegram replies per task. Each reply 1-2 sentences max.
Do NOT batch multiple steps into one reply. Send each step as its own message.

### Token efficiency
- Do NOT write text to the terminal. All communication goes through Telegram replies only.
- Do NOT summarize or narrate your work in the terminal output.
- Only use the terminal for tool calls (Read, Edit, Bash, Grep, etc.)

### Work modes — IMPORTANT
- **DEFAULT MODE (no "תתקן" keyword)**: FAST mode. Answer immediately from your knowledge of the project. Do NOT read files. Do NOT search code. Do NOT run commands. Just reply in Telegram. One short message. This includes: greetings, questions, "תנסח" tasks, general conversation.
- **FIX MODE (message contains "תתקן")**: DEEP mode. Now you go full power — read files, search code, investigate thoroughly, edit code (mobile and/or backend), type-check, commit, push. Send progress updates to Telegram at every step.

### General conversation
- Respond in Hebrew
- Be concise and practical - short answers, no unnecessary explanations
- If the bug is unclear, ask for: screenshot, screen name/route, and steps to reproduce
- After fixing, summarize what was changed in 1-2 sentences
- Do NOT read files you don't need. Use the description to identify the exact file before reading
- Do NOT explore the codebase broadly. Go directly to the relevant file
- Keep responses under 200 words when possible

## Sibling Bots (Telegram channel orchestration)

You are running as a Telegram bot via `claude --channels` on macOS, alongside sibling bots in other project directories on the same Mac. If a user (or you) needs to **restart, wake, or pause** a sibling bot, use the dashboard scripts.

### Available bots
- `clickynder` — Clickynder native (`/Users/tadmitinteractive/Desktop/clickyndernative`)
- `ines` — Ines marketing (`/Users/tadmitinteractive/Desktop/Ines marketing`)
- `mobile` — QuickShop mobile app (`/Users/tadmitinteractive/Desktop/quick10mobileApp`)
- `quick-chat-dev-bot` — @quick_chat_dev_bot (`/Users/tadmitinteractive/Desktop/Projeccts/quickchat`)
- `quickshop10` — QuickShop 10 (`/Users/tadmitinteractive/Desktop/quickshop10`)

### Cross-bot operations (use Bash)
```bash
# Restart any bot by key (kills tmux, releases Telegram polling slot, relaunches)
/Users/tadmitinteractive/bin/restart-claude-bots.sh <key>

# Live status of all bots (tmux, claude PID, uptime)
/Users/tadmitinteractive/bin/claude-bots-status.sh
```

To toggle a bot to a paused state from chat, use the dashboard at `http://localhost:3030` (or call `PATCH /api/bots/<id>` with `{"enabled": false|true}`). Paused bots do not get auto-restarted by the daily cron or 5-minute health check until re-enabled.

