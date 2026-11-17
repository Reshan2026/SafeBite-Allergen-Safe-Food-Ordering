# Design Decisions

- **Three signals for status:** colour, icon (✔ ⚠ ⛔) and text. Colour-blind users and screen reader users get the same information.
- **Green wording:** "Safe based on available information" instead of "allergen-free", to avoid false assurance.
- **Hard block vs soft review:** red cannot be added; yellow shows one dialog with reasons, a phone link and an explicit "I reviewed this" button. Green never shows a dialog, which keeps warnings meaningful.
- **Unknown is yellow:** missing data is displayed as "Allergen information unavailable", never green.
- **Customization honesty:** removing an ingredient lowers risk only to caution because the restaurant cannot verify cross-contact.
- **Defence in depth:** checks run on menu, add, cart render, checkout render and again on order submit.
- **Plain language:** "contains peanuts", "may contain from shared equipment", not medical terms.
- **Palette:** cream background, green `#1f8a4c` for safety, orange for caution, red for danger. Text contrast kept above WCAG AA on badges.
- **Type:** Fraunces for headings (warm, trustworthy), Nunito Sans for readable body text.
- **Accessibility:** skip link, native `<dialog>` with focus trap, `aria-live` regions, labelled inputs, 3px focus ring, `prefers-reduced-motion`.
- **Data in code:** one tagged-ingredient dataset in `js/main.js` keeps the demo backend-free.
