export type AppState = {
    backendIsAvailable: boolean | null;
    isLoading: boolean;
    profilePageIsClose: boolean;
    menuPageIsOpen: boolean;
    notificationsVisible: boolean;
    isDarkMode: boolean;
    toggleProfilePage: (value?:boolean) => void;
    toggleMenuPage: (value?: boolean) => void;
    hydrateMenuPage: () => void;
    toggleNotifications: () => void;
    toggleDarkMode: (value: boolean) => void;
}