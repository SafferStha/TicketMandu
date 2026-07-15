export default function ConfirmModal({ open, title = 'Confirm action', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="tm-btn-secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className={destructive ? 'tm-btn danger-btn' : 'tm-btn'} onClick={onConfirm} disabled={loading}>{loading ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
