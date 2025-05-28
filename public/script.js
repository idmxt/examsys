/************************************
 *         Глобальные данные
 ************************************/

// Пример массива групп (можно менять)
const groupNames = ["Web 3-1", "Web 3-2", "Web 3-3", "Web 3-4", "Web 3-5", "Web 3-6"];

// Текущая выбранная группа и студент
let currentGroup = null;
let currentStudentId = null;

// Объект, хранящий все билеты (ключ: имя файла, значение: массив критериев)
let tickets = {};

// Для хранения экземпляров диаграмм (чтобы можно было обновлять)
let chartGroupAvg = null;
let chartDistribution = null;
let chartGroupCount = null;
let chartTopStudents = null;

/************************************
 *    Функции для работы с LocalStorage
 ************************************/

// Загрузка билетов
function loadTicketsFromLocalStorage() {
  const savedTickets = localStorage.getItem("tickets");
  return savedTickets ? JSON.parse(savedTickets) : {};
}
function saveTicketsToLocalStorage(ticketsData) {
  localStorage.setItem("tickets", JSON.stringify(ticketsData));
}

// Загрузка данных группы
function loadGroupFromLocalStorage(groupName) {
  const savedGroup = localStorage.getItem(`group-${groupName}`);
  return savedGroup ? JSON.parse(savedGroup) : [];
}
function saveGroupToLocalStorage(groupName, data) {
  localStorage.setItem(`group-${groupName}`, JSON.stringify(data));
}

/************************************
 *         Инициализация
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
  // Загружаем билеты из localStorage
  tickets = loadTicketsFromLocalStorage();

  // Кнопка "Сбросить все данные"
  document.getElementById("reset-all-btn").addEventListener("click", handleResetAll);

  // Импорт/Экспорт
  document.getElementById("import-group-btn").addEventListener("click", handleImportGroup);
  document.getElementById("import-tickets-btn").addEventListener("click", handleImportTickets);
  document.getElementById("export-group-btn").addEventListener("click", handleExportGroup);
  document.getElementById("detailed-export-btn").addEventListener("click", handleDetailedExportGroup);

  // Навигация: вернуться на главную
  document.getElementById("back-to-main-btn").addEventListener("click", backToMain);

  // Фильтр/сортировка (на странице группы)
  document.getElementById("filter-btn").addEventListener("click", () => {
    if (currentGroup) {
      renderStudentList(currentGroup);
    }
  });

  // Кнопка "Аналитика"
  document.getElementById("show-analytics-btn").addEventListener("click", showAnalyticsPage);
  document.getElementById("back-to-main-from-analytics").addEventListener("click", backToMainFromAnalytics);

  // Кнопка "Экспортировать в PDF"
  document.getElementById("export-pdf-btn").addEventListener("click", exportAnalyticsToPDF);

  // Отрисуем список групп
  renderGroupList();
});

/************************************
 *        Сброс localStorage
 ************************************/
function handleResetAll() {
  const confirmReset = confirm("Вы уверены, что хотите сбросить все данные из localStorage?");
  if (confirmReset) {
    localStorage.clear();
    alert("Все данные удалены! Перезагрузите страницу.");
    location.reload();
  }
}

/************************************
 *        Главная страница
 ************************************/
function renderGroupList() {
  const groupList = document.getElementById("group-list");
  groupList.innerHTML = "";

  groupNames.forEach((groupName) => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-3";
    col.innerHTML = `
      <div class="card p-3 shadow-sm">
        <h5>${groupName}</h5>
        <button class="btn btn-primary btn-sm mt-2" onclick="openGroup('${groupName}')">
          Открыть
        </button>
      </div>
    `;
    groupList.appendChild(col);
  });
}

function openGroup(groupName) {
  currentGroup = groupName;
  document.getElementById("main-page").classList.add("d-none");
  document.getElementById("group-page").classList.remove("d-none");

  document.getElementById("group-title").textContent = `Группа: ${groupName}`;

  renderStudentList(groupName);
}

