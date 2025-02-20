// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmjWit0GIVgswsUWK3mBjLPOUk8Y9sS30",
  authDomain: "nammadha-de413.firebaseapp.com",
  projectId: "nammadha-de413",
  storageBucket: "nammadha-de413.firebasestorage.app",
  messagingSenderId: "480779718897",
  appId: "1:480779718897:web:28d81a6063939207911950",
  measurementId: "G-53LVV9BF18"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const profileSelector = document.getElementById("profile");
const darkModeSwitch = document.getElementById("dark-mode-switch");

// Overview elements
const totalSolvedElem = document.getElementById("total-solved");
const averageSolvedDisplayElem = document.getElementById("average-solved-display");
const weeklySolvedElem = document.getElementById("weekly-solved");
const overallProgressBar = document.getElementById("overall-progress-bar");
const progressPercentage = document.getElementById("progress-percentage");
const overallProgressNumbers = document.getElementById("overall-progress-numbers");
const currentStreakElem = document.getElementById("current-streak");
const highestStreakElem = document.getElementById("highest-streak");

// Problems section
const problemsList = document.getElementById("problems-list");

// Detailed Analysis elements
const detailedTotalSolvedElem = document.getElementById("detailed-total-solved");
const detailedAverageSolvedElem = document.getElementById("detailed-average-solved");
const averageSolvedChartDetailedCtx =
  document.getElementById("average-solved-chart-detailed")?.getContext("2d");
const solvesOverTimeChartCtx =
  document.getElementById("solves-over-time-chart")?.getContext("2d");
const difficultyDistributionChartCtx =
  document.getElementById("difficulty-distribution-chart")?.getContext("2d");
const topicWiseGrid = document.getElementById("topic-wise-grid");

// Date Range Filter Elements (Detailed Tab)
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const applyDateFilterBtn = document.getElementById("apply-date-filter");
const resetDateFilterBtn = document.getElementById("reset-date-filter");

// Tabs
const tabButtons = document.querySelectorAll(".nav-link");
const tabContents = document.querySelectorAll(".tab-content");

// UI
const loadingSpinner = document.getElementById("loading-spinner");
const syncButton = document.getElementById("sync-button");
const progressAnnouncer = document.getElementById("progress-announcer");

// Calendar
const calendarContainer = document.getElementById("calendar-container");
const dayModal = document.getElementById("day-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalDateElem = document.getElementById("modal-date");
const problemsCountElem = document.getElementById("problems-count");
const problemsBody = document.getElementById("problems-body");

// Quotes
const quoteTextElem = document.getElementById("quote-text");
const quoteAuthorElem = document.getElementById("quote-author");
const refreshQuoteButton = document.getElementById("refresh-quote");

// State Variables
let currentProfile = "Mano";
let problemsData = {};
let allSolvedDates = [];
let totalProblemsCount = 0;
let averageSolvedChartDetailedRef = null;
let solvesOverTimeChartRef = null;
let difficultyDistributionChartRef = null;
let topicSolvedCounts = {};
let topicDifficultyCounts = {};
let quotes = [];

// Date filter state
let currentStartDate = null;
let currentEndDate = null;

// ----------------- Dark Mode Toggle -----------------
darkModeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", darkModeSwitch.checked);
});

// ----------------- Profile-based Endpoints -----------------
function getProfileEndpoint(profile) {
  switch (profile) {
    case "Ananth":
      return "https://alfa-leetcode-api.onrender.com/20epci004/acSubmission";
    case "deva":
      return "https://alfa-leetcode-api.onrender.com/qR2Ni1CLa4/acSubmission";
    case "Mano":
      return "https://alfa-leetcode-api.onrender.com/manoharannagarajan/acSubmission";
    case "revanth":
      return "https://alfa-leetcode-api.onrender.com/Revanth2002/acSubmission";
    case "murali":
      return "https://alfa-leetcode-api.onrender.com/Muralidaran/acSubmission";
    case "vishan":
      return "https://alfa-leetcode-api.onrender.com/vishan/acSubmission";
    default:
      return "";
  }
}

// ----------------- Utility Functions -----------------
function showLoading(show) {
  if (!loadingSpinner) return;
  loadingSpinner.style.display = show ? "flex" : "none";
}

