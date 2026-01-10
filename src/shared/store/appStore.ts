import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {AppState} from "@/shared/types/dto/app.dto";
import {isUndefined} from "lodash";
import {setCookie} from "nookies";

// Восстанавливаем состояние из localStorage
export const useAppStore = create<AppState>()(devtools(immer((set) => {
    return ({
        menuPageIsOpen: true,
        backendIsAvailable: null,
        isLoading: false,
        profilePageIsClose: true,
        notificationsVisible: true,
        isDarkMode: false,
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
                // Сохраняем в localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('menuPageIsOpen', String(newValue));
                }
                return ({menuPageIsOpen: newValue});
            });
        },
    });
})));
