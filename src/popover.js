import OBR from "@owlbear-rodeo/sdk";

/* =========================
   Constants / ID Builders
   ========================= */

const EXTENSION_ID = "com.token-note";

function buildPopoverId() {
  return `${EXTENSION_ID}/popover`;
}

function buildMetadataId() {
  return `${EXTENSION_ID}/metadata`;
}

/* =========================
   Public API
   ========================= */

export function handleOpen(itemId, elementId) {
  openPopover(buildPopoverId(), itemId, elementId);
}

/* =========================
   Popover Opening
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
   DOM Initialization
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
  attachNoteInputHandler(container, itemId);
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

  const notesDiv = container.querySelector("#notes");
  const newNoteP = document.createElement("p");
  newNoteP.textContent = notesText || "";

  const removeButton = document.createElement("span");
  removeButton.className = "remove";
  removeButton.innerHTML = "&times";

  newNoteP.appendChild(removeButton);

  if (notesDiv) notesDiv.append(newNoteP);

  console.log(`Note Content: ${notesText}`);
}

/* =========================
   Event Binding
   ========================= */

function attachNoteInputHandler(container, itemId) {
  const noteInput = getNoteInput(container);
  if (!noteInput) return;

  console.log("Note input found:", noteInput);
  focusNoteInput(noteInput);

  noteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // handleNoteSubmit(noteInput.value, itemId); // i'll try and use this for actual submit
      handleNoteSubmit();
    }
  });
}

/* =========================
   Event Handlers
   ========================= */

function handleNoteSubmit() {
  // fetchSavedNote(itemId, note); // i wont need to fetch ill need to set metadata
  closePopover();
}

function closePopover() {
  OBR.popover.close(buildPopoverId());
}

/* =========================
   OBR / Data Access
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