function updateProgressBar(element, percentage) {
  if (!element) return;
  element.style.width = percentage + "%";
}

function calculateAverageSolvedPerDay(totalSolved) {
  if (!allSolvedDates.length || totalSolved === 0) {
    return 0;
  }
  let earliest = allSolvedDates.reduce((acc, date) => (date < acc ? date : acc));
  let now = new Date();
  let diffInDays = Math.floor((now - earliest) / (1000 * 60 * 60 * 24)) + 1;
  return totalSolved / diffInDays;
}

function calculateWeeklySolved() {
  const now = new Date();
  let count = 0;
  allSolvedDates.forEach((d) => {
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff <= 7 && diff >= 0) count++;
  });
  return count;
}

function renderAverageSolvedChartDetailed(avg) {
  if (averageSolvedChartDetailedRef) {
    averageSolvedChartDetailedRef.destroy();
    averageSolvedChartDetailedRef = null;
  }
  if (!averageSolvedChartDetailedCtx) return;

  averageSolvedChartDetailedRef = new Chart(averageSolvedChartDetailedCtx, {
    type: "bar",
    data: {
      labels: ["Avg / Day"],
      datasets: [
        {
          label: "Average",
          data: [avg],
          backgroundColor: "#3498db",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: true },
        y: {
          beginAtZero: true,
          stepSize: 1,
          title: { display: true, text: "Problems Solved" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#3498db",
          titleColor: "#fff",
          bodyColor: "#fff",
        },
      },
    },
  });
}

function calculateStreaks(dates) {
  const sorted = [...dates].sort((a, b) => a - b);
  if (!sorted.length) return { currentStreak: 0, highestStreak: 0 };
  let currentStreak = 1;
  let highestStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentStreak++;
      highestStreak = Math.max(highestStreak, currentStreak);
    } else if (diff > 1) {
      currentStreak = 1;
    }
  }
  return { currentStreak, highestStreak };
}

// ----------------- Real-Time Overview Subscription -----------------
let unsubscribeOverview = null;
function subscribeToOverviewUpdates() {
  if (unsubscribeOverview) unsubscribeOverview();
  const userRef = collection(db, "users", currentProfile, "problems");
  const q = query(userRef, where("completed", "==", true));
  unsubscribeOverview = onSnapshot(q, (snapshot) => {
    const totalSolved = snapshot.size;
    totalSolvedElem.textContent = totalSolved;
    allSolvedDates = [];
    snapshot.forEach((ds) => {
      const data = ds.data();
      if (data.solvedAt && data.solvedAt.toDate)
        allSolvedDates.push(data.solvedAt.toDate());
    });
    const avg = calculateAverageSolvedPerDay(totalSolved);
    averageSolvedDisplayElem.textContent = avg.toFixed(2);
    weeklySolvedElem.textContent = calculateWeeklySolved();
    const pct = totalProblemsCount
      ? Math.min((totalSolved / totalProblemsCount) * 100, 100)
      : 0;
    updateProgressBar(overallProgressBar, pct);
    overallProgressNumbers.textContent = `${totalSolved}/${totalProblemsCount}`;
    progressPercentage.textContent = `${pct.toFixed(1)}%`;
    overallProgressBar.setAttribute("aria-valuenow", pct.toFixed(1));
    const { currentStreak, highestStreak } = calculateStreaks(allSolvedDates);
    currentStreakElem.textContent = currentStreak;
    highestStreakElem.textContent = highestStreak;
    updateRanking();
  });
}

// ----------------- Event Listeners -----------------
profileSelector.addEventListener("change", async () => {
  currentProfile = profileSelector.value;
  await loadProblems();
  subscribeToOverviewUpdates();
  await updateDetailedAnalysis();
  renderCalendar();
  updateRanking();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    tabContents.forEach((content) => content.classList.remove("active"));
    const selectedTab = document.getElementById(button.dataset.tab);
    if (selectedTab) selectedTab.classList.add("active");
  });
});

syncButton.addEventListener("click", () => {
  if (confirm("Synchronize your local problems with external API?")) {
    syncSubmittedProblems();
  }
});

refreshQuoteButton.addEventListener("click", () => displayRandomQuote());
closeModalBtn.addEventListener("click", () => {
  dayModal.style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target === dayModal) dayModal.style.display = "none";
});

