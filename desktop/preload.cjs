const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (username, password) => ipcRenderer.invoke('db:login', username, password),
  getCurrentUser: () => ipcRenderer.invoke('db:get-current-user'),
  
  // Students
  getStudents: () => ipcRenderer.invoke('db:get-students'),
  saveStudent: (student) => ipcRenderer.invoke('db:save-student', student),
  deleteStudent: (id) => ipcRenderer.invoke('db:delete-student', id),
  
  // Teachers / Admins
  getTeachers: () => ipcRenderer.invoke('db:get-teachers'),
  saveTeacher: (teacher) => ipcRenderer.invoke('db:save-teacher', teacher),
  deleteTeacher: (id) => ipcRenderer.invoke('db:delete-teacher', id),
  
  // Classes / Subjects
  getClasses: () => ipcRenderer.invoke('db:get-classes'),
  saveClass: (cls) => ipcRenderer.invoke('db:save-class', cls),
  deleteClass: (id) => ipcRenderer.invoke('db:delete-class', id),
  
  // Subjects
  getSubjects: () => ipcRenderer.invoke('db:get-subjects'),
  saveSubject: (subject) => ipcRenderer.invoke('db:save-subject', subject),
  deleteSubject: (id) => ipcRenderer.invoke('db:delete-subject', id),

  // Question Bank
  getQuestions: () => ipcRenderer.invoke('db:get-questions'),
  saveQuestion: (question) => ipcRenderer.invoke('db:save-question', question),
  deleteQuestion: (id) => ipcRenderer.invoke('db:delete-question', id),
  importQuestions: (questions) => ipcRenderer.invoke('db:import-questions', questions),

  // Attendance
  getAttendance: (date, type) => ipcRenderer.invoke('db:get-attendance', date, type),
  saveAttendance: (records) => ipcRenderer.invoke('db:save-attendance', records),

  // Assessments
  getAssessments: () => ipcRenderer.invoke('db:get-assessments'),
  saveAssessmentResult: (result) => ipcRenderer.invoke('db:save-assessment-result', result),

  // Licensing
  validateLicense: (key) => ipcRenderer.invoke('license:validate', key),
  getLicenseInfo: () => ipcRenderer.invoke('license:get-info'),

  // Sync
  getSyncInfo: () => ipcRenderer.invoke('sync:get-info'),
  triggerSync: () => ipcRenderer.invoke('sync:trigger'),
  toggleOnline: () => ipcRenderer.invoke('sync:toggle-online'),
  setSyncConfig: (projectUrl, apiKey) => ipcRenderer.invoke('sync:set-config', projectUrl, apiKey),
  getSyncConfig: () => ipcRenderer.invoke('sync:get-config'),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close')
});
