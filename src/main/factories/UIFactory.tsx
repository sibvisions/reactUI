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

import React, { FC } from "react"
import IBaseComponent from "../util/types/IBaseComponent";
import UILabel from "../components/label/UILabel";
import Dummy from "../components/dummy";
import UIIcon from "../components/icon/UIIcon";
import UIChart from "../components/chart/UIChart";
import UIGauge from "../components/gauge/UIGauge";
import UICustomComponentWrapper, { ICustomComponentWrapper } from '../components/custom-comp/UICustomComponentWrapper';
import UITree from "../components/tree/UITree";
import UIDesktopPanel from "../components/panels/desktopPanel/UIDesktopPanel";
import UIToolBarPanel from "../components/panels/toolbarPanel/UIToolBarPanel";
import UIToolBarHelper from "../components/panels/toolbarPanel/UIToolBarHelper";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import UIMobileLauncher from "../components/launcher/UIMobileLauncher";
import UIInternalFrame from "../components/frame/UIInternalFrame";
import CellEditorWrapper, { IRCCellEditor } from "../components/editors/CellEditorWrapper";
import UIDesktopPanelFull from "../components/panels/desktopPanel/UIDesktopPanelFull";
import BaseContentStore from "../contentstore/BaseContentStore";
import { UIEditorImage } from "../components/editors/image/UIEditorImage";
import CELLEDITOR_CLASSNAMES from "../components/editors/CELLEDITOR_CLASSNAMES";
import UIEditorText from "../components/editors/text/UIEditorText";
import UIEditorNumber from "../components/editors/number/UIEditorNumber";
import UIEditorDate from "../components/editors/date/UIEditorDate";
import UIEditorChoice from "../components/editors/choice/UIEditorChoice";
import UIEditorCheckBox from "../components/editors/checkbox/UIEditorCheckbox";
import UIEditorLinked from "../components/editors/linked/UIEditorLinked";
import UIPopupWrapper from "../components/panels/popup/UIPopupWrapper";
import UISplitPanel from "../components/panels/split/UISplitPanel";
import UIButton from "../components/buttons/button/UIButton";
import UIToggleButton from "../components/buttons/togglebutton/UIToggleButton";
import UIMenuButton from "../components/buttons/menubutton/UIMenuButton";
import UIRadioButton from "../components/buttons/radiobutton/UIRadioButton";
import UICheckBox from "../components/buttons/checkbox/UICheckBox";
import UIText from "../components/text/UIText";
import UITextArea from "../components/text/UITextArea";
import UIPassword from "../components/text/UIPassword";
import UIPanel from "../components/panels/panel/UIPanel";
import UIMapGoogle from "../components/maps/UIMapGoogle";
import UIMapOSM from "../components/maps/UIMapOSM";
import UITable from "../components/table/UITable";
import UIGroupPanel from "../components/panels/groupPanel/UIGroupPanel";
import UIScrollPanel from "../components/panels/scrollPanel/UIScrollPanel";
import UITabsetPanel from "../components/panels/tabsetpanel/UITabsetPanel";
import BaseComponent from "../components/BaseComponent";


/**
 * Returns a CustomComponent wrapped in a Wrapper as component
 * @param props - properties sent by the server
 * @returns a CustomComponent wrapped in a Wrapper as component
 */
export const createCustomComponentWrapper: FC<ICustomComponentWrapper> = (props) => {
    return <UICustomComponentWrapper {...props} component={props.component} key={props.id}/>
}

/**
 * Decides which CellEditor should be used
 * @param props - properties sent by the server
 */
const Editor = (props: any) => {
    if(props.cellEditor) {
        if(props.cellEditor.className === CELLEDITOR_CLASSNAMES.IMAGE){
            return <UIEditorImage {...props} />;
        }
        else if(props.cellEditor.className === CELLEDITOR_CLASSNAMES.TEXT){
            return <UIEditorText {...props} />
        }
        else if (props.cellEditor.className === CELLEDITOR_CLASSNAMES.NUMBER) {
            return <UIEditorNumber {...props} />
        }
        else if (props.cellEditor.className === CELLEDITOR_CLASSNAMES.DATE) {
            return <UIEditorDate {...props} />
        }
        else if (props.cellEditor.className === CELLEDITOR_CLASSNAMES.CHOICE) {
            return <UIEditorChoice {...props} />
        }
        else if (props.cellEditor.className === CELLEDITOR_CLASSNAMES.CHECKBOX) {
            return <UIEditorCheckBox {...props} />
        }
        else if (props.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED) {
            return <UIEditorLinked {...props} />
        }
        else{
            return <Dummy {...props} />
        }
    } 
    else {
        return <UIEditorText {...props}  />
        //return <Dummy {...props} />
    }
}

