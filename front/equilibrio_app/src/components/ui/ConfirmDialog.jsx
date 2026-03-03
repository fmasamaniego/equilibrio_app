import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title = '¿Estás seguro?', message }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 text-base mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className="px-4 py-2 text-base text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </Modal>
  )
}
