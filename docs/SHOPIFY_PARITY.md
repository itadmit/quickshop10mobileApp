# QuickShop10 Mobile — Shopify-Parity Roadmap

> Synthesis of 4 parallel audits run on 2026-05-02:
> Shopify mobile feature inventory, internal RTL audit, internal POS audit, internal design-system audit.

The goal is a Hebrew-first, RTL-throughout staff app that matches the polish and capability of Shopify's Admin + POS apps for the QuickShop10 platform. This doc is the punch list, ordered by what unblocks what.

---

## TL;DR

- **Strengths today**: solid information architecture, decent RTL hygiene (zero `row-reverse`, force-RTL set early, no broken design tokens this round), real cart mechanics including exchange/return mode, working multi-store switcher and push notifications.
- **Top blockers vs Shopify-grade**: missing receipt/cash/shift flows in POS (Israeli tax compliance), no save-cart, no per-line discount, no in-app dashboard customization, no Smart-Grid-equivalent home for POS, no Quick-Sale entry on the admin home.
- **Foundation work to do first** (one focused week): fix 3 cart bugs (markAsPaid, partialPaymentAmount, coupon re-validation), add 4 missing UI primitives (Banner, Toggle, BottomSheet, Avatar helper), sweep ~30 hard-coded colors and ~12 RTL absolute-positioning bugs.
- **Parity work itself** is then sequenced into 3 tiers: cashier-essential, polish, and hardware/offline.

---

## Part 1 — Foundation (do before any parity feature)

These cleanups remove the recurring sources of bugs we've been hitting and unblock the new work without re-inventing primitives.

### 1.1 Cart-state bugs (mobile)

| # | File:Line | Bug | Fix |
|---|---|---|---|
| F1 | `hooks/usePOS.ts:200` | `clearCart` resets `markAsPaid` to `true`, so the second sale silently flips the validated default ("Continue to payment" → "Close as paid"). | Reset to `false`. Move `partialPaymentAmount`/`isPartialPayment` into the cart hook (currently lives in `app/(tabs)/pos/index.tsx:160` screen state and is reset by hand at every callsite — easy to forget). |
| F2 | `app/(tabs)/pos/index.tsx:357-379` + backend `quickshop10/src/app/api/mobile/pos/orders/route.ts:411-418` | When `getConfiguredProvider` returns `success:false` (the Quick Payments / Hosted-Fields case), the order is created and the mobile shows a green success toast with an error appended. Cashier walks away with a silently-pending order. | Backend returns a typed error code; mobile shows a hard `Alert` and aborts cart-clear. Track via new `GET /mobile/pos/payment-providers` capability endpoint so the front end can pre-disable "Continue to payment" for unsupported providers. |
| F3 | `hooks/usePOS.ts:182-216` | Coupons stay applied after the cart drops below their min-cart-total or the customer is swapped (e-mail-restricted coupons survive the swap). | Re-call `validateCoupon` after `addItem`/`removeItem`/`updateQuantity`/`setCustomer`, and drop coupons that now fail. |
| F4 | `hooks/usePOS.ts:26,29,33`, `lib/api/pos.ts:118`, `app/(tabs)/pos/index.tsx:141,194,195,198` | 8 `[POS]` `console.log` calls running in production. | Gate on `__DEV__`. |
| F5 | `app/(tabs)/pos/index.tsx:587` | Grid is hard-capped at `products.slice(0, 30)` — silently hides results. | Remove slice; wire pagination/infinite scroll. |

### 1.2 RTL bugs (specific, mostly absolute positioning)

(Full list lives in the RTL audit. Ones with the highest visible impact:)

