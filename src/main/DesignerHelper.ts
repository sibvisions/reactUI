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

import COMPONENT_CLASSNAMES from "./components/COMPONENT_CLASSNAMES";
import Anchor from "./components/layouts/models/Anchor";
import { ORIENTATIONSPLIT } from "./components/panels/split/SplitPanel";
import { ISplit } from "./components/panels/split/UISplitPanel";
import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStore from "./contentstore/ContentStore";
import ContentStoreFull from "./contentstore/ContentStoreFull";
import BaseComponent from "./util/types/BaseComponent";
import Dimension from "./util/types/Dimension";

export type Coordinates = {
  x: number,
  y: number
}

export type FormLayoutInformation = {
    horizontalAnchors: Anchor[],
    verticalAnchors: Anchor[],
    anchorToColumnMap: Map<string, number>
    horizontalColumnToAnchorMap: Map<string, { leftAnchor: Anchor, rightAnchor: Anchor }>
    verticalColumnToAnchorMap: Map<string, { topAnchor: Anchor, bottomAnchor: Anchor }>
}

enum LAYOUTS {
    BORDERLAYOUT = 0,
    FORMLAYOUT = 1,
    FLOWLAYOUT = 2,
    GRIDLAYOUT = 3,
    NULLLAYOUT = 4
}

export class DesignerHelper {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    formLayouts: Map<string, FormLayoutInformation> = new Map<string, FormLayoutInformation>();

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

    getLayoutType(element:HTMLElement) {
        switch (element.getAttribute("data-layout")) {
            case "border":
                return LAYOUTS.BORDERLAYOUT;
            case "form":
                return LAYOUTS.FORMLAYOUT;
            case "flow":
                return LAYOUTS.FLOWLAYOUT;
            case "grid":
                return LAYOUTS.GRIDLAYOUT;
            case "nulllayout":
                return LAYOUTS.NULLLAYOUT;
            default:
                return -1;
        }
    }

    mouseIsInComponent(position:Coordinates, element: HTMLElement) {
        const size: Dimension = { width: parseInt(element.style.width), height: parseInt(element.style.height) }
        if (position.x >= 0 && position.x <= size.width && position.y >= 0 && position.y <= size.height) {
            return true;
        }
        return false;
    }

    isSecondSplit(position:Coordinates, splitPanelComp:ISplit, splitPanelElem:HTMLElement, firstPanel: HTMLElement, secondPanel: HTMLElement) {
        let secondPanelPosition:Coordinates = { x: parseInt(firstPanel.style.width) + 10, y: parseInt(splitPanelElem.style.top) }
        if ((splitPanelComp as ISplit).orientation === ORIENTATIONSPLIT.VERTICAL) {
            secondPanelPosition = { x: parseInt(splitPanelElem.style.left), y: parseInt(firstPanel.style.height) + 10 }
        }
        const secondPanelSize:Dimension = { width: parseInt(secondPanel.style.width), height: parseInt(secondPanel.style.height) }
        if (position.x >= 0 && position.y >= 0) {
           if (position.x >= secondPanelPosition.x && position.x <= (secondPanelPosition.x + secondPanelSize.width) 
            && position.y >= secondPanelPosition.y && position.y <= (secondPanelPosition.y + secondPanelSize.height)) {
                position.x -= secondPanelPosition.x;
                position.y -= secondPanelPosition.y
                return true;
           }
        }
        return false;
    }

    findClickedComponent(mouseCoords: Coordinates) {
        const docStyle = window.getComputedStyle(document.documentElement);

        const firstPanel = document.getElementById("workscreen")?.firstChild as HTMLElement;
        let foundComponent: { component: BaseComponent, element: HTMLElement, relativePosition: Coordinates } | null = null;
        let lastLayout: { component: BaseComponent, element: HTMLElement, layoutInfo: FormLayoutInformation } | null = null;

        let position = mouseCoords;
        position.x -= (parseInt(docStyle.getPropertyValue("--visionx-panel-wrapper-width")) + parseInt(docStyle.getPropertyValue("--visionx-content-padding")));
        position.y -= (parseInt(docStyle.getPropertyValue("--visionx-topbar-height")) + parseInt(docStyle.getPropertyValue("--visionx-content-padding")));

        const searchComponentsRecursive = (currentElem: HTMLElement, position: Coordinates) => {
            if (currentElem.childNodes.length) {
                currentElem.childNodes.forEach(childElem => {
                    let castedChild = childElem as HTMLElement;
                    let newPosition = { ...position }

                    if (castedChild.style.left) {
                        newPosition.x -= parseInt(castedChild.style.left);
                    }
                    
                    if (castedChild.style.top) {
                        newPosition.y -= parseInt(castedChild.style.top);
                    }
                    if (this.mouseIsInComponent(newPosition, castedChild)) {
                        // Added extra _ for wrappers because -wrapper could be a string people would use in their components-name
                        const childComp = this.contentStore.getComponentByName(castedChild.id.replace('-_wrapper', ''));
                        if (childComp) {
                            foundComponent = { component: childComp, element: castedChild, relativePosition: newPosition };

                            // If child is a panel get the layout element instead of the panel element
                            if ([COMPONENT_CLASSNAMES.PANEL, COMPONENT_CLASSNAMES.SCROLLPANEL].indexOf(childComp.className as COMPONENT_CLASSNAMES) !== -1) {
                                if (castedChild.childNodes.length) {
                                    castedChild = castedChild.childNodes[0] as HTMLElement;
                                }
                            }
                            else if (childComp.className === COMPONENT_CLASSNAMES.GROUPPANEL) {
                                const groupPanelHeader = castedChild.childNodes[0] as HTMLElement;
                                newPosition.y -= groupPanelHeader.offsetHeight;
                                castedChild = castedChild.childNodes[1].childNodes[0] as HTMLElement;
                            }
                            else if (childComp.className === COMPONENT_CLASSNAMES.TABSETPANEL) {
                                const tabsetHeader = castedChild.childNodes[0].childNodes[0] as HTMLElement;
                                newPosition.y -= tabsetHeader.offsetHeight;
                                castedChild = (castedChild.querySelector(".rc-panel") as HTMLElement).childNodes[0] as HTMLElement;
                            }
                            else if (childComp.className === COMPONENT_CLASSNAMES.SPLITPANEL) {
                                let firstPanel = castedChild.childNodes[0].childNodes[0] as HTMLElement;
                                let secondPanel = castedChild.childNodes[2].childNodes[0] as HTMLElement;
                                if (this.isSecondSplit(newPosition, (childComp as ISplit), castedChild, firstPanel, secondPanel)) {
                                    castedChild = secondPanel.childNodes[0] as HTMLElement;
                                }
                                else {
                                    castedChild = firstPanel.childNodes[0] as HTMLElement;
                                }
                            }
                        }
                        if (this.getLayoutType(castedChild) !== -1 && castedChild.getAttribute("data-name")) {
                            const layoutComponent = this.contentStore.getComponentByName(castedChild.getAttribute("data-name") as string);
                            if (layoutComponent) {
                                lastLayout = { component: layoutComponent, element: castedChild, layoutInfo: this.formLayouts.get(layoutComponent.name) as FormLayoutInformation };
                                searchComponentsRecursive(castedChild, newPosition);
                            }

                        }
                    }
                })
            }
        }

        if (firstPanel && position.x >= 0 && position.y >= 0) {
            foundComponent = { component: this.contentStore.getComponentByName(firstPanel.id) as BaseComponent, element: firstPanel, relativePosition: position };
            searchComponentsRecursive(firstPanel, position);
        }
        console.log(lastLayout)
        return foundComponent;
    }
}