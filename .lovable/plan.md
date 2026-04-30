## Add Twitter Handles to Guest List

Insert the 21 provided Twitter handles into the `twitter_whitelist` table so they can authenticate via the Twitter Guest List flow on `/arubaito` and `/guestlist`.

### Handles to add
`lochie_sol`, `jussy_world`, `FabianoSolana`, `8bitpenis`, `SolanaSensei`, `inno_ox`, `zuler`, `mango_`, `digiii`, `mangusxbt`, `sol_nxxn`, `defidarling`, `derparsel`, `MrTimister`, `0xapacx`, `ashen_one`, `degentalks`, `soy_muse`, `molusol`, `lostsol`, `marinoonchain`

### Approach

1. Query existing `twitter_whitelist` rows to skip any handles that already exist (avoid unique constraint issues).
2. Insert remaining handles via the insert tool with:
   - `verification_type = 'admin_approved'`
   - `notes = 'Bulk added via admin request'`
   - `twitter_user_id` left null (will be populated lazily on first follow check)
3. Confirm count of inserted rows.

No schema changes, no edge function changes, no frontend changes required.
