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

import { Designer } from "../../../../MiddleMan";
import Anchor, { ORIENTATION } from "../../../components/layouts/models/Anchor";
import Constraints from "../../../components/layouts/models/Constraints";
import BaseContentStore from "../../../contentstore/BaseContentStore";
import SetLayoutRequest from "../../../request/other/SetLayoutRequest";
import Dimension from "../Dimension";
import IBaseComponent from "../IBaseComponent";
import { AnchorPair, BorderLayoutInformation, FlowLayoutInformation, FormLayoutInformation, GridLayoutInformation, LAYOUTS, NullLayoutInformation, RESIZE_START_POSITION } from "./LayoutInformation";

/** Type for Coordinates */
export type Coordinates = {
    x: number,
    y: number
  }

/** Anchor which is being dragged, when a component is being resized horizontally or vertically */
export type DraggedAnchor = {
    name: string,
    absolutePosition: number,
    position: number,
    orientation: ORIENTATION
}

/** Anchors which are being dragged, when resizing a component diagonally */
export type DraggedAnchors = {
    vName: string,
    vAbsolutePosition: number,
    vPosition: number,
    hName: string,
    hAbsolutePosition: number
    hPosition: number,
    orientation: ORIENTATION.DIAGONAL
}

type ConstraintNames = {
    constraintTop: string,
    constraintLeft: string,
    constraintBottom: string,
    constraintRight: string
}

/** Type for a selectedComponent */
type SelectedComponent = { component: IBaseComponent, element: HTMLElement, preferredSize: Dimension };

/** Interface for DraggableComponent */
export interface DraggableComponent { 
    component: IBaseComponent, 
    element: HTMLElement, 
    relativePosition: Coordinates
}

/** Interface for DraggablePanel */
export interface DraggablePanel extends DraggableComponent { 
    layoutAssistant: BorderLayoutAssistant | FormLayoutAssistant | FlowLayoutAssistant | GridLayoutAssistant | NullLayoutAssistant | null,
    layoutType: LAYOUTS
}

export enum DRAG_ACTION {
    MOVE = 0,
    RESIZE = 1
}

export type GhostComponentType = {
    createGhostComponent: (event: React.DragEvent<HTMLElement>, element: HTMLElement, action: DRAG_ACTION) => void,
    resizeGhostComponent: (delta: ResizeDelta, resizeStartPosition: RESIZE_START_POSITION|null) => void,
    handleGhostComponentDragging: (dragCoordinates: Coordinates) => void,
    removeGhostComponent: () => void
}

export type ResizeDelta = { deltaX: number, deltaY:number }|number|null

interface LayoutAssistant {
    layoutInfo: FormLayoutInformation | BorderLayoutInformation | FlowLayoutInformation | GridLayoutInformation | NullLayoutInformation,
    handleResizeDragStart:(component: IBaseComponent, resizeStartPosition: RESIZE_START_POSITION|null) => void,
    handleMoveDragStart(component:IBaseComponent, element: HTMLElement, handleSelectedComponentChange: (newComponent: IBaseComponent, newElement: HTMLElement, size: Dimension) => void): void
    handleComponentMoving:(foundPanel: DraggablePanel, selectedComponent: SelectedComponent, designer: Designer, setSetLayoutRequest: (newSetLayoutRequest: SetLayoutRequest) => void) => void,
    handleComponentResizing:(selectedComponent: SelectedComponent, resizeStartPosition: RESIZE_START_POSITION | null,
        relativePosition: Coordinates, oldDelta: ResizeDelta, ghostComponent: GhostComponentType,
        designer: Designer, setSetLayoutRequest: (newSetLayoutRequest: SetLayoutRequest) => void, resizeStartConstraints: string | null | undefined) => ResizeDelta
    handleDragEnd:(component: IBaseComponent, resizeStartPosition: RESIZE_START_POSITION|null, designer: Designer, setLayoutRequest: SetLayoutRequest|null, dragAction: DRAG_ACTION|null, delta: ResizeDelta|null) => void
    
