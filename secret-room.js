const SecretRoom = (() => {
  const state = {
    tab: "people",
    coworkers: [],
    posts: [],
    chats: [],
    messages: [],
    activeUser: null,
    loading: false,
    error: "",
    pollTimer: null,
    notificationTimer: null,
    notificationUsername: "",
    notificationInitialized: false,
    unreadCount: 0,
    unreadMessageCount: 0,
    unreadPostCount: 0,
    latestPostId: 0,
    lastReadPostId: 0,
    communityDraft: "",
    messageDrafts: {},
    messageAttachments: {}
  };
  const baseDocumentTitle = document.title.replace(/^\(\d+\+?\)\s*/, "");

  function api(path, options = {}) {
    return cloudApiRequest(`/api/secret-room${path}`, options);
  }

  function communityReadStorageKey() {
    return `pismai-community-last-read:${state.notificationUsername}`;
  }

  function initials(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((part) => part[0]).join("") || "?").toUpperCase();
  }

  function formatTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function formatFileSize(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function readMessageAttachment(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) return reject(new Error("รองรับเฉพาะไฟล์ PNG, JPG, WebP หรือ PDF"));
      if (file.size > 5 * 1024 * 1024) return reject(new Error("ไฟล์แนบต้องมีขนาดไม่เกิน 5 MB"));
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(reader.result || "") });
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์แนบได้"));
      reader.readAsDataURL(file);
    });
  }

  function unreadLabel(count) {
    return count > 99 ? "99+" : String(count);
  }

  function showNotificationToast(count, postCount = 0, messageCount = 0) {
    document.querySelector("[data-community-notification-toast]")?.remove();
    const toast = document.createElement("button");
    toast.type = "button";
    toast.className = "community-notification-toast";
    toast.dataset.communityNotificationToast = "";
    const details = [
      postCount ? `โพสต์ใหม่ ${unreadLabel(postCount)}` : "",
      messageCount ? `แชทใหม่ ${unreadLabel(messageCount)}` : ""
    ].filter(Boolean).join(" · ");
    toast.innerHTML = `<span class="community-notification-dot"></span><span><strong>มีรายการใหม่ใน Community</strong><small>${escapeHtml(details || `ยังไม่ได้อ่าน ${unreadLabel(count)} รายการ`)}</small></span>`;
    toast.addEventListener("click", () => {
      toast.remove();
      location.hash = "#/secret-room";
    });
    document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add("is-visible"), 20);
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 220);
    }, 6500);
  }

  function publishUnreadCount(value, { notify = false, postCount, messageCount, latestPostId } = {}) {
    const nextCount = Math.max(0, Number(value) || 0);
    const previousCount = state.unreadCount;
    state.unreadCount = nextCount;
    if (postCount !== undefined) state.unreadPostCount = Math.max(0, Number(postCount) || 0);
    if (messageCount !== undefined) state.unreadMessageCount = Math.max(0, Number(messageCount) || 0);
    if (latestPostId !== undefined) state.latestPostId = Math.max(0, Number(latestPostId) || 0);
    document.querySelectorAll("[data-secret-unread-badge]").forEach((badge) => {
      badge.textContent = unreadLabel(nextCount);
      badge.hidden = nextCount === 0;
      badge.closest(".nav-button")?.classList.toggle("has-notification", nextCount > 0);
    });
    document.querySelectorAll("[data-secret-unread]").forEach((badge) => {
      badge.textContent = nextCount ? unreadLabel(nextCount) : "";
      badge.hidden = nextCount === 0;
    });
    document.title = nextCount ? `(${unreadLabel(nextCount)}) ${baseDocumentTitle}` : baseDocumentTitle;
    if (notify && state.notificationInitialized && nextCount > previousCount) {
      showNotificationToast(nextCount, state.unreadPostCount, state.unreadMessageCount);
    }
    state.notificationInitialized = true;
  }

  async function refreshNotifications({ notify = true } = {}) {
    if (!getSession()?.user) return;
    try {
      const response = await api(`/notifications?after_post_id=${state.lastReadPostId}`);
      publishUnreadCount(response?.data?.unread_count, {
        notify,
        postCount: response?.data?.unread_post_count,
        messageCount: response?.data?.unread_message_count,
        latestPostId: response?.data?.latest_post_id
      });
    } catch (error) {
      if (error?.status === 401) {
        stopNotifications();
        return;
      }
      console.warn("Community notification refresh failed.", error);
    }
  }

  function startNotifications() {
    const username = String(getSession()?.user?.username || "").toLowerCase();
    if (!username) return stopNotifications();
    if (state.notificationUsername !== username) {
      stopNotifications();
      state.notificationUsername = username;
      state.notificationInitialized = false;
      state.unreadCount = 0;
      state.lastReadPostId = Math.max(0, Number(localStorage.getItem(communityReadStorageKey())) || 0);
      state.latestPostId = state.lastReadPostId;
    }
    if (state.notificationTimer) {
      publishUnreadCount(state.unreadCount);
      return;
    }
    refreshNotifications({ notify: false });
    state.notificationTimer = window.setInterval(() => refreshNotifications(), 15000);
  }

  function stopNotifications() {
    if (state.notificationTimer) window.clearInterval(state.notificationTimer);
    state.notificationTimer = null;
    state.notificationUsername = "";
    state.notificationInitialized = false;
    state.unreadMessageCount = 0;
    state.unreadPostCount = 0;
    state.latestPostId = 0;
    state.lastReadPostId = 0;
    publishUnreadCount(0);
    document.querySelector("[data-community-notification-toast]")?.remove();
  }

  function renderShell() {
    return `
      <section class="secret-room" data-secret-room>
        <header class="secret-room-header">
          <div>
            <p class="eyebrow">พื้นที่ร่วมงานภายใน</p>
            <h2>ห้องแห่งความลับ</h2>
            <p>ดูเพื่อนร่วมงาน แบ่งปันเรื่องราว และพูดคุยแบบส่วนตัว</p>
          </div>
          <div class="secret-room-presence"><span class="secret-online-dot"></span><strong data-secret-online-count>0</strong> ออนไลน์</div>
        </header>
        <nav class="secret-tabs" aria-label="เมนูห้องแห่งความลับ">
          <button type="button" data-secret-tab="people">เพื่อนร่วมงาน</button>
          <button type="button" data-secret-tab="community">คอมมู</button>
          <button type="button" data-secret-tab="chat">แชทส่วนตัว <span class="secret-tab-unread" data-secret-unread ${state.unreadCount ? "" : "hidden"}>${state.unreadCount ? unreadLabel(state.unreadCount) : ""}</span></button>
        </nav>
        <div class="secret-room-content" data-secret-content>
          <div class="secret-loading">กำลังโหลดข้อมูล...</div>
        </div>
      </section>`;
  }

  function renderPeople() {
    if (!state.coworkers.length) {
      return `<div class="secret-empty"><strong>ยังไม่พบเพื่อนร่วมงาน</strong><span>บัญชีที่เปิดใช้งานจะแสดงที่นี่</span></div>`;
    }
    return `
      <div class="secret-section-heading">
        <div><h3>เพื่อนร่วมงานทั้งหมด</h3><p>เลือกพูดคุยได้ทันทีโดยไม่ต้องเพิ่มเพื่อน</p></div>
        <span>${state.coworkers.length.toLocaleString("th-TH")} คน</span>
      </div>
      <div class="coworker-grid">
        ${state.coworkers.map((person) => `
          <article class="coworker-card ${person.is_online ? "is-online" : ""}">
            <div class="secret-avatar">${escapeHtml(initials(person.fullname || person.username))}<span></span></div>
            <div class="coworker-main">
              <strong>${escapeHtml(person.fullname || person.username)}</strong>
              <span>@${escapeHtml(person.username)}</span>
              <small>${escapeHtml(person.role_label || person.role || "เพื่อนร่วมงาน")}</small>
            </div>
            <div class="coworker-actions">
              <span class="presence-label">${person.is_online ? "ออนไลน์" : "ออฟไลน์"}</span>
              ${person.is_self ? `<span class="self-label">คุณ</span>` : `<button type="button" data-start-chat="${escapeHtml(person.username)}">แชท</button>`}
            </div>
          </article>`).join("")}
      </div>`;
  }

  function renderCommunity() {
    const user = getSession()?.user || {};
    return `
      <div class="community-layout">
        <div class="community-main">
          <form class="community-composer" data-community-form>
            <div class="secret-avatar compact">${escapeHtml(initials(user.fullname || user.username))}</div>
            <div>
              <textarea name="content" maxlength="2000" rows="3" placeholder="แบ่งปันข้อความกับเพื่อนร่วมงาน..." required>${escapeHtml(state.communityDraft)}</textarea>
              <div class="composer-footer"><small>ทุกคนในระบบจะเห็นโพสต์นี้</small><button type="submit">โพสต์</button></div>
            </div>
          </form>
          <div class="community-feed">
            ${state.posts.length ? state.posts.map((post) => `
              <article class="community-post">
                <div class="secret-avatar compact">${escapeHtml(initials(post.author_fullname || post.author_username))}</div>
                <div>
                  <header><strong>${escapeHtml(post.author_fullname || post.author_username)}</strong><span>@${escapeHtml(post.author_username)} · ${escapeHtml(formatTime(post.created_at))}</span></header>
                  <p>${escapeHtml(post.content).replace(/\n/g, "<br>")}</p>
                </div>
              </article>`).join("") : `<div class="secret-empty"><strong>ยังไม่มีโพสต์</strong><span>เริ่มแบ่งปันข้อความแรกกับทีมได้เลย</span></div>`}
          </div>
        </div>
        <aside class="community-note"><strong>คอมมูของทีม</strong><p>พื้นที่กลางสำหรับประกาศ ข่าวสาร และพูดคุยทั่วไป ระบบรับ–ส่งงานจะเพิ่มในขั้นถัดไป</p></aside>
      </div>`;
  }

  function renderChat() {
    const active = state.activeUser;
    const draftKey = String(active?.username || "").toLowerCase();
    const messageDraft = state.messageDrafts[draftKey] || "";
    const messageAttachment = state.messageAttachments[draftKey] || null;
    return `
      <div class="secret-chat-layout">
        <aside class="chat-list">
          <header><h3>แชทส่วนตัว</h3><span>แสดงเฉพาะคนที่เคยคุย</span></header>
          <div>
            ${state.chats.length ? state.chats.map((chat) => `
              <button type="button" class="chat-list-item ${active?.username === chat.username ? "active" : ""}" data-open-chat="${escapeHtml(chat.username)}">
                <span class="secret-avatar compact">${escapeHtml(initials(chat.fullname || chat.username))}<i class="${chat.is_online ? "online" : ""}"></i></span>
                <span><strong>${escapeHtml(chat.fullname || chat.username)}</strong><small>${escapeHtml(chat.last_message || "เริ่มบทสนทนา")}</small></span>
                ${chat.unread_count ? `<b>${Number(chat.unread_count).toLocaleString("th-TH")}</b>` : ""}
              </button>`).join("") : `<div class="chat-list-empty">ยังไม่มีประวัติแชท<br><small>เริ่มจากหน้าเพื่อนร่วมงาน</small></div>`}
          </div>
        </aside>
        <section class="chat-panel">
          ${active ? `
            <header class="chat-panel-header">
              <div class="secret-avatar compact">${escapeHtml(initials(active.fullname || active.username))}</div>
              <div><strong>${escapeHtml(active.fullname || active.username)}</strong><span>${active.is_online ? "ออนไลน์" : `@${escapeHtml(active.username)}`}</span></div>
            </header>
            <div class="message-list" data-message-list>
              ${state.messages.length ? state.messages.map((message) => `
                <div class="message-row ${message.is_mine ? "mine" : "theirs"}">
                  <div class="message-bubble">
                    ${message.content ? `<p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>` : ""}
                    ${message.attachment_url && String(message.attachment_type || "").startsWith("image/") ? `<a class="message-image-link" href="${escapeHtml(message.attachment_url)}" target="_blank" rel="noopener"><img class="message-attachment-image" src="${escapeHtml(message.attachment_url)}" alt="${escapeHtml(message.attachment_name || "รูปภาพแนบ")}" /></a>` : ""}
                    ${message.attachment_url && message.attachment_type === "application/pdf" ? `<a class="message-file-card" href="${escapeHtml(message.attachment_url)}" target="_blank" rel="noopener"><strong>PDF</strong><span>${escapeHtml(message.attachment_name || "เอกสาร.pdf")}<small>${escapeHtml(formatFileSize(message.attachment_size))}</small></span></a>` : ""}
                    ${message.attachment_name && !message.attachment_url ? `<span class="message-attachment-error">ไม่สามารถเปิดไฟล์แนบได้</span>` : ""}
                    <time>${escapeHtml(formatTime(message.created_at))}</time>
                  </div>
                </div>`).join("") : `<div class="secret-empty"><strong>เริ่มบทสนทนา</strong><span>ข้อความนี้เห็นได้เฉพาะคุณและคู่สนทนา</span></div>`}
            </div>
            <form class="message-composer" data-message-form>
              <div class="message-compose-main">
                <textarea name="content" rows="1" maxlength="3000" placeholder="พิมพ์ข้อความ...">${escapeHtml(messageDraft)}</textarea>
                ${messageAttachment ? `<div class="message-attachment-preview"><span><strong>${escapeHtml(messageAttachment.name)}</strong><small>${escapeHtml(formatFileSize(messageAttachment.size))}</small></span><button type="button" data-remove-message-attachment aria-label="ลบไฟล์แนบ">×</button></div>` : ""}
              </div>
              <label class="message-attach-button" title="แนบรูปหรือ PDF"><input type="file" data-message-attachment accept="image/png,image/jpeg,image/webp,application/pdf" /><span aria-hidden="true">＋</span><b>แนบไฟล์</b></label>
              <button type="submit">ส่ง</button>
            </form>` : `<div class="chat-placeholder"><span class="chat-placeholder-icon">•••</span><strong>เลือกบทสนทนา</strong><p>เลือกจากประวัติด้านซ้าย หรือเริ่มแชทจากหน้าเพื่อนร่วมงาน</p></div>`}
        </section>
      </div>`;
  }

  function update() {
    const root = document.querySelector("[data-secret-room]");
    if (!root) return;
    const activeComposer = document.activeElement?.matches?.("[data-message-form] textarea, [data-community-form] textarea")
      ? document.activeElement
      : null;
    const activeComposerName = activeComposer?.closest("form")?.hasAttribute("data-message-form") ? "message" : "community";
    const selectionStart = activeComposer?.selectionStart;
    const selectionEnd = activeComposer?.selectionEnd;
    root.querySelectorAll("[data-secret-tab]").forEach((button) => button.classList.toggle("active", button.dataset.secretTab === state.tab));
    const online = state.coworkers.filter((person) => person.is_online).length;
    const onlineNode = root.querySelector("[data-secret-online-count]");
    if (onlineNode) onlineNode.textContent = online.toLocaleString("th-TH");
    const content = root.querySelector("[data-secret-content]");
    if (!content) return;
    if (state.loading && !state.coworkers.length) content.innerHTML = `<div class="secret-loading">กำลังโหลดข้อมูล...</div>`;
    else if (state.error) content.innerHTML = `<div class="secret-error"><strong>โหลดข้อมูลไม่สำเร็จ</strong><span>${escapeHtml(state.error)}</span><button type="button" data-secret-retry>ลองอีกครั้ง</button></div>`;
    else content.innerHTML = state.tab === "community" ? renderCommunity() : state.tab === "chat" ? renderChat() : renderPeople();
    bindDynamicEvents();
    requestAnimationFrame(() => {
      const list = document.querySelector("[data-message-list]");
      if (list) list.scrollTop = list.scrollHeight;
      if (activeComposer) {
        const selector = activeComposerName === "message" ? "[data-message-form] textarea" : "[data-community-form] textarea";
        const restoredComposer = document.querySelector(selector);
        restoredComposer?.focus();
        restoredComposer?.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  async function loadBase({ quiet = false } = {}) {
    if (!quiet) state.loading = true;
    state.error = "";
    update();
    try {
      const [coworkers, posts, chats] = await Promise.all([api("/coworkers"), api("/posts"), api("/chats")]);
      state.coworkers = coworkers.data || [];
      state.posts = posts.data || [];
      state.chats = chats.data || [];
      state.unreadMessageCount = state.chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0);
      publishUnreadCount(state.unreadMessageCount + state.unreadPostCount);
      if (state.activeUser) {
        state.activeUser = state.coworkers.find((person) => person.username === state.activeUser.username) || state.activeUser;
      }
    } catch (error) {
      if (!quiet) state.error = error.message || "ไม่สามารถเชื่อมต่อระบบกลางได้";
    } finally {
      state.loading = false;
      update();
    }
  }

  async function openChat(username) {
    const person = state.coworkers.find((item) => item.username === username)
      || state.chats.find((item) => item.username === username)
      || { username, fullname: username };
    state.activeUser = person;
    state.tab = "chat";
    state.messages = [];
    update();
    try {
      const response = await api(`/messages?with=${encodeURIComponent(username)}`);
      state.messages = response.data || [];
      await api("/messages/read", { method: "POST", body: JSON.stringify({ username }) });
      const chat = state.chats.find((item) => item.username === username);
      if (chat) chat.unread_count = 0;
      state.unreadMessageCount = state.chats.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
      publishUnreadCount(state.unreadMessageCount + state.unreadPostCount);
    } catch (error) {
      state.error = error.message;
    }
    update();
  }

  function bindDynamicEvents() {
    document.querySelectorAll("[data-start-chat], [data-open-chat]").forEach((button) => {
      button.addEventListener("click", () => openChat(button.dataset.startChat || button.dataset.openChat));
    });
    document.querySelector("[data-secret-retry]")?.addEventListener("click", () => loadBase());
    document.querySelector("[data-community-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const content = String(new FormData(form).get("content") || "").trim();
      if (!content) return;
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        await api("/posts", { method: "POST", body: JSON.stringify({ content }) });
        state.communityDraft = "";
        form.reset();
        const response = await api("/posts");
        state.posts = response.data || [];
        update();
      } catch (error) {
        window.alert(error.message || "โพสต์ไม่สำเร็จ");
        button.disabled = false;
      }
    });
    document.querySelector("[data-community-form] textarea")?.addEventListener("input", (event) => {
      state.communityDraft = event.currentTarget.value;
    });
    document.querySelector("[data-message-form] textarea")?.addEventListener("input", (event) => {
      const draftKey = String(state.activeUser?.username || "").toLowerCase();
      if (draftKey) state.messageDrafts[draftKey] = event.currentTarget.value;
    });
    document.querySelector("[data-message-attachment]")?.addEventListener("change", async (event) => {
      const draftKey = String(state.activeUser?.username || "").toLowerCase();
      try {
        const attachment = await readMessageAttachment(event.currentTarget.files?.[0]);
        if (draftKey && attachment) state.messageAttachments[draftKey] = attachment;
        update();
      } catch (error) {
        event.currentTarget.value = "";
        window.alert(error.message || "แนบไฟล์ไม่สำเร็จ");
      }
    });
    document.querySelector("[data-remove-message-attachment]")?.addEventListener("click", () => {
      const draftKey = String(state.activeUser?.username || "").toLowerCase();
      if (draftKey) delete state.messageAttachments[draftKey];
      update();
    });
    document.querySelector("[data-message-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const content = String(new FormData(form).get("content") || "").trim();
      const draftKey = String(state.activeUser?.username || "").toLowerCase();
      const attachment = state.messageAttachments[draftKey] || null;
      if ((!content && !attachment) || !state.activeUser) return;
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        await api("/messages", { method: "POST", body: JSON.stringify({
          recipient_username: state.activeUser.username,
          content,
          attachment_name: attachment?.name || "",
          attachment_data: attachment?.data || ""
        }) });
        delete state.messageDrafts[draftKey];
        delete state.messageAttachments[draftKey];
        form.reset();
        await openChat(state.activeUser.username);
        const chats = await api("/chats");
        state.chats = chats.data || [];
        update();
      } catch (error) {
        window.alert(error.message || "ส่งข้อความไม่สำเร็จ");
        button.disabled = false;
      }
    });
  }

  function bind() {
    stop();
    document.querySelectorAll("[data-secret-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.tab = button.dataset.secretTab;
        state.error = "";
        update();
        if (state.tab === "community") markCommunityRead();
      });
    });
    loadBase();
    state.pollTimer = window.setInterval(async () => {
      if (!document.querySelector("[data-secret-room]")) return stop();
      await loadBase({ quiet: true });
      if (state.activeUser && state.tab === "chat") {
        const response = await api(`/messages?with=${encodeURIComponent(state.activeUser.username)}`).catch(() => null);
        if (response) {
          state.messages = response.data || [];
          await api("/messages/read", {
            method: "POST",
            body: JSON.stringify({ username: state.activeUser.username })
          }).catch(() => null);
          const activeChat = state.chats.find((chat) => chat.username === state.activeUser.username);
          if (activeChat) activeChat.unread_count = 0;
          state.unreadMessageCount = state.chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0);
          publishUnreadCount(state.unreadMessageCount + state.unreadPostCount);
          update();
        }
      }
    }, 15000);
  }

  function stop() {
    if (state.pollTimer) window.clearInterval(state.pollTimer);
    state.pollTimer = null;
  }

  function markCommunityRead() {
    const latestPostId = Math.max(state.latestPostId, ...state.posts.map((post) => Number(post.id) || 0));
    if (!latestPostId) return;
    state.latestPostId = latestPostId;
    state.lastReadPostId = latestPostId;
    localStorage.setItem(communityReadStorageKey(), String(latestPostId));
    state.unreadPostCount = 0;
    publishUnreadCount(state.unreadMessageCount);
  }

  return {
    render: renderShell,
    bind,
    stop,
    startNotifications,
    stopNotifications,
    refreshNotifications,
    getUnreadCount: () => state.unreadCount
  };
})();

window.SecretRoom = SecretRoom;
