# SafeBite: Allergen-Safe Food Ordering

## Project overview
SafeBite is a multi-page food ordering prototype for people with food allergies. It shows allergen information on every dish, blocks confirmed dangerous orders and avoids blocking harmless ones. Built with plain HTML, CSS and JavaScript. No backend, no paid APIs.

## Problem statement
Design a food ordering flow that makes allergen information unmistakable and prevents dangerous orders without blocking harmless ones. Core challenges: **risk communication**, **data reliability** and **false alarms**. See [docs/problem-statement.md](docs/problem-statement.md).

## Project objectives
- Make allergen status obvious using text, icons and colour together.
- Prevent confirmed allergen matches from being ordered.
- Never treat missing data as safe.
- Reduce false alarms by separating confirmed allergens from possible cross-contamination.

## Target users
People with food allergies (peanut, tree nut, dairy, egg, soy, gluten, shellfish, fish, sesame), parents ordering for allergic children, and friends or colleagues ordering for them.

## Main features
- Home page, search, categories, featured restaurants and a safety explainer
- Allergy profile (multi-select, save, edit, clear) stored in LocalStorage
- Restaurant listing with cuisine, vegetarian, vegan and delivery-time filters
- Menu with 19 dishes across 6 restaurants, each showing image, ingredients and allergens
- Three-level status: green, yellow, red, plus "profile not set"
- Danger alert dialog, caution review dialog, "Contact restaurant" and "Find Safer Alternatives"
- Customization: remove ingredients, toppings, portion size, notes, with a live safety re-check
- Cart with quantities and totals, re-validated on every render
- Checkout with validation, final allergen check, Cash on Delivery or mock online payment
- Order confirmation and dashboard with order history
- Keyboard-friendly, skip link, visible focus, labelled controls, reduced-motion support

## Technology stack
HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES6), LocalStorage. Food photos load from Unsplash URLs. Fonts from Google Fonts with system fallbacks.

## Allergen detection explanation
Each ingredient is tagged with an allergen (for example `Peanut butter|peanuts`). Each dish also has a `may` list for cross-contamination and a `verified` flag. `evaluate()` in `js/allergy.js` compares the dish with the saved profile:

| Status | Rule |
|---|---|
| **Red, Danger** | A remaining ingredient or chosen topping is a confirmed match with the profile. Cannot be added or ordered. |
| **Yellow, Caution** | No confirmed match, but the dish may contain a matching allergen, the allergen data is unavailable, or ingredients were changed. User can review and continue. |
| **Green, Safe based on available information** | Data is verified and nothing matches. Still not a guarantee. |
| **Grey, Profile not set** | No profile saved yet. |

Removing an ingredient never produces green. A red dish becomes caution, because the kitchen cannot verify the change. Cart and checkout run `evaluate()` again, so a profile change after adding an item is caught.

## Screenshots
Add screenshots to the `screenshots/` folder and link them here:

```
![Home](screenshots/home.png)
![Allergen alert](screenshots/alert.png)
![Cart](screenshots/cart.png)
```

## Installation instructions
```bash
git clone https://github.com/<your-username>/SafeBite.git
cd SafeBite
```
No dependencies to install.

## How to run the project
Open `index.html` in a browser, or serve it locally:
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```
Internet access is needed for food images and fonts. To demo the key flow: set a **Peanuts** profile, open the menu, try adding **Peanut Butter Sandwich** (blocked), then **Chicken Katsu Curry** (caution, info unavailable) and **Chana Masala** (safe).

## Future enhancements
Real restaurant allergen API and menu verification dates, user accounts, severity levels and per-person profiles, barcode or ingredient scan, multi-language support, real payments.

## Disclaimer
All restaurants, menus and allergen data are **sample data for a college prototype**. They are not verified. Never rely on this app for real allergy decisions. Always confirm ingredients and cross-contamination practices with the restaurant.