| # | File:Line | Issue | Fix |
|---|---|---|---|
| R1 | `app/(tabs)/pos/index.tsx:1273` | Variant OOS string `'אזל מהמלאי'` on a feminine noun (`וריאציה`). | `'אזלה מהמלאי'`. |
| R2 | `app/(tabs)/products/[id].tsx:1661,1675`; `create.tsx:887,898`; `pos/index.tsx:1707,1721`; `products/index.tsx:359` | Absolute-positioned thumbnail badges using `left:` / `right:` — wrong corner in RTL. | Switch to `start` / `end`, plus `borderBottomStartRadius` / `borderTopEndRadius` on the draft ribbon. |
| R3 | `app/(tabs)/_layout.tsx:168` | Tab-bar notification badge `right: -10` floats off the wrong edge. | `end: -10`. |
| R4 | `components/ui/Button.tsx:111,128` and `Input.tsx:130-139`, `SearchBar.tsx:78` | `marginLeft`/`paddingLeft` for icon spacing — caller has to lie about iconPosition in RTL. | Migrate to `marginStart` / `paddingStart`; rename the prop `iconPosition: 'leading' | 'trailing'`. |
| R5 | `app/(tabs)/products/create.tsx:349`, `products/[id].tsx:528,549` | `marginLeft` / `paddingLeft` inside a horizontal draggable list — gap on wrong side. | `marginStart` / `paddingStart`. |
| R6 | `app/(tabs)/products/scanner.tsx:172` | Hard-coded `←` glyph in CTA. | Use `<Ionicons name="chevron-back" />`. |

**Systemic**: introduce a shared `rtlText` style in `components/ui/theme.ts` and migrate the screens that re-declare `{textAlign:'right', writingDirection:'rtl'}` boilerplate (12+ files). One-afternoon refactor; removes the entire RTL-text risk surface.

### 1.3 Missing UI primitives (build these once, reuse forever)

| Primitive | Why we need it | What it replaces |
|---|---|---|
| `<Banner>` | Hand-rolled colored surfaces for error/info/coupon-applied/partial-payment in POS keep multiplying hex literals (`#FEF2F2`, `#EFF6FF`, `#F0FDF4`, `#FFF7ED` …). | `pos/index.tsx:1605-1614,2037-2049,2056-2098`. |
| `<Toggle>` | Three different switch sizes (44×26 / 52×32) shipped across discounts/customers/products screens. | `discounts/index.tsx:381-403`, `customers/create.tsx:408-427`, `products/create.tsx:1034-1054`. |
| `<BottomSheet>` (extract from `pos/index.tsx:49-133`) | POS owns a real one with KeyboardAvoidingView; `more.tsx` falls back to a centered `<Modal>` for the contact picker. Two modal patterns for the same intent. | `pos/index.tsx` modals + `more.tsx:302-345`. |
| `lib/utils/avatar.ts` | Three deterministic-color-from-string helpers with three different palettes; some palettes contain colors not in `theme.ts`. | `customers/index.tsx:27`, `customers/[id].tsx:28`, `orders/[id].tsx:65-74`. |

### 1.4 Theme additions

- `designTokens.colors.surface.onBrand` (replace 45× hard-coded `'#FFFFFF'`).
- `designTokens.colors.overlay.{scrim, light, heavy}` (replace 10× raw `rgba(0,0,0,0.X)`).
- `designTokens.colors.return` (or migrate the 10× `'#EA580C'` to `accent[500]`).
- `designTokens.radii.xs` (4 px — used for status dots/pips at 4 callsites).
- Promote one avatar palette to `designTokens.colors.avatar`.

### 1.5 Convergence on existing primitives

- 78 hand-built card-shaped `<View>`s vs only 2 `<Card>` uses → migrate the obvious ones.
- 62 `Alert.alert()` callsites coexist with the `<Toast>` system → pick one for non-blocking (Toast), keep `Alert` only for destructive confirms.
- 69 raw `<TextInput>` vs 16 `<Input>` → migrate.
- Inline status pills in `(tabs)/index.tsx:531-532` and `orders/index.tsx:235-279` → `<StatusBadge>`.
- 12+ hand-rolled `<Text style={styles.sectionTitle}>` → `<SectionHeader>`.

---

## Part 2 — POS to Shopify-grade

Israeli physical-store cashier is the demanding user here. Tiered by what would show up in a Maria-style bug report on day one.

### Tier 1 — Cashier-essential (parity table-stakes)

