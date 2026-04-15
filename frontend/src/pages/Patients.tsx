import { useState, useEffect } from 'react';
import {
  getPatients, createPatient, updatePatient, deletePatient,
  getPatientAppointments, getPatientExams,
  Patient, Appointment, Exam
} from '../api';

const EMPTY_PATIENT: Omit<Patient, 'id' | 'created_at'> = {
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  address: '',
  medical_notes: '',
};

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} anos`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'scheduled') return <span className="badge-scheduled">Agendada</span>;
  if (status === 'completed') return <span className="badge-completed">Concluída</span>;
  return <span className="badge-cancelled">Cancelada</span>;
}

function PatientModal({
  patient,
  onClose,
  onSave,
}: {
  patient: (Omit<Patient, 'id' | 'created_at'> & { id?: number }) | null;
  onClose: () => void;
  onSave: (data: Omit<Patient, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<Patient, 'id' | 'created_at'>>(
    patient ? {
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth || '',
      address: patient.address || '',
      medical_notes: patient.medical_notes || '',
    } : { ...EMPTY_PATIENT }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {patient?.id ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Nome completo *</label>
            <input
              type="text"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do paciente"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                type="tel"
                className="input-field"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9XX XXX XXX"
              />
            </div>
          </div>

          <div>
            <label className="label">Data de Nascimento</label>
            <input
              type="date"
              className="input-field"
              value={form.date_of_birth || ''}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Morada</label>
            <input
              type="text"
              className="input-field"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Rua, número, cidade"
            />
          </div>

          <div>
            <label className="label">Notas Médicas</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              value={form.medical_notes || ''}
              onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
              placeholder="Historial clínico, diagnósticos, observações..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDetail({
  patient,
  onClose,
  onEdit,
}: {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tab, setTab] = useState<'info' | 'appointments' | 'exams'>('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPatientAppointments(patient.id),
      getPatientExams(patient.id),
    ]).then(([appts, exs]) => {
      setAppointments(appts);
      setExams(exs);
    }).finally(() => setLoading(false));
  }, [patient.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-bold text-xl">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
              <p className="text-gray-500 text-sm">
                {patient.date_of_birth ? calcAge(patient.date_of_birth) : 'Idade desconhecida'}
                {patient.phone ? ` · ${patient.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn-secondary text-sm px-3 py-1.5">
              Editar
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['info', 'appointments', 'exams'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'info' ? 'Informações' : t === 'appointments' ? `Consultas (${appointments.length})` : `Avaliações (${exams.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tab === 'info' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Email</p>
                  <p className="text-gray-900">{patient.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Telefone</p>
                  <p className="text-gray-900">{patient.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Data de Nascimento</p>
                  <p className="text-gray-900">
                    {patient.date_of_birth
                      ? new Date(patient.date_of_birth + 'T00:00:00').toLocaleDateString('pt-PT')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Idade</p>
                  <p className="text-gray-900">{calcAge(patient.date_of_birth)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Morada</p>
                <p className="text-gray-900">{patient.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notas Médicas</p>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 text-sm">
                  {patient.medical_notes || 'Sem notas.'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Registado em</p>
                <p className="text-gray-900">
                  {new Date(patient.created_at).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          ) : tab === 'appointments' ? (
            appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma consulta registada.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-PT')} às {appt.time}
                      </p>
                      <p className="text-sm text-gray-500">{appt.duration} min {appt.notes ? `· ${appt.notes}` : ''}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )
          ) : (
            exams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma avaliação registada.</p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div key={exam.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-PT')}
                    </p>
                    {exam.notes && <p className="text-sm text-gray-600 mt-0.5">{exam.notes}</p>}
                    {exam.tests && exam.tests.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{exam.tests.length} teste(s) aplicado(s)</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: Omit<Patient, 'id' | 'created_at'>) => {
    if (editPatient) {
      const updated = await updatePatient(editPatient.id, data);
      setPatients((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } else {
      const created = await createPatient(data);
      setPatients((prev) => [...prev, created]);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePatient(deleteConfirm.id);
      setPatients((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{patients.length} paciente(s) registado(s)</p>
        </div>
        <button
          onClick={() => { setEditPatient(null); setShowModal(true); }}
          className="btn-primary text-sm sm:text-base"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-10 w-full sm:max-w-md"
          placeholder="Pesquisar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Nenhum paciente encontrado</p>
              {search && <p className="text-gray-400 text-sm mt-1">Tente uma pesquisa diferente.</p>}
            </div>
          ) : (
            <>
              {/* Mobile card list — visible below md */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setViewPatient(p)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-700 font-semibold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.phone || p.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditPatient(p); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet table — visible from md up */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Idade</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Morada</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setViewPatient(p)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-teal-700 font-semibold text-sm">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{p.name}</p>
                              {p.medical_notes && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.medical_notes}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-700">{p.email || '—'}</p>
                            <p className="text-sm text-gray-500">{p.phone || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{calcAge(p.date_of_birth)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[180px] truncate hidden lg:table-cell">{p.address || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setEditPatient(p); setShowModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
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
            </>
          )}
        </div>
      )}

      {/* Patient Modal */}
      {showModal && (
        <PatientModal
          patient={editPatient}
          onClose={() => { setShowModal(false); setEditPatient(null); }}
          onSave={handleSave}
        />
      )}

      {/* View Patient Detail */}
      {viewPatient && (
        <PatientDetail
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
          onEdit={() => {
            setEditPatient(viewPatient);
            setViewPatient(null);
            setShowModal(true);
          }}
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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Eliminar Paciente</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Tem a certeza que deseja eliminar <strong>{deleteConfirm.name}</strong>? Esta acção não pode ser revertida.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex-1 justify-center"
              >
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
