/** React imports */
import React, { FC } from "react"

/** Other imports */
import BaseComponent from "../components/BaseComponent";

/** UI and Interface Imports */
import { UIGroupPanel,
        UIPanel,
        UIPopupWrapper,
        UIScrollPanel,
        UISplitPanel,
        UITabsetPanel } from '../components/panels'
import { UIButton,
        UICheckBox,
        UIMenuButton,
        UIToggleButton,
        UIRadioButton } from "../components/buttons"
import UILabel from "../components/label/UILabel";
import Dummy from "../components/dummy";
import { CellEditorWrapper, UIEditorCheckBox,
        UIEditorChoice,
        UIEditorDate,
        UIEditorImage,
        UIEditorLinked,
        UIEditorNumber,
        UIEditorText,
        CELLEDITOR_CLASSNAMES } from "../components/editors"
import UITable from "../components/table/UITable";
import UIIcon from "../components/icon/UIIcon";
import { UIPassword, UIText, UITextArea } from "../components/text"
import UIChart from "../components/chart/UIChart";
import UIGauge from "../components/gauge/UIGauge";
import { UIMapGoogle, UIMapOSM } from "../components/map"
import { UICustomComponentWrapper, ICustomComponentWrapper } from '../components/customComp/index'
import UITree from "../components/tree/UITree";
import UIDesktopPanel from "../components/panels/desktopPanel/UIDesktopPanel";
import UIBrowser from "../components/browser/UIBrowser";
import UIToolBarPanel from "../components/panels/toolbarPanel/UIToolBarPanel";
import UIToolBarHelper from "../components/panels/toolbarPanel/UIToolBarHelper";
import ContentStore from "../ContentStore";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";


/**
 * Returns a CustomComponent wrapped in a Wrapper as component
 * @param props - properties sent by the server
 * @param customComp - the custom component to render
 * @returns a CustomComponent wrapped in a Wrapper as component
 */
export const createCustomComponentWrapper: FC<ICustomComponentWrapper> = (props, globalComp) => {
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
    } else {
        return <Dummy {...props} />
    }
}

/**
 * Decides which CellEditor should be used
 * @param props - properties sent by the server
 */
export function createEditor(props: any) {
    return <Editor {...props} />
}

/**
 * Wraps the JSX Element with a UIPopupWrapper if the element.props.screen_modal_ is set `true`
 * @param element - The JSX Element to wrap
 * @returns The original or wrapped JSX Element
 */
const maybePopup = (element: JSX.Element) => 
    element.props.screen_modal_ 
        ? <UIPopupWrapper {...element.props} render={element} key={'PopupWrapper-' + element.props.id}/> 
        : element


/**
 * Map to get the correct function to build a component for className
 */
const componentsMap = new Map<string, React.ComponentType<any>>()
    .set(COMPONENT_CLASSNAMES.PANEL, props => maybePopup(<UIPanel {...props} />))
    .set(COMPONENT_CLASSNAMES.DESKTOPPANEL, props => maybePopup(<UIDesktopPanel {...props} />))
    .set(COMPONENT_CLASSNAMES.GROUPPANEL, props => maybePopup(<UIGroupPanel {...props} />))
    .set(COMPONENT_CLASSNAMES.SCROLLPANEL, props => maybePopup(<UIScrollPanel {...props} />))
    .set(COMPONENT_CLASSNAMES.TOOLBARPANEL, props => maybePopup(<UIToolBarPanel {...props} />))
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
    .set(COMPONENT_CLASSNAMES.TABSETPANEL, props => maybePopup(<UITabsetPanel {...props} />))
    .set(COMPONENT_CLASSNAMES.CHART, props => <UIChart {...props} />)
    .set(COMPONENT_CLASSNAMES.MAP, props => props.tileProvider === "google"
        ? <UIMapGoogle {...props} />
        : <UIMapOSM {...props} />
    )
    .set(COMPONENT_CLASSNAMES.TREE, props => <UITree {...props} />)
    .set(COMPONENT_CLASSNAMES.GAUGE, props => <UIGauge {...props} />)
    .set(COMPONENT_CLASSNAMES.BROWSER, props => <UIBrowser {...props} />)
    .set(COMPONENT_CLASSNAMES.TOOLBAR, props => <UIPanel {...props} />)
    .set(COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN, props => <UIToolBarHelper {...props} />)
    .set(COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER, props => <UIToolBarHelper {...props} />);

/**
 * Returns the JSXElement for the given base component
 * @param baseComponent - the basecomponent to build
 * @returns the resulting JSXElement
 */
export const componentHandler = (baseComponent: BaseComponent, contentStore:ContentStore) => {
    const Comp = contentStore.globalComponents.has(baseComponent.className) ?
    contentStore.globalComponents.get(baseComponent.className) : componentsMap.get(baseComponent.className);

    if (baseComponent.name.startsWith(".") || baseComponent.name.startsWith("#")) {
        baseComponent.name = baseComponent.name.substring(1);
    }

    if(Comp) {
        if (contentStore.globalComponents.has(baseComponent.className)) {
            return createCustomComponentWrapper({...baseComponent, component: <Comp />, isGlobal: true})
        }
        else {
            return <Comp {...baseComponent} key={baseComponent.id} />;
        }
    } 
    else {
        return <Dummy {...baseComponent} />
    }
}