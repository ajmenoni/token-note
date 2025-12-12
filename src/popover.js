import OBR from "@owlbear-rodeo/sdk";

/* =========================
   Constants
   ========================= */

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

  setHiddenItemId(container, itemId); //I think I can remove this now
  await setPopoverContent(container, itemId);
  attachSaveListener(container);
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

function getNoteInput() {
  const textareaInput = document.querySelector("textarea");
  if (!textareaInput) return;
  return textareaInput;
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

  if (!notesText) {
    const noteInputWrapper = container.querySelector(".note-input-wrapper");
    if (!noteInputWrapper) return;
    const noteInput = container.querySelector(".textarea-input");
    noteInputWrapper.classList.remove("display-none");

    focusNoteInput(noteInput);
  }

  const noteWrapper = container.querySelector(".note-wrapper");

  if (!noteWrapper) return;

  const notesDiv = container.querySelector("#notes");

  //added here because each opening of the popover is a new popover.
  attachNotesListener(container);

  const newNoteP = document.createElement("p");

  newNoteP.textContent = notesText || "";

  if (notesDiv) notesDiv.append(newNoteP);
  noteWrapper.classList.remove("display-none");
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

function handleEdit() {
  // get item note&id
  const itemId = getItemIdFromUrl();
  const itemNote = fetchSavedNote(itemId);

  if (!itemNote) return;

  //'close' note display
  hideContainer(getNoteDisplayWrapper());
  // 'open' text input container
  displayContainer(getNoteInputWrapper());

  addNoteValueToInput();
}

async function handleNoteSubmit(container) {
  const noteInput = getNoteInput();
  const newNote = noteInput.value;
  const itemId = getItemIdFromUrl();

  saveNoteText(newNote, itemId);

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
