import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

interface ActivityManageActionsProps {
    status: Activity['status'];
    actionLoading: boolean;
    isAdmin: boolean;
    onEdit: () => void;
    onComplete: () => void;
    onCancel: () => void;
    onReopen: () => void;
    onDelete: () => void;
}

export function ActivityManageActions({
    status,
    actionLoading,
    isAdmin,
    onEdit,
    onComplete,
    onCancel,
    onReopen,
    onDelete,
}: ActivityManageActionsProps) {
    const isOpen = status === 'open';

    return (
        <div className="mt-6 p-4 bg-base-200/50 border border-base-200 rounded-2xl">
            <h3 className="font-bold text-sm text-base-content/60 uppercase tracking-wider mb-3">Beheer</h3>
            <div className="flex flex-wrap gap-2">
                {isOpen && (
                    <>
                        <button
                            className="btn btn-outline btn-primary btn-sm rounded-xl font-semibold flex items-center gap-1.5"
                            onClick={onEdit}
                            disabled={actionLoading}
                        >
                            ✏️ {nl.edit}
                        </button>
                        <button
                            className="btn btn-success btn-sm rounded-xl font-semibold flex items-center gap-1.5"
                            onClick={onComplete}
                            disabled={actionLoading}
                        >
                            🏆 {nl.complete}
                        </button>
                        <button
                            className="btn btn-warning btn-sm rounded-xl font-semibold flex items-center gap-1.5"
                            onClick={onCancel}
                            disabled={actionLoading}
                        >
                            🚫 {nl.cancel}
                        </button>
                    </>
                )}
                {!isOpen && status === 'completed' && (
                    <button
                        className="btn btn-secondary btn-sm rounded-xl font-semibold flex items-center gap-1.5"
                        onClick={onReopen}
                        disabled={actionLoading}
                    >
                        🔄 Heropenen
                    </button>
                )}
                {isAdmin && (
                    <button
                        className="btn btn-error btn-sm rounded-xl font-semibold flex items-center gap-1.5"
                        onClick={onDelete}
                        disabled={actionLoading}
                    >
                        🗑️ {nl.delete}
                    </button>
                )}
            </div>
        </div>
    );
}
