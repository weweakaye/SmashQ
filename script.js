// ==========================================

// BADMINTON QUEUE MANAGEMENT SYSTEM

// STEP 3: PLAYER MANAGEMENT

// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  // Presentable in-app notifications (replaces browser alert popups).
  function showToast(message, type) {
    let host = document.getElementById("app-toast-container");
    if (!host) {
      host = document.createElement("div");
      host.id = "app-toast-container";
      host.className = "app-toast-container";
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-atomic", "true");
      document.body.appendChild(host);
    }

    const text = String(message || "");
    const inferredType =
      type ||
      (/success|added|restored|removed|saved|updated|recorded|settled/i.test(
        text,
      )
        ? "success"
        : "info");
    const toast = document.createElement("div");
    toast.className = "app-toast app-toast-" + inferredType;
    const icon = document.createElement("span");
    icon.className = "app-toast-icon";
    icon.textContent =
      inferredType === "success" ? "✓" : inferredType === "error" ? "!" : "i";
    const content = document.createElement("span");
    content.className = "app-toast-message";
    content.textContent = text;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "app-toast-close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";
    close.addEventListener("click", function () {
      toast.remove();
    });
    toast.append(icon, content, close);
    host.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("show");
    });
    window.setTimeout(function () {
      toast.classList.remove("show");
      window.setTimeout(function () {
        toast.remove();
      }, 250);
    }, 3600);
  }

  // Branded in-app confirmation and text-entry dialogs (no native browser prompts).
  function appDialog(options) {
    options = options || {};
    return new Promise((resolve) => {
      let overlay = document.getElementById("app-dialog-overlay");
      if (overlay) overlay.remove();
      overlay = document.createElement("div");
      overlay.id = "app-dialog-overlay";
      overlay.className = "app-dialog-overlay";
      const dialog = document.createElement("section");
      dialog.className = "app-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      const heading = document.createElement("h3");
      heading.textContent =
        options.title || (options.input ? "Enter a name" : "Please confirm");
      const message = document.createElement("p");
      message.textContent = options.message || "";
      dialog.append(heading, message);
      let input = null;
      if (options.input) {
        input = document.createElement("input");
        input.type = "text";
        input.value = options.value || "";
        input.maxLength = 80;
        input.placeholder = options.placeholder || "Enter name";
        input.className = "app-dialog-input";
        dialog.appendChild(input);
      }
      const actions = document.createElement("div");
      actions.className = "app-dialog-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "app-dialog-btn app-dialog-cancel";
      cancel.textContent = "Cancel";
      const accept = document.createElement("button");
      accept.type = "button";
      accept.className = "app-dialog-btn app-dialog-confirm";
      accept.textContent =
        options.confirmText || (options.input ? "Save" : "Confirm");
      actions.append(cancel, accept);
      dialog.appendChild(actions);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      const finish = (value) => {
        overlay.remove();
        resolve(value);
      };
      cancel.addEventListener("click", () =>
        finish(options.input ? null : false),
      );
      accept.addEventListener("click", () =>
        finish(options.input ? input.value : true),
      );
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) finish(options.input ? null : false);
      });
      const onKey = (event) => {
        if (event.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          finish(options.input ? null : false);
        }
        if (
          event.key === "Enter" &&
          (event.target === input || event.target === accept)
        ) {
          document.removeEventListener("keydown", onKey);
          finish(options.input ? input.value : true);
        }
      };
      document.addEventListener("keydown", onKey);
      accept.addEventListener(
        "click",
        () => document.removeEventListener("keydown", onKey),
        { once: true },
      );
      cancel.addEventListener(
        "click",
        () => document.removeEventListener("keydown", onKey),
        { once: true },
      );
      if (input) {
        input.focus();
        input.select();
      } else accept.focus();
    });
  }
  function appConfirm(message, title) {
    return appDialog({
      title: title || "Confirm action",
      message,
      confirmText: "Continue",
    });
  }
  function appPrompt(message, value, title) {
    return appDialog({
      title: title || "Rename",
      message,
      input: true,
      value,
      confirmText: "Save",
    });
  }

  // --------------------------------------

  // 1. LOCAL STORAGE

  // --------------------------------------

  const STORAGE_KEY = "badminton_players";

  const ARCHIVED_PLAYER_STORAGE_KEY = "badminton_archived_players";

  function loadArchivedPlayers() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(ARCHIVED_PLAYER_STORAGE_KEY) || "[]",
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Unable to load archived players:", error);

      return [];
    }
  }

  let archivedPlayers = loadArchivedPlayers();

  function saveArchivedPlayers() {
    try {
      localStorage.setItem(
        ARCHIVED_PLAYER_STORAGE_KEY,
        JSON.stringify(archivedPlayers),
      );

      return true;
    } catch (error) {
      console.error("Unable to save archived players:", error);

      showToast("Unable to save player history. Please check browser storage.");

      return false;
    }
  }

  function loadPlayers() {
    try {
      const savedPlayers = localStorage.getItem(STORAGE_KEY);

      const parsedPlayers = savedPlayers ? JSON.parse(savedPlayers) : [];

      return Array.isArray(parsedPlayers) ? parsedPlayers : [];
    } catch (error) {
      console.error("Unable to load player records:", error);

      showToast(
        "Player records could not be read. Please check the browser storage.",
      );

      return [];
    }
  }

  let players = loadPlayers();

  function savePlayers() {
    try {
      localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify(players),
      );

      return true;
    } catch (error) {
      console.error("Unable to save player records:", error);

      showToast(
        "Unable to save player records. Your browser storage may be full or unavailable.",
      );

      return false;
    }
  }

  // --------------------------------------

  // 2. DATE DISPLAY

  // --------------------------------------

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-PH", {
    weekday: "long",

    year: "numeric",

    month: "long",

    day: "numeric",
  });

  document.getElementById("current-date").textContent = formattedDate;

  document.getElementById("session-date").textContent = formattedDate;

  // --------------------------------------

  // 3. NAVIGATION

  // --------------------------------------

  const navigationLinks = document.querySelectorAll(".nav-item[data-page]");

  const pages = document.querySelectorAll(".page");

  navigationLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      const selectedPage = link.dataset.page;

      pages.forEach(function (page) {
        page.classList.remove("active");
      });

      navigationLinks.forEach(function (nav) {
        nav.classList.remove("active");
      });

      const targetPage = document.getElementById(selectedPage + "-page");

      if (targetPage) {
        targetPage.classList.add("active");

        link.classList.add("active");
      }
    });
  });

  // --------------------------------------

  // 4. HTML ESCAPING

  // Protects the interface when displaying

  // player names entered by the user.

  // --------------------------------------

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      const replacements = {
        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;",
      };

      return replacements[character];
    });
  }

  // --------------------------------------

  // 5. ADD PLAYER

  // --------------------------------------

  const playerForm = document.getElementById("player-form");

  playerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document

      .getElementById("player-name")

      .value.trim();

    const level = document.getElementById("player-level").value;

    const studentStatus = document.getElementById("student-status").value;

    if (!name || !level || !studentStatus) {
      showToast("Please complete all player information.");

      return;
    }

    const archivedIndex = archivedPlayers.findIndex(function (item) {
      return (
        String(item.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase()
      );
    });

    let newPlayer;

    if (archivedIndex >= 0) {
      // Restore the same ID so all previous match and payment records remain linked.

      newPlayer = { ...archivedPlayers[archivedIndex] };

      archivedPlayers.splice(archivedIndex, 1);

      newPlayer.name = name;

      newPlayer.level = level;

      newPlayer.studentStatus = studentStatus;

      newPlayer.activeVisitId = crypto.randomUUID();

      newPlayer.returnedAt = new Date().toISOString();
    } else {
      newPlayer = {
        id: crypto.randomUUID(),

        name: name,

        level: level,

        studentStatus: studentStatus,

        activeVisitId: crypto.randomUUID(),

        firstAddedAt: new Date().toISOString(),
      };
    }

    players.push(newPlayer);

    if (!savePlayers() || !saveArchivedPlayers()) {
      players = players.filter((item) => item.id !== newPlayer.id);

      if (archivedIndex >= 0) archivedPlayers.push(newPlayer);

      savePlayers();

      saveArchivedPlayers();

      return;
    }

    playerForm.reset();

    renderPlayers();
    renderQueue();
    updateQueueDropdown();
    updateMatchOptions();
    renderPayments();
    renderHistory();

    showToast(
      archivedIndex >= 0
        ? name +
            " has been restored. Previous match and payment history is preserved."
        : name + " has been successfully added!",
    );
  });

  // --------------------------------------

  // 6. DISPLAY PLAYERS

  // --------------------------------------

  function renderPlayers() {
    const tableBody = document.getElementById("player-table-body");

    const noPlayers = document.getElementById("no-players");

    const searchInput = document.getElementById("player-search");

    const searchTerm = searchInput.value

      .trim()

      .toLowerCase();

    const filteredPlayers = players.filter(function (player) {
      return player.name.toLowerCase().includes(searchTerm);
    });

    tableBody.innerHTML = "";

    if (filteredPlayers.length === 0) {
      noPlayers.style.display = "flex";

      if (players.length > 0 && searchTerm !== "") {
        noPlayers.querySelector("strong").textContent =
          "No matching players found";

        noPlayers.querySelector("p").textContent =
          "Try searching for another name.";
      } else {
        noPlayers.querySelector("strong").textContent =
          "No registered players yet";

        noPlayers.querySelector("p").textContent =
          "Add your first player using the form above.";
      }
    } else {
      noPlayers.style.display = "none";

      filteredPlayers.forEach(function (player, index) {
        const row = document.createElement("tr");

        const statusClass =
          player.studentStatus === "Student"
            ? "student-badge"
            : "student-badge non-student-badge";

        row.innerHTML = `

 

                    <td>${index + 1}</td>

 

 

 

                    <td class="player-name-cell">

 

                        ${escapeHTML(player.name)}

 

                    </td>

 

 

 

                    <td>

 

                        <span class="level-badge">

 

                            ${escapeHTML(player.level)}

 

                        </span>

 

                    </td>

 

 

 

                    <td>

 

                        <span class="${statusClass}">

 

                            ${escapeHTML(player.studentStatus)}

 

                        </span>

 

                    </td>

 

 

 

                    <td>

 

                        <button

 

                            class="delete-btn"

 

                            data-player-id="${escapeHTML(player.id)}"

 

                        >

 

                            Remove

 

                        </button>

 

                    </td>

 

                `;

        tableBody.appendChild(row);
      });
    }

    // Update player counts

    document.getElementById("player-total").textContent = players.length;

    document.getElementById("player-count").textContent =
      players.length + (players.length === 1 ? " Player" : " Players");

    document.getElementById("total-players").textContent = players.length;
  }

  // --------------------------------------

  // 7. SEARCH PLAYER

  // --------------------------------------

  document
    .getElementById("player-search")

    .addEventListener("input", function () {
      renderPlayers();
    });

  // --------------------------------------

  // 8. REMOVE PLAYER

  // --------------------------------------

  document
    .getElementById("player-table-body")

    .addEventListener("click", async function (event) {
      const removeButton = event.target.closest(".delete-btn");

      if (!removeButton) {
        return;
      }

      const playerId = removeButton.dataset.playerId;

      const player = players.find(function (item) {
        return item.id === playerId;
      });

      if (!player) {
        return;
      }

      const confirmDelete = await appConfirm(
        "Are you sure you want to remove " + player.name + "?",
      );

      if (!confirmDelete) {
        return;
      }

      const activeMatch = matches.find(function (match) {
        return (
          match.status === "Playing" &&
          Array.isArray(match.playerIds) &&
          match.playerIds.includes(playerId)
        );
      });

      if (activeMatch) {
        showToast(
          player.name +
            " is currently in Match #" +
            activeMatch.matchNumber +
            ". Finish the match before removing this player.",
        );

        return;
      }

      const oldPlayers = [...players];

      const oldArchived = [...archivedPlayers];

      const oldQueue = [...queue];

      // Archive instead of deleting. Match/payment history remains linked to this player ID.

      archivedPlayers.push({ ...player, archivedAt: new Date().toISOString() });

      players = players.filter((item) => item.id !== playerId);

      queue = queue.filter((item) => item.playerId !== playerId);

      if (!savePlayers() || !saveArchivedPlayers() || !saveQueue()) {
        players = oldPlayers;

        archivedPlayers = oldArchived;

        queue = oldQueue;

        savePlayers();

        saveArchivedPlayers();

        saveQueue();

        return;
      }

      renderPlayers();

      renderQueue();

      renderPayments();

      showToast(
        player.name +
          " was removed from the active list. Their match and payment history was preserved.",
      );
    });

  // --------------------------------------

  // 9. INITIALIZE PLAYER MANAGEMENT

  // --------------------------------------

  // --------------------------------------

  // 9. QUEUE STORAGE

  // --------------------------------------

  const QUEUE_STORAGE_KEY = "badminton_waiting_queue";

  function loadQueue() {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);

      const parsedQueue = savedQueue ? JSON.parse(savedQueue) : [];

      return Array.isArray(parsedQueue) ? parsedQueue : [];
    } catch (error) {
      console.error("Unable to load queue:", error);

      showToast("Queue records could not be read.");

      return [];
    }
  }

  let queue = loadQueue();

  function saveQueue() {
    try {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,

        JSON.stringify(queue),
      );

      return true;
    } catch (error) {
      console.error("Unable to save queue:", error);

      showToast("Unable to save queue records.");

      return false;
    }
  }

  // --------------------------------------

  // 10. UPDATE PLAYER DROPDOWN

  // --------------------------------------

  function updateQueueDropdown() {
    const dropdown = document.getElementById("queue-player");

    const queuedPlayerIds = queue.map(function (item) {
      return item.playerId;
    });

    const activePlayerIds = getPlayersInActiveMatches();

    const availablePlayers = players.filter(function (player) {
      return (
        !queuedPlayerIds.includes(player.id) &&
        !activePlayerIds.includes(player.id)
      );
    });

    dropdown.innerHTML = '<option value="">Choose a registered player</option>';

    availablePlayers.forEach(function (player) {
      const option = document.createElement("option");

      option.value = player.id;

      option.textContent = player.name + " (Level " + player.level + ")";

      dropdown.appendChild(option);
    });

    dropdown.disabled = availablePlayers.length === 0;

    if (availablePlayers.length === 0) {
      dropdown.innerHTML = '<option value="">No available players</option>';
    }
  }

  // --------------------------------------

  // 11. ADD PLAYER TO QUEUE

  // --------------------------------------

  const queueForm = document.getElementById("queue-form");

  queueForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const playerId = document.getElementById("queue-player").value;

    const player = players.find(function (item) {
      return item.id === playerId;
    });

    if (!player) {
      showToast("Please select a registered player.");

      return;
    }

    const alreadyQueued = queue.some(function (item) {
      return item.playerId === playerId;
    });

    if (alreadyQueued) {
      showToast("This player is already in the waiting queue.");

      return;
    }

    const newQueueEntry = {
      id: crypto.randomUUID(),

      playerId: player.id,

      addedAt: new Date().toISOString(),
    };

    queue.push(newQueueEntry);

    if (!saveQueue()) {
      queue.pop();

      return;
    }

    queueForm.reset();

    renderQueue();

    showToast(player.name + " has been added to the waiting queue!");
  });

  // --------------------------------------

  // 12. DISPLAY QUEUE

  // --------------------------------------

  function renderQueue() {
    const tableBody = document.getElementById("queue-table-body");

    const emptyState = document.getElementById("queue-empty");

    tableBody.innerHTML = "";

    if (queue.length === 0) {
      emptyState.style.display = "flex";
    } else {
      emptyState.style.display = "none";

      queue.forEach(function (entry, index) {
        const player = players.find(function (item) {
          return item.id === entry.playerId;
        });

        // Skip entries whose player record no longer exists.

        if (!player) return;

        const row = document.createElement("tr");

        row.innerHTML = `

 

                    <td>

 

                        <span class="queue-position">

 

                            ${index + 1}

 

                        </span>

 

                    </td>

 

 

 

                    <td class="player-name-cell">

 

                        ${escapeHTML(player.name)}

 

                    </td>

 

 

 

                    <td>

 

                        <span class="level-badge">

 

                            ${escapeHTML(player.level)}

 

                        </span>

 

                    </td>

 

 

 

                    <td>

 

                        <span class="${
                          player.studentStatus === "Student"
                            ? "student-badge"
                            : "student-badge non-student-badge"
                        }">

 

                            ${escapeHTML(player.studentStatus)}

 

                        </span>

 

                    </td>

 

 

 

                    <td>

 

                        <span class="waiting-badge">

 

                            Waiting

 

                        </span>

 

                    </td>

 

 

 

                    <td>

 

                        <div class="queue-actions">

 

 

 

                            <button

 

                                class="queue-action-btn"

 

                                data-action="up"

 

                                data-id="${escapeHTML(entry.id)}"

 

                                ${index === 0 ? "disabled" : ""}

 

                                title="Move up"

 

                            >↑</button>

 

 

 

                            <button

 

                                class="queue-action-btn"

 

                                data-action="down"

 

                                data-id="${escapeHTML(entry.id)}"

 

                                ${index === queue.length - 1 ? "disabled" : ""}

 

                                title="Move down"

 

                            >↓</button>

 

 

 

                            <button

 

                                class="queue-action-btn queue-remove-btn"

 

                                data-action="remove"

 

                                data-id="${escapeHTML(entry.id)}"

 

                            >Remove</button>

 

 

 

                        </div>

 

                    </td>

 

                `;

        tableBody.appendChild(row);
      });
    }

    // Update queue counts

    document.getElementById("queue-total").textContent = queue.length;

    document.getElementById("queue-count-label").textContent =
      queue.length + (queue.length === 1 ? " Player" : " Players");

    const dashboardWaitingCount = document.getElementById("waiting-players");

    if (dashboardWaitingCount) {
      dashboardWaitingCount.textContent = queue.length;
    }

    const dashboardQueueCount = document.getElementById("queue-count");

    if (dashboardQueueCount) {
      dashboardQueueCount.textContent =
        queue.length + (queue.length === 1 ? " Player" : " Players");
    }

    // Update the dashboard queue preview only if that panel exists.

    // The dedicated Queue page remains fully functional.

    const dashboardQueue = document.getElementById("queue-list");

    if (dashboardQueue) {
      dashboardQueue.innerHTML = "";

      if (queue.length === 0) {
        dashboardQueue.innerHTML = `

 

                    <div class="empty-state">

 

                        <div>☷</div>

 

                        <strong>Queue is empty</strong>

 

                        <p>Waiting players will appear here.</p>

 

                    </div>

 

                `;
      } else {
        queue.slice(0, 5).forEach(function (entry, index) {
          const player = players.find(function (item) {
            return item.id === entry.playerId;
          });

          if (!player) return;

          const item = document.createElement("div");

          item.className = "dashboard-queue-item";

          item.innerHTML = `

 

                        <span class="queue-position">${index + 1}</span>

 

                        <strong>${escapeHTML(player.name)}</strong>

 

                        <span class="level-badge">

 

                            ${escapeHTML(player.level)}

 

                        </span>

 

                    `;

          dashboardQueue.appendChild(item);
        });
      }
    }

    updateQueueDropdown();
  }

  // --------------------------------------

  // 13. MANUAL QUEUE CONTROL

  // --------------------------------------

  document
    .getElementById("queue-table-body")

    .addEventListener("click", async function (event) {
      const button = event.target.closest("button[data-action]");

      if (!button || button.disabled) return;

      const entryId = button.dataset.id;

      const action = button.dataset.action;

      const index = queue.findIndex(function (item) {
        return item.id === entryId;
      });

      if (index === -1) return;

      const previousQueue = [...queue];

      if (action === "up" && index > 0) {
        [queue[index - 1], queue[index]] = [queue[index], queue[index - 1]];
      } else if (action === "down" && index < queue.length - 1) {
        [queue[index + 1], queue[index]] = [queue[index], queue[index + 1]];
      } else if (action === "remove") {
        const player = players.find(function (item) {
          return item.id === queue[index].playerId;
        });

        const playerName = player ? player.name : "This player";

        const confirmed = await appConfirm(
          "Remove " + playerName + " from the waiting queue?",
        );

        if (!confirmed) return;

        queue.splice(index, 1);
      } else {
        return;
      }

      if (!saveQueue()) {
        queue = previousQueue;

        return;
      }

      renderQueue();
    });

  // --------------------------------------

  // 14. INITIALIZE ALL MODULES

  // --------------------------------------

  // --------------------------------------

  // 14. COURT STORAGE

  // --------------------------------------

  const COURT_STORAGE_KEY = "badminton_courts";

  function loadCourts() {
    try {
      const savedCourts = localStorage.getItem(COURT_STORAGE_KEY);

      const parsedCourts = savedCourts ? JSON.parse(savedCourts) : [];

      return Array.isArray(parsedCourts) ? parsedCourts : [];
    } catch (error) {
      console.error("Unable to load courts:", error);

      showToast("Court records could not be read.");

      return [];
    }
  }

  let courts = loadCourts();

  function saveCourts() {
    try {
      localStorage.setItem(
        COURT_STORAGE_KEY,

        JSON.stringify(courts),
      );

      return true;
    } catch (error) {
      console.error("Unable to save courts:", error);

      showToast("Unable to save court records.");

      return false;
    }
  }

  // --------------------------------------

  // 15. ADD NEW COURT

  // --------------------------------------

  const courtForm = document.getElementById("court-form");

  courtForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const courtName = document

      .getElementById("court-name")

      .value.trim();

    if (!courtName) {
      showToast("Please enter a court name.");

      return;
    }

    const duplicate = courts.some(function (court) {
      return court.name.toLowerCase() === courtName.toLowerCase();
    });

    if (duplicate) {
      showToast("A court with this name already exists.");

      return;
    }

    const newCourt = {
      id: crypto.randomUUID(),

      name: courtName,

      status: "Available",
    };

    courts.push(newCourt);

    if (!saveCourts()) {
      courts.pop();

      return;
    }

    courtForm.reset();

    renderCourts();

    showToast(courtName + " has been successfully added!");
  });

  // --------------------------------------

  // 16. DISPLAY COURTS

  // --------------------------------------

  function renderCourts() {
    const courtList = document.getElementById("court-management-list");

    const emptyState = document.getElementById("no-courts");

    courtList.innerHTML = "";

    const availableCount = courts.filter(function (court) {
      return court.status === "Available";
    }).length;

    const playingCount = courts.filter(function (court) {
      return court.status === "Playing";
    }).length;

    courts.forEach(function (court) {
      const isAvailable = court.status === "Available";

      const card = document.createElement("div");

      card.className = "management-court-card";

      card.innerHTML = `

 

                <div class="court-card-top">

 

                    <div class="court-card-name">

 

                        ${escapeHTML(court.name)}

 

                    </div>

 

 

 

                    <span class="court-status ${
                      isAvailable ? "available" : "playing"
                    }">

 

                        ${escapeHTML(court.status)}

 

                    </span>

 

                </div>

 

 

 

                <div class="court-card-icon">🏸</div>

 

 

 

                <div class="court-card-actions">

 

 

 

                    <button

 

                        class="court-control-btn"

 

                        data-action="rename"

 

                        data-id="${escapeHTML(court.id)}"

 

                    >

 

                        Rename

 

                    </button>

 

 

 

                    <button

 

                        class="court-control-btn status-control"

 

                        data-action="toggle"

 

                        data-id="${escapeHTML(court.id)}"

 

                    >

 

                        ${isAvailable ? "Set Playing" : "Set Available"}

 

                    </button>

 

 

 

                </div>

 

            `;

      courtList.appendChild(card);
    });

    emptyState.style.display = courts.length === 0 ? "flex" : "none";

    // Update court management totals

    document.getElementById("court-total").textContent = courts.length;

    document.getElementById("available-courts").textContent = availableCount;

    document.getElementById("playing-courts").textContent = playingCount;

    document.getElementById("court-count-label").textContent =
      courts.length + (courts.length === 1 ? " Court" : " Courts");

    // Update dashboard preview

    const dashboardCourtList = document.getElementById("court-list");

    dashboardCourtList.innerHTML = "";

    if (courts.length === 0) {
      dashboardCourtList.innerHTML = `

 

                <div class="empty-state">

 

                    <div>🏸</div>

 

                    <strong>No courts added yet</strong>

 

                    <p>Your court information will appear here.</p>

 

                </div>

 

            `;
    } else {
      courts.forEach(function (court) {
        const item = document.createElement("div");

        item.className = "dashboard-court-item";

        item.innerHTML = `

 

                    <div class="dashboard-court-icon">🏸</div>

 

 

 

                    <strong>${escapeHTML(court.name)}</strong>

 

 

 

                    <span class="court-status ${
                      court.status === "Available" ? "available" : "playing"
                    }">

 

                        ${escapeHTML(court.status)}

 

                    </span>

 

                `;

        dashboardCourtList.appendChild(item);
      });
    }

    // Update dashboard court count

    const dashboardCount = document.querySelector(
      "#dashboard-page .count-label",
    );

    if (dashboardCount) {
      dashboardCount.textContent =
        courts.length + (courts.length === 1 ? " Court" : " Courts");
    }
  }

  // --------------------------------------

  // 17. RENAME AND UPDATE COURT STATUS

  // --------------------------------------

  document
    .getElementById("court-management-list")

    .addEventListener("click", async function (event) {
      const button = event.target.closest("button[data-action]");

      if (!button) return;

      const courtId = button.dataset.id;

      const action = button.dataset.action;

      const court = courts.find(function (item) {
        return item.id === courtId;
      });

      if (!court) return;

      const previousCourts = courts.map(function (item) {
        return { ...item };
      });

      if (action === "rename") {
        const newName = await appPrompt(
          "Enter the new court name:",
          court.name,
          "Rename Court",
        );

        if (newName === null) return;

        const trimmedName = newName.trim();

        if (!trimmedName) {
          showToast("Court name cannot be empty.");

          return;
        }

        const duplicate = courts.some(function (item) {
          return (
            item.id !== courtId &&
            item.name.toLowerCase() === trimmedName.toLowerCase()
          );
        });

        if (duplicate) {
          showToast("Another court already uses this name.");

          return;
        }

        court.name = trimmedName;
      } else if (action === "toggle") {
        const activeMatch = matches.some(function (match) {
          return match.courtId === courtId && match.status === "Playing";
        });

        if (activeMatch) {
          showToast("This court has an active match. Finish the match first.");

          return;
        }

        court.status = court.status === "Available" ? "Playing" : "Available";
      } else {
        return;
      }

      if (!saveCourts()) {
        courts = previousCourts;

        return;
      }

      renderCourts();
    });

  // --------------------------------------

  // 18. MATCH AND PAYMENT STORAGE

  // --------------------------------------

  const MATCH_STORAGE_KEY = "badminton_matches";

  const PAYMENT_STORAGE_KEY = "badminton_payments";

  function loadMatches() {
    try {
      const data = JSON.parse(localStorage.getItem(MATCH_STORAGE_KEY) || "[]");

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Unable to load matches:", error);

      showToast("Match records could not be read.");

      return [];
    }
  }

  let matches = loadMatches();

  // SESSION MANAGEMENT: preserve every session, match, and payment.

  const SESSION_STORAGE_KEY = "badminton_sessions";

  const CURRENT_SESSION_KEY = "badminton_current_session_id";

  function loadSessions() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SESSION_STORAGE_KEY) || "[]",
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Unable to load sessions:", error);

      return [];
    }
  }

  let sessions = loadSessions();

  let currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY);

  if (!sessions.length) {
    const legacyDate = matches.length
      ? matches[0].startTime || new Date().toISOString()
      : new Date().toISOString();

    sessions.push({
      id: crypto.randomUUID(),

      number: 1,

      name: "Session 1",

      startedAt: legacyDate,

      endedAt: null,

      status: "Active",

      legacy: true,
    });
  }

  let currentSession = sessions.find(
    (item) => item.id === currentSessionId && item.status === "Active",
  );

  if (!currentSession) {
    currentSession = sessions.find((item) => item.status === "Active") || null;
  }

  // If all saved sessions have ended, keep the system closed until

  // the Queue Master explicitly starts the next session.

  currentSessionId = currentSession ? currentSession.id : null;

  // Existing records are kept and assigned to the first (legacy) session only once.

  matches.forEach((match) => {
    if (!match.sessionId) match.sessionId = sessions[0].id;
  });

  function saveSessions() {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));

      localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId || "");

      return true;
    } catch (error) {
      console.error("Unable to save sessions:", error);

      showToast(
        "Unable to save session information. Please check browser storage.",
      );

      return false;
    }
  }

  saveSessions();

  function saveMatches() {
    try {
      localStorage.setItem(
        MATCH_STORAGE_KEY,

        JSON.stringify(matches),
      );

      return true;
    } catch (error) {
      showToast("Unable to save match records.");

      console.error(error);

      return false;
    }
  }

  function loadMatchPayments() {
    try {
      const data = JSON.parse(
        localStorage.getItem(PAYMENT_STORAGE_KEY) || "[]",
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Unable to load payments:", error);

      showToast("Payment records could not be read.");

      return [];
    }
  }

  let matchPayments = loadMatchPayments();

  matchPayments.forEach((payment) => {
    if (!payment.sessionId) payment.sessionId = sessions[0].id;
  });

  function saveMatchPayments() {
    try {
      localStorage.setItem(
        PAYMENT_STORAGE_KEY,

        JSON.stringify(matchPayments),
      );

      return true;
    } catch (error) {
      showToast("Unable to save payment records.");

      console.error(error);

      return false;
    }
  }

  // --------------------------------------
  // REAL-TIME SYNC BETWEEN OPEN APP TABS
  // --------------------------------------
  window.addEventListener("storage", function (event) {
    const watchedKeys = [
      STORAGE_KEY,
      ARCHIVED_PLAYER_STORAGE_KEY,
      QUEUE_STORAGE_KEY,
      COURT_STORAGE_KEY,
      MATCH_STORAGE_KEY,
      PAYMENT_STORAGE_KEY,
      SESSION_STORAGE_KEY,
      CURRENT_SESSION_KEY,
    ];
    if (event.key !== null && !watchedKeys.includes(event.key)) return;

    players = loadPlayers();
    archivedPlayers = loadArchivedPlayers();
    queue = loadQueue();
    courts = loadCourts();
    matches = loadMatches();
    matchPayments = loadMatchPayments();
    sessions = loadSessions();
    currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
    currentSession =
      sessions.find(
        (item) => item.id === currentSessionId && item.status === "Active",
      ) ||
      sessions.find((item) => item.status === "Active") ||
      null;
    currentSessionId = currentSession ? currentSession.id : null;

    renderPlayers();
    renderQueue();
    updateQueueDropdown();
    renderCourts();
    renderMatches();
    renderPayments();
    renderHistory();
    updateMatchOptions();
    renderSessionManagement();
  });

  // --------------------------------------

  // 19. GET PLAYERS IN ACTIVE MATCHES

  // --------------------------------------

  function getPlayersInActiveMatches() {
    const activePlayers = [];

    matches

      .filter(function (match) {
        return match.status === "Playing";
      })

      .forEach(function (match) {
        activePlayers.push(...match.playerIds);
      });

    return activePlayers;
  }

  // --------------------------------------

  // 20. UPDATE MATCH DROPDOWNS

  // --------------------------------------

  // ==========================================

  // LEVEL-BASED MATCH PLAYER SELECTION

  // ==========================================

  let selectedMatchLevel = "All";

  let selectedStudentFilter = "All";

  let teamASelections = [];

  let teamBSelections = [];

  const teamASelectIds = ["team-a-player-1", "team-a-player-2"];

  const teamBSelectIds = ["team-b-player-1", "team-b-player-2"];

  // ------------------------------------------

  // UPDATE COURT AND HIDDEN PLAYER SELECTS

  // ------------------------------------------

  function updateMatchOptions() {
    const courtDropdown = document.getElementById("match-court");

    const previousCourt = courtDropdown.value;

    courtDropdown.innerHTML =
      '<option value="">Choose an available court</option>';

    courts

      .filter((court) => court.status === "Available")

      .forEach((court) => {
        const option = document.createElement("option");

        option.value = court.id;

        option.textContent = court.name;

        courtDropdown.appendChild(option);
      });

    if (
      courts.some(
        (court) => court.id === previousCourt && court.status === "Available",
      )
    ) {
      courtDropdown.value = previousCourt;
    }

    syncMatchSelects();

    renderMatchPlayerPool();

    renderTeamSelections();
  }

  // ------------------------------------------

  // SYNCHRONIZE TEAM ASSIGNMENTS

  // WITH EXISTING MATCH PROCESSING

  // ------------------------------------------

  function syncMatchSelects() {
    const selections = [...teamASelections, ...teamBSelections];

    const selectIds = [...teamASelectIds, ...teamBSelectIds];

    selectIds.forEach((id, index) => {
      const dropdown = document.getElementById(id);

      dropdown.innerHTML = "";

      const option = document.createElement("option");

      option.value = selections[index] || "";

      option.textContent = selections[index] || "";

      dropdown.appendChild(option);

      dropdown.value = selections[index] || "";
    });
  }

  // ------------------------------------------

  // GET PLAYERS ALREADY SELECTED

  // ------------------------------------------

  function getAssignedPlayerIds() {
    return [...teamASelections, ...teamBSelections];
  }

  // ------------------------------------------

  // RENDER TEAM A AND TEAM B

  // ------------------------------------------

  function renderTeamSelections() {
    const teamAContainer = document.getElementById("team-a-slots");

    const teamBContainer = document.getElementById("team-b-slots");

    function createTeamSlots(teamIds, teamName) {
      const slots = [];

      for (let index = 0; index < 2; index++) {
        const playerId = teamIds[index];

        if (playerId) {
          const player = players.find((item) => item.id === playerId);

          if (player) {
            slots.push(`

 

                            <div class="selected-team-player">

 

                                <span>

 

                                    ♙ ${escapeHTML(player.name)}

 

                                    <small>

 

                                        (Level ${escapeHTML(player.level)})

 

                                    </small>

 

                                </span>

 

 

 

                                <button

 

                                    type="button"

 

                                    class="remove-team-player"

 

                                    data-remove-team="${teamName}"

 

                                    data-player-id="${escapeHTML(playerId)}"

 

                                    title="Remove player"

 

                                >×</button>

 

                            </div>

 

                        `);
          }
        } else {
          slots.push(`

 

                        <div class="team-empty-slot">

 

                            + Select a player below

 

                        </div>

 

                    `);
        }
      }

      return slots.join("");
    }

    teamAContainer.innerHTML = createTeamSlots(teamASelections, "A");

    teamBContainer.innerHTML = createTeamSlots(teamBSelections, "B");

    document.getElementById("team-a-count").textContent =
      teamASelections.length + "/2";

    document.getElementById("team-b-count").textContent =
      teamBSelections.length + "/2";

    syncMatchSelects();
  }

  // ------------------------------------------

  // ADD PLAYER TO A TEAM

  // ------------------------------------------

  function assignPlayerToTeam(playerId, teamName) {
    const player = players.find((item) => item.id === playerId);

    if (!player) return;

    const allAssigned = getAssignedPlayerIds();

    if (allAssigned.includes(playerId)) {
      showToast("This player has already been assigned to a team.");

      return;
    }

    if (selectedMatchLevel !== "All" && player.level !== selectedMatchLevel) {
      showToast("This player does not belong to the selected match level.");

      return;
    }

    if (getPlayersInActiveMatches().includes(playerId)) {
      showToast("This player is currently playing in another match.");

      return;
    }

    if (teamName === "A") {
      if (teamASelections.length >= 2) {
        showToast("Team A already has two players.");

        return;
      }

      teamASelections.push(playerId);
    } else if (teamName === "B") {
      if (teamBSelections.length >= 2) {
        showToast("Team B already has two players.");

        return;
      }

      teamBSelections.push(playerId);
    }

    renderTeamSelections();

    renderMatchPlayerPool();
  }

  // ------------------------------------------

  // REMOVE PLAYER FROM A TEAM

  // ------------------------------------------

  document
    .getElementById("match-form")

    .addEventListener("click", function (event) {
      const button = event.target.closest(".remove-team-player");

      if (!button) return;

      const playerId = button.dataset.playerId;

      const team = button.dataset.removeTeam;

      if (team === "A") {
        teamASelections = teamASelections.filter((id) => id !== playerId);
      } else {
        teamBSelections = teamBSelections.filter((id) => id !== playerId);
      }

      renderTeamSelections();

      renderMatchPlayerPool();
    });

  // ------------------------------------------

  // PLAYER LEVEL FILTER

  // ------------------------------------------

  document
    .getElementById("match-level-filter")

    .addEventListener("click", async function (event) {
      const button = event.target.closest(".level-filter-btn");

      if (!button) return;

      const newLevel = button.dataset.level;

      if (newLevel === selectedMatchLevel) return;

      const hasAssignments =
        teamASelections.length > 0 || teamBSelections.length > 0;

      if (hasAssignments) {
        const confirmed = await appConfirm(
          "Changing the match level will clear your current team selections. Continue?",
        );

        if (!confirmed) return;

        teamASelections = [];

        teamBSelections = [];
      }

      selectedMatchLevel = newLevel;

      document
        .querySelectorAll(".level-filter-btn")

        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      renderTeamSelections();

      renderMatchPlayerPool();
    });

  // ------------------------------------------

  // STUDENT STATUS FILTER

  // ------------------------------------------

  document
    .getElementById("match-student-filter")

    .addEventListener("click", function (event) {
      const button = event.target.closest(".student-filter-btn");

      if (!button) return;

      selectedStudentFilter = button.dataset.status;

      document
        .querySelectorAll(".student-filter-btn")

        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      renderMatchPlayerPool();
    });

  // ------------------------------------------

  // PLAYER SEARCH

  // ------------------------------------------

  document
    .getElementById("match-player-search")

    .addEventListener("input", function () {
      renderMatchPlayerPool();
    });

  // ------------------------------------------

  // DISPLAY AVAILABLE PLAYERS

  // ------------------------------------------

  function renderMatchPlayerPool() {
    const container = document.getElementById("available-match-players");

    const emptyState = document.getElementById("no-match-players");

    const searchTerm = document
      .getElementById("match-player-search")
      .value.trim()
      .toLowerCase();

    const assignedPlayers = getAssignedPlayerIds();

    const activePlayers = getPlayersInActiveMatches();

    const availablePlayers = players.filter(function (player) {
      const correctLevel =
        selectedMatchLevel === "All" || player.level === selectedMatchLevel;

      const correctStatus =
        selectedStudentFilter === "All" ||
        player.studentStatus === selectedStudentFilter;

      const correctSearch = player.name.toLowerCase().includes(searchTerm);

      const notAssigned = !assignedPlayers.includes(player.id);

      const notPlaying = !activePlayers.includes(player.id);

      return (
        correctLevel &&
        correctStatus &&
        correctSearch &&
        notAssigned &&
        notPlaying
      );
    });

    const title =
      selectedMatchLevel === "All"
        ? "Available Players (All Levels)"
        : "Available Players (Level " + selectedMatchLevel + ")";

    document.getElementById("available-player-title").textContent = title;

    container.innerHTML = "";

    emptyState.style.display = availablePlayers.length === 0 ? "flex" : "none";

    availablePlayers.forEach(function (player) {
      const card = document.createElement("div");

      card.className = "match-player-card";

      const studentClass =
        player.studentStatus === "Student" ? "student" : "non-student";

      card.innerHTML = `

 

                <div class="match-player-card-name">

 

                    ♙ ${escapeHTML(player.name)}

 

                </div>

 

 

 

                <div class="match-player-card-level">

 

                    Level ${escapeHTML(player.level)}

 

                </div>

 

 

 

                <span class="match-player-card-status ${studentClass}">

 

                    ${escapeHTML(player.studentStatus)}

 

                </span>

 

 

 

                <div class="match-player-add-actions">

 

 

 

                    <button

 

                        type="button"

 

                        data-add-player="${escapeHTML(player.id)}"

 

                        data-team="A"

 

                        ${teamASelections.length >= 2 ? "disabled" : ""}

 

                    >

 

                        + Team A

 

                    </button>

 

 

 

                    <button

 

                        type="button"

 

                        class="add-to-b"

 

                        data-add-player="${escapeHTML(player.id)}"

 

                        data-team="B"

 

                        ${teamBSelections.length >= 2 ? "disabled" : ""}

 

                    >

 

                        + Team B

 

                    </button>

 

 

 

                </div>

 

            `;

      container.appendChild(card);
    });
  }

  // ------------------------------------------

  // AVAILABLE PLAYER CARD ACTIONS

  // ------------------------------------------

  document
    .getElementById("available-match-players")

    .addEventListener("click", function (event) {
      const button = event.target.closest("button[data-add-player]");

      if (!button || button.disabled) return;

      const playerId = button.dataset.addPlayer;

      const teamName = button.dataset.team;

      assignPlayerToTeam(playerId, teamName);
    });

  // ------------------------------------------

  // CLEAR MATCH FORM

  // ------------------------------------------

  document
    .getElementById("match-form")

    .addEventListener("reset", function () {
      teamASelections = [];

      teamBSelections = [];

      selectedMatchLevel = "All";

      selectedStudentFilter = "All";

      document
        .querySelectorAll(".level-filter-btn")

        .forEach((button) => {
          button.classList.toggle(
            "active",

            button.dataset.level === "All",
          );
        });

      document
        .querySelectorAll(".student-filter-btn")

        .forEach((button) => {
          button.classList.toggle(
            "active",

            button.dataset.status === "All",
          );
        });

      document.getElementById("match-player-search").value = "";

      renderTeamSelections();

      renderMatchPlayerPool();
    });

  // --------------------------------------

  // 21. CREATE MATCH

  // --------------------------------------

  const matchForm = document.getElementById("match-form");

  matchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const courtId = document.getElementById("match-court").value;

    const playerIds = [
      document.getElementById("team-a-player-1").value,

      document.getElementById("team-a-player-2").value,

      document.getElementById("team-b-player-1").value,

      document.getElementById("team-b-player-2").value,
    ];

    const shuttleFee = Number(document.getElementById("shuttle-fee").value);

    // Validate court

    const court = courts.find(function (item) {
      return item.id === courtId;
    });

    if (!court || court.status !== "Available") {
      showToast("Please select an available court.");

      return;
    }

    // Require exactly four players

    if (
      playerIds.some(function (id) {
        return !id;
      })
    ) {
      showToast("Please select all four players.");

      return;
    }

    // Prevent duplicate players

    if (new Set(playerIds).size !== 4) {
      showToast("Each player must be different. Please check your selections.");

      return;
    }

    // Prevent players from joining simultaneous matches

    const activePlayerIds = getPlayersInActiveMatches();

    if (
      playerIds.some(function (id) {
        return activePlayerIds.includes(id);
      })
    ) {
      showToast("One or more selected players are already playing.");

      return;
    }

    // Verify registered players

    const selectedPlayers = playerIds.map(function (id) {
      return players.find(function (player) {
        return player.id === id;
      });
    });

    if (
      selectedPlayers.some(function (player) {
        return !player;
      })
    ) {
      showToast("One or more players are no longer registered.");

      return;
    }

    // Save player information with the match

    const playerSnapshots = selectedPlayers.map(function (player) {
      return {
        id: player.id,

        name: player.name,

        level: player.level,

        studentStatus: player.studentStatus,
      };
    });

    const previousMatches = [...matches];

    const previousCourts = courts.map(function (item) {
      return { ...item };
    });

    const previousQueue = [...queue];

    if (!currentSession) {
      showToast(
        "There is no active session. Please start a new session from the Dashboard first.",
      );

      return;
    }

    const matchNumber =
      matches.filter((item) => item.sessionId === currentSessionId).length + 1;

    const newMatch = {
      id: crypto.randomUUID(),

      matchNumber: matchNumber,

      sessionId: currentSessionId,

      courtId: court.id,

      courtName: court.name,

      playerIds: playerIds,

      players: playerSnapshots,

      teamA: [playerSnapshots[0], playerSnapshots[1]],

      teamB: [playerSnapshots[2], playerSnapshots[3]],

      shuttleFee: shuttleFee,

      status: "Playing",

      startTime: new Date().toISOString(),

      endTime: null,
    };

    matches.push(newMatch);

    // Automatically mark court as playing

    court.status = "Playing";

    // Remove selected players from the waiting queue

    queue = queue.filter(function (entry) {
      return !playerIds.includes(entry.playerId);
    });

    // Save all related data

    if (!saveMatches() || !saveCourts() || !saveQueue()) {
      matches = previousMatches;

      courts = previousCourts;

      queue = previousQueue;

      saveMatches();

      saveCourts();

      saveQueue();

      renderCourts();

      renderQueue();

      updateMatchOptions();

      return;
    }

    matchForm.reset();

    renderMatches();

    renderCourts();

    renderQueue();

    updateMatchOptions();

    showToast(
      "Match #" +
        matchNumber +
        " has successfully started on " +
        court.name +
        "!",
    );
  });

  // --------------------------------------

  // 22. DISPLAY ACTIVE AND COMPLETED MATCHES

  // --------------------------------------

  function renderMatches() {
    const activeList = document.getElementById("active-match-list");

    const completedBody = document.getElementById("completed-match-body");

    const noActive = document.getElementById("no-active-matches");

    const noCompleted = document.getElementById("no-completed-matches");

    const activeMatches = matches.filter(function (match) {
      return match.status === "Playing";
    });

    const completedMatches = matches.filter(function (match) {
      return match.status === "Completed";
    });

    activeList.innerHTML = "";

    completedBody.innerHTML = "";

    noActive.style.display = activeMatches.length === 0 ? "flex" : "none";

    noCompleted.style.display = completedMatches.length === 0 ? "flex" : "none";

    // Active match cards

    activeMatches.forEach(function (match) {
      const card = document.createElement("div");

      card.className = "active-match-card";

      const teamAHTML = match.teamA
        .map(function (player) {
          return `<div class="match-player-name">

 

                    ${escapeHTML(player.name)}

 

                </div>`;
        })
        .join("");

      const teamBHTML = match.teamB
        .map(function (player) {
          return `<div class="match-player-name">

 

                    ${escapeHTML(player.name)}

 

                </div>`;
        })
        .join("");

      card.innerHTML = `

 

                <div class="match-card-header">

 

                    <strong>MATCH #${match.matchNumber}</strong>

 

                    <span class="match-live-badge">● PLAYING</span>

 

                </div>

 

 

 

                <div class="match-info">

 

                    <span>🏸 ${escapeHTML(match.courtName)}</span>

 

                    <span>Started: ${new Date(
                      match.startTime,
                    ).toLocaleTimeString(
                      "en-PH",

                      { hour: "2-digit", minute: "2-digit" },
                    )}</span>

 

                </div>

 

 

 

                <div class="match-team">

 

                    <div class="match-team-label">TEAM A</div>

 

                    ${teamAHTML}

 

                </div>

 

 

 

                <div class="match-vs">VS</div>

 

 

 

                <div class="match-team match-team-b">

 

                    <div class="match-team-label">TEAM B</div>

 

                    ${teamBHTML}

 

                </div>

 

 

 

                <div class="match-info">

 

                    <span>Shuttlecock: ₱${match.shuttleFee.toFixed(2)}</span>

 

                    <span>4 Players</span>

 

                </div>

 

 

 

                <button

 

                    class="finish-match-btn"

 

                    data-match-id="${escapeHTML(match.id)}"

 

                >

 

                    ✓ Finish Match

 

                </button>

 

            `;

      activeList.appendChild(card);
    });

    // Completed match table

    completedMatches
      .slice()
      .reverse()
      .forEach(function (match) {
        const row = document.createElement("tr");

        const teamA = match.teamA
          .map(function (player) {
            return escapeHTML(player.name);
          })
          .join(" + ");

        const teamB = match.teamB
          .map(function (player) {
            return escapeHTML(player.name);
          })
          .join(" + ");

        row.innerHTML = `

 

                <td>#${match.matchNumber}</td>

 

                <td>${escapeHTML(match.courtName)}</td>

 

                <td>${teamA}</td>

 

                <td>${teamB}</td>

 

                <td>${new Date(match.endTime).toLocaleString("en-PH")}</td>

 

                <td>

 

                    <span class="court-status available">

 

                        Completed

 

                    </span>

 

                </td>

 

            `;

        completedBody.appendChild(row);
      });

    // Update match counters

    document.getElementById("match-total").textContent = matches.length;

    document.getElementById("active-match-total").textContent =
      activeMatches.length;

    document.getElementById("completed-match-total").textContent =
      completedMatches.length;

    document.getElementById("active-match-label").textContent =
      activeMatches.length + " Active";

    document.getElementById("completed-match-label").textContent =
      completedMatches.length + " Completed";

    document.getElementById("active-matches").textContent =
      activeMatches.length;

    updateMatchOptions();
  }

  // --------------------------------------

  // 23. FINISH MATCH AND CREATE PAYMENTS

  // --------------------------------------

  document
    .getElementById("active-match-list")

    .addEventListener("click", async function (event) {
      const button = event.target.closest(".finish-match-btn");

      if (!button) return;

      const matchId = button.dataset.matchId;

      const match = matches.find(function (item) {
        return item.id === matchId && item.status === "Playing";
      });

      if (!match) return;

      const confirmed = await appConfirm(
        "Finish Match #" +
          match.matchNumber +
          " on " +
          match.courtName +
          "?\n\n" +
          "This will release the court and create player payment records.",
      );

      if (!confirmed) return;

      const court = courts.find(function (item) {
        return item.id === match.courtId;
      });

      const previousMatches = [...matches];

      const previousCourts = courts.map(function (item) {
        return { ...item };
      });

      const previousPayments = [...matchPayments];

      // Calculate each player's fee

      const newPayments = match.players

        .filter(
          (player) =>
            !matchPayments.some(
              (payment) =>
                payment.matchId === match.id && payment.playerId === player.id,
            ),
        )

        .map(function (player) {
          const amount =
            player.studentStatus === "Student"
              ? Math.max(0, match.shuttleFee - 5)
              : match.shuttleFee;

          const teamA = match.teamA || [];

          const teamB = match.teamB || [];

          const isTeamA = teamA.some((item) => item.id === player.id);

          const ownTeam = isTeamA ? teamA : teamB;

          const otherTeam = isTeamA ? teamB : teamA;

          return {
            id: crypto.randomUUID(),

            matchId: match.id,

            sessionId: match.sessionId || currentSessionId,

            matchNumber: match.matchNumber,

            playerId: player.id,

            playerName: player.name,

            visitId:
              (players.find((item) => item.id === player.id) || {})
                .activeVisitId || null,

            courtId: match.courtId,

            courtName: match.courtName,

            partners: ownTeam
              .filter((item) => item.id !== player.id)
              .map((item) => item.name),

            opponents: otherTeam.map((item) => item.name),

            amount: amount,

            status: "Unpaid",

            createdAt: new Date().toISOString(),
          };
        });

      match.status = "Completed";

      match.endTime = new Date().toISOString();

      // Release court

      if (court) {
        court.status = "Available";
      }

      matchPayments.push(...newPayments);

      if (!saveMatches() || !saveCourts() || !saveMatchPayments()) {
        matches = previousMatches;

        courts = previousCourts;

        matchPayments = previousPayments;

        saveMatches();

        saveCourts();

        saveMatchPayments();

        renderMatches();

        renderCourts();

        return;
      }

      renderMatches();

      renderCourts();

      renderQueue();

      renderPayments();

      renderHistory();

      showToast(
        "Match #" +
          match.matchNumber +
          " completed!\n\n" +
          "Four player payment records have been created.",
      );
    });

  // --------------------------------------

  // 24. INITIALIZE MATCH MANAGEMENT

  // --------------------------------------

  renderMatches();

  // --------------------------------------

  // STEP 7: PLAYER-CENTRED PAYMENT MANAGEMENT

  function formatCurrency(amount) {
    return "₱" + Number(amount || 0).toFixed(2);
  }

  function getPlayerMatches(playerId) {
    const liveMatches = matches.filter(function (match) {
      const allPlayers = [
        ...(Array.isArray(match.players) ? match.players : []),
        ...(Array.isArray(match.teamA) ? match.teamA : []),
        ...(Array.isArray(match.teamB) ? match.teamB : []),
      ];
      const ids = Array.isArray(match.playerIds) ? match.playerIds : [];
      return (
        match.status === "Completed" &&
        (ids.includes(playerId) ||
          allPlayers.some((player) => player && player.id === playerId))
      );
    });
    const archivedMatches = sessions
      .flatMap((session) =>
        session.summary && Array.isArray(session.summary.matches)
          ? session.summary.matches
          : [],
      )
      .filter((match) => {
        const allPlayers = [
          ...(Array.isArray(match.players) ? match.players : []),
          ...(Array.isArray(match.teamA) ? match.teamA : []),
          ...(Array.isArray(match.teamB) ? match.teamB : []),
        ];
        const ids = Array.isArray(match.playerIds) ? match.playerIds : [];
        return (
          ids.includes(playerId) ||
          allPlayers.some((player) => player && player.id === playerId)
        );
      });
    const unique = new Map();
    [...archivedMatches, ...liveMatches].forEach((match) =>
      unique.set(match.id, match),
    );
    return [...unique.values()].sort(
      (a, b) =>
        new Date(b.endTime || b.startTime || 0) -
        new Date(a.endTime || a.startTime || 0),
    );
  }

  function getPlayerPaymentSummary(playerId) {
    const archivedPayments = sessions.flatMap((session) =>
      session.summary && Array.isArray(session.summary.payments)
        ? session.summary.payments
        : [],
    );
    const recordsById = new Map();
    [...archivedPayments, ...matchPayments]
      .filter((payment) => payment.playerId === playerId)
      .forEach((payment) =>
        recordsById.set(
          payment.id ||
            payment.sessionId + "-" + payment.matchId + "-" + payment.playerId,
          payment,
        ),
      );
    const records = [...recordsById.values()];

    const totalFees = records.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const totalPaid = records
      .filter((item) => item.status === "Paid")

      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const balance = records
      .filter((item) => item.status !== "Paid")

      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      records: records,

      totalFees: totalFees,

      totalPaid: totalPaid,

      balance: balance,

      matchCount: getPlayerMatches(playerId).length,
    };
  }

  function ensurePlayerHistoryModal() {
    let modal = document.getElementById("player-history-modal");

    if (modal) return modal;

    modal = document.createElement("div");

    modal.id = "player-history-modal";

    modal.className = "player-history-modal";

    modal.innerHTML = `

 

            <div class="player-history-dialog" role="dialog" aria-modal="true">

 

                <div class="player-history-header">

 

                    <div>

 

                        <span class="history-eyebrow">PLAYER RECORD</span>

 

                        <h2 id="player-history-title">Player History</h2>

 

                        <p id="player-history-subtitle"></p>

 

                    </div>

 

                    <button type="button" class="history-modal-close" aria-label="Close">×</button>

 

                </div>

 

                <div id="player-history-content"></div>

 

            </div>`;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (
        event.target === modal ||
        event.target.closest(".history-modal-close")
      ) {
        modal.classList.remove("open");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") modal.classList.remove("open");
    });

    return modal;
  }

  function openPlayerHistory(playerId) {
    const player = [...players, ...archivedPlayers].find(
      (item) => item.id === playerId,
    );

    if (!player) return;

    const modal = ensurePlayerHistoryModal();

    const summary = getPlayerPaymentSummary(playerId);

    const playerMatches = getPlayerMatches(playerId);

    document.getElementById("player-history-title").textContent = player.name;

    document.getElementById("player-history-subtitle").textContent =
      playerMatches.length +
      " completed match(es) · " +
      (player.archivedAt ? "Archived player record" : "Active player record");

    const matchCards = playerMatches
      .map(function (match) {
        const teamA = match.teamA || [];

        const teamB = match.teamB || [];

        const onTeamA = teamA.some((item) => item.id === playerId);

        const ownTeam = onTeamA ? teamA : teamB;

        const opponents = onTeamA ? teamB : teamA;

        const partners = ownTeam
          .filter((item) => item.id !== playerId)
          .map((item) => item.name);

        const dateText =
          match.endTime || match.startTime
            ? new Date(match.endTime || match.startTime).toLocaleString(
                "en-PH",
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                },
              )
            : "Date unavailable";

        const payment = matchPayments.find(
          (item) => item.matchId === match.id && item.playerId === playerId,
        );

        return `

 

                <article class="player-history-match">

 

                    <div class="player-history-match-top">

 

                        <strong>Match #${escapeHTML(String(match.matchNumber ?? "—"))}</strong>

 

                        <span class="history-court-pill">${escapeHTML(match.courtName || "Court not recorded")}</span>

 

                    </div>

 

                    <p class="player-history-date">${escapeHTML(dateText)}</p>

 

                    <div class="history-team-line">

 

                        <span class="history-team-label">YOUR TEAM</span>

 

                        <strong>${escapeHTML(player.name)}${partners.length ? " + " + escapeHTML(partners.join(" + ")) : ""}</strong>

 

                    </div>

 

                    <div class="history-vs">VS</div>

 

                    <div class="history-team-line opponent">

 

                        <span class="history-team-label">OPPONENTS</span>

 

                        <strong>${escapeHTML(opponents.map((item) => item.name).join(" + ") || "Not recorded")}</strong>

 

                    </div>

 

                    <div class="player-history-match-footer">

 

                        <span>Fee: ${formatCurrency(payment ? payment.amount : match.shuttleFee)}</span>

 

                        <span class="payment-badge ${payment && payment.status === "Paid" ? "paid" : "unpaid"}">

 

                            ${payment ? escapeHTML(payment.status) : "No payment record"}

 

                        </span>

 

                    </div>

 

                </article>`;
      })
      .join("");

    const paymentRows = summary.records
      .slice()

      .sort((a, b) => Number(a.matchNumber || 0) - Number(b.matchNumber || 0))

      .map(
        (payment) => `

 

                <tr>

 

                    <td>#${escapeHTML(String(payment.matchNumber ?? "—"))}</td>

 

                    <td>${escapeHTML(payment.courtName || "—")}</td>

 

                    <td>${formatCurrency(payment.amount)}</td>

 

                    <td><span class="payment-badge ${payment.status === "Paid" ? "paid" : "unpaid"}">${escapeHTML(payment.status || "Unpaid")}</span></td>

 

                </tr>`,
      )
      .join("");

    document.getElementById("player-history-content").innerHTML = `

 

            <div class="player-history-summary-grid">

 

                <div class="player-history-summary-card"><span>Matches Played</span><strong>${summary.matchCount}</strong></div>

 

                <div class="player-history-summary-card"><span>Total Fees</span><strong>${formatCurrency(summary.totalFees)}</strong></div>

 

                <div class="player-history-summary-card"><span>Already Paid</span><strong>${formatCurrency(summary.totalPaid)}</strong></div>

 

                <div class="player-history-summary-card balance"><span>Remaining Balance</span><strong>${formatCurrency(summary.balance)}</strong></div>

 

            </div>

 

            <section class="player-history-section">

 

                <h3>Match-by-Match History</h3>

 

                <p>Each record shows the court, teammate, opponents, and date.</p>

 

                ${matchCards || '<div class="history-empty-note">No completed matches recorded for this player yet.</div>'}

 

            </section>

 

            <section class="player-history-section">

 

                <h3>Payment Breakdown</h3>

 

                <div class="table-wrapper">

 

                    <table class="player-table">

 

                        <thead><tr><th>MATCH</th><th>COURT</th><th>FEE</th><th>STATUS</th></tr></thead>

 

                        <tbody>${paymentRows || '<tr><td colspan="4">No payment records yet.</td></tr>'}</tbody>

 

                    </table>

 

                </div>

 

            </section>`;

    modal.classList.add("open");
  }

  function renderPayments() {
    const tableBody = document.getElementById("payment-table-body");

    const emptyState = document.getElementById("no-payments");

    const searchInput = document.getElementById("payment-search");

    const statusFilter = document.getElementById("payment-status-filter");

    if (!tableBody || !emptyState) return;

    const knownPlayers = [...players, ...archivedPlayers];

    const idsFromPayments = matchPayments.map((item) => item.playerId);

    const idsFromMatches = matches

      .filter((match) => match.status === "Completed")

      .flatMap((match) => (match.players || []).map((player) => player.id));

    const allIds = [...new Set([...idsFromPayments, ...idsFromMatches])];

    const summaries = allIds.map(function (playerId) {
      const player = knownPlayers.find((item) => item.id === playerId);

      const summary = getPlayerPaymentSummary(playerId);

      const fallback = summary.records[0];

      return {
        playerId: playerId,

        playerName: player
          ? player.name
          : fallback
            ? fallback.playerName
            : "Unknown Player",

        archived: !players.some((item) => item.id === playerId),

        ...summary,
      };
    });

    const totalCollected = matchPayments

      .filter((item) => item.status === "Paid")

      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalUnpaid = matchPayments

      .filter((item) => item.status !== "Paid")

      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    document.getElementById("payment-total-collected").textContent =
      formatCurrency(totalCollected);

    document.getElementById("payment-total-unpaid").textContent =
      formatCurrency(totalUnpaid);

    document.getElementById("payment-total-transactions").textContent =
      summaries.length;

    document.getElementById("payment-count").textContent =
      summaries.length + (summaries.length === 1 ? " Player" : " Players");

    const dashboardCollected = document.getElementById("total-collected");

    const dashboardUnpaid = document.getElementById("total-unpaid");

    const dashboardBalance = document.getElementById("unpaid-balance");

    if (dashboardCollected)
      dashboardCollected.textContent = formatCurrency(totalCollected);

    if (dashboardUnpaid)
      dashboardUnpaid.textContent = formatCurrency(totalUnpaid);

    if (dashboardBalance)
      dashboardBalance.textContent = formatCurrency(totalUnpaid);

    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filter = statusFilter ? statusFilter.value : "All";

    const visible = summaries
      .filter(function (item) {
        const searchMatch = item.playerName.toLowerCase().includes(term);

        const statusMatch =
          filter === "All" ||
          (filter === "Unpaid" && item.balance > 0) ||
          (filter === "Paid" && item.balance === 0);

        return searchMatch && statusMatch;
      })
      .sort((a, b) => a.playerName.localeCompare(b.playerName));

    tableBody.innerHTML = "";

    visible.forEach(function (item) {
      const row = document.createElement("tr");

      row.innerHTML = `

 

                <td class="player-name-cell">

 

                    ${escapeHTML(item.playerName)}

 

                    ${item.archived ? '<small class="archived-player-label">Archived</small>' : ""}

 

                </td>

 

                <td>${item.matchCount}</td>

 

                <td>${formatCurrency(item.totalFees)}</td>

 

                <td>${formatCurrency(item.totalPaid)}</td>

 

                <td><strong>${formatCurrency(item.balance)}</strong></td>

 

                <td><span class="payment-badge ${item.balance > 0 ? "unpaid" : "paid"}">${item.balance > 0 ? "Balance Due" : "Settled"}</span></td>

 

                <td class="payment-actions-cell">

 

                    <button type="button" class="view-player-history-btn" data-player-id="${escapeHTML(item.playerId)}">View History</button>

 

                    ${
                      item.balance > 0
                        ? `<button type="button" class="settle-player-btn" data-player-id="${escapeHTML(item.playerId)}">Record Payment</button>`
                        : '<span class="payment-complete-label">✓ Settled</span>'
                    }

 

                </td>`;

      tableBody.appendChild(row);
    });

    emptyState.style.display = visible.length ? "none" : "flex";

    if (!visible.length && summaries.length) {
      emptyState.querySelector("strong").textContent =
        "No matching players found";

      emptyState.querySelector("p").textContent =
        "Try another player name or balance filter.";
    } else if (!summaries.length) {
      emptyState.querySelector("strong").textContent =
        "No player payment records yet";

      emptyState.querySelector("p").textContent =
        "Complete a match to create a player's payment summary.";
    }
  }

  const paymentSearch = document.getElementById("payment-search");

  const paymentStatusFilter = document.getElementById("payment-status-filter");

  const paymentTableBody = document.getElementById("payment-table-body");

  if (paymentSearch) paymentSearch.addEventListener("input", renderPayments);

  if (paymentStatusFilter)
    paymentStatusFilter.addEventListener("change", renderPayments);

  if (paymentTableBody) {
    paymentTableBody.addEventListener("click", async function (event) {
      const historyButton = event.target.closest(".view-player-history-btn");

      if (historyButton) {
        openPlayerHistory(historyButton.dataset.playerId);

        return;
      }

      const settleButton = event.target.closest(".settle-player-btn");

      if (!settleButton) return;

      const playerId = settleButton.dataset.playerId;

      const summary = getPlayerPaymentSummary(playerId);

      if (!summary.balance) return;

      const player = [...players, ...archivedPlayers].find(
        (item) => item.id === playerId,
      );

      const name = player ? player.name : "this player";

      const unpaid = summary.records.filter((item) => item.status !== "Paid");

      const matchList = unpaid.map((item) => "#" + item.matchNumber).join(", ");

      const amount = summary.balance;

      if (
        !(await appConfirm(
          "Record " +
            formatCurrency(amount) +
            " as received from " +
            name +
            "?\n\nThis covers match(es): " +
            matchList +
            "\n\nPreviously paid matches will not be charged again.",
        ))
      )
        return;

      const backup = matchPayments.map((item) => ({ ...item }));

      const groupId = crypto.randomUUID();

      const paidAt = new Date().toISOString();

      unpaid.forEach((item) => {
        item.status = "Paid";

        item.paidAt = paidAt;

        item.paymentGroupId = groupId;
      });

      if (!saveMatchPayments()) {
        matchPayments = backup;

        return;
      }

      renderPayments();

      showToast(
        "Payment recorded for " +
          name +
          ".\nAmount received: " +
          formatCurrency(amount) +
          "\nCovered matches: " +
          matchList,
      );
    });
  }

  // STEP 8: SESSION HISTORY

  function renderHistory() {
    const tableBody = document.getElementById("history-table-body");

    const emptyState = document.getElementById("no-history");

    const searchInput = document.getElementById("history-search");

    if (!tableBody || !emptyState) return;

    const completed = matches
      .filter((match) => match.status === "Completed")

      .sort(
        (a, b) =>
          new Date(b.endTime || b.startTime || 0) -
          new Date(a.endTime || a.startTime || 0),
      );

    const appearances = completed.reduce(
      (sum, match) =>
        sum + (Array.isArray(match.players) ? match.players.length : 0),
      0,
    );

    const fees = matchPayments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    document.getElementById("history-total-matches").textContent =
      completed.length;

    document.getElementById("history-total-players").textContent = appearances;

    document.getElementById("history-total-fees").textContent =
      formatCurrency(fees);

    document.getElementById("history-count").textContent =
      completed.length + (completed.length === 1 ? " Match" : " Matches");

    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = completed.filter(function (match) {
      const names = [...(match.teamA || []), ...(match.teamB || [])]

        .map((player) => player.name || "")
        .join(" ");

      return [match.matchNumber, match.courtName, names]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    tableBody.innerHTML = "";

    filtered.forEach(function (match) {
      const row = document.createElement("tr");

      const teamA = (match.teamA || [])
        .map((player) => escapeHTML(player.name || "Unknown"))
        .join(" + ");

      const teamB = (match.teamB || [])
        .map((player) => escapeHTML(player.name || "Unknown"))
        .join(" + ");

      const started = match.startTime
        ? new Date(match.startTime).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—";

      const finished = match.endTime
        ? new Date(match.endTime).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—";

      row.innerHTML = `

 

                <td>#${escapeHTML(String(match.matchNumber ?? "—"))}</td>

 

                <td>${escapeHTML(match.courtName || "—")}</td>

 

                <td>${teamA || "—"}</td>

 

                <td>${teamB || "—"}</td>

 

                <td>${escapeHTML(started)}</td>

 

                <td>${escapeHTML(finished)}</td>

 

                <td>${formatCurrency(match.shuttleFee)}</td>`;

      tableBody.appendChild(row);
    });

    emptyState.style.display = filtered.length ? "none" : "flex";

    if (!filtered.length && completed.length) {
      emptyState.querySelector("strong").textContent =
        "No matching history found";

      emptyState.querySelector("p").textContent =
        "Try a different match number, court, or player name.";
    } else if (!completed.length) {
      emptyState.querySelector("strong").textContent =
        "No completed matches yet";

      emptyState.querySelector("p").textContent =
        "Finish a match to see it recorded here.";
    }
  }

  const historySearch = document.getElementById("history-search");

  if (historySearch) historySearch.addEventListener("input", renderHistory);

  // --------------------------------------

  // SESSION CONTROLS

  // --------------------------------------

  function formatSessionDate(value) {
    return value
      ? new Date(value).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";
  }

  function getSessionSummary(session) {
    if (session.summary) return session.summary;

    const sessionMatches = matches.filter(
      (m) => m.sessionId === session.id && m.status === "Completed",
    );

    const sessionPayments = matchPayments.filter(
      (p) => p.sessionId === session.id,
    );

    const playerIds = new Set();

    sessionMatches.forEach((match) => {
      (match.playerIds || []).forEach((id) => playerIds.add(id));

      (match.players || []).forEach((player) => {
        if (player && player.id) playerIds.add(player.id);
      });
    });

    return {
      playerCount: playerIds.size,

      matchCount: sessionMatches.length,

      collected: sessionPayments

        .filter((payment) => payment.status === "Paid")

        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),

      unpaid: sessionPayments

        .filter((payment) => payment.status !== "Paid")

        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
  }

  function renderSessionManagement() {
    const name = document.getElementById("active-session-name");

    const details = document.getElementById("active-session-details");

    const endButton = document.getElementById("end-session-btn");

    const startButton = document.getElementById("start-session-btn");

    const list = document.getElementById("saved-sessions-list");

    if (!name || !details || !endButton || !startButton || !list) return;

    name.textContent = currentSession
      ? currentSession.name
      : "No active session";

    details.textContent = currentSession
      ? "Started " +
        formatSessionDate(currentSession.startedAt) +
        " · " +
        matches.filter(
          (m) => m.sessionId === currentSessionId && m.status === "Completed",
        ).length +
        " completed match(es)"
      : "End the previous session before starting another.";

    endButton.disabled = !currentSession;

    startButton.disabled = !!currentSession;

    const ordered = [...sessions].sort(
      (a, b) => Number(b.number) - Number(a.number),
    );

    list.innerHTML = "";

    if (!ordered.length) {
      list.innerHTML = '<p class="session-empty">No saved sessions yet.</p>';

      return;
    }

    ordered.forEach((session) => {
      const summary = getSessionSummary(session);

      const card = document.createElement("div");

      card.className = "saved-session-card";

      card.innerHTML = `

                <div class="saved-session-main">

                    <strong>${escapeHTML(session.name || "Session " + session.number)}</strong>

                    <small>${escapeHTML(formatSessionDate(session.startedAt))} – ${escapeHTML(session.endedAt ? formatSessionDate(session.endedAt) : "In progress")}</small>

                </div>

                <div class="saved-session-stats">

                    <span>${Number(summary.playerCount || 0)} players</span>

                    <span>${Number(summary.matchCount || 0)} matches</span>

                    <span>${formatCurrency(summary.collected || 0)} collected</span>

                    <span>${formatCurrency(summary.unpaid || 0)} unpaid at close</span>

                    <span class="session-state ${session.status === "Active" ? "active" : "closed"}">${escapeHTML(session.status)}</span>
                    <button type="button" class="session-rename-saved-btn" data-session-id="${escapeHTML(session.id)}">Rename</button>
                    <button type="button" class="session-delete-btn" data-session-id="${escapeHTML(session.id)}" ${session.status === "Active" ? "disabled title='End this session before deleting it'" : ""}>Delete Session</button>

                </div>`;

      list.appendChild(card);
    });
  }

  // Rename saved sessions without changing their stored match/payment records.
  const savedSessionsList = document.getElementById("saved-sessions-list");
  if (savedSessionsList) {
    savedSessionsList.addEventListener("click", async function (event) {
      const renameButton = event.target.closest(".session-rename-saved-btn");
      if (renameButton) {
        const session = sessions.find(
          (item) => item.id === renameButton.dataset.sessionId,
        );
        if (!session) return;
        const proposedName = await appPrompt(
          "Enter a name for this session:",
          session.name || "Session " + session.number,
        );
        if (proposedName === null) return;
        const cleanName = proposedName.trim();
        if (!cleanName) {
          showToast("Session name cannot be empty.");
          return;
        }
        const oldName = session.name;
        session.name = cleanName;
        if (!saveSessions()) {
          session.name = oldName;
          return;
        }
        if (currentSessionId === session.id) currentSession = session;
        renderSessionManagement();
        return;
      }

      const button = event.target.closest(".session-delete-btn");
      if (!button || button.disabled) return;
      const sessionId = button.dataset.sessionId;
      const session = sessions.find((item) => item.id === sessionId);
      if (
        !session ||
        session.status === "Active" ||
        session.id === currentSessionId
      )
        return;

      if (
        !(await appConfirm(
          "Permanently delete " +
            (session.name || "this session") +
            " from Saved Sessions? This cannot be undone.",
        ))
      )
        return;

      const previousSessions = sessions;
      sessions = sessions.filter((item) => item.id !== sessionId);
      if (!saveSessions()) {
        sessions = previousSessions;
        renderSessionManagement();
        return;
      }
      renderSessionManagement();
    });
  }

  const endSessionButton = document.getElementById("end-session-btn");

  const startSessionButton = document.getElementById("start-session-btn");
  const renameActiveSessionButton = document.getElementById(
    "rename-active-session-btn",
  );

  if (renameActiveSessionButton) {
    renameActiveSessionButton.addEventListener("click", async function () {
      if (!currentSession) {
        showToast("There is no active session to rename.");
        return;
      }
      const proposedName = await appPrompt(
        "Enter a name for the current session:",
        currentSession.name,
      );
      if (proposedName === null) return;
      const cleanName = proposedName.trim();
      if (!cleanName) {
        showToast("Session name cannot be empty.");
        return;
      }
      const oldName = currentSession.name;
      currentSession.name = cleanName;
      const storedSession = sessions.find(
        (item) => item.id === currentSessionId,
      );
      if (storedSession) storedSession.name = cleanName;
      if (!saveSessions()) {
        currentSession.name = oldName;
        if (storedSession) storedSession.name = oldName;
        return;
      }
      renderSessionManagement();
    });
  }

  if (endSessionButton) {
    endSessionButton.addEventListener("click", async function () {
      if (!currentSession) return;

      const activeMatches = matches.filter(
        (m) => m.sessionId === currentSessionId && m.status === "Playing",
      );

      if (activeMatches.length) {
        showToast(
          "Please finish all active matches before ending this session.",
        );

        return;
      }

      const summary = getSessionSummary(currentSession);

      const confirmed = await appConfirm(
        "End " +
          currentSession.name +
          "?\n\n" +
          "The session summary will be saved:\n" +
          "• " +
          summary.playerCount +
          " players\n" +
          "• " +
          summary.matchCount +
          " completed matches\n" +
          "• " +
          formatCurrency(summary.collected) +
          " collected\n" +
          "• " +
          formatCurrency(summary.unpaid) +
          " unpaid\n\n" +
          "When you start the next session, all player, court, match, queue, and payment records will be cleared. " +
          "Only this saved session summary will remain.",
      );

      if (!confirmed) return;

      const previousStatus = currentSession.status;

      const previousEndedAt = currentSession.endedAt;

      const previousSummary = currentSession.summary;

      const oldQueue = [...queue];

      const oldCourts = courts.map((court) => ({ ...court }));

      currentSession.status = "Ended";

      currentSession.endedAt = new Date().toISOString();

      currentSession.summary = {
        ...summary,
        matches: matches
          .filter(
            (match) =>
              match.sessionId === currentSessionId &&
              match.status === "Completed",
          )
          .map((match) => JSON.parse(JSON.stringify(match))),
        payments: matchPayments
          .filter((payment) => payment.sessionId === currentSessionId)
          .map((payment) => JSON.parse(JSON.stringify(payment))),
      };

      queue = [];

      courts.forEach((court) => (court.status = "Available"));

      if (!saveSessions() || !saveQueue() || !saveCourts()) {
        currentSession.status = previousStatus;

        currentSession.endedAt = previousEndedAt;

        currentSession.summary = previousSummary;

        queue = oldQueue;

        courts = oldCourts;

        saveSessions();

        saveQueue();

        saveCourts();

        showToast(
          "The session could not be fully saved. Please check storage and try again.",
        );

        return;
      }

      currentSession = null;

      currentSessionId = null;

      if (!saveSessions()) {
        showToast(
          "The session was ended, but the current session status could not be updated. Please reload and check Saved Sessions.",
        );

        return;
      }

      renderQueue();

      renderCourts();

      renderSessionManagement();

      showToast(
        "Session ended. Its summary is saved. Start a new session when ready.",
      );
    });
  }

  if (startSessionButton) {
    startSessionButton.addEventListener("click", async function () {
      if (currentSession) return;

      const confirmed = await appConfirm(
        "Start a completely new session?\n\n" +
          "This will clear all operational data from the previous session:\n" +
          "• Active and archived player records\n" +
          "• Courts\n" +
          "• Matches and individual match history\n" +
          "• Waiting queue\n" +
          "• Payment records and unpaid balances\n\n" +
          "Only the saved session summaries will remain in Saved Sessions.",
      );

      if (!confirmed) return;

      const nextNumber =
        Math.max(0, ...sessions.map((session) => Number(session.number) || 0)) +
        1;

      const defaultSessionName = "Session " + nextNumber;
      const enteredSessionName = await appPrompt(
        "Name your new session:",
        defaultSessionName,
      );
      if (enteredSessionName === null) return;
      const cleanSessionName = enteredSessionName.trim();
      if (!cleanSessionName) {
        showToast("Session name cannot be empty.");
        return;
      }

      const newSession = {
        id: crypto.randomUUID(),

        number: nextNumber,

        name: cleanSessionName,

        startedAt: new Date().toISOString(),

        endedAt: null,

        status: "Active",

        summary: null,
      };

      // Keep a rollback copy in case the browser refuses a storage update.

      const storageKeys = [
        STORAGE_KEY,

        ARCHIVED_PLAYER_STORAGE_KEY,

        QUEUE_STORAGE_KEY,

        COURT_STORAGE_KEY,

        MATCH_STORAGE_KEY,

        PAYMENT_STORAGE_KEY,

        SESSION_STORAGE_KEY,

        CURRENT_SESSION_KEY,
      ];

      const previousStorage = {};

      storageKeys.forEach(
        (key) => (previousStorage[key] = localStorage.getItem(key)),
      );

      const previousData = {
        players,

        archivedPlayers,

        queue,

        courts,

        matches,

        matchPayments,

        sessions,

        currentSession,

        currentSessionId,
      };

      try {
        // Clear all previous operational data. Session summaries are kept separately.

        players = [];

        archivedPlayers = [];

        queue = [];

        courts = [];

        matches = [];

        matchPayments = [];

        localStorage.setItem(STORAGE_KEY, "[]");

        localStorage.setItem(ARCHIVED_PLAYER_STORAGE_KEY, "[]");

        localStorage.setItem(QUEUE_STORAGE_KEY, "[]");

        localStorage.setItem(COURT_STORAGE_KEY, "[]");

        localStorage.setItem(MATCH_STORAGE_KEY, "[]");

        localStorage.setItem(PAYMENT_STORAGE_KEY, "[]");

        sessions = [...sessions, newSession];

        currentSession = newSession;

        currentSessionId = newSession.id;

        if (!saveSessions()) throw new Error("Unable to save the new session.");
      } catch (error) {
        players = previousData.players;

        archivedPlayers = previousData.archivedPlayers;

        queue = previousData.queue;

        courts = previousData.courts;

        matches = previousData.matches;

        matchPayments = previousData.matchPayments;

        sessions = previousData.sessions;

        currentSession = previousData.currentSession;

        currentSessionId = previousData.currentSessionId;

        storageKeys.forEach((key) => {
          const oldValue = previousStorage[key];

          if (oldValue === null) localStorage.removeItem(key);
          else localStorage.setItem(key, oldValue);
        });

        console.error("Unable to start a new session:", error);

        showToast(
          "The new session could not be started. Your previous data has been restored.",
        );

        return;
      }

      // Refresh every existing module to show the clean new session.

      renderPlayers();

      renderQueue();

      renderCourts();

      renderMatches();

      renderPayments();

      renderHistory();

      updateMatchOptions();

      renderSessionManagement();

      showToast(
        newSession.name +
          " started. All previous operational data has been cleared. Saved session summaries remain available.",
      );
    });
  }

  // INITIALIZE ALL MODULES

  renderPlayers();

  renderQueue();

  renderCourts();

  renderSessionManagement();

  saveMatches();

  saveMatchPayments();

  // Refresh available courts in Match Management

  updateMatchOptions();

  console.log("--------------------------------");

  console.log("BADMINTON QUEUE SYSTEM");

  console.log("Player Management: Ready");

  console.log("Queue Management: Ready");

  console.log("Court Management: Ready");

  console.log("Offline Storage: Ready");

  console.log("Registered Players:", players.length);

  console.log("Waiting Players:", queue.length);

  console.log("Registered Courts:", courts.length);

  console.log("--------------------------------");
});
