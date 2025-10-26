import { createContext, useContext, useMemo, useState, useEffect,  } from "react";

const CartContext = createContext(null);

export function CartProvider({ token, children }) {
    const storageKey = token ? `cart_${token}` : 'cart_unknown';
    const [items, setItems] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem(storageKey)) || [] }
        catch { return [] }
    });

    useEffect(() => {
        sessionStorage.setItem(storageKey, JSON.stringify(items));
    }, [items, storageKey]);

    const addItem = (menuItem, qty = 1) => {
        setItems(prev => {
            const idx = prev.findIndex(p => p.id == menuItem.id);
            if (idx >=0) {
                const copy = [...prev];
                copy[idx] = {...copy[idx], quantity: copy[idx].quantity + qty};
                return copy;
            }
            return [...prev, {...menuItem, quantity: qty}];
        })
    }

    const updateQty = (id, qty) => 
        setItems(prev => prev.map(p => p.id == id ? { ...p, quantity: Math.max(qty,1) } : p));

    const removeItem = (id) => setItems(prev => prev.filter(p => p.id != id));

    const clear = () => setItems([]);

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const value = useMemo(() => ({ items, addItem, updateQty, removeItem, clear, total }), [items, total]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext);