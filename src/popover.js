import OBR from "@owlbear-rodeo/sdk";

/* =========================
   Constants
   ========================= */

let quill = null;
const EXTENSION_ID = "com.token-note";

function buildPopoverId() {
  return `${EXTENSION_ID}/popover`;
}

function buildMetadataId() {
  return `${EXTENSION_ID}/metadata`;
}

/* =========================
   API
   ========================= */

export function handleOpen(itemId, elementId) {
  openPopover(buildPopoverId(), itemId, elementId);
}

/* =========================
  Open popover
   ========================= */

function openPopover(popoverId, itemId, elementId) {
  OBR.popover.open({
    id: popoverId,
    url: buildPopoverUrl(itemId),
    width: 400,
    height: 500,
    anchorElementId: elementId,
    disableClickAway: false,
    hidePaper: true,
  });
}

function buildPopoverUrl(itemId) {
  return `/popover.html?itemId=${itemId}`;
}

/* =========================
   DOM Init
   ========================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    OBR.onReady(() => {
      bootstrapPopover().catch((err) => console.error(err));
    });
  });
} else {
  OBR.onReady(() => {
    bootstrapPopover().catch((err) => console.error(err));
  });
}

async function bootstrapPopover() {
  const itemId = getItemIdFromUrl();
  const container = getPopoverContainer();
  if (!container) return;

  const editorElement = document.getElementById("quill-editor");

  if (editorElement && !quill) {
    quill = new Quill("#quill-editor", {
      theme: "snow",
      modules: {
        toolbar: "#quill-toolbar",
      },
    });
  }

  setHiddenItemId(container, itemId); //I think I can remove this now
  await setPopoverContent(container, itemId);
  attachSaveListener(container);

  if (editorElement) {
    quill.focus();
  }
}

/* =========================
   URL Helpers
   ========================= */

function getItemIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("itemId");
}

/* =========================
   DOM Queries
   ========================= */

function getPopoverContainer() {
  return document.getElementById("token-note-popover");
}

function getHiddenItemIdInput(container) {
  return container.querySelector("#item-id-hidden");
}

function getNoteInputWrapper() {
  return document.querySelector(".note-input-wrapper");
}

function getNoteDisplayWrapper() {
  return document.querySelector(".note-wrapper");
}

/* =========================
   DOM Mutations
   ========================= */

function setHiddenItemId(container, itemId) {
  const hiddenInput = getHiddenItemIdInput(container);
  if (hiddenInput) {
    hiddenInput.value = itemId || "";
  }
}

function focusNoteInput(input) {
  input.focus();
}

async function setPopoverContent(container, itemId) {
  const notesText = await fetchSavedNote(itemId);

  if (!notesText || isQuillEmpty(notesText)) {
    const noteInputWrapper = container.querySelector(".note-input-wrapper");
    if (!noteInputWrapper) return;
    quill.setText("");
    noteInputWrapper.classList.remove("display-none");

    // focusNoteInput(noteInput);
  } else {
    const noteWrapper = container.querySelector(".note-wrapper");

    if (!noteWrapper) return;

    const notesDiv = container.querySelector("#notes");

    //added here because each opening of the popover is a new popover.
    attachNotesListener(container);

    if (notesDiv) notesDiv.innerHTML = notesText || "";

    noteWrapper.classList.remove("display-none");
  }
}

function hideContainer(el) {
  el.classList.add("display-none");
}

function displayContainer(el) {
  el.classList.remove("display-none");
}

async function addNoteValueToInput() {
  const noteInput = getNoteInput();
  const itemId = getItemIdFromUrl();
  const noteText = await fetchSavedNote(itemId);
  noteInput.value = noteText;
}

/* =========================
   Event Binding
   ========================= */

function attachNotesListener(container) {
  container.addEventListener("dblclick", function (event) {
    handleEdit();
  });
}

function attachSaveListener(container) {
  const saveButton = container.querySelector(".button-save");
  saveButton.addEventListener("click", function (event) {
    handleNoteSubmit(container);
  });
}
/* =========================
   Event Handlers
   ========================= */

function isQuillEmpty(html) {
  if (!html) return true;

  const cleaned = html
    .replace(/<p><br><\/p>/g, "")
    .replace(/<p><\/p>/g, "")
    .trim();

  return cleaned.length === 0;
}

async function handleEdit() {
  // get item note&id
  const itemId = getItemIdFromUrl();
  const noteHtml = await fetchSavedNote(itemId);
  if (!noteHtml) return;
  quill.root.innerHTML = noteHtml;
  console.log();

  //'close' note display
  hideContainer(getNoteDisplayWrapper());
  // 'open' text input container
  displayContainer(getNoteInputWrapper());
  quill.focus();
}

async function handleNoteSubmit() {
  const newNote = quill.root.innerHTML;
  const itemId = getItemIdFromUrl();

  const saveValue = isQuillEmpty(newNote) ? "" : newNote;

  saveNoteText(saveValue, itemId);

  closePopover();
}

function closePopover() {
  OBR.popover.close(buildPopoverId());
}

/* =========================
   OBR / data
   ========================= */

async function saveNoteText(newNote, id) {
  const metadataId = buildMetadataId();
  if (newNote === null) return;

  await OBR.scene.items.updateItems([id], (items) => {
    for (let item of items) {
      if (!item.metadata[metadataId]) item.metadata[metadataId] = {};
      item.metadata[metadataId].note = newNote;
    }
  });
}

async function fetchSavedNote(itemId) {
  if (!itemId) return;

  const item = await getSceneItem(itemId);
  const metadata = getTokenNoteMetadata(item);
  const notes = metadata?.note;
  return notes;
}

async function getSceneItem(itemId) {
  const items = await OBR.scene.items.getItems([itemId]);
  return items[0];
}

function getTokenNoteMetadata(item) {
  return item.metadata[buildMetadataId()];
}
