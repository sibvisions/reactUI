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
import { UIEditorCheckBox,
        UIEditorChoice,
        UIEditorDate,
        UIEditorImage,
        UIEditorLinked,
        UIEditorNumber,
        UIEditorText } from "../components/editors"
import UITable from "../components/table/UITable";
import UIIcon from "../components/icon/UIIcon";
import { UIPassword, UIText, UITextArea } from "../components/text"
import UIChart from "../components/chart/UIChart";
import UIGauge from "../components/gauge/UIGauge";
import { UIMapGoogle, UIMapOSM } from "../components/map"
import { UICustomComponentWrapper, ICustomComponentWrapper } from '../components/customComp/index'
import UITree from "../components/tree/UITree";


/**
 * Returns a CustomComponent wrapped in a Wrapper as component
 * @param props - properties sent by the server
 * @param customComp - the custom component to render
 * @returns a CustomComponent wrapped in a Wrapper as component
 */
export const createCustomComponentWrapper: FC<ICustomComponentWrapper> = (props, customComp) => {
    return <UICustomComponentWrapper {...props} component={customComp} key={props.id}/>
}

/**
 * Decides which CellEditor should be used
 * @param props - properties sent by the server
 */
const Editor = (props: any) => {
    if(props.cellEditor) {
        if(props.cellEditor.className === "ImageViewer"){
            return <UIEditorImage {...props} />;
        }
        else if(props.cellEditor.className === "TextCellEditor"){
            return <UIEditorText {...props} />
        }
        else if (props.cellEditor.className === "NumberCellEditor") {
            return <UIEditorNumber {...props} />
        }
        else if (props.cellEditor.className === "DateCellEditor") {
            return <UIEditorDate {...props} />
        }
        else if (props.cellEditor.className === "ChoiceCellEditor") {
            return <UIEditorChoice {...props} />
        }
        else if (props.cellEditor.className === "CheckBoxCellEditor") {
            return <UIEditorCheckBox {...props} />
        }
        else if (props.cellEditor.className === "LinkedCellEditor") {
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
    .set("Panel", props => maybePopup(<UIPanel {...props} />))
    .set("GroupPanel", props => maybePopup(<UIGroupPanel {...props} />))
    .set("ScrollPanel", props => maybePopup(<UIScrollPanel {...props} />))
    .set("SplitPanel", props => <UISplitPanel {...props} />)
    .set("Button", props => <UIButton {...props} />)
    .set("ToggleButton", props => <UIToggleButton {...props} />)
    .set("PopupMenuButton", props => <UIMenuButton {...props} />)
    .set("RadioButton", props => <UIRadioButton {...props} />)
    .set("CheckBox", props => <UICheckBox {...props} />)
    .set("Label", props => <UILabel {...props} />)
    .set("Editor", props => <Editor {...props} />)
    .set("Table", props => <UITable {...props} />)
    .set("Icon", props => <UIIcon {...props} />)
    .set("TextField", props => <UIText {...props} />)
    .set("TextArea", props => <UITextArea {...props} />)
    .set("PasswordField", props => <UIPassword {...props} />)
    .set("TabsetPanel", props => maybePopup(<UITabsetPanel {...props} />))
    .set("Chart", props => <UIChart {...props} />)
    .set("Map", props => props.tileProvider === "google"
        ? <UIMapGoogle {...props} />
        : <UIMapOSM {...props} />
    )
    .set("Tree", props => <UITree {...props} />)
    .set("Gauge", props => <UIGauge {...props} />)

/**
 * Returns the JSXElement for the given base component
 * @param baseComponent - the basecomponent to build
 * @returns the resulting JSXElement
 */
export const componentHandler = (baseComponent: BaseComponent) => {
    const Comp = componentsMap.get(baseComponent.className as string);
    if(Comp) {
        return <Comp {...baseComponent} key={baseComponent.id} />;
    } else {
        return <div />
    }
}