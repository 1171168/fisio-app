import { useState, useEffect } from 'react';
import {
  getAppointments, createAppointment, updateAppointment, deleteAppointment,
  getPatients,
  Appointment, Patient
} from '../api';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'scheduled') return <span className="badge-scheduled">Agendada</span>;
  if (status === 'completed') return <span className="badge-completed">Concluída</span>;
  return <span className="badge-cancelled">Cancelada</span>;
}

function AppointmentModal({
  appointment,
  patients,
  defaultDate,
  onClose,
  onSave,
}: {
  appointment: Appointment | null;
  patients: Patient[];
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: Omit<Appointment, 'id' | 'patient_name'>) => Promise<void>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    patient_id: appointment?.patient_id ?? (patients[0]?.id ?? 0),
    date: appointment?.date ?? defaultDate ?? today,
    time: appointment?.time ?? '09:00',
    duration: appointment?.duration ?? 60,
    notes: appointment?.notes ?? '',
    status: appointment?.status ?? 'scheduled' as Appointment['status'],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.date || !form.time) {
      setError('Paciente, data e hora são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        patient_id: form.patient_id,
        date: form.date,
        time: form.time,
        duration: Number(form.duration),
        notes: form.notes || null,
        status: form.status,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {appointment ? 'Editar Consulta' : 'Nova Consulta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="label">Paciente *</label>
            <select
              className="input-field"
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Hora *</label>
              <input
                type="time"
                className="input-field"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duração (minutos)</label>
              <select
                className="input-field"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Appointment['status'] })}
              >
                <option value="scheduled">Agendada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações sobre a consulta..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Schedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekBase, setCurrentWeekBase] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(currentWeekBase);
  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[6]);

  const load = () => {
    setLoading(true);
    Promise.all([
      getAppointments({ week_start: weekStart, week_end: weekEnd }),
      getPatients(),
    ]).then(([appts, pats]) => {
      setAppointments(appts);
      setPatients(pats);
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [weekStart, weekEnd]);

  const goTodayWeek = () => setCurrentWeekBase(new Date());
  const goPrevWeek = () => {
    const d = new Date(currentWeekBase);
    d.setDate(d.getDate() - 7);
    setCurrentWeekBase(d);
  };
  const goNextWeek = () => {
    const d = new Date(currentWeekBase);
    d.setDate(d.getDate() + 7);
    setCurrentWeekBase(d);
  };

  const handleSave = async (data: Omit<Appointment, 'id' | 'patient_name'>) => {
    if (editAppt) {
      const updated = await updateAppointment(editAppt.id, data);
      setAppointments((prev) => prev.map((a) => a.id === updated.id ? updated : a));
    } else {
      const created = await createAppointment(data);
      if (created.date >= weekStart && created.date <= weekEnd) {
        setAppointments((prev) => [...prev, created]);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteConfirm.id);
      setAppointments((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const getApptsByDate = (date: string) =>
    appointments.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time));

  const today = toDateStr(new Date());
  const isCurrentWeek = weekDates.some((d) => toDateStr(d) === today);

  const statusColor = (status: string) => {
    if (status === 'scheduled') return 'bg-blue-50 border-blue-200 text-blue-800';
    if (status === 'completed') return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-gray-50 border-gray-200 text-gray-500';
  };

  const weekLabel = () => {
    const s = weekDates[0];
    const e = weekDates[6];
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} — ${e.getDate()} de ${MONTHS_PT[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS_PT[s.getMonth()]} — ${e.getDate()} ${MONTHS_PT[e.getMonth()]} ${e.getFullYear()}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{appointments.length} consulta(s) esta semana</p>
        </div>
        <button
          onClick={() => { setEditAppt(null); setDefaultDate(undefined); setShowModal(true); }}
          className="btn-primary text-sm sm:text-base"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Consulta
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 mb-5 sm:mb-6 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={goPrevWeek} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goNextWeek} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900">{weekLabel()}</h2>
        {!isCurrentWeek && (
          <button onClick={goTodayWeek} className="btn-secondary text-sm px-3 py-1.5">
            Hoje
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Weekly Calendar Grid — desktop only (lg+) */}
          <div className="hidden lg:block card p-0 overflow-hidden mb-8">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {weekDates.map((date, i) => {
                const dateStr = toDateStr(date);
                const isToday = dateStr === today;
                return (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-teal-50' : 'bg-white'}`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isToday ? 'text-teal-600' : 'text-gray-400'}`}>
                      {DAYS_PT[date.getDay()]}
                    </p>
                    <button
                      onClick={() => {
                        setEditAppt(null);
                        setDefaultDate(dateStr);
                        setShowModal(true);
                      }}
                      className={`w-8 h-8 rounded-full text-sm font-bold transition-colors mx-auto flex items-center justify-center ${
                        isToday
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Appointments in calendar */}
            <div className="grid grid-cols-7">
              {weekDates.map((date, i) => {
                const dateStr = toDateStr(date);
                const dayAppts = getApptsByDate(dateStr);
                const isToday = dateStr === today;
                return (
                  <div
                    key={i}
                    className={`min-h-[160px] p-2 border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-teal-50/30' : ''}`}
                  >
                    {dayAppts.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => { setEditAppt(appt); setShowModal(true); }}
                        className={`w-full text-left p-2 rounded-lg border text-xs mb-1.5 transition-opacity hover:opacity-80 ${statusColor(appt.status)}`}
                      >
                        <div className="font-semibold truncate">{appt.time}</div>
                        <div className="truncate">{appt.patient_name}</div>
                        <div className="opacity-70">{appt.duration}min</div>
                      </button>
                    ))}
                    {dayAppts.length === 0 && (
                      <div
                        className="h-full min-h-[120px] flex items-center justify-center cursor-pointer group"
                        onClick={() => {
                          setEditAppt(null);
                          setDefaultDate(dateStr);
                          setShowModal(true);
                        }}
                      >
                        <span className="text-xs text-gray-300 group-hover:text-gray-400 transition-colors">+ consulta</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/tablet day strips — visible below lg */}
          <div className="lg:hidden mb-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDates.map((date, i) => {
                const dateStr = toDateStr(date);
                const isToday = dateStr === today;
                const count = getApptsByDate(dateStr).length;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setEditAppt(null);
                      setDefaultDate(dateStr);
                      setShowModal(true);
                    }}
                    className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                      isToday ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold uppercase ${isToday ? 'text-teal-200' : 'text-gray-400'}`}>
                      {DAYS_PT[date.getDay()]}
                    </span>
                    <span className={`text-sm font-bold mt-0.5 ${isToday ? 'text-white' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </span>
                    {count > 0 && (
                      <span className={`mt-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                        isToday ? 'bg-teal-400 text-white' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List View */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Lista desta Semana</h2>
            {appointments.length === 0 ? (
              <div className="card text-center py-10 text-gray-500">
                Nenhuma consulta agendada para esta semana.
              </div>
            ) : (
              <div className="space-y-3">
                {weekDates.map((date) => {
                  const dateStr = toDateStr(date);
                  const dayAppts = getApptsByDate(dateStr);
                  if (dayAppts.length === 0) return null;
                  return (
                    <div key={dateStr}>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <span>{DAYS_FULL_PT[date.getDay()]}, {date.getDate()} de {MONTHS_PT[date.getMonth()]}</span>
                        {dateStr === today && (
                          <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">Hoje</span>
                        )}
                      </h3>
                      <div className="card p-0 overflow-hidden">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-100">
                            {dayAppts.map((appt) => (
                              <tr key={appt.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                      appt.status === 'scheduled' ? 'bg-blue-500' :
                                      appt.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
                                    }`}></div>
                                    <span className="font-semibold text-gray-900">{appt.time}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-teal-700 text-xs font-bold">
                                        {appt.patient_name.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="font-medium text-gray-900">{appt.patient_name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{appt.duration} min</td>
                                <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate hidden md:table-cell">{appt.notes || '—'}</td>
                                <td className="px-4 py-3">
                                  <StatusBadge status={appt.status} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 justify-end">
                                    <button
                                      onClick={() => { setEditAppt(appt); setShowModal(true); }}
                                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(appt)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Appointment Modal */}
      {showModal && (
        <AppointmentModal
          appointment={editAppt}
          patients={patients}
          defaultDate={defaultDate}
          onClose={() => { setShowModal(false); setEditAppt(null); setDefaultDate(undefined); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Eliminar Consulta</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Tem a certeza que deseja eliminar a consulta de <strong>{deleteConfirm.patient_name}</strong> em {new Date(deleteConfirm.date + 'T00:00:00').toLocaleDateString('pt-PT')} às {deleteConfirm.time}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 justify-center">
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
