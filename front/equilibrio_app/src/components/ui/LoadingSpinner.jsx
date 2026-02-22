export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-600" />
      </div>
    </div>
  )
}
