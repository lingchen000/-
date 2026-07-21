(function () {
  "use strict";

  const root = document.documentElement;
  const storageKey = "lingchen-theme-worldline";
  if (!document.body.classList.contains("dashboard-page")) {
    document.body.classList.add("worldline-inner");
  }

  function preferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = theme === "dark" ? "浅色" : "深色";
      button.setAttribute("aria-label", `切换到${next}模式`);
      button.setAttribute("title", `切换到${next}模式`);
    });
  }

  applyTheme(preferredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      applyTheme(next);
    });
  });

  const menuButton = document.querySelector("[data-menu-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");

  if (menuButton && siteNav) {
    menuButton.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
        siteNav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.focus();
      }
    });
  }

  const header = document.querySelector("[data-header]");
  if (header) {
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const progress = document.querySelector("[data-reading-progress]");
  const article = document.querySelector("[data-article]");
  if (progress && article) {
    const updateProgress = () => {
      const start = article.offsetTop;
      const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
      const amount = Math.min(Math.max((window.scrollY - start) / distance, 0), 1);
      progress.style.transform = `scaleX(${amount})`;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  const tocLinks = Array.from(document.querySelectorAll("[data-toc] a"));
  if (tocLinks.length) {
    const sections = tocLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const setActive = (id) => {
      tocLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    if (sections[0]) setActive(sections[0].id);
  }

  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest(".code-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const button = document.createElement("button");
    button.className = "copy-button";
    button.type = "button";
    button.textContent = "复制";
    button.setAttribute("aria-label", "复制代码");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.textContent = "已复制";
      } catch (_error) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "请按 Ctrl+C";
      }
      window.setTimeout(() => (button.textContent = "复制"), 1600);
    });
    wrap.appendChild(button);
  });

  const searchInput = document.querySelector("[data-article-search]");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const archiveItems = Array.from(document.querySelectorAll("[data-archive-item]"));
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");

  if (archiveItems.length) {
    let activeFilter = "全部";

    const filterArticles = () => {
      const query = (searchInput?.value || "").trim().toLocaleLowerCase("zh-CN");
      let visibleCount = 0;

      archiveItems.forEach((item) => {
        const haystack = (item.dataset.search || item.textContent).toLocaleLowerCase("zh-CN");
        const tags = (item.dataset.tags || "").split(",");
        const matchesText = !query || haystack.includes(query);
        const matchesTag = activeFilter === "全部" || tags.includes(activeFilter);
        const visible = matchesText && matchesTag;
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (resultCount) resultCount.textContent = `找到 ${visibleCount} 篇文章`;
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };

    searchInput?.addEventListener("input", filterArticles);
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        filterArticles();
      });
    });
    filterArticles();
  }

  // 首页桌面小组件：时间、月历、片段、播放器与本地点赞。
  const clock = document.querySelector("[data-clock]");
  const fullDate = document.querySelector("[data-full-date]");
  const greeting = document.querySelector("[data-greeting]");

  if (clock) {
    const updateClock = () => {
      const now = new Date();
      clock.textContent = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(now);
      if (fullDate) {
        fullDate.textContent = new Intl.DateTimeFormat("zh-CN", {
          month: "long", day: "numeric", weekday: "long"
        }).format(now);
      }
      if (greeting) {
        const hour = now.getHours();
        const worldline = document.body.classList.contains("worldline-theme");
        greeting.textContent = worldline
          ? (hour < 6 ? "深夜观测" : hour < 11 ? "晨间连接" : hour < 14 ? "正午同步" : hour < 18 ? "午后记录" : "夜间连接")
          : (hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好");
      }
    };
    updateClock();
    window.setInterval(updateClock, 30000);
  }

  const calendar = document.querySelector("[data-calendar]");
  if (calendar) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
    const monthLabel = document.querySelector("[data-calendar-month]");
    const yearLabel = document.querySelector("[data-calendar-year]");
    if (monthLabel) monthLabel.textContent = monthNames[month];
    if (yearLabel) yearLabel.textContent = year;

    ["日","一","二","三","四","五","六"].forEach((day) => {
      const item = document.createElement("span");
      item.className = "weekday";
      item.textContent = day;
      calendar.appendChild(item);
    });
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    for (let offset = firstDay - 1; offset >= 0; offset -= 1) {
      const item = document.createElement("span");
      item.className = "muted-day";
      item.textContent = previousDays - offset;
      calendar.appendChild(item);
    }
    for (let day = 1; day <= days; day += 1) {
      const item = document.createElement("span");
      item.textContent = day;
      if (day === now.getDate()) item.className = "today";
      calendar.appendChild(item);
    }
    const cells = firstDay + days;
    for (let day = 1; day <= (7 - (cells % 7)) % 7; day += 1) {
      const item = document.createElement("span");
      item.className = "muted-day";
      item.textContent = day;
      calendar.appendChild(item);
    }
  }

  const noteButton = document.querySelector("[data-random-note]");
  const noteText = document.querySelector("[data-note-text]");
  const notes = [
    "“选择发生的那一刻，未来已经开始偏移。”",
    "“欺骗既定的结局之前，先别让今天的自己投降。”",
    "“所谓偶然，不过是尚未解析完成的世界线指令。”",
    "“机关可以窃听信号，却无法夺走观测者选择未来的意志。”",
    "“实习不是重复劳动，是潜入现实系统的一次长期实验。”"
  ];
  noteButton?.addEventListener("click", () => {
    if (!noteText) return;
    const current = notes.indexOf(noteText.textContent);
    noteText.textContent = notes[(current + 1) % notes.length];
  });

  const playButton = document.querySelector("[data-play]");
  const wave = document.querySelector("[data-wave]");
  const audio = document.querySelector("[data-audio]");
  const syncPlayer = (playing) => {
    wave?.classList.toggle("is-playing", playing);
    if (!playButton) return;
    playButton.textContent = playing ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", playing ? "暂停" : "播放");
  };
  playButton?.addEventListener("click", async () => {
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (_) {
        syncPlayer(false);
      }
    } else {
      audio.pause();
    }
  });
  audio?.addEventListener("play", () => syncPlayer(true));
  audio?.addEventListener("pause", () => syncPlayer(false));
  audio?.addEventListener("ended", () => syncPlayer(false));

  const logForm = document.querySelector("[data-log-form]");
  if (logForm) {
    const logStorageKey = "lingchen-internship-observation-logs-v1";
    const logId = logForm.querySelector("[data-log-id]");
    const logDate = logForm.querySelector("[data-log-date]");
    const logTitle = logForm.querySelector("[data-log-title]");
    const logProject = logForm.querySelector("[data-log-project]");
    const logContent = logForm.querySelector("[data-log-content]");
    const logSubmit = logForm.querySelector("[data-log-submit]");
    const logMessage = logForm.querySelector("[data-log-message]");
    const logList = document.querySelector("[data-log-list]");
    const logEmpty = document.querySelector("[data-log-empty]");
    const logCount = document.querySelector("[data-log-count]");
    const logSearch = document.querySelector("[data-log-search]");

    const todayString = () => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    };
    const readLogs = () => {
      try {
        const value = JSON.parse(localStorage.getItem(logStorageKey) || "[]");
        return Array.isArray(value) ? value.filter((item) => item && item.id && item.date && item.content) : [];
      } catch (_) {
        return [];
      }
    };
    const writeLogs = (logs) => localStorage.setItem(logStorageKey, JSON.stringify(logs));
    const setLogMessage = (message, isError = false) => {
      if (!logMessage) return;
      logMessage.textContent = message;
      logMessage.classList.toggle("is-error", isError);
    };
    const resetLogForm = () => {
      logForm.reset();
      logId.value = "";
      logDate.value = todayString();
      logSubmit.textContent = "封存至当前世界线";
      setLogMessage("等待新的观测数据。");
    };
    const makeButton = (label, action, id) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "log-entry-action";
      button.dataset.logAction = action;
      button.dataset.logTarget = id;
      button.textContent = label;
      return button;
    };
    const renderLogs = () => {
      const logs = readLogs().sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      const query = (logSearch?.value || "").trim().toLocaleLowerCase();
      const visibleLogs = query ? logs.filter((item) => [item.date, item.title, item.project, item.content].join(" ").toLocaleLowerCase().includes(query)) : logs;
      logList.replaceChildren();
      visibleLogs.forEach((item, index) => {
        const article = document.createElement("article");
        article.className = "observation-log-entry";

        const meta = document.createElement("div");
        meta.className = "observation-log-meta";
        const time = document.createElement("time");
        time.dateTime = item.date;
        time.textContent = item.date.replaceAll("-", ".");
        const number = document.createElement("span");
        number.textContent = `LOG ${String(logs.length - logs.indexOf(item)).padStart(3, "0")}`;
        meta.append(time, number);

        const heading = document.createElement("h3");
        heading.textContent = item.title || "未命名行动";
        const project = document.createElement("p");
        project.className = "observation-log-project";
        project.textContent = item.project ? `ASSIGNMENT / ${item.project}` : "ASSIGNMENT / CLASSIFIED";
        const content = document.createElement("div");
        content.className = "observation-log-content";
        content.textContent = item.content;
        const actions = document.createElement("div");
        actions.className = "observation-log-actions";
        actions.append(makeButton("重新观测", "edit", item.id), makeButton("抹除记录", "delete", item.id));

        article.append(meta, heading, project, content, actions);
        logList.append(article);
      });
      logCount.textContent = String(logs.length).padStart(3, "0");
      logEmpty.hidden = visibleLogs.length > 0;
      if (!visibleLogs.length && logs.length && query) {
        logEmpty.querySelector("strong").textContent = "NO MATCH";
        logEmpty.querySelector("p").textContent = "当前世界线中没有符合该检索条件的记录。";
      } else {
        logEmpty.querySelector("strong").textContent = "NO SIGNAL";
        logEmpty.querySelector("p").textContent = "尚未捕获任何实习观测记录。今天，就是编号 001 的起点。";
      }
    };

    logForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const logs = readLogs();
      const existingIndex = logs.findIndex((item) => item.id === logId.value);
      const entry = {
        id: logId.value || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: logDate.value,
        title: logTitle.value.trim(),
        project: logProject.value.trim(),
        content: logContent.value.trim(),
        updatedAt: new Date().toISOString()
      };
      if (!entry.date || !entry.title || !entry.content) {
        setLogMessage("信号不完整：日期、行动代号与观测记录均为必填项。", true);
        return;
      }
      if (existingIndex >= 0) logs.splice(existingIndex, 1, entry);
      else logs.push(entry);
      writeLogs(logs);
      resetLogForm();
      renderLogs();
      setLogMessage(existingIndex >= 0 ? "记录已完成修正，世界线参数已更新。" : "观测记录封存成功。El Psy Kongroo。");
    });

    document.querySelector("[data-log-reset]")?.addEventListener("click", resetLogForm);
    logSearch?.addEventListener("input", renderLogs);
    logList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-log-action]");
      if (!button) return;
      const logs = readLogs();
      const target = logs.find((item) => item.id === button.dataset.logTarget);
      if (!target) return;
      if (button.dataset.logAction === "edit") {
        logId.value = target.id;
        logDate.value = target.date;
        logTitle.value = target.title;
        logProject.value = target.project || "";
        logContent.value = target.content;
        logSubmit.textContent = "修正这条世界线记录";
        setLogMessage("旧记录已载入。修改后重新封存即可覆盖原始观测。 ");
        logForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (button.dataset.logAction === "delete" && confirm(`确认抹除「${target.title}」？该操作无法撤回。`)) {
        writeLogs(logs.filter((item) => item.id !== target.id));
        renderLogs();
        setLogMessage("指定记录已从当前世界线抹除。");
      }
    });

    document.querySelector("[data-log-file]")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        logContent.value = await file.text();
        if (!logTitle.value) logTitle.value = file.name.replace(/\.(txt|md)$/i, "");
        setLogMessage(`已读取 ${file.name}，确认内容后即可封存。`);
      } catch (_) {
        setLogMessage("文件读取失败，无法建立观测连接。", true);
      }
      event.target.value = "";
    });

    document.querySelector("[data-log-export]")?.addEventListener("click", () => {
      const logs = readLogs();
      const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), logs }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lingchen-observation-logs-${todayString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setLogMessage(`已导出 ${logs.length} 条观测记录。`);
    });

    document.querySelector("[data-log-import]")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const incoming = Array.isArray(data) ? data : data.logs;
        if (!Array.isArray(incoming)) throw new Error("invalid archive");
        const valid = incoming.filter((item) => item && item.id && item.date && item.content);
        const merged = new Map(readLogs().map((item) => [item.id, item]));
        valid.forEach((item) => merged.set(item.id, item));
        writeLogs([...merged.values()]);
        renderLogs();
        setLogMessage(`备份接入成功，已同步 ${valid.length} 条记录。`);
      } catch (_) {
        setLogMessage("备份解析失败：这不是有效的观测日志文件。", true);
      }
      event.target.value = "";
    });

    resetLogForm();
    renderLogs();
  }

  const likeButton = document.querySelector("[data-like]");
  const likeCount = document.querySelector("[data-like-count]");
  if (likeButton && likeCount) {
    const likeKey = "lingchen-liked";
    const liked = localStorage.getItem(likeKey) === "yes";
    likeButton.closest(".like-card")?.classList.toggle("is-liked", liked);
    likeButton.querySelector("span").textContent = liked ? "♥" : "♡";
    likeCount.textContent = liked ? "129" : "128";
    likeButton.addEventListener("click", () => {
      const card = likeButton.closest(".like-card");
      const next = !card?.classList.contains("is-liked");
      card?.classList.toggle("is-liked", next);
      likeButton.querySelector("span").textContent = next ? "♥" : "♡";
      likeCount.textContent = next ? "129" : "128";
      localStorage.setItem(likeKey, next ? "yes" : "no");
    });
  }
})();