| Feature | Mobile work | Backend work |
|---|---|---|
| **Receipts** (email / SMS / print preview) | After checkout, present "send receipt" sheet with email + SMS + "no receipt" options. Currently `sendOrderConfirmationEmail` is auto-fired only on `markAsPaid && total>0` — silent for the provider-redirect flow. | `POST /mobile/pos/orders/[id]/receipt` `{ channel: 'email'|'sms'|'print' }`. SMS via existing provider; print returns ESC/POS payload. New `GET /mobile/pos/receipt-template` for store name / VAT id / footer. |
| **Refund from past order** | New flow: open recent POS orders → pick order → pick line items → pick refund method (original tender / cash / store credit). Today the cashier re-picks products from the grid in exchange mode and guesses prices; `originalOrderId` exists on `CartItem` but nothing populates it. | `GET /mobile/pos/orders` (list, paginated, filter `utmSource='pos'`). `GET /mobile/pos/orders/[id]` (line items). `POST /mobile/pos/orders/[id]/refund` `{ items, refundMethod, restock }`. Restock via existing `pendingInventoryReturns`. |
| **Shifts** — open / close / cash count (Israeli tax law: קופה רושמת end-of-day Z-report) | New "Shift" home tile, open/close screens, mid-shift cash count, Z-report PDF/print. | New `posShifts` table (`storeId, userId, openedAt, closedAt, openingCash, closingCash, expectedCash, salesTotal, refundsTotal`). Endpoints: `POST /open`, `POST /close`, `GET /current`, `GET /[id]/report`. New `posCashMovements` table for paid-in/paid-out/float. |
| **Per-line discount** (₪/%) | Long-press cart row → discount sheet with amount + reason. | `orderItems.lineDiscountAmount` + `lineDiscountReason` columns; `/pos/orders` accepts. |
| **Tip line** at checkout (preset 10/15/20% + custom) | New cart row above total. | `orders.tipAmount`; `/pos/orders` accepts; receipts include. |
| **Cash flow + change calc** | "Amount tendered" input on `markAsPaid` path; computes change due; integrates with cash-drawer movement. | `cashTendered` + `changeDue` on order; cash-movement record on close-sale. |
| **Save / park cart** | "Park sale" button → server-stored draft → recall sheet on Cart screen. | `POST /mobile/pos/carts` (snapshot the cart state), `GET`, `DELETE`. |
| **Barcode scanner auto-add** | Scanner currently just dumps to search field (`pos/index.tsx:257`). Switch to: scan → fetch product+variant → instantly add to cart. The standalone `app/(tabs)/products/scanner.tsx` already has the right hook; reuse it. | `GET /mobile/pos/products/by-barcode/[code]` returning resolved product+variant. |

### Tier 2 — High-value polish

