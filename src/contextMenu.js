import OBR from "@owlbear-rodeo/sdk";
import { handleOpen } from "./popover";

const ID = "com.token-note";

export function setupContextMenu() {
  OBR.contextMenu.create({
    id: `${ID}/token-note`,
    icons: [
      {
        icon: "paper-note.svg",
        label: "Token Note",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],

    async onClick(context, elementId) {
      if (context.items.length === 0) return;

      const itemId = context.items[0].id;

      handleOpen(itemId, elementId);
    },
  });
}
