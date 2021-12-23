/** React imports */
import { useContext, useRef } from "react";

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

    const pressedElement = useRef<boolean>(false);

    const pressedX = useRef<number>();
    
    const pressedY = useRef<number>();

    const handleMousePressed = (event:MouseEvent) => {
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        pressedX.current = event.x;
        pressedY.current = event.y;
        pressedElement.current = true;

        if (eventMousePressed) {
            const pressReq = createMouseRequest();
            pressReq.componentId = compName;
            pressReq.button = getMouseButton(event.button);
            pressReq.x = event.x;
            pressReq.y = event.y;
            setTimeout(() => showTopBar(context.server.sendRequest(pressReq, REQUEST_ENDPOINTS.MOUSE_PRESSED), topbar), 75);
        }
    }

    const handleMouseUp = (event:MouseEvent) => {
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        if (eventMouseReleased && pressedElement.current) {
            const releaseReq = createMouseRequest();
            releaseReq.componentId = compName;
            releaseReq.button = getMouseButton(event.button);
            releaseReq.x = event.x;
            releaseReq.y = event.y;
            setTimeout(() => showTopBar(context.server.sendRequest(releaseReq, REQUEST_ENDPOINTS.MOUSE_RELEASED), topbar), 76);
        }

        pressedElement.current = false;

        if (eventMouseClicked && pressedX.current === event.x && pressedY.current === event.y) {
            const clickReq = createMouseClickedRequest();
            clickReq.componentId = compName;
            clickReq.button = getMouseButton(event.button);
            clickReq.x = event.x;
            clickReq.y = event.y;
            clickReq.clickCount = event.detail;
            setTimeout(() => showTopBar(context.server.sendRequest(clickReq, REQUEST_ENDPOINTS.MOUSE_CLICKED), topbar), 77);
        }
    }

    useEventHandler(element, "mousedown", (event) => handleMousePressed(event as MouseEvent));
    useEventHandler(document.body, "mouseup", (event) => handleMouseUp(event as MouseEvent));
}
export default useMouseListener;