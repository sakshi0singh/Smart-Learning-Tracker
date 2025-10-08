
// SMART LEARNING TRACKER - MAIN JAVASCRIPT

// Global state management
let subjects = [];
let currentEditId = null;
let activeTimers = {};

// DOM element references
const elements = {
  subjectInput: document.getElementById("subjectInput"),
  addBtn: document.getElementById("addBtn"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  filterSelect: document.getElementById("filterSelect"),
  subjectBoard: document.getElementById("subjectBoard"),
  emptyState: document.getElementById("emptyState"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearBtn: document.getElementById("clearBtn"),
  editModal: document.getElementById("editModal"),
  modalClose: document.getElementById("modalClose"),
  editSubjectName: document.getElementById("editSubjectName"),
  editProgress: document.getElementById("editProgress"),
  editNotes: document.getElementById("editNotes"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  totalSubjects: document.getElementById("totalSubjects"),
  avgProgress: document.getElementById("avgProgress"),
  totalTime: document.getElementById("totalTime"),
  completedSubjects: document.getElementById("completedSubjects"),
};

// INITIALIZATION

/**
 * Initialize the application on page load
 */
function init() {
  loadFromLocalStorage();
  renderBoard();
  updateDashboard();
  attachEventListeners();
  console.log("Smart Learning Tracker initialized");
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Add subject
  elements.addBtn.addEventListener("click", handleAddSubject);
  elements.subjectInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddSubject();
  });

  // Search and filter
  elements.searchInput.addEventListener("input", renderBoard);
  elements.sortSelect.addEventListener("change", renderBoard);
  elements.filterSelect.addEventListener("change", renderBoard);

  // Modal controls
  elements.modalClose.addEventListener("click", closeModal);
  elements.cancelEditBtn.addEventListener("click", closeModal);
  elements.saveEditBtn.addEventListener("click", saveEdit);

  // Data management
  elements.exportBtn.addEventListener("click", exportData);
  elements.importBtn.addEventListener("click", () =>
    elements.importFile.click()
  );
  elements.importFile.addEventListener("change", importData);
  elements.clearBtn.addEventListener("click", clearAllData);

  // Close modal on outside click
  elements.editModal.addEventListener("click", (e) => {
    if (e.target === elements.editModal) closeModal();
  });
}

// SUBJECT MANAGEMENT (CRUD OPERATIONS)

/**
 * Add a new subject
 */
function addSubject(name) {
  if (!name || name.trim() === "") {
    alert("Please enter a subject name");
    return;
  }

  const newSubject = {
    id: generateId(),
    name: name.trim(),
    progress: 0,
    totalTime: 0, // in minutes
    notes: "",
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  subjects.push(newSubject);
  saveToLocalStorage();
  renderBoard();
  updateDashboard();

  // Clear input
  elements.subjectInput.value = "";

  console.log("Subject added:", newSubject);
}

/**
 * Handle add subject button click
 */
function handleAddSubject() {
  const name = elements.subjectInput.value;
  addSubject(name);
}

/**
 * Delete a subject by ID
 */
function deleteSubject(id) {
  if (!confirm("Are you sure you want to delete this subject?")) {
    return;
  }

  // Stop timer if running
  if (activeTimers[id]) {
    stopTimer(id);
  }

  subjects = subjects.filter((subject) => subject.id !== id);
  saveToLocalStorage();
  renderBoard();
  updateDashboard();

  console.log("Subject deleted:", id);
}

/**
 * Open edit modal for a subject
 */
function editSubject(id) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  currentEditId = id;
  elements.editSubjectName.value = subject.name;
  elements.editProgress.value = subject.progress;
  elements.editNotes.value = subject.notes;

  elements.editModal.classList.add("show");
}

/**
 * Save edited subject data
 */
function saveEdit() {
  if (!currentEditId) return;

  const subject = subjects.find((s) => s.id === currentEditId);
  if (!subject) return;

  const newName = elements.editSubjectName.value.trim();
  const newProgress = parseInt(elements.editProgress.value);
  const newNotes = elements.editNotes.value;

  if (!newName) {
    alert("Subject name cannot be empty");
    return;
  }

  if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
    alert("Progress must be between 0 and 100");
    return;
  }

  subject.name = newName;
  subject.progress = newProgress;
  subject.notes = newNotes;
  subject.lastModified = new Date().toISOString();

  saveToLocalStorage();
  renderBoard();
  updateDashboard();
  closeModal();

  console.log("Subject updated:", subject);
}

/**
 * Close edit modal
 */
function closeModal() {
  elements.editModal.classList.remove("show");
  currentEditId = null;
}

/**
 * Update subject progress
 */
function updateProgress(id, value) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  subject.progress = Math.max(0, Math.min(100, value));
  subject.lastModified = new Date().toISOString();

  saveToLocalStorage();
  renderBoard();
  updateDashboard();
}

/**
 * Increment progress by amount
 */
function incrementProgress(id, amount) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  updateProgress(id, subject.progress + amount);
}

// TIME TRACKING

/**
 * Toggle timer for a subject
 */
