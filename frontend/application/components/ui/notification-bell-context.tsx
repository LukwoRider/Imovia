import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type NotificationBellContextValue = {
    active: boolean;
    toggle: () => void;
};

const NotificationBellContext = createContext<NotificationBellContextValue | undefined>(undefined);

export function NotificationBellProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState(false);

    const value = useMemo(
        () => ({
            active,
            toggle: () => setActive((prev) => !prev),
        }),
        [active]
    );

    return (
        <NotificationBellContext.Provider value={value}>
            {children}
        </NotificationBellContext.Provider>
    );
}

export function useNotificationBell() {
    const context = useContext(NotificationBellContext);
    if (!context) {
        throw new Error("useNotificationBell must be used within NotificationBellProvider");
    }
    return context;
}
