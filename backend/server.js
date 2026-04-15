const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fisio-dev-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fisio2024';

// Middleware
app.use(cors());
app.use(express.json());

// Auth: login (public)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Credenciais inválidas' });
});

// Auth middleware — protects all /api routes except /api/auth/login
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/auth/login') return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada, faça login novamente' });
  }
});

// Database setup
const dbPath = path.join(__dirname, 'fisio.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth TEXT,
    address TEXT,
    medical_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tests_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    instructions TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS exam_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    result TEXT,
    observations TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (test_id) REFERENCES tests_library(id)
  );
`);

// Seed data example (runs only if tables are empty):
// INSERT INTO patients (name, email, phone, date_of_birth) VALUES ('Maria Silva', 'maria@email.com', '912345678', '1985-03-15');
// INSERT INTO tests_library (name, description, category) VALUES ('Teste de Lasègue', 'Avalia compressão radicular lombar', 'Ortopédico');
// INSERT INTO appointments (patient_id, date, time, duration, status) VALUES (1, '2024-02-15', '09:00', 60, 'scheduled');

// Check if we need seed data
const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
if (patientCount.count === 0) {
  // Insert seed patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (name, email, phone, date_of_birth, address, medical_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPatient.run('Maria Silva', 'maria.silva@email.com', '912 345 678', '1985-03-15', 'Rua das Flores 123, Lisboa', 'Dor lombar crónica. Sem alergias conhecidas.');
  insertPatient.run('João Ferreira', 'joao.ferreira@email.com', '961 234 567', '1972-07-22', 'Av. da Liberdade 45, Porto', 'Pós-operatório joelho direito (LCA). Hipertenso.');
  insertPatient.run('Ana Rodrigues', 'ana.rodrigues@email.com', '935 678 901', '1990-11-08', 'Praça do Comércio 7, Setúbal', 'Cervicalgia. Síndrome do túnel do carpo bilateral.');
  insertPatient.run('Carlos Mendes', 'carlos.mendes@email.com', '926 789 012', '1968-05-30', 'Rua do Ouro 89, Coimbra', 'Diabetes tipo 2. Periartrite escápulo-umeral esquerda.');
  insertPatient.run('Beatriz Costa', 'beatriz.costa@email.com', '914 567 890', '1998-02-14', 'Travessa da Saudade 12, Braga', 'Escoliose leve. Pratica atletismo.');

  // Insert seed tests library
  const insertTest = db.prepare(`
    INSERT INTO tests_library (name, description, category, instructions)
    VALUES (?, ?, ?, ?)
  `);
  insertTest.run('Teste de Lasègue', 'Avalia compressão radicular lombar por estiramento do nervo ciático.', 'Ortopédico', 'Paciente em decúbito dorsal. Elevar passivamente o membro inferior com joelho estendido. Positivo se dor irradiada abaixo do joelho entre 30°-70°.');
  insertTest.run('Teste de Thomas', 'Avalia encurtamento do músculo psoas-ilíaco e recto femoral.', 'Ortopédico', 'Paciente em decúbito dorsal na beira da maca. Flexionar uma coxa ao peito. Observar se a coxa oposta levanta da maca.');
  insertTest.run('Teste de Ober', 'Avalia encurtamento da banda ílio-tibial e tensor da fáscia lata.', 'Ortopédico', 'Paciente em decúbito lateral com lado a avaliar por cima. Abduzir e estender a anca em posição neutra e soltar. Positivo se o membro não cai.');
  insertTest.run('Sinal de Phalen', 'Avalia síndrome do túnel do carpo.', 'Ortopédico', 'Manter os pulsos em flexão máxima por 60 segundos. Positivo se parestesias nos dedos inervados pelo nervo mediano.');
  insertTest.run('Teste de Romberg', 'Avalia equilíbrio estático e propriocepção.', 'Neurológico', 'Paciente em pé com pés juntos e olhos abertos, depois fechados. Positivo se oscilação ou queda com olhos fechados.');
  insertTest.run('Teste de Fukuda', 'Avalia disfunção vestibular e assimetria motora.', 'Neurológico', 'Paciente marcha no lugar 50 passos com olhos fechados. Desvio >45° indica disfunção vestibular do lado para onde desvia.');
  insertTest.run('Teste de Finger-Nose', 'Avalia coordenação e disdiadococinesia.', 'Neurológico', 'Paciente toca alternadamente o nariz e o dedo do examinador. Observar precisão, tremor intencional e dismetria.');
  insertTest.run('Teste de Sentar-Levantar', 'Avalia força de membros inferiores e funcionalidade.', 'Funcional', 'Paciente sentado numa cadeira sem apoio dos braços, levantar e sentar 5 vezes o mais rápido possível. Registar o tempo.');
  insertTest.run('Teste de Caminhada 6 Minutos', 'Avalia capacidade funcional aeróbia.', 'Funcional', 'Paciente caminha o mais rápido possível durante 6 minutos num percurso plano de 30 metros. Registar distância total percorrida.');
  insertTest.run('Avaliação Postural Global', 'Análise postural em várias vistas (anterior, posterior, lateral).', 'Postura', 'Observar alinhamento em vista anterior (ombros, cristas ilíacas, joelhos), posterior (coluna, escápulas) e lateral (curvaturas fisiológicas).');
  insertTest.run('Teste de Adams', 'Avalia escoliose estrutural vs funcional.', 'Postura', 'Paciente faz flexão anterior do tronco com joelhos estendidos. Observar gibosidade costal. Positivo indica escoliose estrutural.');

  // Insert seed appointments
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const insertAppt = db.prepare(`
    INSERT INTO appointments (patient_id, date, time, duration, notes, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAppt.run(1, today, '09:00', 60, 'Sessão de reabilitação lombar', 'scheduled');
  insertAppt.run(2, today, '10:30', 45, 'Fisioterapia pós-operatória joelho', 'scheduled');
  insertAppt.run(3, today, '14:00', 60, 'Tratamento cervicalgia', 'scheduled');
  insertAppt.run(4, yesterday, '09:00', 60, 'Mobilização ombro', 'completed');
  insertAppt.run(1, yesterday, '11:00', 45, 'Electroterapia lombar', 'completed');
  insertAppt.run(5, tomorrow, '10:00', 60, 'Avaliação inicial', 'scheduled');
  insertAppt.run(2, tomorrow, '15:00', 45, 'Treino propriocepção', 'scheduled');
  insertAppt.run(3, nextWeek, '09:30', 60, 'Reavaliação', 'scheduled');
  insertAppt.run(4, nextWeek, '11:00', 45, 'Ultrassom terapêutico', 'scheduled');

  // Insert seed exams
  const insertExam = db.prepare(`
    INSERT INTO exams (patient_id, date, notes)
    VALUES (?, ?, ?)
  `);
  const exam1 = insertExam.run(1, yesterday, 'Avaliação inicial de dor lombar. Paciente refere EVA 7/10.');
  const exam2 = insertExam.run(2, yesterday, 'Reavaliação pós-operatória semana 6. Boa evolução.');
  const exam3 = insertExam.run(3, new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], 'Avaliação cervicalgia e suspeita de hérnia discal C5-C6.');

  // Insert exam tests
  const insertExamTest = db.prepare(`
    INSERT INTO exam_tests (exam_id, test_id, result, observations)
    VALUES (?, ?, ?, ?)
  `);
  insertExamTest.run(exam1.lastInsertRowid, 1, 'Positivo a 45° esquerdo', 'Dor irradiada até ao pé esquerdo. Suspeita de compressão L5-S1.');
  insertExamTest.run(exam1.lastInsertRowid, 2, 'Positivo bilateral', 'Encurtamento bilateral do psoas. Maior à esquerda.');
  insertExamTest.run(exam1.lastInsertRowid, 10, 'Hiperlordose lombar, ombro direito mais elevado', 'Desvio postural relevante. Recomenda exercícios correctivos.');
  insertExamTest.run(exam2.lastInsertRowid, 8, '14.2 segundos', 'Acima do normal para idade (>12s = limitação funcional). A melhorar face à avaliação anterior (18s).');
  insertExamTest.run(exam2.lastInsertRowid, 5, 'Negativo', 'Equilíbrio estático preservado. Sem défice proprioceptivo aparente.');
  insertExamTest.run(exam3.lastInsertRowid, 1, 'Positivo a 60° direito', 'Dor cervical com irradiação para membro superior direito.');
  insertExamTest.run(exam3.lastInsertRowid, 4, 'Positivo bilateral', 'Parestesias nos 3 primeiros dedos bilateralmente após 40 segundos.');
}