function toggleTimer(id) {
  if (activeTimers[id]) {
    stopTimer(id);
  } else {
    startTimer(id);
  }
}

/**
 * Start timer for a subject
 */
function startTimer(id) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  // Stop any other running timers
  Object.keys(activeTimers).forEach((timerId) => {
    if (timerId !== id) stopTimer(timerId);
  });

  activeTimers[id] = {
    startTime: Date.now(),
    interval: setInterval(() => {
      updateTimerDisplay(id);
    }, 1000),
  };

  renderBoard();
  console.log("Timer started for:", subject.name);
}

/**
 * Stop timer for a subject
 */
function stopTimer(id) {
  if (!activeTimers[id]) return;

  const timer = activeTimers[id];
  const elapsed = Math.floor((Date.now() - timer.startTime) / 1000 / 60); // minutes

  clearInterval(timer.interval);
  delete activeTimers[id];

  const subject = subjects.find((s) => s.id === id);
  if (subject) {
    subject.totalTime += elapsed;
    subject.lastModified = new Date().toISOString();
    saveToLocalStorage();
    updateDashboard();
  }

  renderBoard();
  console.log(
    "Timer stopped for:",
    subject?.name,
    "Time added:",
    elapsed,
    "minutes"
  );
}

/**
 * Update timer display in real-time
 */
function updateTimerDisplay(id) {
  const timer = activeTimers[id];
  if (!timer) return;

  const elapsed = Math.floor((Date.now() - timer.startTime) / 1000 / 60);
  const timeDisplay = document.querySelector(`[data-timer-id="${id}"]`);

  if (timeDisplay) {
    const subject = subjects.find((s) => s.id === id);
    const totalMinutes = subject.totalTime + elapsed;
    timeDisplay.textContent = formatTime(totalMinutes);
  }
}

/**
 * Format minutes to hours and minutes
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// NOTES MANAGEMENT

/**
 * Update notes for a subject (auto-save)
 */
function updateNotes(id, notes) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  subject.notes = notes;
  subject.lastModified = new Date().toISOString();

  // Debounced save
  clearTimeout(subject.notesSaveTimeout);
  subject.notesSaveTimeout = setTimeout(() => {
    saveToLocalStorage();
    console.log("Notes auto-saved for:", subject.name);
  }, 1000);
}

// RENDERING

/**
 * Main render function - rebuilds the subject board
 */
function renderBoard() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const sortBy = elements.sortSelect.value;
  const filterBy = elements.filterSelect.value;

  // Filter subjects
  let filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm);

    let matchesFilter = true;
    if (filterBy === "completed") matchesFilter = subject.progress === 100;
    else if (filterBy === "inProgress")
      matchesFilter = subject.progress > 0 && subject.progress < 100;
    else if (filterBy === "notStarted") matchesFilter = subject.progress === 0;

    return matchesSearch && matchesFilter;
  });

  // Sort subjects
  filteredSubjects.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "progress":
        return b.progress - a.progress;
      case "time":
        return b.totalTime - a.totalTime;
      case "recent":
      default:
        return new Date(b.lastModified) - new Date(a.lastModified);
    }
  });

  // Show/hide empty state
  if (filteredSubjects.length === 0) {
    elements.emptyState.classList.add("show");
    elements.subjectBoard.innerHTML = "";
    return;
  } else {
    elements.emptyState.classList.remove("show");
  }

  // Render subjects
  elements.subjectBoard.innerHTML = filteredSubjects
    .map((subject) => createSubjectCard(subject))
    .join("");

  // Attach event listeners to new elements
  attachCardEventListeners();
}

/**
 * Create HTML for a subject card
 */
