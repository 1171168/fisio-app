import { useState, useEffect } from 'react';
import {
  getExams, createExam, updateExam, deleteExam,
  getPatients, getTests,
  addExamTest, updateExamTest, deleteExamTest,
  Exam, Patient, TestLibrary, ExamTest
} from '../api';

const CATEGORY_COLORS: Record<string, string> = {
  'Ortopédico': 'bg-blue-100 text-blue-700',
  'Neurológico': 'bg-purple-100 text-purple-700',
  'Funcional': 'bg-green-100 text-green-700',
  'Postura': 'bg-amber-100 text-amber-700',
  'Outro': 'bg-gray-100 text-gray-700',
};

function CategoryBadge({ category }: { category: string | null }) {
  const cat = category || 'Outro';
  const cls = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Outro'];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{cat}</span>;
}

// Modal to create/edit exam
function ExamModal({
  exam,
  patients,
  tests,
  onClose,
  onSave,
}: {
  exam: Exam | null;
  patients: Patient[];
  tests: TestLibrary[];
  onClose: () => void;
  onSave: (data: {
    patient_id: number;
    date: string;
    notes: string;
    tests: { test_id: number; result: string; observations: string }[];
  }) => Promise<void>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [patientId, setPatientId] = useState(exam?.patient_id ?? (patients[0]?.id ?? 0));
  const [date, setDate] = useState(exam?.date ?? today);
  const [notes, setNotes] = useState(exam?.notes ?? '');
  const [selectedTests, setSelectedTests] = useState<
    { test_id: number; result: string; observations: string }[]
  >(
    exam?.tests?.map((t) => ({
      test_id: t.test_id,
      result: t.result ?? '',
      observations: t.observations ?? '',
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingTest, setAddingTest] = useState(false);
  const [testSearch, setTestSearch] = useState('');

  const availableTests = tests.filter(
    (t) => !selectedTests.some((st) => st.test_id === t.id)
  );

  const filteredTests = availableTests.filter((t) =>
    t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.category ?? '').toLowerCase().includes(testSearch.toLowerCase())
  );

  const addTest = (testId: number) => {
    if (!testId) return;
    setSelectedTests((prev) => [...prev, { test_id: testId, result: '', observations: '' }]);
    setTestSearch('');
    setAddingTest(false);
  };

  const removeTest = (testId: number) => {
    setSelectedTests((prev) => prev.filter((t) => t.test_id !== testId));
  };

  const updateTest = (testId: number, field: 'result' | 'observations', value: string) => {
    setSelectedTests((prev) =>
      prev.map((t) => t.test_id === testId ? { ...t, [field]: value } : t)
    );
  };

  const getTestInfo = (testId: number) => tests.find((t) => t.id === testId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date) {
      setError('Paciente e data são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ patient_id: patientId, date, notes, tests: selectedTests });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {exam ? 'Editar Avaliação' : 'Nova Avaliação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Paciente *</label>
              <select
                className="input-field"
                value={patientId}
                onChange={(e) => setPatientId(Number(e.target.value))}
                required
              >
                <option value="">Seleccionar...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Notas gerais</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações gerais sobre a avaliação..."
            />
          </div>

          {/* Tests section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Testes Aplicados</label>
              <button
                type="button"
                onClick={() => setAddingTest(true)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Teste
              </button>
            </div>

            {/* Add test picker */}
            {addingTest && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Seleccionar teste da biblioteca:</p>
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="input-field pl-9 text-sm"
                    placeholder="Pesquisar testes..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredTests.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum teste encontrado.</p>
                  ) : (
                    filteredTests.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => addTest(t.id)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{t.name}</span>
                          <CategoryBadge category={t.category} />
                        </div>
                        {t.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setAddingTest(false); setTestSearch(''); }}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            )}

            {selectedTests.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Nenhum teste adicionado ainda.</p>
                <p className="text-gray-300 text-xs mt-1">Clique em "Adicionar Teste" para incluir testes nesta avaliação.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTests.map((st) => {
                  const testInfo = getTestInfo(st.test_id);
                  if (!testInfo) return null;
                  return (
                    <div key={st.test_id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">{testInfo.name}</span>
                            <CategoryBadge category={testInfo.category} />
                          </div>
                          {testInfo.instructions && (
                            <p className="text-xs text-gray-400 mt-1 italic">{testInfo.instructions}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTest(st.test_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Resultado</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={st.result}
                            onChange={(e) => updateTest(st.test_id, 'result', e.target.value)}
                            placeholder="Ex: Positivo, 14.2s, Normal..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Observações</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={st.observations}
                            onChange={(e) => updateTest(st.test_id, 'observations', e.target.value)}
                            placeholder="Notas adicionais..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => {
              const form = e.currentTarget.closest('.flex')?.previousElementSibling as HTMLElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }}
            className="btn-primary flex-1 justify-center"
            // We handle submit via a real form, this is a workaround for footer button
          >
            {saving ? 'A guardar...' : 'Guardar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Exam detail modal
function ExamDetail({
  exam,
  onClose,
  onEdit,
  onUpdateTest,
  onDeleteTest,
}: {
  exam: Exam;
  tests: TestLibrary[];
  onClose: () => void;
  onEdit: () => void;
  onAddTest: (examId: number, testId: number, result: string, observations: string) => Promise<void>;
  onUpdateTest: (id: number, result: string, observations: string) => Promise<void>;
  onDeleteTest: (id: number) => Promise<void>;
}) {
  const [editingTest, setEditingTest] = useState<ExamTest | null>(null);
  const [editResult, setEditResult] = useState('');
  const [editObs, setEditObs] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (et: ExamTest) => {
    setEditingTest(et);
    setEditResult(et.result ?? '');
    setEditObs(et.observations ?? '');
  };

  const saveEdit = async () => {
    if (!editingTest) return;
    setSaving(true);
    try {
      await onUpdateTest(editingTest.id, editResult, editObs);
      setEditingTest(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Avaliação — {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-PT')}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{exam.patient_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn-secondary text-sm px-3 py-1.5">Editar</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {exam.notes && (
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Notas Gerais</p>
              <p className="text-gray-700 text-sm">{exam.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Testes Realizados ({exam.tests?.length ?? 0})</h3>
            </div>

            {(!exam.tests || exam.tests.length === 0) ? (
              <p className="text-gray-400 text-sm text-center py-6">Nenhum teste registado nesta avaliação.</p>
            ) : (
              <div className="space-y-3">
                {exam.tests.map((et) => (
                  <div key={et.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900 text-sm">{et.test_name}</span>
                          <CategoryBadge category={et.category} />
                        </div>
                        {editingTest?.id === et.id ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1">Resultado</label>
                              <input
                                type="text"
                                className="input-field text-sm"
                                value={editResult}
                                onChange={(e) => setEditResult(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1">Observações</label>
                              <textarea
                                className="input-field text-sm resize-none"
                                rows={2}
                                value={editObs}
                                onChange={(e) => setEditObs(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                                {saving ? 'Guardar...' : 'Guardar'}
                              </button>
                              <button onClick={() => setEditingTest(null)} className="btn-secondary text-xs px-3 py-1.5">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Resultado</p>
                              <p className="text-sm text-gray-800 font-medium">{et.result || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Observações</p>
                              <p className="text-sm text-gray-700">{et.observations || '—'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {editingTest?.id !== et.id && (
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            onClick={() => startEdit(et)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteTest(et.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<TestLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [viewExam, setViewExam] = useState<Exam | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getExams(), getPatients(), getTests()])
      .then(([exs, pats, tsts]) => {
        setExams(exs);
        setPatients(pats);
        setTests(tsts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: {
    patient_id: number;
    date: string;
    notes: string;
    tests: { test_id: number; result: string; observations: string }[];
  }) => {
    if (editExam) {
      // Update exam header
      await updateExam(editExam.id, {
        patient_id: data.patient_id,
        date: data.date,
        notes: data.notes,
      });
      // Refresh full list
      const updated = await getExams();
      setExams(updated);
    } else {
      const created = await createExam({
        patient_id: data.patient_id,
        date: data.date,
        notes: data.notes,
        tests: data.tests,
      });
      setExams((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteExam(deleteConfirm.id);
      setExams((prev) => prev.filter((e) => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddTest = async (examId: number, testId: number, result: string, observations: string) => {
    await addExamTest({ exam_id: examId, test_id: testId, result, observations });
    const updated = await getExams();
    setExams(updated);
    if (viewExam) {
      const refreshed = updated.find((e) => e.id === examId);
      if (refreshed) setViewExam(refreshed);
    }
  };

  const handleUpdateTest = async (id: number, result: string, observations: string) => {
    await updateExamTest(id, { result, observations });
    const updated = await getExams();
    setExams(updated);
    if (viewExam) {
      const refreshed = updated.find((e) => e.id === viewExam.id);
      if (refreshed) setViewExam(refreshed);
    }
  };

  const handleDeleteTest = async (id: number) => {
    await deleteExamTest(id);
    const updated = await getExams();
    setExams(updated);
    if (viewExam) {
      const refreshed = updated.find((e) => e.id === viewExam.id);
      if (refreshed) setViewExam(refreshed);
    }
  };

  const filtered = exams.filter((e) =>
    e.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-gray-500 mt-1">{exams.length} avaliação(ões) registada(s)</p>
        </div>
        <button
          onClick={() => { setEditExam(null); setShowModal(true); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Avaliação
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-10 max-w-md"
          placeholder="Pesquisar por paciente ou notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Nenhuma avaliação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exam) => (
            <div
              key={exam.id}
              className="card hover:shadow-md transition-shadow cursor-pointer p-5"
              onClick={() => setViewExam(exam)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{exam.patient_name}</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-PT', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                    {exam.notes && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{exam.notes}</p>
                    )}
                    {exam.tests && exam.tests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {exam.tests.slice(0, 4).map((et) => (
                          <CategoryBadge key={et.id} category={et.category} />
                        ))}
                        {exam.tests.length > 4 && (
                          <span className="text-xs text-gray-400">+{exam.tests.length - 4} mais</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right mr-3">
                    <p className="text-xs text-gray-400">Testes</p>
                    <p className="font-semibold text-gray-900">{exam.tests?.length ?? 0}</p>
                  </div>
                  <button
                    onClick={() => { setEditExam(exam); setShowModal(true); }}
                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(exam)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exam Create/Edit Modal */}
      {showModal && (
        <ExamModal
          exam={editExam}
          patients={patients}
          tests={tests}
          onClose={() => { setShowModal(false); setEditExam(null); }}
          onSave={handleSave}
        />
      )}

      {/* View Exam Detail */}
      {viewExam && (
        <ExamDetail
          exam={viewExam}
          tests={tests}
          onClose={() => setViewExam(null)}
          onEdit={() => {
            setEditExam(viewExam);
            setViewExam(null);
            setShowModal(true);
          }}
          onAddTest={handleAddTest}
          onUpdateTest={handleUpdateTest}
          onDeleteTest={handleDeleteTest}
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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Eliminar Avaliação</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Tem a certeza que deseja eliminar a avaliação de <strong>{deleteConfirm.patient_name}</strong> de {new Date(deleteConfirm.date + 'T00:00:00').toLocaleDateString('pt-PT')}? Todos os testes associados serão eliminados.
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
