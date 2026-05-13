import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {AppState} from "@/shared/types/dto/app.dto";
import isUndefined from "lodash/isUndefined";
import {setCookie} from "nookies";

const MENU_STORAGE_KEY = 'menuPageIsOpen';

// SSR-safe чтение из localStorage. На сервере возвращаем дефолт,
// на клиенте — сохранённое пользователем значение, если оно есть.
const readSavedMenuOpen = (defaultValue: boolean): boolean => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const raw = window.localStorage.getItem(MENU_STORAGE_KEY);
        if (raw === null) return defaultValue;
        return raw === 'true';
    } catch {
        return defaultValue;
    }
};

export const useAppStore = create<AppState>()(devtools(immer((set) => {
    return ({
        menuPageIsOpen: true,
        backendIsAvailable: null,
        isLoading: false,
        profilePageIsClose: true,
        notificationsVisible: true,
        isDarkMode: false,
        hydrateMenuPage: () => {
            set({ menuPageIsOpen: readSavedMenuOpen(true) });
        },
        toggleProfilePage: (value) => {
            set((state) => {
                return ({profilePageIsClose: !isUndefined(value) ? value : !state.profilePageIsClose});
            });
        },
        toggleNotifications: () => {
            set((state) => ({toggleNotifications: !state.toggleNotifications}));
        },
        toggleDarkMode: (value: boolean) => {
            setCookie(null, "theme", value ? "dark" : "light", {
                path: "/"
            });
            set({isDarkMode: value});
        },
        toggleMenuPage: (value) => {
            set((state) => {
                const newValue = !isUndefined(value) ? value : !state.menuPageIsOpen;
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.setItem(MENU_STORAGE_KEY, String(newValue));
                    } catch {
                        // ignore
                    }
                }
                return ({menuPageIsOpen: newValue});
            });
        },
    });
})));
