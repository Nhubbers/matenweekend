import { useRef, useEffect } from 'react';
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
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

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
        <dialog ref={dialogRef} className="modal" onClose={onCancel}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action">
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
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onCancel}>close</button>
            </form>
        </dialog>
    );
}