/**
 * Decides which CellEditor should be used
 * @param props - properties sent by the server
 */
export function createEditor(props: IRCCellEditor) {
    return <Editor {...props} />
}

/**
 * Wraps the JSX Element with a UIPopupWrapper if the element.props.screen_modal_ is set `true`
 * @param element - The JSX Element to wrap
 * @returns The original or wrapped JSX Element
 */
const maybePopup = (element: JSX.Element) => {
    if (element.props.screen_modal_ || element.props.content_modal_) {
        return <UIPopupWrapper {...element.props} render={element} key={'PopupWrapper-' + element.props.id}/> 
    }
    else {
        return element
    }
}


const baseComponentMap = new Map<string, React.ComponentType<any>>()
.set(COMPONENT_CLASSNAMES.SPLITPANEL, props => <UISplitPanel {...props} />)
.set(COMPONENT_CLASSNAMES.BUTTON, props => <UIButton {...props} />)
.set(COMPONENT_CLASSNAMES.TOGGLEBUTTON, props => <UIToggleButton {...props} />)
.set(COMPONENT_CLASSNAMES.POPUPMENUBUTTON, props => <UIMenuButton {...props} />)
.set(COMPONENT_CLASSNAMES.RADIOBUTTON, props => <UIRadioButton {...props} />)
.set(COMPONENT_CLASSNAMES.CHECKBOX, props => <UICheckBox {...props} />)
.set(COMPONENT_CLASSNAMES.LABEL, props => <UILabel {...props} />)
.set(COMPONENT_CLASSNAMES.EDITOR, props => <CellEditorWrapper {...props} />)
.set(COMPONENT_CLASSNAMES.TABLE, props => <UITable {...props} />)
.set(COMPONENT_CLASSNAMES.ICON, props => <UIIcon {...props} />)
.set(COMPONENT_CLASSNAMES.TEXTFIELD, props => <UIText {...props} />)
.set(COMPONENT_CLASSNAMES.TEXTAREA, props => <UITextArea {...props} />)
.set(COMPONENT_CLASSNAMES.PASSWORD, props => <UIPassword {...props} />)
.set(COMPONENT_CLASSNAMES.CHART, props => <UIChart {...props} />)
.set(COMPONENT_CLASSNAMES.MAP, props => props.tileProvider === "google"
    ? <UIMapGoogle {...props} />
    : <UIMapOSM {...props} />
)
.set(COMPONENT_CLASSNAMES.TREE, props => <UITree {...props} />)
.set(COMPONENT_CLASSNAMES.GAUGE, props => <UIGauge {...props} />)
//.set(COMPONENT_CLASSNAMES.BROWSER, props => <UIBrowser {...props} />)
.set(COMPONENT_CLASSNAMES.TOOLBAR, props => <UIPanel {...props} />)
.set(COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN, props => <UIToolBarHelper {...props} />)
.set(COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER, props => <UIToolBarHelper {...props} />)

const componentsMap = new Map<string, React.ComponentType<any>>([...baseComponentMap])
.set(COMPONENT_CLASSNAMES.PANEL, props => <UIPanel {...props} />)
.set(COMPONENT_CLASSNAMES.DESKTOPPANEL, props => <UIDesktopPanel {...props} />)
.set(COMPONENT_CLASSNAMES.GROUPPANEL, props => <UIGroupPanel {...props} />)
.set(COMPONENT_CLASSNAMES.SCROLLPANEL, props => <UIScrollPanel {...props} />)
.set(COMPONENT_CLASSNAMES.TOOLBARPANEL, props => <UIToolBarPanel {...props} />)
.set(COMPONENT_CLASSNAMES.TABSETPANEL, props => <UITabsetPanel {...props} />)


