import { useRef, useEffect } from 'react';
import { NewsForm } from './NewsForm';
import { nl } from '@/lib/translations';

interface EditNewsModalProps {
    isOpen: boolean;
    initialTitle: string;
    initialBody: string;
    onSubmit: (title: string, body: string) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

export function EditNewsModal({
    isOpen,
    initialTitle,
    initialBody,
    onSubmit,
    onClose,
    isLoading,
}: EditNewsModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box w-11/12 max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Bericht Bewerken</h3>
                <NewsForm
                    initialTitle={initialTitle}
                    initialBody={initialBody}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    submitLabel={nl.save}
                    onCancel={onClose}
                />
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
