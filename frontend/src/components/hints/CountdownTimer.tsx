import { useState, useEffect } from 'react';
import { nl } from '@/lib/translations';

interface CountdownTimerProps {
    targetDate: string; // ISO date string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isCompleted: false,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds, isCompleted: false });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (timeLeft.isCompleted) {
        return (
            <div className="badge badge-success gap-2 py-3 px-4 font-bold text-white shadow-md">
                ✨ {nl.allHintsUnlocked}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-primary/10 via-primary/20 to-secondary/10 border border-primary/20 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-2">
                ⏳ {nl.nextHintCountdown}
            </p>
            <div className="grid grid-flow-col gap-3 justify-center text-center auto-cols-max">
                <div className="flex flex-col p-2 bg-base-100/80 rounded-xl border border-base-200 min-w-[55px]">
                    <span className="font-mono text-2xl font-extrabold text-primary">
                        {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-base-content/60 uppercase">Dagen</span>
                </div>
                <div className="flex flex-col p-2 bg-base-100/80 rounded-xl border border-base-200 min-w-[55px]">
                    <span className="font-mono text-2xl font-extrabold text-primary">
                        {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-base-content/60 uppercase">Uren</span>
                </div>
                <div className="flex flex-col p-2 bg-base-100/80 rounded-xl border border-base-200 min-w-[55px]">
                    <span className="font-mono text-2xl font-extrabold text-primary">
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-base-content/60 uppercase">Min</span>
                </div>
                <div className="flex flex-col p-2 bg-base-100/80 rounded-xl border border-base-200 min-w-[55px]">
                    <span className="font-mono text-2xl font-extrabold text-secondary">
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-base-content/60 uppercase">Sec</span>
                </div>
            </div>
        </div>
    );
}
