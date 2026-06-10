import { BottomSheet } from './BottomSheet';
import { nl } from '@/lib/translations';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'default' | 'danger' | 'warning';
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = nl.confirm,
    cancelLabel = nl.cancel,
    onConfirm,
    onCancel,
    variant = 'default',
}: ConfirmDialogProps) {
    const getBtnClass = () => {
        switch (variant) {
            case 'danger':
                return 'btn-error';
            case 'warning':
                return 'btn-warning';
            default:
                return 'btn-primary';
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onCancel} title={title}>
            <p className="py-3 text-base-content/80">{message}</p>
            <div className="flex justify-end gap-2 mt-4">
                <button className="btn btn-ghost" onClick={onCancel}>
                    {cancelLabel}
                </button>
                <button
                    className={`btn ${getBtnClass()}`}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </div>
        </BottomSheet>
    );
}
