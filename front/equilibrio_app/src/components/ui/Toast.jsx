import { useToast } from '../../hooks/useToast'
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from './Icon'

export default function Toast() {
  const { toast, hideToast } = useToast()

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className={`fixed top-4 right-4 z-50 ${isError ? 'bg-red-600' : 'bg-emerald-600'} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-down`}>
      {isError
        ? <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
        : <CheckCircleIcon className="w-5 h-5 shrink-0" />
      }
      <span className="text-base">{toast.message}</span>
      <button onClick={hideToast} className="text-white/60 hover:text-white transition-colors ml-1">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
