import { useState, useEffect, type ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setShow(true);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div
            className={`transition-all duration-300 ease-out flex-1 flex flex-col min-h-0 ${
                show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
        >
            {children}
        </div>
    );
}
