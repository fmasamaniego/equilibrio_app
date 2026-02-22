import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { getEjerciciosDelDia, getMiRutinaHoy } from '../api/rutinaService'
import { crear as crearEjecucion } from '../api/ejecucionService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PageTransition from '../components/ui/PageTransition'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { BoltIcon, CheckCircleIcon } from '../components/ui/Icon'

export default function WorkoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [ejercicios, setEjercicios] = useState([])
  const [rutinaId, setRutinaId] = useState(null)
  const [dia, setDia] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)

  useEffect(() => {
    const rId = searchParams.get('rutina')
    const d = searchParams.get('dia')

    if (rId && d) {
      setRutinaId(Number(rId))
      setDia(Number(d))
      getEjerciciosDelDia(rId, d)
        .then((data) => {
          setEjercicios(data)
          const initial = {}
          data.forEach((ej) => {
            initial[ej.ejercicio_id] = {
              series_completadas: 0,
              repeticiones_realizadas: ej.repeticiones,
              peso_usado: ej.peso || 0,
            }
          })
          setForm(initial)
        })
        .catch(() => showToast('Error cargando ejercicios', 'error'))
        .finally(() => setLoading(false))
    } else {
      getMiRutinaHoy()
        .then((rutina) => {
          navigate(`/entrenar?rutina=${rutina.id}&dia=1`, { replace: true })
        })
        .catch(() => {
          showToast('No tienes rutina asignada', 'error')
          navigate('/', { replace: true })
        })
    }
  }, [searchParams])

  const updateField = (ejercicioId, field, value) => {
    setForm((prev) => ({
      ...prev,
      [ejercicioId]: { ...prev[ejercicioId], [field]: Number(value) || 0 },
    }))
  }

  const handleFinish = async () => {
    setSending(true)
    try {
      const detalles = Object.entries(form).map(([ejercicioId, data]) => ({
        ejercicio_id: Number(ejercicioId),
        ...data,
      }))

      await crearEjecucion({
        rutina_id: rutinaId,
        dia,
        completada: true,
        detalles,
      })

      showToast('Sesion registrada')
      navigate('/')
    } catch {
      showToast('Error al registrar la sesion', 'error')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <PageTransition>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BoltIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Entrenamiento</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5 ml-10">Dia {dia}</p>

        <div className="space-y-3">
          {ejercicios.map((ej) => (
            <div key={ej.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                {ej.ejercicio_nombre || `Ejercicio #${ej.ejercicio_id}`}
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Meta: {ej.repeticiones} reps  {ej.peso ? `${ej.peso} kg` : 'Sin peso'}
              </p>
              {ej.notas && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
                  <p className="text-sm text-indigo-700">{ej.notas}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Series</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form[ej.ejercicio_id]?.series_completadas || 0}
                    onChange={(e) => updateField(ej.ejercicio_id, 'series_completadas', e.target.value)}
                    className="w-full px-2 py-3 border border-gray-200 rounded-xl text-center text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reps</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form[ej.ejercicio_id]?.repeticiones_realizadas || 0}
                    onChange={(e) => updateField(ej.ejercicio_id, 'repeticiones_realizadas', e.target.value)}
                    className="w-full px-2 py-3 border border-gray-200 rounded-xl text-center text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={form[ej.ejercicio_id]?.peso_usado || 0}
                    onChange={(e) => updateField(ej.ejercicio_id, 'peso_usado', e.target.value)}
                    className="w-full px-2 py-3 border border-gray-200 rounded-xl text-center text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setConfirmFinish(true)}
          disabled={sending}
          className="mt-6 w-full bg-emerald-600 text-white py-4 rounded-xl text-base font-semibold hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Guardando...
            </span>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              Terminar Sesion
            </>
          )}
        </button>

        <ConfirmDialog
          open={confirmFinish}
          onClose={() => setConfirmFinish(false)}
          onConfirm={handleFinish}
          message="Se registrara la sesion con los datos ingresados."
        />
      </div>
    </PageTransition>
  )
}
