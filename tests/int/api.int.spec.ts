import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('nested-docs breadcrumb bug', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('publishing fails when two locales share a breadcrumb ID', async () => {
    // Step 1: Create a page in English — the nested-docs plugin generates
    // a breadcrumb with a unique id
    const page = await payload.create({
      collection: 'pages',
      locale: 'en',
      draft: true,
      data: {
        title: 'Home',
        slug: 'home',
        _status: 'draft',
      },
    })

    const enBreadcrumbId = page.breadcrumbs?.[0]?.id
    console.log('EN breadcrumb id after create:', enBreadcrumbId)
    expect(enBreadcrumbId).toBeDefined()

    // Step 2: Save the Spanish locale, passing breadcrumbs with the SAME id.
    //
    // This mirrors what the admin UI does: when an editor switches locale,
    // the form state still contains the breadcrumbs array from the previous
    // locale (including its `id`). The PATCH request sends it back as-is.
    // The nested-docs plugin's formatBreadcrumb() then spreads the existing
    // breadcrumb object — preserving the id — into the new locale's data.
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'es',
      draft: true,
      data: {
        title: 'Inicio',
        breadcrumbs: [
          {
            id: enBreadcrumbId,
            doc: page.id,
            url: '/home',
            label: 'Inicio',
          },
        ],
        _status: 'draft',
      },
    })

    // Verify both locales now have the same breadcrumb id
    const enDoc = await payload.findByID({
      collection: 'pages',
      id: page.id,
      locale: 'en',
      draft: true,
    })
    const esDoc = await payload.findByID({
      collection: 'pages',
      id: page.id,
      locale: 'es',
      draft: true,
    })

    console.log('EN breadcrumb id:', enDoc.breadcrumbs?.[0]?.id)
    console.log('ES breadcrumb id:', esDoc.breadcrumbs?.[0]?.id)
    expect(enDoc.breadcrumbs?.[0]?.id).toBe(esDoc.breadcrumbs?.[0]?.id)

    // Step 3: Publish — Payload deletes all breadcrumb rows then re-inserts
    // them for each locale within a single transaction. Both locales have
    // the same breadcrumb id, so the second INSERT violates the primary key:
    //
    //   duplicate key value violates unique constraint "pages_breadcrumbs_pkey"
    //   Key (id)=(<shared-id>) already exists.
    //
    // This surfaces as: "The following field is invalid: id"
    //                    "Value must be unique"
    let error: Error | undefined
    try {
      await payload.update({
        collection: 'pages',
        id: page.id,
        data: { _status: 'published' },
      })
    } catch (e) {
      error = e as Error
    }

    console.log('Publish error:', error?.message)
    expect(error).toBeDefined()
    expect(error!.message).toMatch(/invalid.*id|unique/i)
  })
})