function backToMain() {
  currentGroup = null;
  document.getElementById("group-page").classList.add("d-none");
  document.getElementById("main-page").classList.remove("d-none");
}

/************************************
 *     Страница аналитики
 ************************************/
function showAnalyticsPage() {
  // Прячем main-page, group-page
  document.getElementById("main-page").classList.add("d-none");
  document.getElementById("group-page").classList.add("d-none");
  document.getElementById("analytics-page").classList.remove("d-none");

  renderAnalytics();
}

function backToMainFromAnalytics() {
  document.getElementById("analytics-page").classList.add("d-none");
  document.getElementById("main-page").classList.remove("d-none");
}

/************************************
 *  Реализация «Дополнительной аналитики»
 ************************************/

/**
 * Основная функция, которая обновляет все диаграммы и статистику на analytics-page
 */
function renderAnalytics() {
  // 1) Средний балл по каждой группе
  renderChartGroupAvg();

  // 2) Распределение баллов по последней открытой группе
  renderDistributionChart();

  // 3) Статистика по билетам
  renderTicketsStats();

  // 4) Общее количество студентов по группам
  renderChartGroupCount();

  // 5) Самые активные студенты
  renderChartTopStudents();
}

/**
 * 1) Отрисовка диаграммы «Средний балл по группам» (bar-chart)
 */
function renderChartGroupAvg() {
  const ctx = document.getElementById("chart-group-avg").getContext("2d");

  // Посчитаем средний балл для каждой группы
  const averages = groupNames.map((g) => {
    return {
      group: g,
      avg: getGroupAverage(g)
    };
  });

  // Если диаграмма уже создана, уничтожим её прежде, чем создавать заново
  if (chartGroupAvg) {
    chartGroupAvg.destroy();
  }

  chartGroupAvg = new Chart(ctx, {
    type: "bar",
    data: {
      labels: averages.map((item) => item.group),
      datasets: [{
        label: "Средний балл",
        data: averages.map((item) => item.avg),
        backgroundColor: "rgba(54, 162, 235, 0.7)"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Баллы" }
        },
        x: {
          title: { display: true, text: "Группы" }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Средний балл по группам'
        }
      }
    }
  });
}

/**
 * 2) Распределение баллов (гистограмма) по последней открытой группе
 */
function renderDistributionChart() {
  const ctx = document.getElementById("chart-distribution").getContext("2d");

  // Если мы ни разу не открывали группу, currentGroup будет null
  if (!currentGroup) {
    // Очищаем график, если был
    if (chartDistribution) {
      chartDistribution.destroy();
      chartDistribution = null;
    }
    return;
  }

  // Получаем всех студентов в группе
  const students = loadGroupFromLocalStorage(currentGroup);
  // Берём их итоговые баллы
  const allPoints = students.map((s) => s.totalPoints || 0);

  // Превратим эти баллы в «распределение» (число студентов в каждом диапазоне)
  // Например, шаг = 10 (0-9, 10-19, 20-29, ...)
  const bins = new Array(11).fill(0); // для 0..100 (по 10 баллов) — 11 «корзин»
  allPoints.forEach((p) => {
    const binIndex = Math.min(Math.floor(p / 10), 10); // чтобы 100 баллов не вышли за предел
    bins[binIndex]++;
  });

  const labels = bins.map((_, idx) => {
    if (idx < 10) {
      return `${idx * 10} - ${idx * 10 + 9}`;
    } else {
      return "100";
    }
  });

  if (chartDistribution) {
    chartDistribution.destroy();
  }

  chartDistribution = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `Распределение баллов (${currentGroup})`,
        data: bins,
        backgroundColor: "rgba(255, 99, 132, 0.7)"
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Баллы" } },
        y: { beginAtZero: true, title: { display: true, text: "Число студентов" } }
      },
      plugins: {
        title: {
          display: true,
          text: 'Распределение баллов по группе'
        }
      }
    }
  });
}

