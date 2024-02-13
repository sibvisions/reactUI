/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { useContext, useMemo, useRef } from "react";
import useEventHandler from "../event-hooks/useEventHandler";
import { appContext } from "../../contexts/AppProvider";
import { createMouseClickedRequest, createMouseRequest } from "../../factories/RequestFactory";
import { showTopBar } from "../../components/topbar/TopBar";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";

/** Returns which mouse-button was pressed */
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

/**
 * Adds mouse-listeners for the components and sends mouse-event-request to the server
 * @param compName - the name of the component
 * @param element - the element which the handler is added to
 * @param eventMouseClicked - true if mouse clicked should be added
 * @param eventMousePressed - true if mouse pressed should be added
 * @param eventMouseReleased - true if mouse released should be added
 * @param hold - function on hold
 * @param isTable - true, if this is in a table
 * @param rowSelectionFunc - a row select function which is called on mouse release
 */
const useMouseListener = (
    compName:string, 
    element?:HTMLElement, 
    eventMouseClicked?:boolean, 
    eventMousePressed?:boolean, 
    eventMouseReleased?:boolean,
    hold?: (type: "pressed" | "released" | "clicked" | "cancelled"| "row_select", release: () => void) => void,
    isTable?: boolean,
    rowSelectionFunc?: Function
) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** true, if an element has been pressed */
    const pressedElement = useRef<boolean>(false);

    /** The x-position when clicking */
    const pressedX = useRef<number>();
    
    /** The y-position when clicking */
    const pressedY = useRef<number>();

    /** The className of the component */
    const componentClassName = useMemo(() => {
        if (context.contentStore.getComponentByName(compName)) {
            return context.contentStore.getComponentByName(compName)!.className
        }
        return undefined
    }, [compName])

    /**
     * Checks where has been clicked and sends the data to the server
     * @param event - the mouse event
     */
    const handleMousePressed = (event:MouseEvent) => {
        // Don't send when the dropdownbutton of a linkedcelleditor has been clicked
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        // Save the press-position for later
        pressedX.current = event.x;
        pressedY.current = event.y;
        pressedElement.current = true;

        // Call the row selection function
        if (isTable && rowSelectionFunc) {
            const release = () => rowSelectionFunc(event);
            hold ? hold("row_select", release) : release();
        }

        if (eventMousePressed) {
            const pressReq = createMouseRequest();
            pressReq.componentId = compName;
            pressReq.button = getMouseButton(event.button);
            pressReq.x = event.x;
            pressReq.y = event.y;
            pressReq.clickCount = event.detail;
            const release = () => showTopBar(context.server.sendRequest(pressReq, REQUEST_KEYWORDS.MOUSE_PRESSED), context.server.topbar);
            hold ? hold("pressed", release) : release();
        }
    }

    const handleMouseUp = (event:MouseEvent) => {
        // Don't send when the dropdownbutton of a linkedcelleditor has been clicked
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        // Only send when the eventflag is true, and the x and y position from mousedown and mouseup is the same
        if (eventMouseClicked && pressedX.current === event.x && pressedY.current === event.y) {
            const clickReq = createMouseClickedRequest();
            clickReq.componentId = compName;
            clickReq.button = getMouseButton(event.button);
            clickReq.x = event.x;
            clickReq.y = event.y;
            clickReq.clickCount = event.detail;
            const release = () => showTopBar(context.server.sendRequest(clickReq, REQUEST_KEYWORDS.MOUSE_CLICKED), context.server.topbar);
            hold ? hold("clicked", release) : release();
        } else if (hold) {
            hold("cancelled", () => {});
        }

        if (eventMouseReleased && pressedElement.current) {
            const releaseReq = createMouseRequest();
            releaseReq.componentId = compName;
            releaseReq.button = getMouseButton(event.button);
            releaseReq.x = event.x;
            releaseReq.y = event.y;
            releaseReq.clickCount = event.detail;
            const release = () => showTopBar(context.server.sendRequest(releaseReq, REQUEST_KEYWORDS.MOUSE_RELEASED), context.server.topbar);
            hold ? hold("released", release) : release();
        }

        pressedElement.current = false;
    }

    useEventHandler(element, "mousedown", (event) => handleMousePressed(event as MouseEvent), isTable, componentClassName);
    useEventHandler(document.body, "mouseup", (event) => handleMouseUp(event as MouseEvent), isTable, componentClassName);
}
export default useMouseListener;