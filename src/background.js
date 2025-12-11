import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu.js";

const ID = "com.token-note";

OBR.onReady(() => {
  setupContextMenu();
});
