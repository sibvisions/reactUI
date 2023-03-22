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

export function getNextAnchorName(name: string, negative: boolean) {
    if (["l", "r", "t", "b"].indexOf(name) !== -1) {
        return name + "m";
    }
    else if (name === "lm") {
        return "r0";
    }
    else if (name === "rm") {
        return "l-1";
    }
    else if (name === "tm") {
        return "b0";
    }
    else if (name === "bm") {
        return "t-1";
    }
    else {
        const firstChar = name.substring(0, 1);
        const columnValue = getColumnValue(name);
        if (!negative) {
            if (firstChar === "l") {
                return "r" + columnValue.toString();
            }
            else if (firstChar === "r") {
                return "l" + (columnValue + 1).toString();
            }
            else if (firstChar === "t") {
                return "b" + columnValue.toString();
            }
            else if (firstChar === "b") {
                return "t" + (columnValue + 1).toString();
            }
        }
        else {
            if (firstChar === "r") {
                return "l" + columnValue.toString();
            }
            else if (firstChar === "l") {
                return "r" + (columnValue - 1).toString();
            }
            else if (firstChar === "b") {
                return "t" + columnValue.toString();
            }
            else if (firstChar === "t") {
                return "b" + (columnValue - 1).toString();
            }
        }
    }
    return name;
}

export function createDesignerAnchors(layoutInfo:FormLayoutInformation, name: string) {
    const getAnchorsToCreate = (lastAnchor: Anchor, orientation: ORIENTATION, negative: boolean) => {
        const anchorsToCreate: string[] = [];
        let anchorName = getNextAnchorName(lastAnchor.name, negative);
        let currentColumnValue = getColumnValue(anchorName);
        let columnValueToCreate = getColumnValue(name);
        console.log(anchorName, currentColumnValue, columnValueToCreate, layoutInfo, name)
        // Continue loop if not negative and currentColumnValue is smaller or equal than the col to create, if negative and greater or equal than col to create.
        // And if the new anchor name is not the same as the anchor name to create
        while (((!negative && currentColumnValue <= columnValueToCreate) || (negative && currentColumnValue >= columnValueToCreate)) && anchorName !== name) {
            anchorsToCreate.push(anchorName);
            anchorName = getNextAnchorName(anchorName, negative);
            currentColumnValue = getColumnValue(anchorName);
        }
        anchorsToCreate.push(name);
        return anchorsToCreate;
    }

    const createAnchorData = (name: string) => {
        let anchorData = "";
    }

    const orientation = ["l", "r"].indexOf(name.substring(0, 1)) !== -1 ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL;
    const negative = name.substring(1).includes("-");
    const lastAnchor = getLastAnchor(layoutInfo, orientation, negative);
    console.log(getAnchorsToCreate(lastAnchor, orientation, negative));
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
            // other anchor is a placeholder
            if (direction === directionHelper) {
                //console.log(anchor)
                //TODO: only call create after all anchors registered themselves and look for placeholder anchors then replace them
                //createDesignerAnchors(layoutInfo, getAnchorNameToCreate())
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