// Date Filter Listeners
applyDateFilterBtn.addEventListener("click", () => {
  currentStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
  currentEndDate = endDateInput.value ? new Date(endDateInput.value) : null;
  renderSolvesOverTimeChart();
});
resetDateFilterBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  currentStartDate = null;
  currentEndDate = null;
  renderSolvesOverTimeChart();
});

// ----------------- On DOM Load -----------------
document.addEventListener("DOMContentLoaded", async () => {
  await initializeQuotes();
  await loadProblems();
  subscribeToOverviewUpdates();
  await updateDetailedAnalysis();
  renderCalendar();
  updateRanking();
});

// ----------------- Load Problems -----------------
async function loadProblems() {
  try {
    showLoading(true);
    const resp = await fetch("problems.json");
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    problemsData = await resp.json();
    countTotalProblems();
    await computeTopicStats();
    renderOverviewTopics();
  } catch (e) {
    console.error("Problem loading:", e);
    problemsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load problems. Please try again later.
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function countTotalProblems() {
  let count = 0;
  if (problemsData.topics && Array.isArray(problemsData.topics)) {
    problemsData.topics.forEach((t) => {
      if (Array.isArray(t.problems)) count += t.problems.length;
    });
  }
  totalProblemsCount = count;
}

async function computeTopicStats() {
  topicSolvedCounts = {};
  topicDifficultyCounts = {};
  if (!problemsData.topics) return;
  problemsData.topics.forEach((topic) => {
    topicSolvedCounts[topic.name] = 0;
    topicDifficultyCounts[topic.name] = { Easy: 0, Medium: 0, Hard: 0 };
  });
  const userRef = collection(db, "users", currentProfile, "problems");
  const q = query(userRef, where("completed", "==", true));
  const snap = await getDocs(q);
  snap.forEach((ds) => {
    const data = ds.data();
    const tName = data.topic;
    if (tName && topicSolvedCounts[tName] !== undefined) {
      topicSolvedCounts[tName]++;
      if (data.difficulty && topicDifficultyCounts[tName][data.difficulty] !== undefined)
        topicDifficultyCounts[tName][data.difficulty]++;
    }
  });
}

function renderOverviewTopics() {
  if (!problemsData.topics || !Array.isArray(problemsData.topics)) {
    problemsList.innerHTML = "<p>No valid topics found.</p>";
    return;
  }
  problemsList.innerHTML = "";
  problemsData.topics.forEach((topic) => {
    const topicDiv = document.createElement("div");
    topicDiv.classList.add("topic");
    const total = Array.isArray(topic.problems) ? topic.problems.length : 0;
    const solved = topicSolvedCounts[topic.name] || 0;
    const pct = total === 0 ? 0 : ((solved / total) * 100).toFixed(1);
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("topic-header");
    const h2 = document.createElement("h2");
    h2.textContent = topic.name;
    const progressWrapper = document.createElement("div");
    progressWrapper.classList.add("progress-wrapper");
    const subContainer = document.createElement("div");
    subContainer.classList.add("progress-bar-container");
    const subBar = document.createElement("div");
    subBar.classList.add("progress-bar-fill");
    subBar.style.width = `${pct}%`;
    subContainer.appendChild(subBar);
    const labelSpan = document.createElement("span");
    labelSpan.style.fontSize = "0.9em";
    labelSpan.textContent = `${pct}% | ${solved}/${total}`;
    progressWrapper.appendChild(subContainer);
    progressWrapper.appendChild(labelSpan);
    const sortControls = document.createElement("div");
    sortControls.classList.add("sort-controls");
    sortControls.innerHTML = `
      <select class="sort-select" aria-label="Sort problems by difficulty">
        <option value="default">Sort by</option>
        <option value="difficulty-asc">Difficulty (Easy First)</option>
        <option value="difficulty-desc">Difficulty (Hard First)</option>
      </select>
    `;
    headerDiv.appendChild(h2);
    headerDiv.appendChild(progressWrapper);
    headerDiv.appendChild(sortControls);
    const tableWrapper = document.createElement("div");
    tableWrapper.style.display = "none";
    headerDiv.addEventListener("click", (e) => {
      if (e.target.closest(".sort-controls") || e.target.tagName === "SELECT") return;
      tableWrapper.style.display = tableWrapper.style.display === "none" ? "block" : "none";
    });
    topicDiv.appendChild(headerDiv);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Completed", "Title", "Difficulty", "Solved On", "Notes"].forEach((hText) => {
      const th = document.createElement("th");
      th.textContent = hText;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    if (Array.isArray(topic.problems)) {
      topic.problems.forEach((prob) => {
        const row = document.createElement("tr");
        const cTd = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        cTd.appendChild(checkbox);
        row.appendChild(cTd);
        const tTd = document.createElement("td");
        const link = document.createElement("a");
        link.href = prob.link;
        link.target = "_blank";
        link.textContent = prob.title;
        tTd.appendChild(link);
        row.appendChild(tTd);
        const dTd = document.createElement("td");
        dTd.textContent = prob.difficulty;
        const lower = prob.difficulty.toLowerCase();
        if (lower === "easy") dTd.classList.add("difficulty-easy");
        if (lower === "medium") dTd.classList.add("difficulty-medium");
        if (lower === "hard") dTd.classList.add("difficulty-hard");
        row.appendChild(dTd);
        const sTd = document.createElement("td");
        const sSpan = document.createElement("span");
        sSpan.textContent = "N/A";
        sTd.appendChild(sSpan);
        row.appendChild(sTd);
        const nTd = document.createElement("td");
        const nInput = document.createElement("input");
        nInput.type = "text";
        nInput.classList.add("notes-input");
        nInput.placeholder = "Add notes...";
        nTd.appendChild(nInput);
        row.appendChild(nTd);
        const docRef = doc(db, "users", currentProfile, "problems", prob.id.toString());
        getDoc(docRef)
          .then((ds) => {
            if (ds.exists()) {
              const data = ds.data();
              checkbox.checked = data.completed || false;
              if (data.notes) nInput.value = data.notes;
              if (data.solvedAt && data.solvedAt.toDate)
                sSpan.textContent = data.solvedAt.toDate().toLocaleDateString();
            }
          })
          .catch((e) =>
            console.error(`Error reading docRef for ${prob.title}:`, e)
          );
        checkbox.addEventListener("change", async () => {
          try {
            if (checkbox.checked) {
              const solvedDate = new Date();
              await setDoc(
                docRef,
                {
                  completed: true,
                  title: prob.title,
                  link: prob.link,
                  difficulty: prob.difficulty,
                  topic: topic.name,
                  solvedAt: Timestamp.fromDate(solvedDate),
                },
                { merge: true }
              );
              sSpan.textContent = solvedDate.toLocaleDateString();
            } else {
              await updateDoc(docRef, {
                completed: false,
                solvedAt: deleteField(),
                topic: deleteField(),
              });
              sSpan.textContent = "N/A";
            }
            await computeTopicStats();
            updateTopicProgress(topic.name);
            renderTopicWiseDetailedAnalysis();
            await updateDetailedAnalysis();
            renderCalendar();
            updateRanking();
          } catch (err) {
            console.error("Error:", err);
          }
        });
        nInput.addEventListener(
          "input",
          debounce(async () => {
            const val = nInput.value.trim();
            try {
              if (val) {
                await updateDoc(docRef, { notes: val });
              } else {
                await updateDoc(docRef, { notes: deleteField() });
              }
            } catch (er) {
              console.error("Error updating notes:", er);
            }
          })
        );
        tbody.appendChild(row);
      });
    }
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    topicDiv.appendChild(tableWrapper);
    problemsList.appendChild(topicDiv);
    sortControls.querySelector("select").addEventListener("change", (e) => {
      const sortOrder = e.target.value;
      const tableBody = tableWrapper.querySelector("tbody");
      const rows = Array.from(tableBody.querySelectorAll("tr"));
      const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
      rows.sort((a, b) => {
        const aDiff = a.querySelector("td:nth-child(3)").textContent;
        const bDiff = b.querySelector("td:nth-child(3)").textContent;
        if (sortOrder === "difficulty-asc") return difficultyOrder[aDiff] - difficultyOrder[bDiff];
        if (sortOrder === "difficulty-desc") return difficultyOrder[bDiff] - difficultyOrder[aDiff];
        return 0;
      });
      tableBody.innerHTML = "";
      rows.forEach((row) => tableBody.appendChild(row));
    });
  });
}

function updateTopicProgress(topicName) {
  const topics = document.querySelectorAll(".topic");
  topics.forEach((topicDiv) => {
    const header = topicDiv.querySelector(".topic-header h2");
    if (header.textContent === topicName) {
      const topicData = problemsData.topics.find((t) => t.name === topicName);
      const total = topicData?.problems?.length || 0;
      const solved = topicSolvedCounts[topicName] || 0;
      const pct = total > 0 ? (solved / total) * 100 : 0;
      const progressBar = topicDiv.querySelector(".progress-bar-fill");
      const progressText = topicDiv.querySelector(".progress-bar-container + span");
      progressBar.style.width = `${pct}%`;
      progressText.textContent = `${pct.toFixed(1)}% | ${solved}/${total}`;
    }
  });
}

async function updateDetailedAnalysis() {
  try {
    const userRef = collection(db, "users", currentProfile, "problems");
    const q = query(userRef, where("completed", "==", true));
    const snap = await getDocs(q);
    const totalSolved = snap.size;
    detailedTotalSolvedElem.textContent = totalSolved;
    allSolvedDates = [];
    snap.forEach((ds) => {
      const data = ds.data();
      if (data.solvedAt && data.solvedAt.toDate)
        allSolvedDates.push(data.solvedAt.toDate());
    });
    const avg = calculateAverageSolvedPerDay(totalSolved);
    detailedAverageSolvedElem.textContent = avg.toFixed(2);
    renderAverageSolvedChartDetailed(avg);
    renderSolvesOverTimeChart();
    renderDifficultyDistributionChart();
    await computeTopicStats();
    renderTopicWiseDetailedAnalysis();
  } catch (e) {
    console.error("Error updateDetailedAnalysis:", e);
  }
}

function renderSolvesOverTimeChart() {
  if (solvesOverTimeChartRef) {
    solvesOverTimeChartRef.destroy();
    solvesOverTimeChartRef = null;
  }
  if (!solvesOverTimeChartCtx) return;
  const solveCounts = {};
  allSolvedDates.forEach((date) => {
    if (currentStartDate && date < currentStartDate) return;
    if (currentEndDate && date > currentEndDate) return;
    const day = date.toISOString().split("T")[0];
    solveCounts[day] = (solveCounts[day] || 0) + 1;
  });
  const sortedDays = Object.keys(solveCounts).sort();
  const data = sortedDays.map((day) => solveCounts[day]);
  solvesOverTimeChartRef = new Chart(solvesOverTimeChartCtx, {
    type: "line",
    data: {
      labels: sortedDays,
      datasets: [
        {
          label: "Problems Solved",
          data: data,
          borderColor: "#1abc9c",
          backgroundColor: "rgba(26,188,156,0.2)",
          fill: true,
          tension: 0.3,
          pointBackgroundColor: "#1abc9c",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Date" },
          ticks: { maxRotation: 90, minRotation: 45 },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: "Problems Solved" },
          beginAtZero: true,
          precision: 0,
          grid: { color: "#f0f0f0" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1abc9c",
          titleColor: "#fff",
          bodyColor: "#fff",
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: "x",
          },
        },
      },
    },
  });
}

async function renderDifficultyDistributionChart() {
  if (difficultyDistributionChartRef) {
    difficultyDistributionChartRef.destroy();
    difficultyDistributionChartRef = null;
  }
  if (!difficultyDistributionChartCtx) return;
  try {
    const userRef = collection(db, "users", currentProfile, "problems");
    const q = query(userRef, where("completed", "==", true));
    const snap = await getDocs(q);
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    snap.forEach((ds) => {
      const data = ds.data();
      if (data.difficulty && difficultyCounts[data.difficulty] !== undefined)
        difficultyCounts[data.difficulty]++;
    });
    const labels = Object.keys(difficultyCounts);
    const chartData = Object.values(difficultyCounts);
    difficultyDistributionChartRef = new Chart(difficultyDistributionChartCtx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: chartData,
            backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            backgroundColor: "#34495e",
            titleColor: "#fff",
            bodyColor: "#fff",
          },
        },
      },
    });
  } catch (e) {
    console.error("Error in difficulty distribution chart:", e);
  }
}

