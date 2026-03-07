import { XMarkIcon } from './Icon'

const sizeClass = {
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white w-full max-h-[95vh] overflow-y-auto rounded-t-2xl md:rounded-2xl ${sizeClass[size] ?? sizeClass.md} md:mx-4 shadow-2xl animate-slide-up`}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10 rounded-t-2xl md:rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
