import { useState, useEffect } from 'react';
import { nl } from '@/lib/translations';

interface NewsFormProps {
    initialTitle?: string;
    initialBody?: string;
    onSubmit: (title: string, body: string) => Promise<void>;
    isLoading?: boolean;
    submitLabel?: string;
    onCancel?: () => void;
}

export function NewsForm({
    initialTitle = '',
    initialBody = '',
    onSubmit,
    isLoading = false,
    submitLabel = nl.create,
    onCancel,
}: NewsFormProps) {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);

    useEffect(() => {
        setTitle(initialTitle);
        setBody(initialBody);
    }, [initialTitle, initialBody]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(title, body);
        // We don't clear form here, parent handles success
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">{nl.title}</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Titel van je bericht"
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Inhoud (HTML toegestaan)</span>
                </label>
                <textarea
                    className="textarea textarea-bordered h-32 w-full font-mono text-sm"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="<p>Je bericht hier...</p>"
                />
                <label className="label">
                    <span className="label-text-alt text-base-content/60">
                        Tip: Je kunt HTML tags gebruiken voor opmaak.
                    </span>
                </label>
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {nl.cancel}
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !title.trim()}
                >
                    {isLoading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
}