const componentsMapV2 = new Map<string, React.ComponentType<any>>([...baseComponentMap])
.set(COMPONENT_CLASSNAMES.PANEL, props => <UIPanel {...props} />)
.set(COMPONENT_CLASSNAMES.DESKTOPPANEL, props => <UIDesktopPanelFull {...props} />)
.set(COMPONENT_CLASSNAMES.GROUPPANEL, props => <UIGroupPanel {...props} />)
.set(COMPONENT_CLASSNAMES.SCROLLPANEL, props => <UIScrollPanel {...props} />)
.set(COMPONENT_CLASSNAMES.TOOLBARPANEL, props => <UIToolBarPanel {...props} />)
.set(COMPONENT_CLASSNAMES.TABSETPANEL, props => <UITabsetPanel {...props} />)
.set(COMPONENT_CLASSNAMES.MOBILELAUNCHER, props => <UIMobileLauncher {...props} />)
.set(COMPONENT_CLASSNAMES.INTERNAL_FRAME, props => <UIInternalFrame {...props} />)

/**
 * Returns the JSXElement for the given base component
 * @param IBaseComponent - the IBaseComponent to build
 * @returns the resulting JSXElement
 */
export const componentHandler = (baseComponent: IBaseComponent, contentStore:BaseContentStore) => {
    let Comp:Function|undefined;

    if (baseComponent.name && (baseComponent.name.startsWith(".") || baseComponent.name.startsWith("#"))) {
        baseComponent.name = baseComponent.name.substring(1);
    }

    // If the component className is a global component (globally changed via api) or is a custom container, create a customcomponentwrapper with that component
    // else just create the standard component
    if (contentStore.globalComponents.has(baseComponent.classNameEventSourceRef ? baseComponent.classNameEventSourceRef : baseComponent.className)) {
        Comp = contentStore.globalComponents.get(baseComponent.classNameEventSourceRef ? baseComponent.classNameEventSourceRef : baseComponent.className) as Function;
        return createCustomComponentWrapper({...baseComponent, component: <BaseComponent key={baseComponent.id + "-wrapper"} {...baseComponent}><Comp /></BaseComponent>, isGlobal: true})
    }
    else {
        if (baseComponent.className === COMPONENT_CLASSNAMES.CUSTOM_CONTAINER) {
            Comp = contentStore.appSettings.transferType === "full" ? componentsMapV2.get(baseComponent.classNameEventSourceRef as string) : componentsMap.get(baseComponent.classNameEventSourceRef as string);
        }
        else {
            Comp = contentStore.appSettings.transferType === "full" ? componentsMapV2.get(baseComponent.className) : componentsMap.get(baseComponent.className);
        }
        
        if (Comp) {
            if (contentStore.appSettings.transferType !== "full") {
                return maybePopup(<BaseComponent key={baseComponent.id + "-wrapper"} {...baseComponent}><Comp /></BaseComponent>);
            }
            return <BaseComponent key={baseComponent.id + "-wrapper"} {...baseComponent}><Comp /></BaseComponent>;
        }
        else if (baseComponent.className !== COMPONENT_CLASSNAMES.MENUBAR) {
            return <Dummy {...baseComponent} key={baseComponent.id} />
        }
        else {
            return <></>;
        }
    }

    // if (contentStore.globalComponents.has(baseComponent.className)) {
    //     Comp = contentStore.globalComponents.get(baseComponent.className) as Function;
    //     return createCustomComponentWrapper({...baseComponent, component: <Comp />, isGlobal: true})
    // }
    // else if (baseComponent.className === COMPONENT_CLASSNAMES.CUSTOM_CONTAINER) {
    //     Comp = contentStore.globalComponents.get(baseComponent.classNameEventSourceRef as string);
    //     if (Comp) {
    //         return createCustomComponentWrapper({...baseComponent, component: <Comp {...baseComponent} />, isGlobal: false})
    //     }
    //     else {
    //         return <Dummy {...baseComponent} key={baseComponent.id} />
    //     }
    // }
    // else {
    //     Comp = contentStore.appSettings.transferType === "full" ? componentsMapV2.get(baseComponent.className) : componentsMap.get(baseComponent.className);

    //     if (Comp) {
    //         return <Comp {...baseComponent} key={baseComponent.id} />;
    //     }
    //     else if (baseComponent.className !== COMPONENT_CLASSNAMES.MENUBAR) {
    //         return <Dummy {...baseComponent} key={baseComponent.id} />
    //     }
    //     else {
    //         return <></>;
    //     }
    // }
}