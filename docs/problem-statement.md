# Problem Statement

**Title:** Allergen-Safe Food Ordering  **Domain:** E-commerce

Design a food ordering flow that makes allergen information unmistakable and prevents dangerous orders without blocking harmless ones.

## Core challenges
1. **Risk communication.** Allergen warnings are often small print. Users need clear, plain-language status using text and icons, not colour alone.
2. **Data reliability.** Restaurants provide incomplete or outdated data. "No allergen listed" is not the same as "allergen-free".
3. **False alarms.** Warning on everything trains users to ignore warnings. Confirmed risks must be separated from possible ones.

## How SafeBite responds
| Challenge | Response |
|---|---|
| Risk communication | Badge on every card, danger dialog naming the allergen and dish, highlighted ingredients |
| Data reliability | `verified` flag, "Allergen information unavailable" state, contact-restaurant option, green means only "safe based on available information" |
| False alarms | Hard block only for confirmed matches. Possible risks get a review step. Safe items add instantly with no popup. |
