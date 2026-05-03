import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type Step = 1 | 2 | 3 | 4

interface FormData {
  child_id: string
  mood_score: number
  sleep_hours: number
  appetite: 'poor' | 'fair' | 'good' | 'excellent' | ''
  tasks_completed: number
  speech_notes: string
  behavior_notes: string
  notes: string
}

const initialFormData: FormData = {
  child_id: '',
  mood_score: 5,
  sleep_hours: 8,
  appetite: '',
  tasks_completed: 50,
  speech_notes: '',
  behavior_notes: '',
  notes: ''
}

export default function ParentReportFormPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [children, setChildren] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — Hisobot yuborish'
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await api.get('/api/children')
      const childrenData = res.data?.data?.children || []
      setChildren(childrenData)
      if (childrenData.length > 0) {
        setFormData(prev => ({ ...prev, child_id: childrenData[0].id }))
      }
    } catch (err) {
      console.error('Failed to fetch children:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4) as Step)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1) as Step)
  }

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.child_id) {
          setError('Bola tanlanmagan')
          return false
        }
        if (formData.mood_score < 1 || formData.mood_score > 10) {
          setError('Kayfiyat 1-10 orasida bo\'lishi kerak')
          return false
        }
        setError(null)
        return true
      case 2:
        if (formData.sleep_hours < 0 || formData.sleep_hours > 24) {
          setError('Uyqu vaqti 0-24 soat orasida bo\'lishi kerak')
          return false
        }
        if (!formData.appetite) {
          setError('Ichtimochi tanlanmagan')
          return false
        }
        setError(null)
        return true
      case 3:
        if (formData.tasks_completed < 0 || formData.tasks_completed > 100) {
          setError('Vazifalar 0-100% orasida bo\'lishi kerak')
          return false
        }
        setError(null)
        return true
      case 4:
        setError(null)
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    setSubmitting(true)
    try {
      await api.post('/api/reports', formData)
      navigate('/parent/dashboard', { state: { reportSubmitted: true } })
    } catch (err: any) {
      console.error('Failed to submit report:', err)
      setError(err.response?.data?.error || 'Hisobot yuborishda xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😊'
    if (score >= 5) return '🙂'
    if (score >= 3) return '😐'
    return '😢'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-3">👶</p>
        <p>Bolalar ro'yxati bo'sh</p>
        <p className="text-sm mt-2">Doktor bilan bog'lanish</p>
      </div>
    )
  }

  const steps = [
    { num: 1, title: 'Kayfiyat' },
    { num: 2, title: 'Boshqa holatlar' },
    { num: 3, title: 'Faoliyat' },
    { num: 4, title: 'Qo\'shimcha' },
  ]

  const selectedChild = children.find(c => c.id === formData.child_id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Hisobot yuborish</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.num}
              </div>
              <span className="text-xs mt-2 text-gray-600 hidden sm:block">
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Kayfiyat */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Qadam 1: Bolaning kayfiyati
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bola
                  </label>
                  <select
                    value={formData.child_id}
                    onChange={(e) => handleChange('child_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kayfiyat (1-10): {formData.mood_score} {getMoodEmoji(formData.mood_score)}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.mood_score}
                    onChange={(e) => handleChange('mood_score', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>😢</span>
                    <span>😐</span>
                    <span>🙂</span>
                    <span>😊</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nutq izohlari (ixtiyoriy)
                  </label>
                  <textarea
                    value={formData.speech_notes}
                    onChange={(e) => handleChange('speech_notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Bugun qanday yangi so'zlar aytdi..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Boshqa holatlar */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Qadam 2: Boshqa holatlar
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uyqu soati (soat): {formData.sleep_hours}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.sleep_hours}
                    onChange={(e) => handleChange('sleep_hours', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ichtimochi
                  </label>
                  <div className="flex gap-3">
                    {(['poor', 'fair', 'good', 'excellent'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleChange('appetite', level)}
                        className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                          formData.appetite === level
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {level === 'poor' ? '😟' :
                           level === 'fair' ? '😐' :
                           level === 'good' ? '🙂' : '😋'}
                        </div>
                        <div className="text-xs text-gray-600 capitalize">
                          {level === 'poor' ? 'Yomon' :
                           level === 'fair' ? 'O'rtacha' :
                           level === 'good' ? 'Yaxshi' : 'Ajoyib'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Faoliyat */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Qadam 3: Faoliyat va xatti-harakat
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vazifalar bajarilganligi: {formData.tasks_completed}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.tasks_completed}
                    onChange={(e) => handleChange('tasks_completed', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xatti-harakat izohlari (ixtiyoriy)
                  </label>
                  <textarea
                    value={formData.behavior_notes}
                    onChange={(e) => handleChange('behavior_notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Xatti-harakat haqida izoh..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Qo'shimcha */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Qadam 4: Qo'shimcha ma'lumot
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qo'shimcha izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="Qo'shimcha ma'lumotlar..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-gray-800">Hisobot ma'lumoti:</h3>
                  {selectedChild && (
                    <p className="text-sm text-gray-600">
                      Bola: <span className="font-medium">{selectedChild.full_name}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Kayfiyat: {formData.mood_score}/10 {getMoodEmoji(formData.mood_score)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Uyqu: {formData.sleep_hours} soat
                  </p>
                  <p className="text-sm text-gray-600">
                    Ichtimochi: {
                      formData.appetite === 'poor' ? 'Yomon' :
                      formData.appetite === 'fair' ? 'O\'rtacha' :
                      formData.appetite === 'good' ? 'Yaxshi' : 'Ajoyib'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Vazifalar: {formData.tasks_completed}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Ortga
          </Button>

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Keyingi
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              variant="primary"
            >
              {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
