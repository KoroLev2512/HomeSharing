import { MAX_LISTING_PHOTOS, type FormState } from './hostListingFormModel';

export type HostListingFormAction =
    | { type: 'patch'; patch: Partial<FormState> }
    | { type: 'replace'; state: FormState }
    | { type: 'appendImages'; urls: string[] }
    | { type: 'removeImageAt'; index: number }
    | {
          type: 'hydrateOwnerFromSession';
          payload: { name?: string | null; email?: string | null; image?: string | null };
      };

export function hostListingFormReducer(state: FormState, action: HostListingFormAction): FormState {
    switch (action.type) {
        case 'patch':
            return { ...state, ...action.patch };
        case 'replace':
            return action.state;
        case 'appendImages':
            return {
                ...state,
                images: [...state.images, ...action.urls].slice(0, MAX_LISTING_PHOTOS),
            };
        case 'removeImageAt':
            return { ...state, images: state.images.filter((_, i) => i !== action.index) };
        case 'hydrateOwnerFromSession': {
            const { name, email, image } = action.payload;
            return {
                ...state,
                ownerName: state.ownerName || name || email || '',
                ownerAvatar: state.ownerAvatar || (typeof image === 'string' ? image : ''),
            };
        }
        default:
            return state;
    }
}