// ==================== PATIENTS API ====================

// GET all patients
app.get('/api/patients', (req, res) => {
  try {
    const patients = db.prepare('SELECT * FROM patients ORDER BY name').all();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single patient
app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create patient
app.post('/api/patients', (req, res) => {
  try {
    const { name, email, phone, date_of_birth, address, medical_notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const stmt = db.prepare(`
      INSERT INTO patients (name, email, phone, date_of_birth, address, medical_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email || null, phone || null, date_of_birth || null, address || null, medical_notes || null);
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
app.put('/api/patients/:id', (req, res) => {
  try {
    const { name, email, phone, date_of_birth, address, medical_notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const stmt = db.prepare(`
      UPDATE patients SET name=?, email=?, phone=?, date_of_birth=?, address=?, medical_notes=?
      WHERE id=?
    `);
    const result = stmt.run(name, email || null, phone || null, date_of_birth || null, address || null, medical_notes || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Paciente não encontrado' });
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
app.delete('/api/patients/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET patient appointments
app.get('/api/patients/:id/appointments', (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time DESC
    `).all(req.params.id);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET patient exams
app.get('/api/patients/:id/exams', (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT e.*, p.name as patient_name
      FROM exams e
      JOIN patients p ON e.patient_id = p.id
      WHERE e.patient_id = ?
      ORDER BY e.date DESC
    `).all(req.params.id);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== APPOINTMENTS API ====================

// GET all appointments
app.get('/api/appointments', (req, res) => {
  try {
    const { date, week_start, week_end } = req.query;
    let query = `
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
    `;
    const params = [];

    if (date) {
      query += ' WHERE a.date = ?';
      params.push(date);
    } else if (week_start && week_end) {
      query += ' WHERE a.date >= ? AND a.date <= ?';
      params.push(week_start, week_end);
    }

    query += ' ORDER BY a.date, a.time';
    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single appointment
app.get('/api/appointments/:id', (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Consulta não encontrada' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create appointment
app.post('/api/appointments', (req, res) => {
  try {
    const { patient_id, date, time, duration, notes, status } = req.body;
    if (!patient_id || !date || !time) {
      return res.status(400).json({ error: 'Paciente, data e hora são obrigatórios' });
    }
    const stmt = db.prepare(`
      INSERT INTO appointments (patient_id, date, time, duration, notes, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(patient_id, date, time, duration || 60, notes || null, status || 'scheduled');
    const appointment = db.prepare(`
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update appointment
app.put('/api/appointments/:id', (req, res) => {
  try {
    const { patient_id, date, time, duration, notes, status } = req.body;
    if (!patient_id || !date || !time) {
      return res.status(400).json({ error: 'Paciente, data e hora são obrigatórios' });
    }
    const stmt = db.prepare(`
      UPDATE appointments SET patient_id=?, date=?, time=?, duration=?, notes=?, status=?
      WHERE id=?
    `);
    const result = stmt.run(patient_id, date, time, duration || 60, notes || null, status || 'scheduled', req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Consulta não encontrada' });
    const appointment = db.prepare(`
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `).get(req.params.id);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE appointment
app.delete('/api/appointments/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Consulta não encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TESTS LIBRARY API ====================

// GET all tests
app.get('/api/tests', (req, res) => {
  try {
    const tests = db.prepare('SELECT * FROM tests_library ORDER BY category, name').all();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single test
app.get('/api/tests/:id', (req, res) => {
  try {
    const test = db.prepare('SELECT * FROM tests_library WHERE id = ?').get(req.params.id);
    if (!test) return res.status(404).json({ error: 'Teste não encontrado' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create test
app.post('/api/tests', (req, res) => {
  try {
    const { name, description, category, instructions } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const stmt = db.prepare(`
      INSERT INTO tests_library (name, description, category, instructions)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, description || null, category || 'Outro', instructions || null);
    const test = db.prepare('SELECT * FROM tests_library WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update test
app.put('/api/tests/:id', (req, res) => {
  try {
    const { name, description, category, instructions } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const stmt = db.prepare(`
      UPDATE tests_library SET name=?, description=?, category=?, instructions=?
      WHERE id=?
    `);
    const result = stmt.run(name, description || null, category || 'Outro', instructions || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Teste não encontrado' });
    const test = db.prepare('SELECT * FROM tests_library WHERE id = ?').get(req.params.id);
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE test
app.delete('/api/tests/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tests_library WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Teste não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXAMS API ====================

// GET all exams
app.get('/api/exams', (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT e.*, p.name as patient_name
      FROM exams e
      JOIN patients p ON e.patient_id = p.id
      ORDER BY e.date DESC, e.created_at DESC
    `).all();

    // Attach tests to each exam
    const examTests = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.exam_id = ?
    `);

    const examsWithTests = exams.map(exam => ({
      ...exam,
      tests: examTests.all(exam.id)
    }));

    res.json(examsWithTests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exam with tests
app.get('/api/exams/:id', (req, res) => {
  try {
    const exam = db.prepare(`
      SELECT e.*, p.name as patient_name
      FROM exams e
      JOIN patients p ON e.patient_id = p.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Avaliação não encontrada' });

    const tests = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category, tl.description, tl.instructions
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.exam_id = ?
    `).all(req.params.id);

    res.json({ ...exam, tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exam
app.post('/api/exams', (req, res) => {
  try {
    const { patient_id, date, notes, tests } = req.body;
    if (!patient_id || !date) {
      return res.status(400).json({ error: 'Paciente e data são obrigatórios' });
    }

    const insertExam = db.prepare(`
      INSERT INTO exams (patient_id, date, notes)
      VALUES (?, ?, ?)
    `);
    const examResult = insertExam.run(patient_id, date, notes || null);
    const examId = examResult.lastInsertRowid;

    // Insert exam tests if provided
    if (tests && tests.length > 0) {
      const insertExamTest = db.prepare(`
        INSERT INTO exam_tests (exam_id, test_id, result, observations)
        VALUES (?, ?, ?, ?)
      `);
      for (const t of tests) {
        insertExamTest.run(examId, t.test_id, t.result || null, t.observations || null);
      }
    }

    const exam = db.prepare(`
      SELECT e.*, p.name as patient_name
      FROM exams e
      JOIN patients p ON e.patient_id = p.id
      WHERE e.id = ?
    `).get(examId);

    const examTests = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.exam_id = ?
    `).all(examId);

    res.status(201).json({ ...exam, tests: examTests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update exam
app.put('/api/exams/:id', (req, res) => {
  try {
    const { patient_id, date, notes } = req.body;
    if (!patient_id || !date) {
      return res.status(400).json({ error: 'Paciente e data são obrigatórios' });
    }
    const stmt = db.prepare(`
      UPDATE exams SET patient_id=?, date=?, notes=?
      WHERE id=?
    `);
    const result = stmt.run(patient_id, date, notes || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Avaliação não encontrada' });

    const exam = db.prepare(`
      SELECT e.*, p.name as patient_name
      FROM exams e
      JOIN patients p ON e.patient_id = p.id
      WHERE e.id = ?
    `).get(req.params.id);

    const tests = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.exam_id = ?
    `).all(req.params.id);

    res.json({ ...exam, tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam
app.delete('/api/exams/:id', (req, res) => {
  try {
    // Delete associated exam_tests first
    db.prepare('DELETE FROM exam_tests WHERE exam_id = ?').run(req.params.id);
    const result = db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Avaliação não encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXAM TESTS API ====================

// GET exam tests by exam_id
app.get('/api/exam-tests/:exam_id', (req, res) => {
  try {
    const tests = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category, tl.description, tl.instructions
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.exam_id = ?
    `).all(req.params.exam_id);
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add test to exam
app.post('/api/exam-tests', (req, res) => {
  try {
    const { exam_id, test_id, result, observations } = req.body;
    if (!exam_id || !test_id) {
      return res.status(400).json({ error: 'exam_id e test_id são obrigatórios' });
    }
    const stmt = db.prepare(`
      INSERT INTO exam_tests (exam_id, test_id, result, observations)
      VALUES (?, ?, ?, ?)
    `);
    const ins = stmt.run(exam_id, test_id, result || null, observations || null);
    const examTest = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.id = ?
    `).get(ins.lastInsertRowid);
    res.status(201).json(examTest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update exam test
app.put('/api/exam-tests/:id', (req, res) => {
  try {
    const { result, observations } = req.body;
    const stmt = db.prepare(`
      UPDATE exam_tests SET result=?, observations=?
      WHERE id=?
    `);
    const upd = stmt.run(result || null, observations || null, req.params.id);
    if (upd.changes === 0) return res.status(404).json({ error: 'Registo não encontrado' });
    const examTest = db.prepare(`
      SELECT et.*, tl.name as test_name, tl.category
      FROM exam_tests et
      JOIN tests_library tl ON et.test_id = tl.id
      WHERE et.id = ?
    `).get(req.params.id);
    res.json(examTest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam test
app.delete('/api/exam-tests/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM exam_tests WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Registo não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD API ====================

app.get('/api/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const todayAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE date = ?').get(today).count;
    const totalExams = db.prepare('SELECT COUNT(*) as count FROM exams').get().count;
    const totalTests = db.prepare('SELECT COUNT(*) as count FROM tests_library').get().count;

    const todayAppointmentsList = db.prepare(`
      SELECT a.*, p.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.date = ?
      ORDER BY a.time
    `).all(today);

    res.json({
      totalPatients,
      todayAppointments,
      totalExams,
      totalTests,
      todayAppointmentsList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Fisioterapia rodando em http://0.0.0.0:${PORT}`);
  console.log(`Base de dados em: ${dbPath}`);
});
