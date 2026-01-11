

interface LogoProps {
    className?: string;
}

export function Logo({ className = "w-auto h-8" }: LogoProps) {
    return (
        <svg
            viewBox="0 0 190 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Matenweekend Logo"
        >
            <path
                d="M10 80 L30 20 L50 80 L70 20 L90 80 M100 20 L120 80 L140 20 L160 80 L180 20"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
