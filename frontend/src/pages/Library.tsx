import { useState, useEffect } from 'react';
import { getTests, createTest, updateTest, deleteTest, TestLibrary } from '../api';

const CATEGORIES = ['Ortopédico', 'Neurológico', 'Funcional', 'Postura', 'Outro'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Ortopédico': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100' },
  'Neurológico': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'bg-purple-100' },
  'Funcional': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'bg-green-100' },
  'Postura': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100' },
  'Outro': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'bg-gray-100' },
};

function CategoryBadge({ category }: { category: string | null }) {
  const cat = category || 'Outro';
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Outro'];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
      {cat}
    </span>
  );
}

function TestModal({
  test,
  onClose,
  onSave,
}: {
  test: TestLibrary | null;
  onClose: () => void;
  onSave: (data: Omit<TestLibrary, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: test?.name ?? '',
    description: test?.description ?? '',
    category: test?.category ?? 'Ortopédico',
    instructions: test?.instructions ?? '',
  });
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
            {test ? 'Editar Teste' : 'Novo Teste'}
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
            <label className="label">Nome do Teste *</label>
            <input
              type="text"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Teste de Lasègue"
              required
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const colors = CATEGORY_COLORS[cat];
                const isSelected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descrição do que este teste avalia..."
            />
          </div>

          <div>
            <label className="label">Instruções de Aplicação</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Passo a passo de como aplicar o teste e interpretar os resultados..."
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

function TestDetailModal({
  test,
  onClose,
  onEdit,
}: {
  test: TestLibrary;
  onClose: () => void;
  onEdit: () => void;
}) {
  const colors = CATEGORY_COLORS[test.category ?? 'Outro'] || CATEGORY_COLORS['Outro'];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`p-6 rounded-t-2xl ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-start justify-between">
            <div>
              <CategoryBadge category={test.category} />
              <h2 className="text-xl font-bold text-gray-900 mt-2">{test.name}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {test.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descrição</p>
              <p className="text-gray-700 leading-relaxed">{test.description}</p>
            </div>
          )}
          {test.instructions && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Instruções de Aplicação</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{test.instructions}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Adicionado em</p>
            <p className="text-gray-600 text-sm">{new Date(test.created_at).toLocaleDateString('pt-PT')}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Fechar</button>
            <button onClick={onEdit} className="btn-primary flex-1 justify-center">Editar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const [tests, setTests] = useState<TestLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editTest, setEditTest] = useState<TestLibrary | null>(null);
  const [viewTest, setViewTest] = useState<TestLibrary | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TestLibrary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getTests()
      .then(setTests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: Omit<TestLibrary, 'id' | 'created_at'>) => {
    if (editTest) {
      const updated = await updateTest(editTest.id, data);
      setTests((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    } else {
      const created = await createTest(data);
      setTests((prev) => [...prev, created]);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteTest(deleteConfirm.id);
      setTests((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = tests.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Group by category for display
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catTests = filtered.filter((t) => (t.category ?? 'Outro') === cat);
    if (catTests.length > 0) acc[cat] = catTests;
    return acc;
  }, {} as Record<string, TestLibrary[]>);

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = tests.filter((t) => (t.category ?? 'Outro') === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Testes</h1>
          <p className="text-gray-500 mt-1">{tests.length} teste(s) disponível(is)</p>
        </div>
        <button
          onClick={() => { setEditTest(null); setShowModal(true); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Teste
        </button>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {CATEGORIES.map((cat) => {
          const colors = CATEGORY_COLORS[cat];
          const count = categoryCounts[cat] ?? 0;
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? 'all' : cat)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-current ${colors.text}`
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className={`text-2xl font-bold ${isActive ? colors.text : 'text-gray-900'}`}>{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${isActive ? colors.text : 'text-gray-500'}`}>{cat}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-10 max-w-md"
          placeholder="Pesquisar testes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(filterCategory !== 'all' || search) && (
          <button
            onClick={() => { setSearch(''); setFilterCategory('all'); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 max-w-md"
            style={{ right: 'calc(100% - 390px)' }}
          >
            Limpar filtros
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
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Nenhum teste encontrado</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catTests]) => {
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Outro'];
            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${colors.icon.replace('bg-', 'bg-').replace('100', '400')}`}></div>
                  <h2 className="text-base font-semibold text-gray-700">{category}</h2>
                  <span className="text-sm text-gray-400">({catTests.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTests.map((test) => (
                    <div
                      key={test.id}
                      className={`rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer bg-white`}
                      onClick={() => setViewTest(test)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                          <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditTest(test); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(test)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-snug">{test.name}</h3>
                      {test.description ? (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{test.description}</p>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Sem descrição.</p>
                      )}

                      {test.instructions && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 font-medium mb-1">Instruções</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{test.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Create/Edit Modal */}
      {showModal && (
        <TestModal
          test={editTest}
          onClose={() => { setShowModal(false); setEditTest(null); }}
          onSave={handleSave}
        />
      )}

      {/* Test Detail Modal */}
      {viewTest && (
        <TestDetailModal
          test={viewTest}
          onClose={() => setViewTest(null)}
          onEdit={() => {
            setEditTest(viewTest);
            setViewTest(null);
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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Eliminar Teste</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Tem a certeza que deseja eliminar o teste <strong>"{deleteConfirm.name}"</strong>? Esta acção não pode ser revertida.
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
