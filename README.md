# Bug: Restoring a version fails validation on localized required fields

## The problem

When restoring a previous version of a document with **localized required fields** and `fallback: false`, validation fails for locales that have empty values — even though saving/publishing the same document normally (with those same empty locale fields) succeeds.

Normal saves validate only the **active locale**. Version restores send the **entire document snapshot** (all locales at once) and validate all locales, causing required field validation to fail for unpopulated locales.

## Reproduction steps

1. `pnpm install && pnpm dev`
2. Create a first admin user
3. Go to Pages → Create New
4. With locale set to **English**, fill in the `title` and `content` fields
5. Leave Spanish fields empty (do not switch to Spanish locale)
6. Click **Publish** — succeeds
7. Edit the title, publish again — succeeds (creates a new version)
8. Go to the **Versions** tab
9. Click on the previous version
10. Click **Restore this version**
11. Observe: **400 error** — `The following fields are invalid: Title, Content`

## Expected behavior

Restoring a version should succeed, since the same data passes validation on a normal save/publish.

## Environment

- Payload: 3.79.0
- Next.js: 15.4.11
- Node: >=20.9.0
- Database: PostgreSQL (`@payloadcms/db-postgres`)

## Setup

```bash
cp .env.example .env  # set DATABASE_URL and PAYLOAD_SECRET
pnpm install
pnpm dev
```
