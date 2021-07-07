/** React imports */
import { useContext } from "react";

/** Hook imports */
import { useEventHandler } from ".";

/** Other imports */
import { appContext } from "../../AppProvider";
import { createMouseClickedRequest, createMouseRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const getMouseButton = (button:number): "Left"|"Middle"|"Right" => {
    if (button === 0) {
        return "Left";
    }
    else if (button === 1) {
        return "Middle";
    }
    else {
        return "Right";
    }
}

const useMouseListener = (compName:string, element?:HTMLElement, eventMouseClicked?:boolean, eventMousePressed?:boolean, eventMouseReleased?:boolean) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    const handleMouseClicked = (event:MouseEvent) => {
        const clickReq = createMouseClickedRequest();
        clickReq.componentId = compName;
        clickReq.button = getMouseButton(event.button);
        clickReq.x = event.x;
        clickReq.y = event.y;
        clickReq.clickCount = event.detail;
        showTopBar(context.server.sendRequest(clickReq, REQUEST_ENDPOINTS.MOUSE_CLICKED), topbar);
    }

    const handleMouse = (event:MouseEvent, released:boolean) => {
        const pressReq = createMouseRequest();
        pressReq.componentId = compName;
        pressReq.button = getMouseButton(event.button);
        pressReq.x = event.x;
        pressReq.y = event.y;
        showTopBar(context.server.sendRequest(pressReq, released ? REQUEST_ENDPOINTS.MOUSE_RELEASED : REQUEST_ENDPOINTS.MOUSE_PRESSED), topbar);
    }

    useEventHandler(element, "mouseup", eventMouseClicked ? (event) =>  handleMouseClicked(event as MouseEvent) : undefined);
    useEventHandler(element, "mousedown", eventMousePressed ? (event) => handleMouse(event as MouseEvent, false) : undefined);
    useEventHandler(document.body, "mouseup", eventMouseReleased ? (event) => handleMouse(event as MouseEvent, true) : undefined);
}
export default useMouseListener;