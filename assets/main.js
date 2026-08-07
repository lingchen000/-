(function () {
  "use strict";

  // Homepage card tilt: pointer tracking is desktop-only so mobile scrolling
  // and touch gestures remain untouched.
  const tiltCards = document.querySelectorAll(
    ".dashboard-page .desktop-shell > .glass-card:not(.like-card), " +
    ".worldline-inner .about-layout > .portrait-placeholder, " +
    ".worldline-inner .about-layout > .prose"
  );
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (tiltCards.length) {
    tiltCards.forEach((card) => {
      const glare = document.createElement("span");
      glare.className = "card-tilt-glare";
      glare.setAttribute("aria-hidden", "true");
      card.appendChild(glare);
      card.classList.add("tilt-ready");

      let cardRect = null;
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const resetTilt = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        cardRect = null;
        card.classList.remove("is-tilting", "is-tilt-hover");
        card.style.setProperty("--tilt-rx", "0deg");
        card.style.setProperty("--tilt-ry", "0deg");
        card.style.setProperty("--tilt-gx", "50%");
        card.style.setProperty("--tilt-gy", "50%");
      };

      const paintTilt = () => {
        frame = 0;
        if (!cardRect) return;
        const x = Math.min(1, Math.max(0, (pointerX - cardRect.left) / cardRect.width));
        const y = Math.min(1, Math.max(0, (pointerY - cardRect.top) / cardRect.height));
        const rotateX = (0.5 - y) * 12;
        const rotateY = (x - 0.5) * 12;
        card.style.setProperty("--tilt-rx", `${rotateX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-ry", `${rotateY.toFixed(2)}deg`);
        card.style.setProperty("--tilt-gx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--tilt-gy", `${(y * 100).toFixed(1)}%`);
      };

      card.addEventListener("pointerenter", (event) => {
        if (!finePointer.matches || reducedMotion.matches) return;
        cardRect = card.getBoundingClientRect();
        card.classList.add("is-tilting", "is-tilt-hover");
        pointerX = event.clientX;
        pointerY = event.clientY;
        paintTilt();
      });

      card.addEventListener("pointermove", (event) => {
        if (!cardRect) return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!frame) frame = window.requestAnimationFrame(paintTilt);
      });

      card.addEventListener("pointerleave", resetTilt);
      card.addEventListener("pointercancel", resetTilt);
      reducedMotion.addEventListener?.("change", resetTilt);
      finePointer.addEventListener?.("change", resetTilt);
    });
  }

  const root = document.documentElement;
  const storageKey = "lingchen-theme-worldline";
  if (!document.body.classList.contains("dashboard-page")) {
    document.body.classList.add("worldline-inner");
  }

  const startupIntro = document.querySelector("[data-startup-intro]");
  if (startupIntro) {
    if (root.classList.contains("intro-pending")) {
      const skipButton = startupIntro.querySelector("[data-startup-skip]");
      const introStorageKey = "lingchen-opening-seen-v4";
      let introTimer;
      let introFinished = false;

      const removeIntro = () => {
        if (introFinished) return;
        introFinished = true;
        window.clearTimeout(introTimer);
        try {
          localStorage.setItem(introStorageKey, "1");
        } catch (_) {
          // The opening still closes normally when storage is unavailable.
        }
        root.classList.remove("intro-pending");
        startupIntro.hidden = true;
        document.removeEventListener("keydown", handleIntroKeydown);
        if (document.activeElement === skipButton) {
          document.querySelector(".desk-nav a")?.focus({ preventScroll: true });
        }
      };

      const skipIntro = () => {
        if (introFinished || startupIntro.classList.contains("is-skipping")) return;
        startupIntro.classList.add("is-skipping");
        window.setTimeout(removeIntro, 320);
      };

      const handleIntroKeydown = (event) => {
        if (event.key === "Escape") skipIntro();
      };

      skipButton?.addEventListener("click", skipIntro);
      document.addEventListener("keydown", handleIntroKeydown);
      introTimer = window.setTimeout(removeIntro, 2280);
    } else {
      startupIntro.hidden = true;
    }
  }

  function preferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

  // 日常记录：按月份归档，并提供检索、折叠与稳定锚点。
  const notesList = document.querySelector("[data-notes-list]");
  if (notesList) {
    const notesEntries = Array.from(notesList.querySelectorAll("[data-notes-entry]")).sort((entryA, entryB) => {
      const dateA = entryA.querySelector("time[datetime]")?.dateTime || "";
      const dateB = entryB.querySelector("time[datetime]")?.dateTime || "";
      return dateB.localeCompare(dateA);
    });
    const notesSearch = document.querySelector("[data-notes-search]");
    const notesResultCount = document.querySelector("[data-notes-result-count]");
    const notesToggleAll = document.querySelector("[data-notes-toggle-all]");
    const notesEmpty = document.querySelector("[data-notes-empty]");
    const notesClear = document.querySelector("[data-notes-clear]");
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const searchIndexes = new Map();
    const openStates = new Map();
    const detailsByEntry = new Map();
    const monthGroups = new Map();
    const usedNotesIds = new Set();

    const normalizeNotesText = (value) =>
      value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();

    const updateEntryState = (entry) => {
      const details = detailsByEntry.get(entry);
      const state = entry.querySelector("[data-notes-entry-state]");
      const icon = entry.querySelector(".notes-entry-state-icon");
      if (details && state) state.textContent = details.open ? "收起" : "展开";
      if (details && icon) icon.textContent = details.open ? "−" : "+";
    };

    const visibleEntries = () => notesEntries.filter((entry) => !entry.hidden);

    const updateToggleAll = () => {
      if (!notesToggleAll) return;
      const visible = visibleEntries();
      const allOpen = visible.length > 0 && visible.every((entry) => detailsByEntry.get(entry)?.open);
      notesToggleAll.textContent = allOpen ? "收起全部" : "展开全部";
      notesToggleAll.disabled = visible.length === 0;
    };

    notesEntries.forEach((entry, index) => {
      const time = entry.querySelector("time[datetime]");
      const meta = entry.querySelector(".observation-log-meta");
      const sourceTitle = entry.querySelector("h3, h4");
      const project = entry.querySelector(".observation-log-project");
      const content = entry.querySelector(".observation-log-content");
      if (!time || !meta || !sourceTitle || !project || !content) return;

      const date = time.dateTime;
      const monthKey = date.slice(0, 7);
      const logLabel = meta.querySelector("span")?.textContent.trim() || `LOG ${String(notesEntries.length - index).padStart(3, "0")}`;
      searchIndexes.set(entry, normalizeNotesText(`${date} ${logLabel} ${entry.textContent}`));
      const baseId = entry.id || `log-${date}`;
      entry.id = usedNotesIds.has(baseId) ? `${baseId}-${String(index + 1).padStart(2, "0")}` : baseId;
      usedNotesIds.add(entry.id);
      const isLatest = index === 0;
      entry.toggleAttribute("data-latest", isLatest);
      entry.classList.toggle("is-latest", isLatest);

      const details = document.createElement("details");
      details.className = "notes-entry-details";
      details.open = isLatest;
      openStates.set(entry, details.open);
      detailsByEntry.set(entry, details);

      const summary = document.createElement("summary");
      summary.className = "notes-entry-summary";
      const summaryHeading = document.createElement("h4");
      summaryHeading.className = "notes-entry-heading";
      summaryHeading.id = `${entry.id}-title`;
      entry.setAttribute("aria-labelledby", summaryHeading.id);
      const summaryMain = document.createElement("span");
      summaryMain.className = "notes-entry-summary-main";
      const summaryMeta = document.createElement("span");
      summaryMeta.className = "observation-log-meta";
      summaryMeta.append(...Array.from(meta.childNodes));
      const summaryTitle = document.createElement("span");
      summaryTitle.className = "notes-entry-title";
      summaryTitle.textContent = sourceTitle.textContent;
      const summaryProject = document.createElement("span");
      summaryProject.className = "observation-log-project";
      summaryProject.textContent = project.textContent;
      summaryMain.append(summaryMeta, summaryTitle, summaryProject);
      const state = document.createElement("span");
      state.className = "notes-entry-state";
      state.setAttribute("aria-hidden", "true");
      const stateLabel = document.createElement("span");
      stateLabel.dataset.notesEntryState = "";
      const stateIcon = document.createElement("span");
      stateIcon.className = "notes-entry-state-icon";
      stateIcon.textContent = details.open ? "−" : "+";
      state.append(stateLabel, stateIcon);
      summaryHeading.append(summaryMain, state);
      summary.append(summaryHeading);

      const body = document.createElement("div");
      body.className = "notes-entry-body";
      body.id = `${entry.id}-body`;
      body.append(content);

      const permalink = document.createElement("a");
      permalink.className = "notes-entry-permalink";
      permalink.href = `#${entry.id}`;
      permalink.setAttribute("aria-label", `${summaryTitle.textContent.trim()}的固定链接`);
      permalink.innerHTML = "<span aria-hidden=\"true\">#</span> 固定链接";
      body.append(permalink);

      details.append(summary, body);
      entry.replaceChildren(details);
      updateEntryState(entry);

      summary.addEventListener("click", () => {
        openStates.set(entry, !details.open);
      });
      details.addEventListener("toggle", () => {
        updateEntryState(entry);
        updateToggleAll();
      });

      if (!monthGroups.has(monthKey)) {
        const section = document.createElement("section");
        section.className = "notes-month-group";
        section.dataset.notesMonth = monthKey;
        const headingId = `notes-month-${monthKey}`;
        section.setAttribute("aria-labelledby", headingId);

        const heading = document.createElement("h3");
        heading.className = "notes-month-title";
        heading.id = headingId;
        const headingDate = document.createElement("span");
        headingDate.textContent = monthKey.replace("-", " / ");
        const headingMeta = document.createElement("small");
        const monthIndex = Number(monthKey.slice(5, 7)) - 1;
        const monthName = monthNames[monthIndex] || "MONTH";
        headingMeta.textContent = `${monthName} · 0 CUTS`;
        heading.append(headingDate, headingMeta);

        const entriesContainer = document.createElement("div");
        entriesContainer.className = "notes-month-entries";
        section.append(heading, entriesContainer);
        monthGroups.set(monthKey, { section, entriesContainer, headingMeta, monthName, entries: [] });
      }

      const group = monthGroups.get(monthKey);
      group.entries.push(entry);
      group.entriesContainer.append(entry);
    });

    monthGroups.forEach((group) => {
      group.headingMeta.textContent = `${group.monthName} · ${group.entries.length} ${group.entries.length === 1 ? "CUT" : "CUTS"}`;
    });
    notesList.replaceChildren(...Array.from(monthGroups.values(), (group) => group.section));

    const applyNotesFilter = () => {
      const query = normalizeNotesText(notesSearch?.value || "");
      const terms = query ? query.split(" ") : [];
      const matchingEntries = new Set(notesEntries.filter((entry) =>
        terms.every((term) => searchIndexes.get(entry)?.includes(term))
      ));
      const matchCount = matchingEntries.size;

      notesEntries.forEach((entry) => {
        const matches = matchingEntries.has(entry);
        entry.hidden = !matches;
        const details = detailsByEntry.get(entry);
        if (details) {
          details.open = query && matchCount === 1 && matches ? true : Boolean(openStates.get(entry));
          updateEntryState(entry);
        }
      });

      monthGroups.forEach((group) => {
        const visibleCount = group.entries.filter((entry) => !entry.hidden).length;
        group.section.hidden = visibleCount === 0;
        group.headingMeta.textContent = `${group.monthName} · ${visibleCount} ${visibleCount === 1 ? "CUT" : "CUTS"}`;
      });

      if (notesResultCount) {
        notesResultCount.textContent = query ? `找到 ${matchCount} 条记录` : `共 ${notesEntries.length} 条记录`;
      }
      if (notesEmpty) notesEmpty.hidden = matchCount !== 0;
      updateToggleAll();
    };

    notesSearch?.addEventListener("input", applyNotesFilter);
    notesClear?.addEventListener("click", () => {
      if (notesSearch) notesSearch.value = "";
      applyNotesFilter();
      notesSearch?.focus();
    });

    notesToggleAll?.addEventListener("click", () => {
      const visible = visibleEntries();
      const shouldOpen = visible.some((entry) => !detailsByEntry.get(entry)?.open);
      visible.forEach((entry) => {
        const details = detailsByEntry.get(entry);
        if (!details) return;
        openStates.set(entry, shouldOpen);
        details.open = shouldOpen;
        updateEntryState(entry);
      });
      updateToggleAll();
    });

    const showHashTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target?.matches("[data-notes-entry]")) return;
      if (notesSearch) notesSearch.value = "";
      openStates.set(target, true);
      applyNotesFilter();
      const details = detailsByEntry.get(target);
      if (details) details.open = true;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
    };

    window.addEventListener("hashchange", showHashTarget);
    applyNotesFilter();
    showHashTarget();
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
          ? (hour < 6 ? "深夜独白" : hour < 11 ? "晨间一页" : hour < 14 ? "正午插曲" : hour < 18 ? "午后章节" : "夜间场景")
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
    "“忘记不是消失，只是故事暂时没有轮到它出场。”",
    "“所谓日常，大概就是怪异还没来得及自我介绍。”",
    "“没有说出口的话不会消失，它们只是换成了别的语气。”",
    "“成长不是成为别人，而是终于能替过去的自己补完旁白。”"
  ];
  noteButton?.addEventListener("click", () => {
    if (!noteText) return;
    const current = notes.indexOf(noteText.textContent);
    noteText.textContent = notes[(current + 1) % notes.length];
  });

  const playButton = document.querySelector("[data-play]");
  const wave = document.querySelector("[data-wave]");
  let audio = document.querySelector("[data-audio]");
  const nextTrackButton = document.querySelector("[data-next-track]");
  const trackStatus = document.querySelector("[data-track-status]");
  const trackTitle = document.querySelector("[data-track-title]");
  const mainScript = document.querySelector('script[src*="assets/main.js"]');
  const assetRoot = mainScript ? new URL(".", mainScript.src) : new URL("assets/", document.baseURI);
  const tracks = [
    { title: "星愿 · off vocal", src: new URL("xingyuan-off-vocal.mp3", assetRoot).href },
    { title: "ある雨の日 · 神前暁", src: new URL("aru-ame-no-hi.mp3", assetRoot).href }
  ];
  const playerStorageKey = "lingchen-cross-page-player-v1";
  let savedPlayerState = null;
  let playerStarted = false;
  let wantsToPlay = false;
  let isLeavingPage = false;
  let lastPlayerSave = 0;

  try {
    const parsed = JSON.parse(sessionStorage.getItem(playerStorageKey) || "null");
    if (parsed && Number.isInteger(parsed.trackIndex)) savedPlayerState = parsed;
  } catch (_) {
    savedPlayerState = null;
  }

  let trackIndex = Math.min(tracks.length - 1, Math.max(0, savedPlayerState?.trackIndex || 0));
  playerStarted = Boolean(savedPlayerState?.started);
  wantsToPlay = Boolean(savedPlayerState?.playing);

  if (!audio) {
    audio = document.createElement("audio");
    audio.dataset.audio = "";
    audio.hidden = true;
    audio.preload = "metadata";
    document.body.appendChild(audio);
  }

  let musicDock = null;
  let dockPlayButton = null;
  let dockNextButton = null;
  let dockTrackTitle = null;
  if (!document.body.classList.contains("dashboard-page")) {
    musicDock = document.createElement("aside");
    musicDock.className = "global-music-dock";
    musicDock.hidden = !playerStarted;
    musicDock.setAttribute("aria-label", "跨页面音乐播放器");
    musicDock.innerHTML = `
      <button class="global-music-play" type="button" data-global-music-play aria-label="播放">▶</button>
      <span class="global-music-copy"><small>NOW PLAYING / LOCAL</small><strong data-global-music-title></strong></span>
      <button class="global-music-next" type="button" data-global-music-next aria-label="播放下一首">›</button>`;
    document.body.appendChild(musicDock);
    dockPlayButton = musicDock.querySelector("[data-global-music-play]");
    dockNextButton = musicDock.querySelector("[data-global-music-next]");
    dockTrackTitle = musicDock.querySelector("[data-global-music-title]");
  }

  const writePlayerState = (playing = !audio.paused) => {
    if (!playerStarted) return;
    const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    try {
      sessionStorage.setItem(playerStorageKey, JSON.stringify({
        started: true,
        trackIndex,
        currentTime,
        playing,
        updatedAt: Date.now()
      }));
    } catch (_) {
      // Playback still works when session storage is unavailable.
    }
  };

  const syncTrackCopy = () => {
    const track = tracks[trackIndex];
    if (trackStatus) trackStatus.textContent = `TRACK ${trackIndex + 1} / ${tracks.length}`;
    if (trackTitle) trackTitle.textContent = track.title;
    if (dockTrackTitle) dockTrackTitle.textContent = track.title;
  };

  const syncPlayer = (playing, resumeBlocked = false) => {
    wave?.classList.toggle("is-playing", playing);
    [playButton, dockPlayButton].forEach((button) => {
      if (!button) return;
      button.textContent = playing ? "Ⅱ" : "▶";
      button.setAttribute("aria-label", playing ? "暂停" : (resumeBlocked ? "继续播放" : "播放"));
    });
    musicDock?.classList.toggle("is-playing", playing);
    musicDock?.classList.toggle("is-resume-needed", resumeBlocked);
    if (musicDock && playerStarted) musicDock.hidden = false;
  };

  const togglePlayback = async () => {
    if (audio.paused) {
      playerStarted = true;
      wantsToPlay = true;
      if (musicDock) musicDock.hidden = false;
      try {
        await audio.play();
      } catch (_) {
        wantsToPlay = false;
        writePlayerState(false);
        syncPlayer(false, true);
      }
    } else {
      wantsToPlay = false;
      audio.pause();
    }
  };

  const selectTrack = async (index, continuePlaying = false) => {
    trackIndex = (index + tracks.length) % tracks.length;
    wantsToPlay = continuePlaying;
    audio.pause();
    audio.src = tracks[trackIndex].src;
    audio.load();
    syncTrackCopy();
    writePlayerState(continuePlaying);
    if (continuePlaying) {
      try {
        await audio.play();
      } catch (_) {
        wantsToPlay = false;
        writePlayerState(false);
        syncPlayer(false, true);
      }
    }
  };

  playButton?.addEventListener("click", togglePlayback);
  dockPlayButton?.addEventListener("click", togglePlayback);
  nextTrackButton?.addEventListener("click", () => selectTrack(trackIndex + 1, !audio.paused));
  dockNextButton?.addEventListener("click", () => selectTrack(trackIndex + 1, !audio.paused));
  audio.addEventListener("play", () => {
    playerStarted = true;
    wantsToPlay = true;
    writePlayerState(true);
    syncPlayer(true);
  });
  audio.addEventListener("pause", () => {
    syncPlayer(false);
    if (!isLeavingPage) {
      wantsToPlay = false;
      writePlayerState(false);
    }
  });
  audio.addEventListener("timeupdate", () => {
    if (!playerStarted || Date.now() - lastPlayerSave < 1000) return;
    lastPlayerSave = Date.now();
    writePlayerState(!audio.paused);
  });
  audio.addEventListener("ended", () => selectTrack(trackIndex + 1, true));

  const restorePlayer = async () => {
    if (savedPlayerState && Number.isFinite(savedPlayerState.currentTime) && savedPlayerState.currentTime > 0) {
      const latestTime = Number.isFinite(audio.duration)
        ? Math.min(savedPlayerState.currentTime, Math.max(0, audio.duration - 0.25))
        : savedPlayerState.currentTime;
      try {
        audio.currentTime = latestTime;
      } catch (_) {
        // Some browsers only allow seeking after metadata becomes available.
      }
    }
    if (wantsToPlay) {
      try {
        await audio.play();
      } catch (_) {
        wantsToPlay = false;
        syncPlayer(false, true);
      }
    }
  };

  audio.src = tracks[trackIndex].src;
  syncTrackCopy();
  syncPlayer(false);
  if (audio.readyState >= 1) {
    restorePlayer();
  } else {
    audio.addEventListener("loadedmetadata", restorePlayer, { once: true });
    audio.load();
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !playerStarted) return;
    try {
      const destination = new URL(link.href, location.href);
      if (destination.origin === location.origin) writePlayerState(!audio.paused || wantsToPlay);
    } catch (_) {
      // Ignore malformed or non-navigation links.
    }
  }, true);
  window.addEventListener("pagehide", () => {
    isLeavingPage = true;
    writePlayerState(!audio.paused || wantsToPlay);
  });

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
    const likeEndpoint = "https://lingchen-agent.653050197.workers.dev/likes/site";
    const visitorStorageKey = "lingchen-like-visitor-v1";
    const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const likeCard = likeButton.closest(".like-card");
    const likeHeart = likeButton.querySelector("span");
    let likeState = null;
    let likePending = false;

    const createVisitorId = () => {
      if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };

    let visitorId = createVisitorId();
    try {
      const savedVisitor = localStorage.getItem(visitorStorageKey);
      if (visitorPattern.test(savedVisitor || "")) {
        visitorId = savedVisitor;
      } else {
        localStorage.setItem(visitorStorageKey, visitorId);
      }
      localStorage.removeItem("lingchen-liked");
    } catch (_) {
      // Private browsing can disable storage; the current tab still gets a stable visitor ID.
    }

    const setLikePending = (pending) => {
      likePending = pending;
      likeButton.disabled = pending;
      likeButton.setAttribute("aria-busy", String(pending));
      likeCard?.classList.toggle("is-like-loading", pending);
    };

    const renderLikeState = (state) => {
      likeState = state;
      likeCard?.classList.remove("is-like-error");
      likeCard?.classList.toggle("is-liked", state.liked);
      likeHeart.textContent = state.liked ? "♥" : "♡";
      likeCount.textContent = String(state.count);
      likeButton.setAttribute("aria-pressed", String(state.liked));
      likeButton.setAttribute("aria-label", state.liked ? "取消喜欢这个网站" : "喜欢这个网站");
      likeButton.title = state.liked ? "取消点赞" : "给这个网站点赞";
    };

    const renderLikeError = () => {
      likeCard?.classList.add("is-like-error");
      likeCount.textContent = "—";
      likeButton.title = "点赞服务暂时不可用，点击重试";
    };

    const requestLikeState = async (liked) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(likeEndpoint, {
          method: typeof liked === "boolean" ? "PUT" : "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Lingchen-Visitor": visitorId
          },
          body: typeof liked === "boolean" ? JSON.stringify({ liked }) : undefined,
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`like request failed: ${response.status}`);
        const data = await response.json();
        if (!Number.isSafeInteger(data.count) || data.count < 0 || typeof data.liked !== "boolean") {
          throw new Error("invalid like response");
        }
        return data;
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const syncLikeState = async () => {
      if (likePending) return;
      setLikePending(true);
      try {
        renderLikeState(await requestLikeState());
      } catch (_) {
        renderLikeError();
      } finally {
        setLikePending(false);
      }
    };

    likeButton.addEventListener("click", async () => {
      if (likePending) return;
      const next = likeState ? !likeState.liked : true;
      setLikePending(true);
      try {
        renderLikeState(await requestLikeState(next));
      } catch (_) {
        renderLikeError();
      } finally {
        setLikePending(false);
      }
    });

    void syncLikeState();
  }

  const mobileInteractionMedia = window.matchMedia("(max-width: 760px)");
  let floatingToolRail;
  let floatingToolActions;
  let floatingToolToggle;
  let floatingToolsOpen = false;

  const setFloatingToolsOpen = (open, { restoreFocus = false } = {}) => {
    if (!floatingToolRail) return;
    const isMobile = mobileInteractionMedia.matches;
    floatingToolsOpen = isMobile && Boolean(open);
    floatingToolRail.classList.toggle("is-open", floatingToolsOpen);
    floatingToolToggle.hidden = !isMobile;
    floatingToolToggle.setAttribute("aria-expanded", String(floatingToolsOpen));
    floatingToolToggle.setAttribute("aria-label", floatingToolsOpen ? "收起互动工具" : "打开互动工具");
    floatingToolActions.hidden = isMobile && !floatingToolsOpen;
    if (restoreFocus && isMobile) floatingToolToggle.focus();
  };

  const showInteractionDialog = (dialog) => {
    dialog.showModal();
    document.documentElement.classList.add("interaction-modal-open");
  };

  const handleInteractionDialogClose = () => {
    document.documentElement.classList.remove("interaction-modal-open");
    if (mobileInteractionMedia.matches && floatingToolToggle) {
      floatingToolRail?.classList.remove("is-field-active");
      floatingToolToggle.focus({ preventScroll: true });
    }
  };

  const getFloatingToolRail = () => {
    if (floatingToolRail) return floatingToolActions;
    floatingToolRail = document.createElement("nav");
    floatingToolRail.className = "floating-tool-rail";
    floatingToolRail.setAttribute("aria-label", "互动工具");

    floatingToolActions = document.createElement("div");
    floatingToolActions.id = "interaction-actions";
    floatingToolActions.className = "interaction-actions";

    floatingToolToggle = document.createElement("button");
    floatingToolToggle.className = "interaction-toggle";
    floatingToolToggle.type = "button";
    floatingToolToggle.setAttribute("aria-controls", floatingToolActions.id);
    floatingToolToggle.innerHTML = '<span aria-hidden="true">✦</span><strong>互动</strong>';
    floatingToolRail.append(floatingToolToggle, floatingToolActions);
    document.body.appendChild(floatingToolRail);
    document.body.classList.add("has-floating-tool-rail");

    floatingToolToggle.addEventListener("click", () => {
      setFloatingToolsOpen(!floatingToolsOpen);
    });

    document.addEventListener("pointerdown", (event) => {
      if (floatingToolsOpen && !floatingToolRail.contains(event.target)) setFloatingToolsOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && floatingToolsOpen) {
        event.preventDefault();
        setFloatingToolsOpen(false, { restoreFocus: true });
      }
    });

    const isTextField = (target) => target instanceof Element
      && Boolean(target.closest("input, textarea, [contenteditable='true']"));
    document.addEventListener("focusin", (event) => {
      if (!mobileInteractionMedia.matches || !isTextField(event.target)) return;
      setFloatingToolsOpen(false);
      floatingToolRail.classList.add("is-field-active");
    });
    document.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!isTextField(document.activeElement)) floatingToolRail?.classList.remove("is-field-active");
      }, 0);
    });

    const syncFloatingTools = () => {
      floatingToolRail.classList.remove("is-field-active");
      setFloatingToolsOpen(false);
    };
    if (typeof mobileInteractionMedia.addEventListener === "function") {
      mobileInteractionMedia.addEventListener("change", syncFloatingTools);
    } else {
      mobileInteractionMedia.addListener(syncFloatingTools);
    }
    syncFloatingTools();
    return floatingToolActions;
  };

  // 陵辰助手：通过 Cloudflare Worker 调用模型，浏览器端永远不接触 API 密钥。
  const assistantEndpoint = "https://lingchen-agent.653050197.workers.dev/chat";
  const enableAssistant = !document.body.classList.contains("not-found-page");
  if (enableAssistant) {
    const assistantStorageKey = "lingchen-assistant-history-v1";
    const launcher = document.createElement("button");
    launcher.className = "assistant-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.innerHTML = '<span aria-hidden="true">✧</span><strong>问问陵辰</strong>';

    const dialog = document.createElement("dialog");
    dialog.className = "assistant-dialog";
    dialog.setAttribute("aria-labelledby", "assistant-title");
    dialog.innerHTML = `
      <div class="assistant-panel">
        <header class="assistant-head">
          <div class="assistant-identity">
            <span class="assistant-avatar" aria-hidden="true">辰</span>
            <div><p>LINGCHEN AGENT / ONLINE</p><h2 id="assistant-title">陵辰</h2></div>
          </div>
          <div class="assistant-head-actions">
            <button class="assistant-clear" type="button" title="清空对话">清空</button>
            <button class="assistant-close" type="button" aria-label="关闭智能体">×</button>
          </div>
        </header>
        <div class="assistant-messages" data-assistant-messages aria-live="polite"></div>
        <div class="assistant-suggestions" data-assistant-suggestions>
          <button type="button">介绍一下这个博客</button>
          <button type="button">最近在忙什么？</button>
          <button type="button">随机说句可爱的话</button>
        </div>
        <form class="assistant-form" data-assistant-form>
          <textarea id="assistant-input" rows="1" maxlength="600" placeholder="想问陵辰什么呀……" aria-label="发送给陵辰" required></textarea>
          <button type="submit" aria-label="发送消息">➤</button>
        </form>
        <p class="assistant-footnote">AI 的回答可能有误，请不要发送密码或其他隐私信息。</p>
      </div>`;

    getFloatingToolRail().appendChild(launcher);
    document.body.appendChild(dialog);
    const messagesNode = dialog.querySelector("[data-assistant-messages]");
    const form = dialog.querySelector("[data-assistant-form]");
    const input = form.querySelector("textarea");
    const submit = form.querySelector("button[type='submit']");
    const suggestions = dialog.querySelector("[data-assistant-suggestions]");
    let history = [];

    const readHistory = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(assistantStorageKey) || "[]");
        return Array.isArray(saved)
          ? saved.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").slice(-12)
          : [];
      } catch (_) {
        return [];
      }
    };

    const writeHistory = () => {
      try {
        localStorage.setItem(assistantStorageKey, JSON.stringify(history.slice(-12)));
      } catch (_) {}
    };

    const addMessage = (role, content, extraClass = "") => {
      const bubble = document.createElement("div");
      bubble.className = `assistant-message ${role} ${extraClass}`.trim();
      const label = document.createElement("span");
      label.textContent = role === "user" ? "YOU" : "陵辰";
      const text = document.createElement("p");
      text.textContent = content;
      bubble.append(label, text);
      messagesNode.appendChild(bubble);
      messagesNode.scrollTop = messagesNode.scrollHeight;
      return bubble;
    };

    const addResearchTrace = (bubble, research) => {
      if (!research || !bubble) return;
      const labels = {
        no_sources: "未找到可用来源",
        single_source: "单一来源，结论需谨慎",
        cross_checked: `已交叉核验 ${research.independent_domains} 个独立站点`
      };
      const trace = document.createElement("div");
      trace.className = `assistant-research-trace is-${research.verification || "unknown"}`;
      const stages = [];
      if (research.plan) stages.push("制定计划");
      if (research.searches) stages.push(`网页搜索×${research.searches}`);
      stages.push(labels[research.verification] || "研究完成");
      trace.textContent = `RESEARCH / ${stages.join(" → ")}`;
      if (research.plan?.steps?.length) {
        trace.title = `${research.plan.goal}\n${research.plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`;
      }
      bubble.appendChild(trace);
    };

    const renderHistory = () => {
      messagesNode.replaceChildren();
      if (!history.length) {
        addMessage("assistant", "嗨呀，我是陵辰～可以陪你逛博客、找日志，也可以随便聊两句哦。");
      } else {
        history.forEach((item) => addMessage(item.role, item.content));
      }
    };

    const pageContext = () => {
      const main = document.querySelector("main");
      return {
        title: document.title,
        path: location.pathname,
        text: (main?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 3500)
      };
    };

    const sendMessage = async (content) => {
      const cleaned = content.trim();
      if (!cleaned || submit.disabled) return;
      suggestions.hidden = true;
      history.push({ role: "user", content: cleaned });
      history = history.slice(-12);
      writeHistory();
      addMessage("user", cleaned);
      input.value = "";
      input.style.height = "auto";
      submit.disabled = true;
      input.disabled = true;
      const pending = addMessage("assistant", "正在翻阅这条世界线……", "is-pending");
      const progressMessages = ["正在判断是否需要检索……", "正在核对可用信息……", "正在整理结论与来源……"];
      let progressIndex = 0;
      const progressTimer = window.setInterval(() => {
        const text = pending.querySelector("p");
        if (text) {
          text.textContent = progressMessages[progressIndex % progressMessages.length];
          progressIndex += 1;
        }
      }, 1800);

      try {
        const response = await fetch(assistantEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, page: pageContext() })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "连接暂时中断");
        const answer = String(data.answer || "唔，没有收到有效回复，再问一次好吗？").trim();
        history.push({ role: "assistant", content: answer });
        history = history.slice(-12);
        writeHistory();
        pending.querySelector("p").textContent = answer;
        pending.classList.remove("is-pending");
        addResearchTrace(pending, data.research);
      } catch (error) {
        pending.querySelector("p").textContent = `${error.message || "连接失败"}，稍后再试试吧。`;
        pending.classList.remove("is-pending");
        pending.classList.add("is-error");
      } finally {
        window.clearInterval(progressTimer);
        submit.disabled = false;
        input.disabled = false;
        if (!mobileInteractionMedia.matches && dialog.open) input.focus();
        messagesNode.scrollTop = messagesNode.scrollHeight;
      }
    };

    history = readHistory();
    renderHistory();

    launcher.addEventListener("click", () => {
      setFloatingToolsOpen(false);
      showInteractionDialog(dialog);
      if (mobileInteractionMedia.matches) {
        dialog.querySelector(".assistant-close").focus({ preventScroll: true });
      } else {
        window.setTimeout(() => input.focus(), 80);
      }
    });
    dialog.addEventListener("close", handleInteractionDialogClose);
    dialog.querySelector(".assistant-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".assistant-clear").addEventListener("click", () => {
      history = [];
      localStorage.removeItem(assistantStorageKey);
      suggestions.hidden = false;
      renderHistory();
      if (!mobileInteractionMedia.matches) input.focus();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "Enter" && !event.shiftKey && !mobileInteractionMedia.matches) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
    });
    suggestions.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button) sendMessage(button.textContent);
    });
  }

  // GitHub Discussions：入口与智能体共用侧边工具栏，不参与原页面网格排版。
  const enableDiscussions = !document.body.classList.contains("not-found-page");
  if (enableDiscussions) {
    const launcher = document.createElement("button");
    launcher.className = "discussion-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.innerHTML = '<span aria-hidden="true">✦</span><strong>评论 · 收藏</strong>';

    const dialog = document.createElement("dialog");
    dialog.className = "discussion-dialog";
    dialog.setAttribute("aria-labelledby", "discussion-title");
    dialog.innerHTML = `
      <div class="discussion-panel">
        <header class="discussion-head">
          <div>
            <p>READER ECHO / GITHUB</p>
            <h2 id="discussion-title">评论与收藏</h2>
          </div>
          <button class="discussion-close" type="button" aria-label="关闭评论">×</button>
        </header>
        <p class="discussion-note">使用 GitHub 登录后即可留言；点亮反应，就是把这一页收入收藏。</p>
        <div class="discussion-frame" data-giscus-mount>
          <p class="discussion-loading">正在连接 GitHub Discussions…</p>
        </div>
      </div>`;

    getFloatingToolRail().appendChild(launcher);
    document.body.appendChild(dialog);
    const mount = dialog.querySelector("[data-giscus-mount]");
    let loaded = false;

    const loadGiscus = () => {
      if (loaded) return;
      loaded = true;
      mount.replaceChildren();
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.repo = "lingchen000/-";
      script.dataset.repoId = "R_kgDOTXv2iA";
      script.dataset.category = "General";
      script.dataset.categoryId = "DIC_kwDOTXv2iM4DBnwM";
      script.dataset.mapping = "pathname";
      script.dataset.strict = "0";
      script.dataset.reactionsEnabled = "1";
      script.dataset.emitMetadata = "0";
      script.dataset.inputPosition = "top";
      script.dataset.theme = "preferred_color_scheme";
      script.dataset.lang = "zh-CN";
      mount.appendChild(script);
    };

    launcher.addEventListener("click", () => {
      setFloatingToolsOpen(false);
      showInteractionDialog(dialog);
      loadGiscus();
    });
    dialog.addEventListener("close", handleInteractionDialogClose);
    dialog.querySelector(".discussion-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
})();
