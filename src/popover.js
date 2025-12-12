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

  setHiddenItemId(container, itemId);
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

function getNoteInput(container) {
  return container.querySelector("input[type='text']");
}

function getHiddenItemIdInput(container) {
  return container.querySelector("#item-id-hidden");
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
  } else {
    const noteWrapper = container.querySelector(".note-wrapper");

    if (!noteWrapper) return;

    const notesDiv = container.querySelector("#notes");

    attachNotesListener(container);
    const newNoteP = document.createElement("p");

    newNoteP.textContent = notesText || "";

    if (notesDiv) notesDiv.append(newNoteP);
    noteWrapper.classList.remove("display-none");
  }
}

/* =========================
   Event Binding
   ========================= */

function attachNotesListener(container) {
  container.addEventListener("dblclick", function (event) {
    alert("You double clicked");
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

function handleNoteSubmit(container) {
  const idEl = getHiddenItemIdInput(container);
  const idValue = idEl.value;
  console.log(idValue);

  closePopover();
}

function closePopover() {
  OBR.popover.close(buildPopoverId());
}

/* =========================
   OBR / get data
   ========================= */

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
