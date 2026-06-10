import { nl } from '@/lib/translations';

interface ActivityDetailDescriptionProps {
    description: string;
}

export function ActivityDetailDescription({ description }: ActivityDetailDescriptionProps) {
    if (!description) return null;

    return (
        <div className="bg-base-200/30 border border-base-200 p-5 rounded-2xl shadow-sm">
            <h2 className="font-bold text-lg mb-2 text-base-content">{nl.description}</h2>
            <p className="text-base-content/90 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {description}
            </p>
        </div>
    );
}
