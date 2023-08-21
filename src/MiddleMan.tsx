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
import { ComponentSizes } from './main/hooks/components-hooks/useComponents';
import Dimension from './main/util/types/Dimension';
import Anchor from './main/components/layouts/models/Anchor';
import IBaseComponent from './main/util/types/IBaseComponent';
import BaseContentStore from './main/contentstore/BaseContentStore';
import BaseServer from './main/server/BaseServer';

interface LayoutInformation {
    id: string,
    name: string,
    originalConstraints: Map<string, string>,
    componentSizes: Map<string, ComponentSizes> | undefined,
    calculatedSize: Dimension|null,
    componentConstraints: Map<string, string>,
    layoutType: number;
}

type AnchorPair = { 
    topLeftAnchor: Anchor, 
    bottomRightAnchor: Anchor 
}

interface FormLayoutInformation extends LayoutInformation {
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
    anchors: Map<string, Anchor>
}

export interface BorderLayoutInformation extends LayoutInformation {
    currentSize: Dimension|null
}

type SelectedComponent = { component: IBaseComponent, element: HTMLElement, preferredSize: Dimension };

export interface Designer {
    contentStore: BaseContentStore|undefined;
    server: BaseServer|undefined;
    formLayouts: Map<string, any>,
    borderLayouts: Map<string, any>,
    createBorderLayoutAssistant: (layoutInfo: BorderLayoutInformation) => void,
    createFormLayoutAssistant: (layoutInfo: FormLayoutInformation) => void,
    updateSelectedComponentInnerComponent: (comp: IBaseComponent) => void,
    selectedComponent: SelectedComponent|null,
    paintResizer: (rect: DOMRect) => void,
    isVisible: boolean
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
    designer?: Designer
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
                <TopBar>
                    <EmbedProvider embedOptions={props.embedOptions}>
                        {props.embedOptions !== undefined ? <ReactUIEmbedded {...props} /> : <ReactUI {...props}/>}
                    </EmbedProvider>
                </TopBar>
            </AppProvider>
        </HashRouter>
    )
}
export default MiddleMan;