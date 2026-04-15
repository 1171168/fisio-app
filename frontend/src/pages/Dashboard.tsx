import { useState, useEffect } from 'react';
import { getDashboard, DashboardData } from '../api';

function StatCard({ title, value, subtitle, color, icon }: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'scheduled') return <span className="badge-scheduled">Agendada</span>;
  if (status === 'completed') return <span className="badge-completed">Concluída</span>;
  return <span className="badge-cancelled">Cancelada</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">A carregar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Erro ao carregar dados</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <p className="text-gray-500 text-sm mt-3">Certifique-se que o servidor está a correr em http://localhost:3001</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 capitalize">{todayStr}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Pacientes"
          value={data?.totalPatients ?? 0}
          subtitle="pacientes registados"
          color="bg-teal-100"
          icon={
            <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Consultas Hoje"
          value={data?.todayAppointments ?? 0}
          subtitle="agendadas para hoje"
          color="bg-blue-100"
          icon={
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total de Avaliações"
          value={data?.totalExams ?? 0}
          subtitle="avaliações realizadas"
          color="bg-purple-100"
          icon={
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatCard
          title="Testes na Biblioteca"
          value={data?.totalTests ?? 0}
          subtitle="testes disponíveis"
          color="bg-amber-100"
          icon={
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
      </div>

      {/* Today's Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Consultas de Hoje</h2>
          <span className="text-sm text-gray-500">
            {data?.todayAppointmentsList.length ?? 0} consulta(s)
          </span>
        </div>

        {!data?.todayAppointmentsList.length ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Nenhuma consulta hoje</p>
            <p className="text-gray-400 text-sm mt-1">Não há consultas agendadas para hoje.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duração</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.todayAppointmentsList.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          appt.status === 'scheduled' ? 'bg-blue-500' :
                          appt.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-semibold text-gray-900">{appt.time}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{appt.patient_name}</div>
                    </td>
                    <td className="py-3 text-gray-600 text-sm">{appt.duration} min</td>
                    <td className="py-3 text-gray-500 text-sm max-w-xs truncate">
                      {appt.notes || '—'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
