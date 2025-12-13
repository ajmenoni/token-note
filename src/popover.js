import OBR from "@owlbear-rodeo/sdk";

// **constants

let quill = null;
const EXTENSION_ID = "com.token-note";

function buildPopoverId() {
  return `${EXTENSION_ID}/popover`;
}

function buildMetadataId() {
  return `${EXTENSION_ID}/metadata`;
}

// **api

export function handleOpen(itemId, elementId) {
  openPopover(buildPopoverId(), itemId, elementId);
}

// **open popover

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

// **init

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

  await setPopoverContent(container, itemId);
  attachSaveListener(container);

  if (editorElement) {
    quill.focus();
  }
}

// **helpers

function getItemIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("itemId");
}

// **dom queries

function getPopoverContainer() {
  return document.getElementById("token-note-popover");
}

function getNoteInputWrapper() {
  return document.querySelector(".note-input-wrapper");
}

function getNoteDisplayWrapper() {
  return document.querySelector(".note-wrapper");
}

// **dom mutations

async function setPopoverContent(container, itemId) {
  const notesText = await fetchSavedNote(itemId);

  if (!notesText || isQuillEmpty(notesText)) {
    const noteInputWrapper = getNoteInputWrapper();

    if (!noteInputWrapper) return;

    quill.setText("");

    displayContainer(noteInputWrapper);
  } else {
    const noteWrapper = getNoteDisplayWrapper();

    if (!noteWrapper) return;

    const notesDiv = container.querySelector("#notes");

    attachNotesListener(container);

    if (notesDiv) notesDiv.innerHTML = notesText || "";

    displayContainer(noteWrapper);
  }
}

function hideContainer(el) {
  el.classList.add("display-none");
}

function displayContainer(el) {
  el.classList.remove("display-none");
}

// **Binding

function attachNotesListener(container) {
  container.ondblclick = handleEdit;
}

function attachSaveListener(container) {
  const saveButton = container.querySelector(".button-save");
  saveButton.onclick = handleNoteSubmit;
}

// **Event Handlers

function isQuillEmpty(html) {
  if (!html) return true;

  const cleaned = html
    .replace(/<p><br><\/p>/g, "")
    .replace(/<p><\/p>/g, "")
    .trim();

  return cleaned.length === 0;
}

async function handleEdit() {
  const itemId = getItemIdFromUrl();
  const noteHtml = await fetchSavedNote(itemId);

  if (!noteHtml) return;

  quill.root.innerHTML = noteHtml;

  hideContainer(getNoteDisplayWrapper());
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

// **data

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
