import { useState } from 'react';
import { useNews } from '@/hooks/useNews';
import { LoadingSpinner, ErrorMessage, ConfirmDialog } from '@/components/common';
import { formatRelativeTime } from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { News } from '@/types';

export function NewsManager() {
    const { news, loading, error, refetch, createNews, deleteNews } = useNews();
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<News | null>(null);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        try {
            setActionLoading(true);
            await createNews(title, body);
            setTitle('');
            setBody('');
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to create news:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setActionLoading(true);
            await deleteNews(deleteConfirm.id);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete news:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refetch} />;
    }

    return (
        <>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{nl.newsManagement}</h3>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsCreating(!isCreating)}
                    >
                        {isCreating ? nl.cancel : nl.newPost}
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="card bg-base-200 p-4 space-y-3">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{nl.title}</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Inhoud (HTML toegestaan)</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-24"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="<p>Je bericht hier...</p>"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={actionLoading || !title}
                        >
                            {actionLoading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                nl.create
                            )}
                        </button>
                    </form>
                )}

                {news.length === 0 ? (
                    <p className="text-base-content/70">Geen nieuwsberichten</p>
                ) : (
                    <div className="space-y-2">
                        {news.map((item) => (
                            <div key={item.id} className="card bg-base-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{item.title}</h4>
                                        <p className="text-sm text-base-content/70">
                                            {formatRelativeTime(item.created)}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-error btn-xs"
                                        onClick={() => setDeleteConfirm(item)}
                                        disabled={actionLoading}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                title={nl.delete}
                message={`${nl.areYouSure} "${deleteConfirm?.title}" verwijderen?`}
                confirmLabel={nl.delete}
                cancelLabel={nl.cancel}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
                variant="danger"
            />
        </>
    );
}
