# DVSH Agentic — Dryer Vent Superheroes Booking Assistant

A conversational booking agent for **Dryer Vent Superheroes**. Adapted from `voda-agentic`,
customized for DVSH's services and pricing. The chat streams from Claude and renders
inline interactive "UI moments" (pickers, quotes, contact form) to take a customer from
"my dryer vent needs cleaning" to a confirmed booking on `/checkout`.

## How it works

- **Embedded catalog** — `agent.md` (project root) holds the DVSH services, pricing rules,
  and appointment windows as JSON blocks. `/api/agent` serves it; the client parses it and
  generates a rolling weekday availability calendar. No external storefront dependency.
- **Agent** — `/api/chat` streams from Claude using `AGENT_SYSTEM_PROMPT.md` + the catalog
  injected as `<agent_data>` (plus today's date). The model emits `<<<UI_MOMENT>>>` blocks
  that render as cards.
- **UI moments** — `tier_picker` (access type), `quote_summary`, `recurrence_picker`
  (annual plan, 15% off), `date_picker` / `slot_picker`, `contact_form`, `booking_handoff`.
- **Checkout** — `booking_handoff` persists the order to localStorage and routes to
  `/checkout`, which itemizes the selected services, adds 8.25% tax, and takes payment.

## Pricing (source of truth: `agent.md`)

Dryer Vent Cleaning (Side $175 / Roof $249 / Second-floor $189), Dryer Vent Special
($350 first service, annual renewal at 15% off access), Dryer Vent + Air Duct Bundle,
Bathroom Fan ($175), Coil Cleaning ($385), AC Duct Cleaning ($500 for 10 ducts + $30/extra),
Whole-Home Air Package (duct + coil + fan, 15% bundle discount). Checkout add-ons:
Magnetic Vent Cover $110, Transition Hose $75, Reroute from $189 (hidden when the Special
is selected). Annual plan = 15% off recurring-eligible services.

## Getting started

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Editing pricing

Edit `agent.md` (the catalog) and `AGENT_SYSTEM_PROMPT.md` (the pricing rules / behavior).
Keep the two in sync — the prompt tells the model how to compute; the catalog holds the numbers.
