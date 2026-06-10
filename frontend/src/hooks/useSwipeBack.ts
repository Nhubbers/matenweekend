import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useSwipeBack(enabled: boolean = true) {
    const navigate = useNavigate();
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            // Only start tracking if touch originates close to the left edge (e.g., left 40px)
            if (touch.clientX < 40) {
                touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;

            // If user swiped vertically more than horizontally, cancel tracking
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaX > 10) {
                touchStartRef.current = null;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;

            // Swipe threshold: 100px horizontally, minimal vertical deviation
            if (deltaX > 100 && Math.abs(deltaY) < 60) {
                navigate(-1);
            }
            touchStartRef.current = null;
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigate, enabled]);
}
