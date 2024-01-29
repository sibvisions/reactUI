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

import React, { CSSProperties, FC } from 'react';
import './index.scss';
import { HashRouter } from 'react-router-dom';
import ReactUI from './ReactUI';
import AppProvider from "./main/contexts/AppProvider";
import { IUIManagerProps } from './application-frame/screen-management/ui-manager/UIManager';
import ReactUIEmbedded from './ReactUIEmbedded';
import EmbedProvider from './main/contexts/EmbedProvider';
import TopBar from './main/components/topbar/TopBar';
import Dimension from './main/util/types/Dimension';
import IBaseComponent from './main/util/types/IBaseComponent';
import BaseContentStore from './main/contentstore/BaseContentStore';
import BaseServer from './main/server/BaseServer';
import { BorderLayoutInformation, FlowLayoutInformation, FormLayoutInformation, GridLayoutInformation, LAYOUTS, NullLayoutInformation } from './main/util/types/designer/LayoutInformation';
import { BorderLayoutAssistant, Coordinates, DraggableComponent, DraggablePanel, FlowLayoutAssistant, FormLayoutAssistant, GridLayoutAssistant, LayoutAssistant, NullLayoutAssistant } from './main/util/types/designer/LayoutAssistant';
import { ISplit } from './main/components/panels/split/UISplitPanel';
import { DesignerComponentGroup } from './main/util/types/designer/DesignerComponents';

export type SelectedComponent = { 
    component: IBaseComponent, 
    element: HTMLElement, 
    preferredSize: Dimension,
    layoutAssistant: LayoutAssistant | null
};

export interface Designer {
    contentStore: BaseContentStore|undefined;
    server: BaseServer|undefined;
    isVisible: boolean,
    designerComponentMap: Map<string, DesignerComponentGroup>,
    borderLayouts: Map<string, BorderLayoutAssistant>,
    formLayouts: Map<string, FormLayoutAssistant>,
    flowLayouts: Map<string, FlowLayoutAssistant>,
    gridLayouts: Map<string, GridLayoutAssistant>,
    nullLayouts: Map<string, NullLayoutAssistant>,
    selectedComponent: SelectedComponent|null,
    isDragging: boolean,
    allowSetLayout: boolean,
    setContentStore:(store: BaseContentStore) => void
    setServer:(server: BaseServer) => void,
    getSelectedComponent:() => SelectedComponent|null
    drawPanelOverlay: () => void,
    setSelectedComponent:(newSelectedComponent: SelectedComponent, isNewComponent?: boolean) => void
    getLayoutTypeByElement: (element:HTMLElement) => LAYOUTS,
    getLayoutTypeByName: (name: string) => LAYOUTS,
    getLayoutAssistant:(name: string, layoutType: LAYOUTS) => BorderLayoutAssistant|FormLayoutAssistant|FlowLayoutAssistant|GridLayoutAssistant|NullLayoutAssistant|null,
    isFormLayout:(foundPanel: DraggablePanel) => boolean,
    isBorderLayout:(foundPanel: DraggablePanel) => boolean,
    isFlowLayout:(foundPanel: DraggablePanel) => boolean,
    isGridLayout:(foundPanel: DraggablePanel) => boolean,
    isNullLayout:(foundPanel: DraggablePanel) => boolean 
    createBorderLayoutAssistant:(layoutInfo: BorderLayoutInformation) => void,
    createFormLayoutAssistant:(layoutInfo: FormLayoutInformation) => void,
    createFlowLayoutAssistant:(layoutInfo: FlowLayoutInformation) => void,
    createGridLayoutAssistant:(layoutInfo: GridLayoutInformation) => void,
    createNullLayoutAssistant:(layoutInfo: NullLayoutInformation) => void,
    getLayoutAssistentOfChild:(id: string) => BorderLayoutAssistant | FormLayoutAssistant | FlowLayoutAssistant | GridLayoutAssistant | NullLayoutAssistant | null,
    updateOriginalConstraints:(changedComponents: IBaseComponent[]) => void,
    mouseIsInComponent:(position:Coordinates, element: HTMLElement) => boolean,
    isSecondSplit:(position:Coordinates, splitPanelComp:ISplit, splitPanelElem:HTMLElement, firstPanel: HTMLElement, secondPanel: HTMLElement) => boolean,
    getComponentByMousePosition:(mouseCoords: Coordinates, layout: boolean) => DraggableComponent|DraggablePanel|null,
    componentIsChildOf: (childId:string, parentId:string) => boolean
    removeComponentFromLayout:(component: IBaseComponent) => void,
    addComponentToLayout:(component: IBaseComponent) => void
    paintResizer: (rect: DOMRect) => void
}

export interface ICustomContent {
    customAppWrapper?: IUIManagerProps["customAppWrapper"]
    onStartup?: Function
    onMenu?: Function
    onOpenScreen?: Function
    onLogin?: Function
    style?: CSSProperties
    embedOptions?:{ [key:string]:any }
    theme?: string
    colorScheme?: string
    design?:string
    designer?: Designer,
    enableDesigner?: Function,
    children?: React.ReactNode
}

/**
 * This component is used as a middleman between index.tsx and App.tsx before index.tsx looked like this, but because this needed to
 * be exported for the context to work and index couldn't be exported, this component was created.
 * When using reactUI as a library this is the component they will use and pass props which will be passed to App.tsx
 * @param props - Custom Content which will be passed to App.
 */
const MiddleMan: FC<ICustomContent> = (props) => {
    return (
        <HashRouter>
            <AppProvider {...props}>
                <TopBar />
                <EmbedProvider embedOptions={props.embedOptions}>
                    {props.embedOptions !== undefined ? <ReactUIEmbedded {...props} /> : <ReactUI {...props}/>}
                </EmbedProvider>
            </AppProvider>
        </HashRouter>
    )
}
export default MiddleMan;