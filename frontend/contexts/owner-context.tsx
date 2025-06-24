import { createContext, useContext, useState } from "react";

interface OwnerContextType {
    ownerId: string | null;
    setOwnerId: (id: string | null) => void;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: React.ReactNode }) {
    const [ownerId, setOwnerId] = useState<string | null>(null);

    return (
        <OwnerContext.Provider value={{ ownerId, setOwnerId }}>
            {children}
        </OwnerContext.Provider>
    );
}

export function useOwner() {
    const context = useContext(OwnerContext);
    if (context === undefined) {
        throw new Error("useOwner must be used within an OwnerProvider");
    }
    return context;
} 