function renderTopicWiseDetailedAnalysis() {
  if (!problemsData.topics || !topicWiseGrid) return;
  topicWiseGrid.innerHTML = "";
  problemsData.topics.forEach((topic) => {
    const total = Array.isArray(topic.problems) ? topic.problems.length : 0;
    const solved = topicSolvedCounts[topic.name] || 0;
    const mainPct = total === 0 ? 0 : ((solved / total) * 100).toFixed(1);
    const diffObj = topicDifficultyCounts[topic.name] || { Easy: 0, Medium: 0, Hard: 0 };
    const eCount = diffObj.Easy;
    const mCount = diffObj.Medium;
    const hCount = diffObj.Hard;
    const card = document.createElement("div");
    card.classList.add("accordion-card");
    const accordionHeader = document.createElement("div");
    accordionHeader.classList.add("accordion-header");
    const heading = document.createElement("h3");
    heading.textContent = topic.name;
    accordionHeader.appendChild(heading);
    const progressInfo = document.createElement("div");
    progressInfo.classList.add("topic-progress-info");
    progressInfo.innerHTML = `<span>${mainPct}% Completed</span>`;
    accordionHeader.appendChild(progressInfo);
    card.appendChild(accordionHeader);
    const accordionBody = document.createElement("div");
    accordionBody.classList.add("accordion-body");
    const extraStats = document.createElement("div");
    extraStats.classList.add("topic-extra-stats");
    const longestStreak = document.createElement("div");
    longestStreak.classList.add("stat-box");
    longestStreak.innerHTML = `<strong>Longest Streak:</strong> 0 Days`;
    const timeSpent = document.createElement("div");
    timeSpent.classList.add("stat-box");
    timeSpent.innerHTML = `<strong>Time Spent:</strong> 0 Hours`;
    extraStats.appendChild(longestStreak);
    extraStats.appendChild(timeSpent);
    accordionBody.appendChild(extraStats);
    const chartDiv = document.createElement("div");
    chartDiv.classList.add("topic-chart");
    const canvas = document.createElement("canvas");
    canvas.id = `topic-chart-${topic.name.replace(/\s+/g, "-")}`;
    chartDiv.appendChild(canvas);
    accordionBody.appendChild(chartDiv);
    card.appendChild(accordionBody);
    topicWiseGrid.appendChild(card);
    new Chart(canvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Easy", "Medium", "Hard"],
        datasets: [
          {
            data: [eCount, mCount, hCount],
            backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
    accordionHeader.addEventListener("click", () => {
      accordionBody.classList.toggle("open");
    });
  });
}

async function syncSubmittedProblems() {
  if (loadingSpinner?.style.display === "flex") {
    alert("Synchronization is already in progress. Please wait.");
    return;
  }
  showLoading(true);
  try {
    const url = getProfileEndpoint(currentProfile);
    if (!url) {
      alert("No API endpoint found for this profile!");
      return;
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API request failed, status ${resp.status}`);
    const data = await resp.json();
    if (!data || !Array.isArray(data.submission)) {
      alert('API data unexpected or no "submission" array found.');
      return;
    }
    const submittedTitles = data.submission.map((i) => i.title).filter(Boolean);
    if (!submittedTitles.length) {
      alert("No matching submissions found or empty data from API.");
      return;
    }
    const matched = matchProblems(submittedTitles, problemsData);
    if (!matched.length) {
      alert("No matching problems found between local data and external API.");
      return;
    }
    await updateFirebaseForMatchedProblems(matched);
    await loadProblems();
    await updateDetailedAnalysis();
    renderCalendar();
    updateRanking();
    alert("Synchronization complete! Marked new problems as completed.");
  } catch (e) {
    console.error("Sync error:", e);
    alert(`Sync error: ${e.message}`);
  } finally {
    showLoading(false);
  }
}

function matchProblems(submittedTitles, localData) {
  const normalized = submittedTitles.map((t) =>
    t.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
  );
  return localData.topics.flatMap((topic) =>
    topic.problems
      .filter((prob) => {
        const cleanTitle = prob.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        return normalized.includes(cleanTitle);
      })
      .map((prob) => ({
        topic: topic.name,
        problemId: prob.id.toString(),
        title: prob.title,
        link: prob.link,
        difficulty: prob.difficulty,
      }))
  );
}

async function updateFirebaseForMatchedProblems(matchedProblems) {
  const tasks = matchedProblems.map(async (prob) => {
    const docRef = doc(db, "users", currentProfile, "problems", prob.problemId);
    try {
      const ds = await getDoc(docRef);
      if (ds.exists()) {
        const data = ds.data();
        if (!data.completed) {
          await updateDoc(docRef, {
            completed: true,
            solvedAt: Timestamp.fromDate(new Date()),
            topic: prob.topic,
          });
        }
      } else {
        await setDoc(docRef, {
          completed: true,
          title: prob.title,
          link: prob.link,
          difficulty: prob.difficulty,
          topic: prob.topic,
          solvedAt: Timestamp.fromDate(new Date()),
        });
      }
    } catch (e) {
      console.error(`Error updating problem "${prob.title}":`, e);
    }
  });
  await Promise.all(tasks);
}

function debounce(func, timeout = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

async function fetchQuotes() {
  try {
    const response = await fetch("quotes.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    quotes = data.quotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    quoteTextElem.textContent = "Keep pushing forward!";
    quoteAuthorElem.textContent = "Unknown";
  }
}

function displayRandomQuote(initial = false) {
  if (!quotes.length) return;
  let quote;
  if (initial && quotes.length > 0) {
    quote = quotes[0];
  } else {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quote = quotes[randomIndex];
  }
  quoteTextElem.style.animation = "fadeOutDown 0.5s forwards";
  quoteAuthorElem.style.animation = "fadeOutDown 0.5s forwards";
  setTimeout(() => {
    quoteTextElem.textContent = `${quote.text}`;
    quoteAuthorElem.textContent = `- ${quote.author}`;
    quoteTextElem.style.animation = "fadeInUp 0.5s forwards";
    quoteAuthorElem.style.animation = "fadeInUp 0.5s forwards";
  }, 500);
}

async function initializeQuotes() {
  await fetchQuotes();
  displayRandomQuote(true);
}

async function getAllCompletedProblems() {
  const result = [];
  try {
    const userRef = collection(db, "users", currentProfile, "problems");
    const q = query(userRef, where("completed", "==", true));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.solvedAt && data.solvedAt.toDate) {
        result.push({
          date: data.solvedAt.toDate(),
          title: data.title || "Untitled",
          difficulty: data.difficulty || "Unknown",
        });
      }
    });
  } catch (err) {
    console.error("Error in getAllCompletedProblems:", err);
  }
  return result;
}

function openDayModal(isoStr, dayData) {
  if (!dayModal) return;
  dayModal.style.display = "block";
  modalDateElem.textContent = isoStr;
  problemsCountElem.textContent = `Total Problems Solved: ${dayData.count}`;
  problemsBody.innerHTML = "";
  dayData.problems.forEach((prob) => {
    const tr = document.createElement("tr");
    const tdTitle = document.createElement("td");
    tdTitle.textContent = prob.title;
    const tdDiff = document.createElement("td");
    tdDiff.textContent = prob.difficulty;
    const diffLower = prob.difficulty.toLowerCase();
    if (diffLower === "easy") tdDiff.classList.add("difficulty-easy");
    if (diffLower === "medium") tdDiff.classList.add("difficulty-medium");
    if (diffLower === "hard") tdDiff.classList.add("difficulty-hard");
    tr.appendChild(tdTitle);
    tr.appendChild(tdDiff);
    problemsBody.appendChild(tr);
  });
}

function getMonthlySolvedCount(solveMap, year, month) {
  let total = 0;
  Object.keys(solveMap).forEach((dayStr) => {
    const dObj = new Date(dayStr);
    if (dObj.getFullYear() === year && dObj.getMonth() === month) {
      total += solveMap[dayStr].count;
    }
  });
  return total;
}

function renderCalendar(year, month) {
  if (!calendarContainer) return;
  const now = new Date();
  const currYear = year ?? now.getFullYear();
  const currMonth = month ?? now.getMonth();
  calendarContainer.innerHTML = "";
  const headerDiv = document.createElement("div");
  headerDiv.classList.add("calendar-header");
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.addEventListener("click", () => {
    let newMonth = currMonth - 1;
    let newYear = currYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    renderCalendar(newYear, newMonth);
  });
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.addEventListener("click", () => {
    let newMonth = currMonth + 1;
    let newYear = currYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    renderCalendar(newYear, newMonth);
  });
  const monthInfo = document.createElement("div");
  monthInfo.classList.add("month-info");
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const monthYearTitle = document.createElement("h3");
  monthYearTitle.style.margin = "0";
  monthYearTitle.textContent = `${monthNames[currMonth]} ${currYear}`;
  const monthBadge = document.createElement("span");
  monthBadge.classList.add("month-solved-badge");
  monthBadge.textContent = `Month Solved: 0`;
  monthInfo.appendChild(monthYearTitle);
  monthInfo.appendChild(monthBadge);
  headerDiv.appendChild(prevBtn);
  headerDiv.appendChild(monthInfo);
  headerDiv.appendChild(nextBtn);
  calendarContainer.appendChild(headerDiv);
  getAllCompletedProblems()
    .then((allCompleted) => {
      const solveMap = {};
      allCompleted.forEach((item) => {
        const dayStr = item.date.toISOString().split("T")[0];
        if (!solveMap[dayStr]) {
          solveMap[dayStr] = { count: 0, problems: [] };
        }
        solveMap[dayStr].count++;
        solveMap[dayStr].problems.push({
          title: item.title,
          difficulty: item.difficulty,
        });
      });
      const monthSolved = getMonthlySolvedCount(solveMap, currYear, currMonth);
      monthBadge.textContent = `Solved this Month: ${monthSolved}`;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const grid = document.createElement("div");
      grid.classList.add("calendar-grid");
      dayNames.forEach((d) => {
        const dh = document.createElement("div");
        dh.classList.add("day-header");
        dh.textContent = d;
        grid.appendChild(dh);
      });
      const firstDayOfMonth = new Date(currYear, currMonth, 1);
      const lastDayOfMonth = new Date(currYear, currMonth + 1, 0);
      const startDay = firstDayOfMonth.getDay();
      const totalDays = lastDayOfMonth.getDate();
      for (let i = 0; i < startDay; i++) {
        const blank = document.createElement("div");
        blank.classList.add("calendar-day", "inactive");
        grid.appendChild(blank);
      }
      for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("calendar-day");
        dayDiv.textContent = day;
        const dateObj = new Date(currYear, currMonth, day);
        const isoStr = dateObj.toISOString().split("T")[0];
        if (solveMap[isoStr]) {
          const sc = document.createElement("div");
          sc.classList.add("solves-count");
          sc.textContent = solveMap[isoStr].count;
          dayDiv.appendChild(sc);
          dayDiv.addEventListener("click", () => openDayModal(isoStr, solveMap[isoStr]));
        } else {
          dayDiv.addEventListener("click", () => openDayModal(isoStr, { count: 0, problems: [] }));
        }
        grid.appendChild(dayDiv);
      }
      calendarContainer.appendChild(grid);
    })
    .catch((err) => console.error("Error building solve map:", err));
}

function openDayModalHandler() {
  dayModal.style.display = "block";
}

async function updateRanking() {
  const profiles = ["Mano", "deva", "Ananth", "revanth", "murali", "vishan"];
  const rankingData = await Promise.all(
    profiles.map(async (profile) => {
      const userRef = collection(db, "users", profile, "problems");
      const q = query(userRef, where("completed", "==", true));
      const snap = await getDocs(q);
      let score = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.difficulty) {
          const diff = data.difficulty.toLowerCase();
          if (diff === "easy") score += 1;
          else if (diff === "medium") score += 2;
          else if (diff === "hard") score += 3;
        }
      });
      return { profile, score };
    })
  );
  rankingData.sort((a, b) => b.score - a.score);
  renderRanking(rankingData);
}

function renderRanking(rankingData) {
  const rankingTableBody = document.querySelector("#ranking-table tbody");
  if (!rankingTableBody) return;
  rankingTableBody.innerHTML = "";
  rankingData.forEach((entry, index) => {
    const tr = document.createElement("tr");
    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;
    const profileCell = document.createElement("td");
    profileCell.textContent = entry.profile;
    const scoreCell = document.createElement("td");
    scoreCell.textContent = entry.score;
    tr.appendChild(rankCell);
    tr.appendChild(profileCell);
    tr.appendChild(scoreCell);
    rankingTableBody.appendChild(tr);
  });
}

// ----------------- End of Code -----------------
