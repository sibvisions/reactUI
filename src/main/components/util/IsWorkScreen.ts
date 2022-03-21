import { IPanel } from "../panels";

export function isWorkScreen(panel:IPanel) {
    if (panel.screen_navigationName_ || panel.content_className_) {
        return true;
    }
    return false;
}