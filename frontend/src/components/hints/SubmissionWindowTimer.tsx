import { useState, useEffect } from 'react';
import { nl } from '@/lib/translations';

interface SubmissionWindowTimerProps {
    windowEndDate: string; // ISO date string
}

export function SubmissionWindowTimer({ windowEndDate }: SubmissionWindowTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(windowEndDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [windowEndDate]);

    if (timeLeft.isExpired) {
        return (
            <div className="badge badge-error gap-1 py-2 px-3 text-xs font-bold text-white shadow-sm">
                🔒 {nl.guessWindowClosed}
            </div>
        );
    }

    return (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-xs font-semibold text-primary flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-1">
                ⏱️ <span>Tijd over voor voorspelling:</span>
            </span>
            <span className="font-mono font-extrabold text-sm text-primary">
                {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                {String(timeLeft.hours).padStart(2, '0')}u {String(timeLeft.minutes).padStart(2, '0')}m{' '}
                {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
        </div>
    );
}
