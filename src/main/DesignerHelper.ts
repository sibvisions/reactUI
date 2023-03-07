/* Copyright 2023 SIB Visions GmbH
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

import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStore from "./contentstore/ContentStore";
import ContentStoreFull from "./contentstore/ContentStoreFull";

export type Coordinates = {
  x: number,
  y: number
}

export class DesignerHelper {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    /**
     * @constructor constructs submanager instance
     * @param store - contentstore instance
     */
        constructor(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
    }

    /** Sets the ContentStore */
    setContentStore(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
    }

    isLayoutComponent(element: HTMLElement) {
        return element.getAttribute("data-layout") !== null || element.getAttribute("data-layout") !== undefined;
    }

    findClickedComponent(mouseCoords: Coordinates) {
        const docStyle = window.getComputedStyle(document.documentElement);
        let position = mouseCoords;
        console.log(docStyle.getPropertyValue("--visionx-panel-wrapper-width"), docStyle.getPropertyValue("--visionx-content-padding"))
        position.x -= (parseInt(docStyle.getPropertyValue("--visionx-panel-wrapper-width")) + parseInt(docStyle.getPropertyValue("--visionx-content-padding")));
        position.y -= (parseInt(docStyle.getPropertyValue("--visionx-topbar-height")) + parseInt(docStyle.getPropertyValue("--visionx-content-padding")))
        console.log(position)
        const firstPanel = document.getElementById("workscreen")?.firstChild;
        if (firstPanel) {
            const firstLayout = firstPanel.childNodes[0] as HTMLElement;
            if (firstLayout && this.isLayoutComponent(firstLayout)) {
                console.log("formlayouts children: ", firstLayout.childNodes)
                
            }
        }
    }
}