    compareComponentIndex:(rect1:DOMRect, rect2:DOMRect) => -1|0|1,
    updateComponentIndex:(name: string, componentElement: HTMLElement|null) => number|undefined,
    getDraggingPanel:(foundPanel: DraggablePanel, selectedComponent: SelectedComponent, designer: Designer) => string,
    removeOriginalConstraintsFromOldParent:(component: IBaseComponent, designer: Designer) => void
}

export interface FormLayoutAssistant extends LayoutAssistant {
    layoutInfo: FormLayoutInformation,
    originalAbsoluteAnchorPositions: Map<string, number>,
    originalAnchorPositions: Map<string, number>,
    designerCreatedAnchorPairs: { vPositive: AnchorPair|null, hPositive: AnchorPair|null, vNegative: AnchorPair|null, hNegative: AnchorPair|null },
    draggedAnchors: DraggedAnchor|DraggedAnchors|null,
    constraintCorrections: any,
    correctionsDecreasedComponents: string[],
    columnValueChangeFactor: number,
    decreaseAnchorFlag: boolean,
    isBorderAnchor: (name: string) => boolean,
    isMarginAnchor: (name: string) => boolean,
    isAnchorNegative: (name: string) => boolean,
    isAnchorHorizontal: (name: string) => boolean,
    isEvenAnchor: (name: string) => boolean,
    getAnchorArray: (horizontal?: boolean) => Anchor[],
    getAnchorArrayCopy: (horizontal?: boolean) => Anchor[],
    checkAnchorName: (name: string) => string,
    getAnchorByName: (name: string) => Anchor|undefined,
    getNextAnchorName: (name: string) => string,
    getPreviousAnchorName: (name: string) => string,
    getNextAnchor: (name: string) => Anchor|undefined,
    getPreviousAnchor: (name: string) => Anchor|undefined,
    getParallelAnchor: (name: string, constraints: string) => Anchor|null,
    getLastAnchor:(name: string) => Anchor,
    getComponentsAttachedToAnchor:(name: string) => string[],
    getLastUsedAnchor:(horizontal: boolean, negative: boolean, selectedComponentName: string) => Anchor,
    getAnchorsByConstraints:(constraints:string) => Constraints|null,
    getMaximumAnchorPositions: () => {
        maxNegHPosition: number | undefined;
        maxPosHPosition: number | undefined;
        maxNegVPosition: number | undefined;
        maxPosVPosition: number | undefined;
    },
    getColumnValue:(name: string) => number,
    getMinimumHorizontalColumn:() => number,
    getMinimumVerticalColumn:() => number,
    getMaximumHorizontalColumn:() => number,
    getMaximumVerticalColumn:() => number,
    getComponentsOfColumn: (name: string, columnValue: number, horizontal: boolean) => string[],
    getConvertedVerticalHorizontalConstraints: (constraints: string) => string,
    getComponentConstraints:(name: string) => string|null|undefined,
    setIsAdvancedFormLayout:(isAdvancedFormLayout: boolean) => void,
    setOriginalAnchorPositions:(empty:boolean) => void,
    setComponentConstrainsts:(name:string, componentConstraintsToChange:Map<string, string>, newConstraints: string[], horizontal: boolean) => void,
    setConstraintsPair:(newConstraints: ConstraintNames, horizontal:boolean, topLeftConstraint: string, bottomRightConstraint: string) => void,
    createAnchorData:(name: string, lastAnchorName: string, position?:number) => string,
    createAnchors:(name: string, placeHolder?:boolean) => Anchor[],
    createColumnAnchorPair:(column:number, orientation: ORIENTATION) => AnchorPair|null,
    createDesignerCreatedColumnPairs:(selectedComponentName: string) => void,
    createConstraints:(constraintsArray: string[]) => string,
    fillAnchorToColumnMap:(anchor: Anchor) => number|undefined,
    fillColumnToAnchorMaps:(anchor: Anchor, horizontal: boolean, column: number) => void,
    fillAnchorMaps:(pAnchor: Anchor) => void,
    fillFormLayoutInfo:() => void,
    getPositiveAnchors:(horizontal: boolean) => Anchor[],
    getNegativeAnchors:(horizontal: boolean) => Anchor[],
    getNextOddAnchor:(anchor: Anchor) => Anchor,
    setNextOddAnchorsAsConstraints:(newConstraints: ConstraintNames, horizontal: boolean, lastUsedAnchor: Anchor) => void,
    getClosestPreviousAnchor:(horizontal:boolean, position: number) => Anchor|null,
    getRestoreArray:(selectedComponent: SelectedComponent, contentStore: BaseContentStore) => IBaseComponent[],
    increaseExistingAnchors:(selectedComponent: IBaseComponent, referenceColumn:number, componentConstraintsToChange:Map<string, string>, horizontal: boolean) => void,
    decreaseExistingAnchors:(selectedComponent: IBaseComponent, referenceColumn: number, componentConstraintsToChange:Map<string, string>, horizontal: boolean) => void,
    increaseLayoutPreferredSize:(selectedComponentSize: Dimension, panelComponent: IBaseComponent, contentStore: BaseContentStore) => void,
    addComponentToExistingConstraints:(newConstraints: ConstraintNames, horizontal: boolean, relativePosition: Coordinates, selectedComponent: IBaseComponent, compConstrainstsToChange: Map<string, string>) => void,
    handleMouseBetweenMaxAnchors:(newConstraints: ConstraintNames, horizontal: boolean, relativePosition: number, selectedComponent: IBaseComponent) => void,
    decreaseComponentConstraints:(selectedComponent: SelectedComponent, designer: Designer) => void,
    updateComponentConstraints:(foundPanel: DraggablePanel, selectedComponent: SelectedComponent, designer: Designer, setSetLayoutRequest: (newSetLayoutRequest: SetLayoutRequest) => void) => void
    getDraggingDelta:(resizeStartPosition: RESIZE_START_POSITION|null, relativePosition: Coordinates, constraints:string) => { deltaX: number, deltaY:number }|number|null,
    originalAnchorPositionsHasNames:(names: string|string[]) => boolean,
    setDraggedAnchors:(constraints: string, resizeStartPosition: RESIZE_START_POSITION | null) => void,
    getAllowedResizeAnchors:(resizeStartPosition: RESIZE_START_POSITION | null, anchorsToIgnore: string[], draggedAnchorAbsolutePosition: number, horizontal: boolean, draggedAnchorName: string) => string[],
    getAnchorsToIgnore:(resizeStartPosition: RESIZE_START_POSITION | null) => string[],
    getResizedAnchor:(position: number, allowedAnchors:string[]) => Anchor|null,
    getOrientationFromResizingPosition:(resizeStartPosition: RESIZE_START_POSITION|null) => ORIENTATION|null,
    resizeComponent:(component: IBaseComponent, resizeStartPosition: RESIZE_START_POSITION|null, delta: ResizeDelta, designer: Designer, setSetLayoutRequest: (newSetLayoutRequest: SetLayoutRequest) => void) => void
}



export interface BorderLayoutAssistant extends LayoutAssistant {
    layoutInfo: BorderLayoutInformation,
    getUsedConstraints:(original: boolean) => string[],
    getDraggingDelta:(resizeStartPosition: RESIZE_START_POSITION|null, relativePosition: Coordinates, originalElement: HTMLElement) => number|null,
}

export interface FlowLayoutAssistant extends LayoutAssistant {
    getDraggingDelta:(resizeStartPosition: RESIZE_START_POSITION|null, relativePosition: Coordinates, originalElement: HTMLElement) => ResizeDelta|null
    layoutInfo: FlowLayoutInformation,
}

export interface GridLayoutAssistant extends LayoutAssistant {
    layoutInfo: GridLayoutInformation,
    getCoveredAreas:(gridX: number, gridY: number, gridWidth: number, gridHeight: number) => string[],
    getUsedAreas:(selectedComponentName: string) => string[],
    getNewGridConstraints:(relativePosition: Coordinates, constraints: string, usedAreas: string[]) => string|null
}

export interface NullLayoutAssistant extends LayoutAssistant {
    layoutInfo: NullLayoutInformation,
}