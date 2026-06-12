import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  danger = false,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button
        variant={danger ? 'danger' : 'primary'}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer} maxWidth="400px">
      <p className="text-secondary">{message}</p>
    </Modal>
  )
}
