import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {AppState} from "../types/dto/app.dto";
import {isUndefined} from "lodash";
import {setCookie} from "nookies";

export const useAppStore = create<AppState>()(devtools(immer((set) => {
    return ({
        menuPageIsOpen: false,
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
                return ({menuPageIsOpen: !isUndefined(value) ? value :  !state.menuPageIsOpen});
            });
        },
    });
})));
