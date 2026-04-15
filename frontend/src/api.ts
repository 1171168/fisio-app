const BASE_URL = '/api';

// ==================== TYPES ====================

export interface Patient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  time: string;
  duration: number;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface TestLibrary {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  instructions: string | null;
  created_at: string;
}

export interface ExamTest {
  id: number;
  exam_id: number;
  test_id: number;
  test_name: string;
  category: string | null;
  description?: string | null;
  instructions?: string | null;
  result: string | null;
  observations: string | null;
}

export interface Exam {
  id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  notes: string | null;
  created_at: string;
  tests: ExamTest[];
}

export interface DashboardData {
  totalPatients: number;
  todayAppointments: number;
  totalExams: number;
  totalTests: number;
  todayAppointmentsList: Appointment[];
}

// ==================== HELPER ====================

export const getToken = () => localStorage.getItem('fisio_token');
export const setToken = (t: string) => localStorage.setItem('fisio_token', t);
export const clearToken = () => localStorage.removeItem('fisio_token');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const login = (username: string, password: string) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no login');
    return data as { token: string };
  });

// ==================== DASHBOARD ====================

export const getDashboard = () => request<DashboardData>('/dashboard');

// ==================== PATIENTS ====================

export const getPatients = () => request<Patient[]>('/patients');
export const getPatient = (id: number) => request<Patient>(`/patients/${id}`);
export const createPatient = (data: Omit<Patient, 'id' | 'created_at'>) =>
  request<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) });
export const updatePatient = (id: number, data: Omit<Patient, 'id' | 'created_at'>) =>
  request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePatient = (id: number) =>
  request<{ success: boolean }>(`/patients/${id}`, { method: 'DELETE' });
export const getPatientAppointments = (id: number) =>
  request<Appointment[]>(`/patients/${id}/appointments`);
export const getPatientExams = (id: number) =>
  request<Exam[]>(`/patients/${id}/exams`);

// ==================== APPOINTMENTS ====================

export const getAppointments = (params?: { date?: string; week_start?: string; week_end?: string }) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return request<Appointment[]>(`/appointments${qs}`);
};
export const getAppointment = (id: number) => request<Appointment>(`/appointments/${id}`);
export const createAppointment = (data: Omit<Appointment, 'id' | 'patient_name'>) =>
  request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) });
export const updateAppointment = (id: number, data: Omit<Appointment, 'id' | 'patient_name'>) =>
  request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAppointment = (id: number) =>
  request<{ success: boolean }>(`/appointments/${id}`, { method: 'DELETE' });

// ==================== TESTS LIBRARY ====================

export const getTests = () => request<TestLibrary[]>('/tests');
export const getTest = (id: number) => request<TestLibrary>(`/tests/${id}`);
export const createTest = (data: Omit<TestLibrary, 'id' | 'created_at'>) =>
  request<TestLibrary>('/tests', { method: 'POST', body: JSON.stringify(data) });
export const updateTest = (id: number, data: Omit<TestLibrary, 'id' | 'created_at'>) =>
  request<TestLibrary>(`/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTest = (id: number) =>
  request<{ success: boolean }>(`/tests/${id}`, { method: 'DELETE' });

// ==================== EXAMS ====================

export const getExams = () => request<Exam[]>('/exams');
export const getExam = (id: number) => request<Exam>(`/exams/${id}`);
export const createExam = (data: { patient_id: number; date: string; notes?: string; tests?: { test_id: number; result?: string; observations?: string }[] }) =>
  request<Exam>('/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: number, data: { patient_id: number; date: string; notes?: string }) =>
  request<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExam = (id: number) =>
  request<{ success: boolean }>(`/exams/${id}`, { method: 'DELETE' });

// ==================== EXAM TESTS ====================

export const getExamTests = (examId: number) => request<ExamTest[]>(`/exam-tests/${examId}`);
export const addExamTest = (data: { exam_id: number; test_id: number; result?: string; observations?: string }) =>
  request<ExamTest>('/exam-tests', { method: 'POST', body: JSON.stringify(data) });
export const updateExamTest = (id: number, data: { result?: string; observations?: string }) =>
  request<ExamTest>(`/exam-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExamTest = (id: number) =>
  request<{ success: boolean }>(`/exam-tests/${id}`, { method: 'DELETE' });