function createSubjectCard(subject) {
  const isTimerActive = !!activeTimers[subject.id];
  const statusClass = getStatusClass(subject.progress);
  const statusText = getStatusText(subject.progress);

  return `
        <div class="subject-card" data-id="${subject.id}">
            <div class="subject-header">
                <h3 class="subject-name">${escapeHtml(subject.name)}</h3>
                <div class="subject-actions">
                    <button class="btn-secondary btn-small edit-btn" data-id="${
                      subject.id
                    }">✏️ Edit</button>
                    <button class="btn-danger btn-small delete-btn" data-id="${
                      subject.id
                    }">🗑️</button>
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${subject.progress}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${
                      subject.progress
                    }%"></div>
                </div>
                <div class="progress-controls">
                    <button class="btn-secondary btn-small progress-btn" data-id="${
                      subject.id
                    }" data-change="-10">-10%</button>
                    <button class="btn-secondary btn-small progress-btn" data-id="${
                      subject.id
                    }" data-change="+10">+10%</button>
                    <button class="btn-success btn-small progress-btn" data-id="${
                      subject.id
                    }" data-change="complete">Complete</button>
                </div>
            </div>

            <div class="time-section">
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 4px;">Time Spent</div>
                    <div class="time-display ${
                      isTimerActive ? "timer-active" : ""
                    }" data-timer-id="${subject.id}">
                        ${formatTime(subject.totalTime)}
                    </div>
                </div>
                <button class="btn-${
                  isTimerActive ? "danger" : "primary"
                } btn-small timer-btn" data-id="${subject.id}">
                    ${isTimerActive ? "⏸️ Stop" : "▶️ Start"}
                </button>
            </div>

            <div class="notes-section">
                <textarea 
                    class="notes-input" 
                    data-id="${subject.id}" 
                    placeholder="Add notes about your learning..."
                    rows="3"
                >${escapeHtml(subject.notes)}</textarea>
            </div>

            <div class="subject-meta">
                <span class="status-badge status-${statusClass}">${statusText}</span>
                <span>Modified: ${formatDate(subject.lastModified)}</span>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners to card elements
 */
function attachCardEventListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      editSubject(id);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      deleteSubject(id);
    });
  });

  // Progress buttons
  document.querySelectorAll(".progress-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const change = e.target.dataset.change;

      if (change === "complete") {
        updateProgress(id, 100);
      } else {
        incrementProgress(id, parseInt(change));
      }
    });
  });

  // Timer buttons
  document.querySelectorAll(".timer-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      toggleTimer(id);
    });
  });

  // Notes inputs
  document.querySelectorAll(".notes-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const id = e.target.dataset.id;
      updateNotes(id, e.target.value);
    });
  });
}

/**
 * Get status class based on progress
 */
function getStatusClass(progress) {
  if (progress === 0) return "not-started";
  if (progress === 100) return "completed";
  return "in-progress";
}

/**
 * Get status text based on progress
 */
function getStatusText(progress) {
  if (progress === 0) return "Not Started";
  if (progress === 100) return "Completed";
  return "In Progress";
}

// DASHBOARD STATISTICS

/**
 * Update dashboard statistics
 */
function updateDashboard() {
  const total = subjects.length;
  const completed = subjects.filter((s) => s.progress === 100).length;
  const avgProgress =
    total > 0
      ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / total)
      : 0;
  const totalMinutes = subjects.reduce((sum, s) => s.totalTime, 0);

  elements.totalSubjects.textContent = total;
  elements.completedSubjects.textContent = completed;
  elements.avgProgress.textContent = `${avgProgress}%`;
  elements.totalTime.textContent = formatTime(totalMinutes);
}

// LOCAL STORAGE MANAGEMENT

/**
 * Save subjects to localStorage
 */
function saveToLocalStorage() {
  try {
    const data = {
      subjects: subjects,
      version: "1.0",
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("smartLearningTracker", JSON.stringify(data));
    console.log("Data saved to localStorage");
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    alert("Failed to save data. Your browser may have storage disabled.");
  }
}

/**
 * Load subjects from localStorage
 */
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem("smartLearningTracker");
    if (stored) {
      const data = JSON.parse(stored);
      subjects = data.subjects || [];
      console.log(
        "Data loaded from localStorage:",
        subjects.length,
        "subjects"
      );
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    subjects = [];
  }
}

// DATA IMPORT/EXPORT

/**
 * Export data as JSON file
 */
function exportData() {
  if (subjects.length === 0) {
    alert("No data to export");
    return;
  }

  const data = {
    subjects: subjects,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `learning-tracker-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("Data exported");
}

/**
 * Import data from JSON file
 */
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error("Invalid data format");
      }

      if (subjects.length > 0) {
        if (!confirm("This will replace your current data. Continue?")) {
          return;
        }
      }

      subjects = data.subjects;
      saveToLocalStorage();
      renderBoard();
      updateDashboard();

      alert(`Successfully imported ${subjects.length} subjects`);
      console.log("Data imported:", subjects.length, "subjects");
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import data. Invalid file format.");
    }
  };

  reader.readAsText(file);
  event.target.value = ""; // Reset file input
}

/**
 * Clear all data
 */
function clearAllData() {
  if (
    !confirm(
      "Are you sure you want to delete ALL subjects? This cannot be undone!"
    )
  ) {
    return;
  }

  if (
    !confirm(
      "Last chance! This will permanently delete all your learning data."
    )
  ) {
    return;
  }

  // Stop all timers
  Object.keys(activeTimers).forEach((id) => stopTimer(id));

  subjects = [];
  saveToLocalStorage();
  renderBoard();
  updateDashboard();

  console.log("All data cleared");
}

// UTILITY FUNCTIONS

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format date to readable string
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// KEYBOARD SHORTCUTS

document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + K: Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    elements.searchInput.focus();
  }

  // Ctrl/Cmd + N: Focus add subject input
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    elements.subjectInput.focus();
  }

  // Escape: Close modal
  if (e.key === "Escape") {
    closeModal();
  }
});

// AUTO-SAVE TIMERS ON PAGE UNLOAD

window.addEventListener("beforeunload", () => {
  // Save any active timer progress before leaving
  Object.keys(activeTimers).forEach((id) => {
    stopTimer(id);
  });
});

// START APPLICATION

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Log helpful info to console
console.log(
  "%c🧠 Smart Learning Tracker",
  "font-size: 20px; font-weight: bold; color: #4f46e5;"
);
console.log("%cKeyboard Shortcuts:", "font-weight: bold;");
console.log("Ctrl/Cmd + K: Focus search");
console.log("Ctrl/Cmd + N: Add new subject");
console.log("Escape: Close modal");
