(() => {
  console.log("🚀 [PISITO] Script inyectado correctamente en:", window.location.hostname);

  const INBOX_URLS = [
    "http://localhost:5173/extension-widget",
    "http://localhost:4173/extension-widget"
  ];

  const HOTKEYS = [
    { ctrlKey: true, shiftKey: true, altKey: false, key: "V" },
    { ctrlKey: false, shiftKey: true, altKey: true, key: "P" }
  ];

  let root = null;
  let overlay = null;
  let iframe = null;
  let note = null;
  let loadTimer = null;

  function isTypingTarget(element) {
    if (!(element instanceof HTMLElement)) return false;
    const tag = element.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || element.isContentEditable || element.getAttribute("role") === "textbox";
  }

  function pickInboxUrl() {
    if (window.location.protocol === "https:") {
      return INBOX_URLS.find((url) => url.startsWith("https://")) || INBOX_URLS[0];
    }
    return INBOX_URLS[0];
  }

  function showNote(message) {
    if (!note || !iframe) return;
    note.dataset.show = "true";
    note.querySelector("[data-note-text]").textContent = message;
    iframe.style.display = "none";
  }

  function hideNote() {
    if (!note || !iframe) return;
    note.dataset.show = "false";
    iframe.style.display = "block";
  }

  function openInNewTab() {
    window.open(pickInboxUrl(), "_blank", "noopener,noreferrer");
  }

  function ensureUi() {
    if (root && overlay && iframe && note) {
      console.log("🔵 [PISITO] La UI ya estaba creada.");
      return;
    }
    
    console.log("🟢 [PISITO] Creando elementos del DOM...");

    root = document.createElement("div");
    root.id = "pisito-inbox-root";

    overlay = document.createElement("div");
    overlay.className = "pisito-overlay";
    overlay.dataset.open = "false";

    const modal = document.createElement("section");
    modal.className = "pisito-modal";

    const header = document.createElement("header");
    header.className = "pisito-header";
    header.innerHTML = `
      <p class="pisito-title">Funil</p>
      <div class="pisito-actions">
        <button type="button" class="pisito-btn" id="pisito-tab-btn">Abrir en pestaña</button>
        <button type="button" class="pisito-btn pisito-close" id="pisito-close-btn">×</button>
      </div>
    `;

    const frameWrap = document.createElement("div");
    frameWrap.className = "pisito-frame-wrap";

    iframe = document.createElement("iframe");
    iframe.className = "pisito-frame";
    iframe.setAttribute("referrerpolicy", "no-referrer");

    note = document.createElement("div");
    note.className = "pisito-note";
    note.dataset.show = "false";
    note.innerHTML = `
      <h4>No se pudo cargar el Inbox</h4>
      <p data-note-text></p>
      <button type="button" class="pisito-btn" id="pisito-fallback-btn">Abrir Inbox en pestaña</button>
    `;

    frameWrap.append(iframe, note);
    modal.append(header, frameWrap);
    overlay.appendChild(modal);
    root.appendChild(overlay);
    
    document.body.appendChild(root);
    console.log("🟢 [PISITO] Elementos inyectados en el body.");

    // Eventos
    header.querySelector("#pisito-tab-btn").addEventListener("click", openInNewTab);
    header.querySelector("#pisito-close-btn").addEventListener("click", closeModal);
    note.querySelector("#pisito-fallback-btn").addEventListener("click", openInNewTab);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

    iframe.addEventListener("load", () => {
      console.log("✅ [PISITO] iframe cargado.");
      if (loadTimer) window.clearTimeout(loadTimer);
      hideNote();
    });
  }

  function openModal() {
    console.log("🟡 [PISITO] Intentando abrir el modal...");
    ensureUi();
    overlay.dataset.open = "true";
    document.body.style.overflow = "hidden";
    
    const url = pickInboxUrl();
    console.log("🟡 [PISITO] Cargando URL en iframe:", url);
    iframe.src = url;
    
    if (loadTimer) window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(() => {
      showNote("Posible bloqueo del navegador hacia http://localhost. Prueba con HTTPS local.");
    }, 2200);
  }

  function closeModal() {
    console.log("🔴 [PISITO] Cerrando modal.");
    if (!overlay) return;
    overlay.dataset.open = "false";
    document.body.style.overflow = "";
  }

  function toggleModal() {
    if (overlay?.dataset.open === "true") {
      closeModal();
    } else {
      openModal();
    }
  }

  function matchesHotkey(event, hotkey) {
    return (
      event.key.toUpperCase() === hotkey.key &&
      event.ctrlKey === hotkey.ctrlKey &&
      event.shiftKey === hotkey.shiftKey &&
      event.altKey === hotkey.altKey
    );
  }

  document.addEventListener("keydown", (event) => {
    // Para ver cada tecla que pulsas y confirmar si el script está escuchando
    // console.log("[PISITO Debug] Tecla:", event.key, "| Ctrl:", event.ctrlKey, "| Shift:", event.shiftKey, "| Alt:", event.altKey);

    if (isTypingTarget(event.target)) return;

    if (HOTKEYS.some((hotkey) => matchesHotkey(event, hotkey))) {
      console.log("🎯 [PISITO] ¡Atajo detectado!");
      event.preventDefault();
      toggleModal();
      return;
    }

    if (event.key === "Escape" && overlay?.dataset.open === "true") {
      event.preventDefault();
      closeModal();
    }
  });
})();