- **Tax controls**: per-item taxable toggle + customer-level exemption (B2B / tourist VAT). Schema: `orderItems.taxable`, `orders.taxExempt`. Tax breakdown line in summary.
- **Customer-facing display**: simple mirror screen for a second device (or the customer's phone via QR) showing the running cart total. PWA URL works for v1 (no native build).
- **Order lookup / reprint** from the POS itself, not just the admin Orders tab.
- **Multi-register + cashier identity**: `orders.registerId` and `orders.cashierUserId`. Staff PIN entry on app foreground (4–6 digits) for shared tablets — Shopify Pro parity.
- **Smart-Grid-style POS home**: configurable tile grid (favorites, top-sellers, custom-sale, discount, customer, app actions). Today the POS opens directly into the cart; a tile grid is the Shopify default and makes one-tap recall faster.
- **Inline product search typeahead** + recent-scanned strip.

### Tier 3 — Hardware / offline (longer arc, may need native build)

- **Bluetooth receipt printers** (Star/Epson). Needs a native module → new build. Worth it because Israeli stores expect physical receipts.
- **External card readers** (PayPlus terminal, Tranzilla, SumIt). Currently we redirect via `Linking.openURL` to a hosted page — bypasses the cashier flow. Needs SDK integration → new build per provider.
- **Cash drawer** (kicked open via printer ESC/POS). Together with the printer.
- **Offline mode**: queue cash + manual sales when offline; sync on reconnect. Card-present offline payments are explicitly *not* in scope (Shopify themselves don't fully support this).
- **Tap to Pay on iPhone / Android**: requires Apple/Google enrollment per provider; unlikely to land before native partners support it.

---

## Part 3 — Admin app to Shopify-grade

### Tier 1

- **Quick Sale entry on Home**: a one-tap path to take a payment from the admin home, not just from the POS tab. Shopify shows this as the most-used admin-app shortcut.
- **Customizable dashboard**: pick which KPIs and time periods (today / 7 / 30 / 90 / custom) appear, with sparklines and percent delta vs previous period. We have the data via `/mobile/analytics/summary`; need the UI configurability.
- **Live View**: real-time visitors / active checkouts / today's sales ticker. Backend hook would wrap existing analytics + a websocket or short-poll.
- **Push notification deep-linking**: extend the listeners in `app/_layout.tsx` to cover low-stock, abandoned-checkout, refund-request types beyond the existing `new_order`/`low_stock`/`new_customer`.

### Tier 2

- **Bulk actions on list screens** (orders fulfill/archive/mark-paid; products status change/delete). Cap at 25 like Shopify does.
- **Saved views / filters** on Orders and Products. Persist per-user.
- **KPI sparkline** on every numeric tile (currently we show the value only).
- **In-app camera tools** for product photos: built-in crop + remove background (we have `expo-image-picker`; add `expo-image-manipulator` / on-device ML).
- **Sidekick-equivalent AI assistant**: "מה ההזמנות שצריך לטפל בהן היום?" type queries. This is an app-wide feature, lower priority but big perception jump.

### Tier 3

- **Apple Watch companion** (sales-at-a-glance, push notifications) — tiny effort with Expo+watchOS, big perception.
- **Mobile theme editor** — likely out of scope for v1.

---

## Part 4 — Cross-cutting polish

- **Optimistic updates** on all mutations that the cart hook already does for adds. Extend to "mark as fulfilled", "mark as paid", customer credit add.
- **List virtualization**: replace `ScrollView` with `FlatList` in POS cart and any list that can grow. Today the POS cart is unbounded inside an outer `ScrollView`.
- **Skeleton loaders** instead of bare `ActivityIndicator` (POS grid is the worst offender).
- **Dynamic Type** + VoiceOver labels on actionable controls.
- **Empty-state CTAs** ("צור הזמנה ראשונה" / "הוסף מוצר") instead of just descriptive text.

---

## Part 5 — Schema & API summary (cross-repo)

New columns:
- `orders.tipAmount`, `orders.taxExempt`, `orders.registerId`, `orders.cashierUserId`, `orders.cashTendered`, `orders.changeDue`.
- `orderItems.lineDiscountAmount`, `orderItems.lineDiscountReason`, `orderItems.taxable`.
- New tables: `posShifts`, `posCashMovements`, `posParkedCarts`.

New endpoints (all under `/api/mobile/pos/`):
- `GET /payment-providers` — capability check.
- `POST /orders/[id]/receipt`, `POST /orders/[id]/refund`.
- `GET /orders`, `GET /orders/[id]`.
- `GET /products/by-barcode/[code]`.
- `POST /shifts/open`, `POST /shifts/close`, `GET /shifts/current`, `GET /shifts/[id]/report`.
- `POST /cash-movements`.
- `POST /carts`, `GET /carts`, `DELETE /carts/[id]`.
- `GET /receipt-template`.

---

## Part 6 — What we explicitly skip (parity not required)

These are documented Shopify weaknesses; we don't chase them.

- **Bluetooth flakiness** — Shopify's #1 complaint (daily disconnect). Our printer/reader integration should ship with a hard "reconnect" UI, but matching their stack isn't a goal.
- **Smart-Grid density limits** — Shopify caps at ~10 tiles/page; we can do better.
- **Shallow in-app reporting** — Shopify forces CSV export for serious analysis. Our analytics endpoint already returns rich data; we should out-do them here.
- **Admin dark mode** — Shopify still doesn't have it on mobile; not a parity blocker.
- **POS Pro paywall** — staff roles, exchanges, smart-grid templates are Pro-only at Shopify. We shouldn't gate equivalents.
- **Offline card payments** — Shopify only partially supports this; pinning to "online-only card payments" is fine for v1.
- **Locked-in to a single payment processor** — we already support multiple providers; keep that.

---

## Suggested rollout

1. **Week 1 — foundation** (Part 1 in full). One commit per primitive, one OTA at the end. No user-visible features yet.
2. **Week 2 — POS Tier 1 (a)**: receipts + refund-from-past-order. These two are the most-asked-for in any cashier UX.
3. **Week 3 — POS Tier 1 (b)**: shifts + per-line discount + tip + cash flow + park-cart + barcode auto-add.
4. **Week 4 — Admin Tier 1**: Quick Sale entry, dashboard configurability, Live View.
5. **Weeks 5-6 — Tier 2** for both apps.
6. **Tier 3** is its own project; needs a build cadence and at least one native partner.
