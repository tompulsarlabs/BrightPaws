# IP Notes

## Grogu / Star Wars / Disney IP

The v0 theme uses **Grogu** (a.k.a. "Baby Yoda") as one of three placeholder character families alongside cats and sausage dogs. Grogu is owned by Lucasfilm / The Walt Disney Company.

### Current scope (safe)
- **Personal use only.** App distributed to Margaux's iPad via TestFlight, joined only by Tom + immediate family.
- Not on the App Store. Not distributed to other families. No public web. Not monetised.
- Under U.S. fair-use doctrine and analogous EU exceptions, private personal use of a copyrighted character in a non-distributed context is effectively unenforceable and not the kind of thing rightsholders pursue.

### Triggers that require swapping Grogu out
Before doing **any** of the following, replace every Grogu reference with an original Grogu-inspired character:
- Listing on the App Store (public TestFlight or full release).
- Distributing to non-family users (other parents, schools, friends).
- Any monetisation: paid app, IAP, ads, tips.
- Any public marketing: website, social posts, app demos.
- Open-sourcing the repo on GitHub publicly. (Private repo or family-only fork is fine.)

### Swap procedure
- All Grogu references are isolated to `content/v0.ts` (asset paths, character IDs, vocab slot assignments).
- Replace with an original character (suggested fields for the brief: small green creature, big ears, gentle, child-friendly — but visually distinct in proportions, palette, and silhouette from Grogu).
- One-line code change: swap the asset path and character name in `content/v0.ts`.

### Cats and sausage dogs
- Generic animals, no IP concerns at the species level.
- If specific cat / dachshund characters are introduced (e.g. a named character from a book or film), apply the same swap rule.
