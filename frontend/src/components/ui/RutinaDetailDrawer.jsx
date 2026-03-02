import { useState } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from './Icon'

export default function RutinaDetailDrawer({ rutina, alumnoNombre, ejerciciosDisp, grupos = [], onClose }) {
  const [activeDay, setActiveDay] = useState(1)

  if (!rutina) return null

  const dias = [...new Set(rutina.ejercicios.map((e) => e.dia))].sort((a, b) => a - b)
  const currentDay = dias.includes(activeDay) ? activeDay : dias[0]
  const ejerciciosDelDia = rutina.ejercicios.filter((e) => e.dia === currentDay)

  const getEjercicio = (id) => ejerciciosDisp.find((e) => e.id === Number(id))
  const nombreEjercicio = (id) => getEjercicio(id)?.nombre || `Ejercicio #${id}`
  const grupoNombre = (id) => {
    const ej = getEjercicio(id)
    if (!ej?.grupo_muscular_id) return null
    return grupos.find((g) => g.id === ej.grupo_muscular_id)?.nombre || null
  }

  const handleDownloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    const margin = 15
    let y = 20

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(rutina.nombre, margin, y)
    y += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Alumno: ${alumnoNombre}`, margin, y)
    y += 6
    doc.text(
      `${dias.length} dia${dias.length !== 1 ? 's' : ''} · ${rutina.ejercicios.length} ejercicio${rutina.ejercicios.length !== 1 ? 's' : ''}`,
      margin,
      y,
    )
    y += 10
    doc.setTextColor(0)

    for (const dia of dias) {
      const ejercicios = rutina.ejercicios.filter((e) => e.dia === dia)
      if (y > 260) { doc.addPage(); y = 20 }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(79, 70, 229)
      doc.roundedRect(margin, y - 5, 180, 9, 2, 2, 'F')
      doc.setTextColor(255)
      doc.text(`Dia ${dia}`, margin + 3, y + 1.5)
      doc.setTextColor(0)
      y += 12

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y - 4, 180, 7, 'F')
      doc.text('Ejercicio', margin + 2, y)
      doc.text('Reps', margin + 110, y)
      doc.text('Peso (kg)', margin + 135, y)
      doc.text('Notas', margin + 160, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      for (const ej of ejercicios) {
        if (y > 270) { doc.addPage(); y = 20 }
        const grupo = grupoNombre(ej.ejercicio_id)
        const labelEj = grupo ? `${grupo} · ${nombreEjercicio(ej.ejercicio_id)}` : nombreEjercicio(ej.ejercicio_id)
        doc.text(labelEj, margin + 2, y, { maxWidth: 105 })
        doc.text(String(ej.repeticiones ?? '-'), margin + 110, y)
        doc.text(ej.peso ? String(ej.peso) : '-', margin + 135, y)
        doc.text(ej.notas || '', margin + 160, y, { maxWidth: 32 })
        y += 7
      }
      y += 4
    }

    const safeName = rutina.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`rutina-${safeName}.pdf`)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <p className="font-bold text-gray-900 text-xl truncate">{rutina.nombre}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{alumnoNombre}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 px-5 py-3 border-b border-gray-100 overflow-x-auto shrink-0">
          {dias.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                currentDay === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dia {d}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="overflow-y-auto px-5 py-4 space-y-2">
          {ejerciciosDelDia.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Sin ejercicios</p>
          ) : (
            ejerciciosDelDia.map((ej, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {grupoNombre(ej.ejercicio_id) && (
                    <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-0.5">{grupoNombre(ej.ejercicio_id)}</p>
                  )}
                  <p className="font-semibold text-gray-900 text-sm">{nombreEjercicio(ej.ejercicio_id)}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500">
                    <span><span className="font-medium text-gray-700">{ej.repeticiones}</span> reps</span>
                    {ej.peso ? <span><span className="font-medium text-gray-700">{ej.peso}</span> kg</span> : null}
                  </div>
                  {ej.notas && (
                    <p className="text-xs text-indigo-600 mt-1.5 bg-indigo-50 px-2 py-1 rounded-lg">{ej.notas}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
