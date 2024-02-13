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
import Anchor, { ORIENTATION } from "../../../components/layouts/models/Anchor";
import GridSize from "../../../components/layouts/models/GridSize";
import { ComponentSizes } from "../../../hooks/components-hooks/useComponents";
import Dimension from "../Dimension";

/** Enum for the id's of the resizer elements */
export enum RESIZE_START_POSITION {
    TOP_LEFT = "sel-comp-resizer-tl",
    TOP_CENTER = "sel-comp-resizer-tc",
    TOP_RIGHT = "sel-comp-resizer-tr",
    CENTER_LEFT = "sel-comp-resizer-cl",
    CENTER_CENTER = "sel-comp-resizer-cc",
    CENTER_RIGHT = "sel-comp-resizer-cr",
    BOTTOM_LEFT = "sel-comp-resizer-bl",
    BOTTOM_CENTER = "sel-comp-resizer-bc",
    BOTTOM_RIGHT = "sel-comp-resizer-br"
}

/** Enum for Layouts */
export enum LAYOUTS {
    BORDERLAYOUT = 0,
    FORMLAYOUT = 1,
    FLOWLAYOUT = 2,
    GRIDLAYOUT = 3,
    NULLLAYOUT = 4,
    NOT_FOUND = -1
}

/** A pair of anchors eg. in a column */
export type AnchorPair = { 
    topLeftAnchor: Anchor, 
    bottomRightAnchor: Anchor 
}

/** Interface for LayoutInformation */
export interface LayoutInformation {
    id: string,
    name: string,
    originalConstraints: Map<string, string>,
    componentSizes: Map<string, ComponentSizes> | undefined,
    componentIndeces: string[]
    calculatedSize: Dimension|null,
    componentConstraints: Map<string, string>,
    layoutType: LAYOUTS;
}

/** Interface for FormLayoutInformations */
export interface FormLayoutInformation extends LayoutInformation {
    layoutData: string,
    horizontalGap: number,
    verticalGap: number,
    horizontalAnchors: Anchor[],
    verticalAnchors: Anchor[],
    anchorToColumnMap: Map<string, number>,
    horizontalColumnToAnchorMap: Map<string, AnchorPair>,
    verticalColumnToAnchorMap: Map<string, AnchorPair>,
    componentIndeces: string[]
    isAdvancedFormLayout: boolean,
    advancedLabelPosition: "top"|"left"|null,
    anchors: Map<string, Anchor>
}

/** Interface for BorderLayoutInformation */
export interface BorderLayoutInformation extends LayoutInformation {
    currentSize: Dimension|null
}

/** Interface for FlowLayoutInformation */
export interface FlowLayoutInformation extends LayoutInformation {
    orientation: ORIENTATION,
    autoWrap: boolean
}

/** Interface for GridLayoutInformation */
export interface GridLayoutInformation extends LayoutInformation {
    gridSize: GridSize,
    currentSize: Dimension|null,
    columnSize: number,
    rowSize: number
}

/** Interface for NullLayoutInformation */
export interface NullLayoutInformation extends LayoutInformation {
    
}