/**
 * 3) Статистика по билетам
 * - Топ-3 самых сложных билетов
 * - Топ-3 самых лёгких билетов
 * - Количество студентов, получивших каждый билет
 */
function renderTicketsStats() {
  const container = document.getElementById("tickets-stats");
  container.innerHTML = "";

  // Сформируем единый список: [{ ticketName, avgPoints, studentsCount }, ...]
  const stats = getAllTicketsStats();

  if (!stats.length) {
    container.innerHTML = "<p class='text-muted'>Нет данных по билетам.</p>";
    return;
  }

  // Сортируем по avgPoints
  // «Сложный билет» = низкий средний балл
  // «Лёгкий билет»  = высокий средний балл
  const sorted = [...stats].sort((a, b) => a.avgPoints - b.avgPoints);

  const top3Hard = sorted.slice(0, 3); // первые 3 — с самым низким avg
  const top3Easy = sorted.slice(-3).reverse(); // последние 3, развернём, чтобы в порядке убывания

  let html = "<div class='row'>";

  // «Сложные»
  html += "<div class='col-md-6'>";
  html += "<h5>Самые сложные билеты (низкий средний балл)</h5>";
  top3Hard.forEach((item) => {
    html += `<p><strong>${item.ticketName}</strong> — Ср.балл: ${item.avgPoints.toFixed(1)} (у ${item.studentsCount} студентов)</p>`;
  });
  html += "</div>";

  // «Лёгкие»
  html += "<div class='col-md-6'>";
  html += "<h5>Самые лёгкие билеты (высокий средний балл)</h5>";
  top3Easy.forEach((item) => {
    html += `<p><strong>${item.ticketName}</strong> — Ср.балл: ${item.avgPoints.toFixed(1)} (у ${item.studentsCount} студентов)</p>`;
  });
  html += "</div>";

  html += "</div>";

  // Дополнительная статистика: количество студентов, получивших каждый билет
  html += "<div class='mt-4'>";
  html += "<h5>Количество студентов по каждому билету</h5>";
  html += "<ul class='list-group'>";
  stats.sort((a, b) => b.studentsCount - a.studentsCount);
  stats.forEach((item) => {
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">
              ${item.ticketName}
              <span class="badge bg-primary rounded-pill">${item.studentsCount}</span>
            </li>`;
  });
  html += "</ul>";
  html += "</div>";

  container.innerHTML = html;
}

/**
 * 4) Отрисовка диаграммы "Количество студентов по группам"
 */
function renderChartGroupCount() {
  const ctx = document.getElementById("chart-group-count").getContext("2d");

  // Посчитаем количество студентов для каждой группы
  const counts = groupNames.map((g) => {
    const students = loadGroupFromLocalStorage(g);
    return students.length;
  });

  if (chartGroupCount) {
    chartGroupCount.destroy();
  }

  chartGroupCount = new Chart(ctx, {
    type: "pie",
    data: {
      labels: groupNames,
      datasets: [{
        label: "Количество студентов",
        data: counts,
        backgroundColor: generateColorPalette(groupNames.length)
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Количество студентов по группам'
        }
      }
    }
  });
}

/**
 * 5) Отрисовка диаграммы "Самые активные студенты"
 * - Студенты с наибольшим количеством баллов
 */
function renderChartTopStudents() {
  const ctx = document.getElementById("chart-top-students").getContext("2d");

  // Собираем всех студентов из всех групп
  let allStudents = [];
  groupNames.forEach((g) => {
    const students = loadGroupFromLocalStorage(g);
    allStudents = allStudents.concat(students);
  });

  // Сортируем по totalPoints и берем топ-5
  const topStudents = allStudents
    .filter(s => s.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  const labels = topStudents.map(s => s.name);
  const data = topStudents.map(s => s.totalPoints);

  if (chartTopStudents) {
    chartTopStudents.destroy();
  }

  chartTopStudents = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Итоговые баллы",
        data: data,
        backgroundColor: "rgba(75, 192, 192, 0.7)"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Баллы" }
        },
        x: {
          title: { display: true, text: "Студенты" }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Самые активные студенты'
        }
      }
    }
  });
}

/**
 * Генерация цветовой палитры для диаграмм
 */
function generateColorPalette(numColors) {
  const colors = [];
  const hueStep = 360 / numColors;
  for (let i = 0; i < numColors; i++) {
    const hue = i * hueStep;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

/**
 * Подсчёт среднего балла для одной группы
 */
function getGroupAverage(groupName) {
  const students = loadGroupFromLocalStorage(groupName) || [];
  if (!students.length) return 0;
  const sum = students.reduce((acc, s) => acc + (s.totalPoints || 0), 0);
  return sum / students.length;
}

/**
 * Сбор статистики по всем билетам (во всех группах).
 * Возвращает массив вида:
 * [
 *   { ticketName: "Билет1.xlsx", avgPoints: 45.7, studentsCount: 10 },
 *   { ... },
 *   ...
 * ]
 */
function getAllTicketsStats() {
  // Собираем все группы, всех студентов, смотрим их student.tickets[fileName]
  const resultMap = new Map(); 
  // Ключ = ticketName, значение = { sumPoints: ..., count: ... }

  groupNames.forEach((g) => {
    const students = loadGroupFromLocalStorage(g);
    students.forEach((st) => {
      const tMap = st.tickets || {};
      for (let ticketName in tMap) {
        // Подсчитаем сумму итогов именно по этому билету
        let sumThisTicket = 0;
        tMap[ticketName].forEach((c) => { sumThisTicket += c.total; });

        if (!resultMap.has(ticketName)) {
          resultMap.set(ticketName, { sumPoints: 0, count: 0 });
        }
        const obj = resultMap.get(ticketName);
        obj.sumPoints += sumThisTicket;
        obj.count += 1;
      }
    });
  });

  // Превратим Map в массив
  const statsArray = [];
  for (let [ticketName, data] of resultMap) {
    statsArray.push({
      ticketName: ticketName,
      avgPoints: data.count ? (data.sumPoints / data.count) : 0,
      studentsCount: data.count
    });
  }
  return statsArray;
}

/************************************
 *    Работа со студентами
 ************************************/
function renderStudentList(groupName) {
  let students = loadGroupFromLocalStorage(groupName);

  // Фильтр/поиск
  const searchValue = document.getElementById("search-student").value.trim().toLowerCase();
  const minPoints = parseInt(document.getElementById("min-points").value) || 0;
  students = students.filter((student) => {
    const nameMatch = student.name.toLowerCase().includes(searchValue);
    const pointsMatch = (student.totalPoints || 0) >= minPoints;
    return nameMatch && pointsMatch;
  });

  // Сортировка
  const sortValue = document.getElementById("sort-field").value;
  students.sort((a, b) => {
    switch(sortValue) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "points-asc":
        return (a.totalPoints || 0) - (b.totalPoints || 0);
      case "points-desc":
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      default:
        return 0;
    }
  });

  const container = document.getElementById("student-list");
  container.innerHTML = `<div class="accordion" id="students-accordion"></div>`;
  const accordionEl = container.querySelector(".accordion");

  students.forEach((student, index) => {
    const headingId = `heading-${student.id}`;
    const collapseId = `collapse-${student.id}`;

    // Добавим кнопку "Показать лог" и блок <div> для вывода лога
    const accordionItem = `
      <div class="accordion-item">
        <h2 class="accordion-header" id="${headingId}">
          <button class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#${collapseId}"
                  aria-expanded="false"
                  aria-controls="${collapseId}">
            ${index + 1}. ${student.name} (Итог: ${student.totalPoints || 0} баллов)
          </button>
        </h2>
        <div id="${collapseId}"
             class="accordion-collapse collapse"
             data-bs-parent="#students-accordion">
          <div class="accordion-body">
            <p class="text-muted">ID: ${student.id}</p>
            <button class="btn btn-primary btn-sm me-2" onclick="openGradeModal(${student.id}, '${groupName}')">
              Оценить
            </button>
            <button class="btn btn-secondary btn-sm" onclick="toggleLog(${student.id})">
              Показать лог
            </button>
            <div id="log-${student.id}" class="mt-2 d-none">
              <!-- Журнал изменений будет отрисовываться здесь -->
            </div>
          </div>
        </div>
      </div>
    `;
    accordionEl.insertAdjacentHTML("beforeend", accordionItem);
  });
}

/**
 * Показать/скрыть лог для конкретного студента
 */
function toggleLog(studentId) {
  const logDiv = document.getElementById(`log-${studentId}`);
  if (!logDiv) return;

  // Если он был скрыт, отрисуем лог
  if (logDiv.classList.contains("d-none")) {
    logDiv.classList.remove("d-none");
    renderLog(studentId);
  } else {
    logDiv.classList.add("d-none");
  }
}

/**
 * Отрисовываем журнал изменений для конкретного студента
 */
function renderLog(studentId) {
  const students = loadGroupFromLocalStorage(currentGroup);
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const logDiv = document.getElementById(`log-${studentId}`);
  if (!logDiv) return;

  if (!student.history || student.history.length === 0) {
    logDiv.innerHTML = "<p class='text-muted'>Лог пуст.</p>";
    return;
  }

  // Отсортируем по времени (новые - выше)
  const sortedHistory = [...student.history].sort((a, b) => b.timestamp - a.timestamp);

  let html = "<ul class='list-group'>";
  sortedHistory.forEach((record) => {
    const dateStr = new Date(record.timestamp).toLocaleString(); 
    html += `
      <li class="list-group-item">
        <strong>${dateStr}:</strong> 
        Изменение критерия "<em>${record.criterion}</em>" в билете "<em>${record.ticketName}</em>" 
        c <u>${record.oldValue}</u> на <u>${record.newValue}</u>.
      </li>
    `;
  });
  html += "</ul>";

  logDiv.innerHTML = html;
}

/************************************
 *  Импорт студентов из Excel
 ************************************/
function handleImportGroup() {
  const fileInput = document.getElementById("csv-file");
  const file = fileInput.files[0];
  if (!file) {
    alert("Сначала выберите файл со студентами!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const newStudents = [];
    let nextId = Date.now();

    jsonData.forEach((row) => {
      if (row[0]) {
        newStudents.push({
          id: nextId++,
          name: row[0],
          totalPoints: 0,
          tickets: {},
          lastTicket: null, // Здесь будем хранить "последний билет"
          history: []       // Журнал изменений
        });
      }
    });

    const existingStudents = loadGroupFromLocalStorage(currentGroup);
    const allStudents = existingStudents.concat(newStudents);
    saveGroupToLocalStorage(currentGroup, allStudents);

    renderStudentList(currentGroup);
    alert("Студенты успешно импортированы!");
    fileInput.value = "";
  };

  reader.readAsArrayBuffer(file);
}

/************************************
 *   Экспорт группы (простой)
 ************************************/
function handleExportGroup() {
  if (!currentGroup) {
    alert("Сначала выберите группу!");
    return;
  }

  const students = loadGroupFromLocalStorage(currentGroup);
  if (students.length === 0) {
    alert("В группе нет студентов для экспорта.");
    return;
  }

  const exportData = students.map((student) => ({
    ID: student.id,
    "ФИО студента": student.name,
    "Итоговые баллы": student.totalPoints || 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, currentGroup);

  XLSX.writeFile(wb, `${currentGroup}.xlsx`);
}

/************************************
 *  Подробный экспорт (по билетам, 4-й вариант)
 ************************************/
function handleDetailedExportGroup() {
  if (!currentGroup) {
    alert("Сначала выберите группу!");
    return;
  }

  const students = loadGroupFromLocalStorage(currentGroup);
  if (!students.length) {
    alert("В группе нет студентов.");
    return;
  }

  // Создаём новую книгу Excel
  const wb = XLSX.utils.book_new();

  // Собираем все уникальные билеты у всех студентов
  const allTicketsSet = new Set();
  students.forEach((st) => {
    if (st.tickets) {
      Object.keys(st.tickets).forEach((tn) => allTicketsSet.add(tn));
    }
  });

  if (allTicketsSet.size === 0) {
    alert("Нет данных по билетам. Сначала оцените студентов по билетам.");
    return;
  }

  // Для каждого билета создаём отдельный лист
  allTicketsSet.forEach((ticketName) => {
    const rows = [];
    // Первая строка (шапка)
    rows.push(["Студент", "ID", "Билет", "Критерий", "Макс.", "Факт", "Баллы"]);

    students.forEach((student) => {
      const criteriaArr = student.tickets?.[ticketName] || [];
      criteriaArr.forEach((c) => {
        rows.push([
          student.name,
          student.id,
          ticketName,
          c.criteria,
          c.maxPoints,
          c.fact,
          c.total
        ]);
      });
    });

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const sheetName = ticketName.substring(0, 31); // Лимит Excel
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  });

  XLSX.writeFile(wb, `Detailed_${currentGroup}.xlsx`);
}

/************************************
 *   Импорт билетов
 ************************************/
function handleImportTickets() {
  const input = document.getElementById("tickets-files");
  const files = input.files;
  if (!files || files.length === 0) {
    alert("Сначала выберите хотя бы один файл с билетами!");
    return;
  }

  const promises = [];
  for (let i = 0; i < files.length; i++) {
    promises.push(readTicketFile(files[i]));
  }

  Promise.all(promises)
    .then((results) => {
      results.forEach(({ fileName, criteriaList }) => {
        tickets[fileName] = criteriaList;
      });
      saveTicketsToLocalStorage(tickets);
      alert("Билеты успешно импортированы!");
      input.value = "";
    })
    .catch((err) => {
      console.error("Ошибка при чтении файлов билетов:", err);
      alert("Ошибка при чтении файлов билетов. Подробности в консоли.");
    });
}

function readTicketFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const criteriaRows = rows.slice(1);

        const criteriaList = criteriaRows.map((row) => ({
          criteria: row[0] || "Без названия",
          maxPoints: Number(row[1]) || 0,
          fact: "Нет",
          total: 0,
        }));

        resolve({ fileName: file.name, criteriaList });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/************************************
 *   Оценивание студента (модал)
 ************************************/
function openGradeModal(studentId, groupName) {
  const students = loadGroupFromLocalStorage(groupName);
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    alert("Ошибка: Студент не найден!");
    return;
  }

  currentStudentId = studentId;
  document.getElementById("modal-student-name").textContent = student.name;

  const ticketSelect = document.getElementById("ticket-select");
  const allFileNames = Object.keys(tickets);
  if (!allFileNames.length) {
    ticketSelect.innerHTML = `<option disabled selected>Нет загруженных билетов</option>`;
  } else {
    // Собираем <option> для всех билетов
    ticketSelect.innerHTML = allFileNames
      .map((fileName) => `<option value="${fileName}">${fileName}</option>`)
      .join("");

    // Если у студента есть lastTicket, попробуем его выбрать
    if (student.lastTicket && allFileNames.includes(student.lastTicket)) {
      ticketSelect.value = student.lastTicket;
    }
  }

  applyTicketCriteria();

  const gradeModal = new bootstrap.Modal(document.getElementById("gradeModal"));
  gradeModal.show();
}

function applyTicketCriteria() {
  updateTable();
}

/**
 * Вызывается при смене "Да/Нет" в критерии
 * Здесь мы также будем заносить запись в "history"
 */
function updateCriterion(index, newValue) {
  const fileName = document.getElementById("ticket-select").value;
  const criteria = tickets[fileName];
  if (!criteria || !criteria[index]) return;

  const oldValue = criteria[index].fact; // чтобы отобразить "из ... в ..."
  criteria[index].fact = newValue;
  criteria[index].total = (newValue === "Да") ? criteria[index].maxPoints : 0;

  // Логика журнала: если oldValue != newValue, пишем запись
  if (oldValue !== newValue) {
    addHistoryRecord(fileName, criteria[index].criteria, oldValue, newValue);
  }

  updateTable();
  autoSaveStudentGrades();
}

function updateTable() {
  const fileName = document.getElementById("ticket-select").value;
  const criteria = tickets[fileName] || [];

  const criteriaTable = document.getElementById("criteria-table");
  criteriaTable.innerHTML = "";

  let totalPoints = 0;
  criteria.forEach((criterion, index) => {
    totalPoints += criterion.total;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${criterion.criteria}</td>
      <td>${criterion.maxPoints}</td>
      <td>
        <select class="form-select" onchange="updateCriterion(${index}, this.value)">
          <option value="Нет" ${criterion.fact === "Нет" ? "selected" : ""}>Нет</option>
          <option value="Да"  ${criterion.fact === "Да"  ? "selected" : ""}>Да</option>
        </select>
      </td>
      <td>${criterion.total}</td>
    `;
    criteriaTable.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td colspan="4" class="text-end fw-bold">Итоговые баллы:</td>
    <td class="fw-bold">${totalPoints}</td>
  `;
  criteriaTable.appendChild(totalRow);
}

/************************************
 *   Добавление записи в history
 ************************************/
function addHistoryRecord(ticketName, criterion, oldVal, newVal) {
  if (!currentGroup || !currentStudentId) return;

  const students = loadGroupFromLocalStorage(currentGroup);
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;

  const record = {
    timestamp: Date.now(),
    ticketName: ticketName,
    criterion: criterion,
    oldValue: oldVal,
    newValue: newVal
  };

  // Если нет history — инициализируем
  if (!student.history) {
    student.history = [];
  }
  student.history.push(record);

  // Сохраняем обратно
  saveGroupToLocalStorage(currentGroup, students);
}

/************************************
 *   Автосохранение при «Да/Нет»
 ************************************/
function autoSaveStudentGrades() {
  if (!currentGroup || !currentStudentId) return;

  const students = loadGroupFromLocalStorage(currentGroup);
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;

  const fileName = document.getElementById("ticket-select").value;
  const criteria = tickets[fileName] || [];

  // Если у студента нет .tickets — инициализируем
  if (!student.tickets) student.tickets = {};

  student.tickets[fileName] = criteria.map((c) => ({
    criteria: c.criteria,
    maxPoints: c.maxPoints,
    fact: c.fact,
    total: c.total
  }));

  // Запомним "последний билет"
  student.lastTicket = fileName;

  // Пересчитываем общую сумму по всем билетам
  let globalSum = 0;
  Object.values(student.tickets).forEach((arr) => {
    const sumTicket = arr.reduce((acc, c) => acc + c.total, 0);
    globalSum += sumTicket;
  });
  student.totalPoints = globalSum;

  saveGroupToLocalStorage(currentGroup, students);
  // Обновим список (чтобы в аккордеоне сразу отобразился новый totalPoints)
  renderStudentList(currentGroup);
}

/************************************
 *   Сохранение оценок (кнопка)
 ************************************/
function saveGrades() {
  // Всё уже сохраняется при изменении "Да/Нет"
  autoSaveStudentGrades();

  const students = loadGroupFromLocalStorage(currentGroup);
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;
  alert(`Оценки сохранены! Итог: ${student.totalPoints} баллов (по всем билетам).`);
}

/************************************
 *   Экспорт аналитики в PDF
 ************************************/
function exportAnalyticsToPDF() {
  const exportGroupSelect = document.getElementById("export-group-select");
  const selectedGroup = exportGroupSelect.value;

  if (!selectedGroup) {
    alert("Пожалуйста, выберите группу для экспорта.");
    return;
  }

  // Создаём новый объект jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');

  // Добавляем заголовок
  doc.setFontSize(20);
  doc.text(`Аналитика для группы: ${selectedGroup}`, 40, 40);

  // Создаём временный контейнер для экспорта
  const tempDiv = document.createElement('div');
  tempDiv.style.width = '800px'; // Ширина для A4 в пиках
  tempDiv.style.padding = '20px';
  tempDiv.style.background = '#fff';

  // Добавляем нужные элементы в tempDiv
  // Средний балл по группам
  const avgChartCanvas = document.getElementById("chart-group-avg");
  const avgChartImg = avgChartCanvas.toDataURL("image/png");
  const avgTitle = document.createElement('h3');
  avgTitle.textContent = 'Средний балл по группам';
  tempDiv.appendChild(avgTitle);
  const avgImg = document.createElement('img');
  avgImg.src = avgChartImg;
  avgImg.style.width = '100%';
  tempDiv.appendChild(avgImg);

  // Распределение баллов
  const distChartCanvas = document.getElementById("chart-distribution");
  const distChartImg = distChartCanvas.toDataURL("image/png");
  const distTitle = document.createElement('h3');
  distTitle.textContent = `Распределение баллов (${selectedGroup})`;
  tempDiv.appendChild(distTitle);
  const distImg = document.createElement('img');
  distImg.src = distChartImg;
  distImg.style.width = '100%';
  tempDiv.appendChild(distImg);

  // Статистика по билетам
  const ticketsStatsDiv = document.getElementById("tickets-stats");
  const ticketsStatsClone = ticketsStatsDiv.cloneNode(true);
  tempDiv.appendChild(ticketsStatsClone);

  // Общее количество студентов по группам
  const countChartCanvas = document.getElementById("chart-group-count");
  const countChartImg = countChartCanvas.toDataURL("image/png");
  const countTitle = document.createElement('h3');
  countTitle.textContent = 'Количество студентов по группам';
  tempDiv.appendChild(countTitle);
  const countImg = document.createElement('img');
  countImg.src = countChartImg;
  countImg.style.width = '100%';
  tempDiv.appendChild(countImg);

  // Самые активные студенты
  const topStudentsChartCanvas = document.getElementById("chart-top-students");
  const topStudentsChartImg = topStudentsChartCanvas.toDataURL("image/png");
  const topStudentsTitle = document.createElement('h3');
  topStudentsTitle.textContent = 'Самые активные студенты';
  tempDiv.appendChild(topStudentsTitle);
  const topStudentsImg = document.createElement('img');
  topStudentsImg.src = topStudentsChartImg;
  topStudentsImg.style.width = '100%';
  tempDiv.appendChild(topStudentsImg);

  // Добавляем tempDiv к body (не видимо)
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  // Используем html2canvas для захвата содержимого tempDiv
  html2canvas(tempDiv).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth() - 80; // Отступы
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(imgData, 'PNG', 40, 60, pdfWidth, pdfHeight);
    doc.save(`Analytics_${selectedGroup}.pdf`);

    // Удаляем временный контейнер
    document.body.removeChild(tempDiv);
  }).catch((err) => {
    console.error("Ошибка при экспорте в PDF:", err);
    alert("Произошла ошибка при экспорте в PDF. Подробности в консоли.");
  });
}
