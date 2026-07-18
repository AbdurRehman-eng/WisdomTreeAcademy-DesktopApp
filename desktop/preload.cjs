const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (username, password) => ipcRenderer.invoke('db:login', username, password),
  getCurrentUser: () => ipcRenderer.invoke('db:get-current-user'),
  changePassword: (username, currentPassword, newPassword) => ipcRenderer.invoke('db:change-password', username, currentPassword, newPassword),
  
  // Students
  getStudents: () => ipcRenderer.invoke('db:get-students'),
  saveStudent: (student) => ipcRenderer.invoke('db:save-student', student),
  deleteStudent: (id) => ipcRenderer.invoke('db:delete-student', id),
  
  // Teachers / Admins
  getTeachers: () => ipcRenderer.invoke('db:get-teachers'),
  saveTeacher: (teacher) => ipcRenderer.invoke('db:save-teacher', teacher),
  deleteTeacher: (id, currentUserId) => ipcRenderer.invoke('db:delete-teacher', id, currentUserId),
  
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
  deleteQuestion: (id, currentUserId, currentUserRole) => ipcRenderer.invoke('db:delete-question', id, currentUserId, currentUserRole),
  importQuestions: (questions, currentUserId) => ipcRenderer.invoke('db:import-questions', questions, currentUserId),
  approveQuestion: (id, currentUserId) => ipcRenderer.invoke('db:approve-question', id, currentUserId),
  archiveQuestion: (id, currentUserId) => ipcRenderer.invoke('db:archive-question', id, currentUserId),
  getQuestionVersions: (questionId) => ipcRenderer.invoke('db:get-question-versions', questionId),
  getAuditLogs: () => ipcRenderer.invoke('db:get-audit-logs'),
  getSchoolLogo: () => ipcRenderer.invoke('db:get-school-logo'),
  saveSchoolLogo: (base64) => ipcRenderer.invoke('db:save-school-logo', base64),

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
  triggerSync: (options) => ipcRenderer.invoke('sync:trigger', options),
  toggleOnline: () => ipcRenderer.invoke('sync:toggle-online'),
  setSyncConfig: (projectUrl, apiKey) => ipcRenderer.invoke('sync:set-config', projectUrl, apiKey),
  getSyncConfig: () => ipcRenderer.invoke('sync:get-config'),
  getDashboardData: () => ipcRenderer.invoke('db:get-dashboard-data'),

  // Images
  selectImage: () => ipcRenderer.invoke('image:select'),

  // Backup & Export
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  exportQuestions: () => ipcRenderer.invoke('db:export-questions'),
  exportResults: () => ipcRenderer.invoke('db:export-results'),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close')
});
