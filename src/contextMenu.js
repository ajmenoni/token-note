import OBR from "@owlbear-rodeo/sdk";
import { handleOpen } from "./popover";

const ID = "com.token-note";

export function setupContextMenu() {
  // Add Note button
  OBR.contextMenu.create({
    id: `${ID}/add-note`,
    icons: [
      {
        icon: "/add.svg",
        label: "Add Note",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    //handle clicking context button
    async onClick(context, elementId) {
      if (context.items.length === 0) return;

      const itemId = context.items[0].id;

      handleOpen(itemId, elementId);
    },
  });

  // Test button to see if metadata is saved
  OBR.contextMenu.create({
    //make button to check--avoid name collision
    id: `${ID}/show-note`,
    icons: [
      {
        icon: "/data.svg",
        label: "Show Note",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    async onClick(context) {
      if (context.items.length === 0) return;

      const notes = context.items.map(
        (item) =>
          item.metadata[`${ID}/metadata`] &&
          item.metadata[`${ID}/metadata`].note
      );

      const hasNotes = notes.some((note) => note !== undefined);

      if (!hasNotes) {
        alert("No notes found for these items.");
      } else {
        alert("Saved notes:\n" + notes.filter(Boolean).join("\n"));
      }
    },
  });
}
