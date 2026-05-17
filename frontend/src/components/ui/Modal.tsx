import type { PropsWithChildren } from 'react';
import { Button } from './Button';

type Props = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
  size?: 'md' | 'lg';
}>;

export function Modal({ title, open, onClose, size = 'md', children }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

