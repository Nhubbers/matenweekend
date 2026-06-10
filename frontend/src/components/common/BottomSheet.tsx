import { useEffect, useRef } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
            // Prevent body scroll on iOS/mobile
            document.body.style.overflow = 'hidden';
        } else {
            dialog.close();
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            className="modal modal-bottom sm:modal-middle backdrop-blur-xs transition-all duration-300"
            onClose={onClose}
        >
            <div className="modal-box bg-base-100/95 backdrop-blur-md border border-base-content/10 shadow-2xl rounded-t-3xl sm:rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {/* Grab handle for bottom sheet on mobile */}
                <div className="w-12 h-1.5 bg-base-content/20 rounded-full mx-auto mb-4 sm:hidden cursor-pointer" onClick={onClose} />
                
                <h3 className="font-extrabold text-xl mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{title}</h3>
                
                <div className="py-2">
                    {children}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-black/40">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
