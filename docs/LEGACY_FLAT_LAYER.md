# Legacy Flat Layer

This document marks the old `Flat` stack as archived.

## Status

The `Flat` model is no longer part of the active product flow.

Active object-related flows now use:

- `listings`
- `host/listings`
- `bookings`
- `favorites`

The old `Flat` stack is retained only for reference and possible data migration work later.

## Archived files

- `src/shared/lib/flatService.ts`
- `src/shared/store/flats.ts`
- `src/widgets/Flat/**`
- `src/widgets/FlatCard/**`
- `src/app/api/flats/**`

## Rules

1. Do not use the `Flat` layer for new product features.
2. Do not wire new routes or screens to `/api/flats`.
3. If data must be recovered from `Flat`, treat it as a migration/export task into the active `listings` domain.
4. If the layer is ever reactivated, it should be a deliberate product decision, not an incidental reuse.
