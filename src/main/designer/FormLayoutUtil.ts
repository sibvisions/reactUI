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

import Anchor, { ORIENTATION } from "../components/layouts/models/Anchor";
import { FormLayoutInformation } from "./DesignerHelper";

export function getColumnValue(name: string) {
    if (name === "lm" || name === "tm") {
        return 0;
    }
    else if (name === "rm" || name === "bm") {
        return -1
    }
    else {
        return parseInt(name.substring(1));
    }
}

// Returns the lastAnchor based on orientation and negative
export function getLastAnchor(layoutInfo:FormLayoutInformation, orientation: ORIENTATION, negative:boolean) {
    const listToCheck = orientation === ORIENTATION.HORIZONTAL ? layoutInfo.horizontalAnchors : layoutInfo.verticalAnchors;
    const leftTopChar = orientation === ORIENTATION.HORIZONTAL ? "l" : "t";
    const rightBottomChar = orientation === ORIENTATION.HORIZONTAL ? "r" : "b";
    let lastAnchor = listToCheck.find(anchor => negative ? anchor.name === rightBottomChar : anchor.name === leftTopChar) as Anchor;
    for (let i = 0; i < listToCheck.length; i++) {
        const newAnchor = listToCheck[i];
        const columnValue = getColumnValue(newAnchor.name);
        const lastColumnValue = getColumnValue(lastAnchor.name);
        // Set anchor if lastAnchor is l, r, t or b
        if (isNaN(lastColumnValue)) {
            lastAnchor = newAnchor;
        }
        else {
            // If negative use anchor with smaller column value or if column value is equal use left or top over right or bottom 
            if (negative) {
                if (columnValue < lastColumnValue || (columnValue === lastColumnValue && newAnchor.name.substring(0, 1) === leftTopChar)) {
                    lastAnchor = newAnchor;
                }
            }
            // If not negative use anchor with higher column value or if equal use right or bottom over left and top
            else {
                if (columnValue > lastColumnValue || (columnValue === lastColumnValue && newAnchor.name.substring(0, 1) === rightBottomChar)) {
                    lastAnchor = newAnchor
                }
            }
        }
    }
    return lastAnchor
}

export function createDesignerAnchors(layoutInfo:FormLayoutInformation, name: string) {
    const createAnchorData = (name: string) => {
        let anchorData = "";
    }

    const orientation = ["l", "r"].indexOf(name.substring(0, 1)) !== -1 ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL;
    const negative = name.substring(1).includes("-");
    const lastAnchor = getLastAnchor(layoutInfo, orientation, negative);
    //console.log(lastAnchor)
}

export function fillAnchorToColumnMap(layoutInfo:FormLayoutInformation, anchor: Anchor) {
    if (anchor.name.length > 1) {
        let column = 9999;
        const anchorDirection = anchor.name.substring(0, 1);
        column = getColumnValue(anchor.name);
        layoutInfo.anchorToColumnMap.set(anchor.name, column);
        return { column: column, direction: anchorDirection }
    }
}

export function fillColumnToAnchorMaps(layoutInfo:FormLayoutInformation, anchor: Anchor, horizontal: boolean, column: number, direction: string) {
    if (anchor.name.length > 1) {
        const mapToFill = horizontal ? layoutInfo.horizontalColumnToAnchorMap : layoutInfo.verticalColumnToAnchorMap;
        const directionHelper = horizontal ? "l" : "t"
        const leftTop = horizontal ? "leftAnchor" : "topAnchor";
        const rightBottom = horizontal ? "rightAnchor" : "bottomAnchor"
        const entry = mapToFill.get(column.toString());
        if (entry) {
            if (direction === directionHelper) {
                (entry as any)[leftTop] = anchor;
            }
            else {
                (entry as any)[rightBottom] = anchor;
            }
        }
        else {
            //const firstChar = anchor.name.substring(0, 1);
            const getAnchorNameToCreate = () => {
                if (anchor.name === "lm") {
                    return "r0";
                }
                else if (anchor.name === "rm") {
                    return "l-1";
                }
                else if (anchor.name === "tm") {
                    return "b0";
                }
                else if (anchor.name === "bm") {
                    return "t-1";
                }
                else {
                    const firstChar = anchor.name.substring(0, 1);
                    if (firstChar === "l") {
                        return anchor.name.replace("l", "r");
                    }
                    else if (firstChar === "r") {
                        return anchor.name.replace("r", "l");
                    }
                    else if (firstChar === "t") {
                        return anchor.name.replace("t", "b");
                    }
                }
                return anchor.name.replace("b", "t");
            }
            // other anchor is a placeholder
            if (direction === directionHelper) {
                //console.log(anchor)
                createDesignerAnchors(layoutInfo, getAnchorNameToCreate())
                //@ts-ignore
                mapToFill.set(column.toString(), horizontal ? { leftAnchor: anchor, rightAnchor: new Anchor("xx,xx,-,x,xx") } : { topAnchor: anchor, bottomAnchor: new Anchor("xx,xx,-,x,xx") })
            }
            else {
                //@ts-ignore
                mapToFill.set(column.toString(), horizontal ? { leftAnchor: new Anchor("xx,xx,-,x,xx"), rightAnchor: anchor } : { topAnchor: new Anchor("xx,xx,-,x,xx"), bottomAnchor: anchor })
            }
        }
    }
}

export function fillAnchorMaps(layoutInfo:FormLayoutInformation, pAnchor: Anchor) {
    const colAndDir = fillAnchorToColumnMap(layoutInfo, pAnchor);
    if (colAndDir) {
        fillColumnToAnchorMaps(layoutInfo, pAnchor, pAnchor.orientation === ORIENTATION.HORIZONTAL, colAndDir.column, colAndDir.direction);
    }
}