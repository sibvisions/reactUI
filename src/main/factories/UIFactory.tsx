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
        UITabsetPanel,
        IPanel,
        IPopup,
        ISplit,
        ITabsetPanel } from '../components/panels'
import { UIButton,
        UICheckBox,
        UIMenuButton,
        UIToggleButton,
        UIRadioButton,
        IButton,
        IButtonSelectable,
        IMenuButton } from "../components/buttons"
import UILabel from "../components/label/UILabel";
import Dummy from "../components/dummy";
import { UIEditorCheckBox,
        UIEditorChoice,
        UIEditorDate,
        UIEditorImage,
        UIEditorLinked,
        UIEditorNumber,
        UIEditorText,
        IEditor,
        IEditorCheckBox,
        IEditorChoice,
        IEditorDate,
        IEditorImage,
        IEditorLinked,
        IEditorNumber,
        IEditorText } from "../components/editors"
import UITable, { TableProps } from "../components/table/UITable";
import UIIcon from "../components/icon/UIIcon";
import { UIPassword, UIText, UITextArea } from "../components/text"
import UIChart, { IChart } from "../components/chart/UIChart";
import UIGauge, { IGauge } from "../components/gauge/UIGauge";
import { UIMapGoogle, UIMapOSM, IMap } from "../components/map"
import { UICustomComponentWrapper, ICustomComponentWrapper } from '../components/customComp/index'
import UITree, { ITree } from "../components/tree/UITree";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../response";

/**
 * Returns a Panel as component as popup or normal
 * @param props - properties sent by the server
 * @returns a Panel as component
 */
export const createPanel: FC<IPopup|IPanel> = (props) => {
    if (props.screen_modal_)
        return <UIPopupWrapper {...props} render={<UIPanel {...props} key={props.id}/>} key={'PopupWrapper-' + props.id}/>
    else
        return <UIPanel {...props} key={props.id}/>
}

/**
 * Returns a GroupPanel as component as popup or normal
 * @param props - properties sent by the server
 * @returns a GroupPanel as component
 */
export const createGroupPanel: FC<IPopup|IPanel> = (props) => {
    if (props.screen_modal_)
        return <UIPopupWrapper {...props} render={<UIGroupPanel {...props} key={props.id}/>} key={'PopupWrapper-' + props.id}/>
    else
        return <UIGroupPanel {...props} key={props.id}/>
}

/**
 * Returns a ScrollPanel as component as popup or normal
 * @param props - properties sent by the server
 * @returns a ScrollPanel as component
 */
export const createScrollPanel: FC<IPopup|IPanel> = (props) => {
    if (props.screen_modal_)
        return <UIPopupWrapper {...props} render={<UIScrollPanel {...props} key={props.id}/>} key={'PopupWrapper-' + props.id}/>
    else
        return <UIScrollPanel {...props} key={props.id}/>
}

/**
 * Returns a SplitPanel as component
 * @param props - properties sent by the server
 * @returns a SplitPanel as component
 */
export const createSplitPanel: FC<ISplit> = (props) => {
    return <UISplitPanel {...props} key={props.id}/>
}

/**
 * Returns a Button as component
 * @param props - properties sent by the server
 * @returns a Button as component
 */
export const createButton: FC<IButton> = (props) => {
    return <UIButton {...props} key={props.id}/>
}

/**
 * Returns a ToggleButton as component
 * @param props - properties sent by the server
 * @returns a ToggleButton as component
 */
export const createToggleButton: FC<IButtonSelectable> = (props) => {
    return <UIToggleButton {...props} key={props.id}/>
}

/**
 * Returns a PopupMenuButton as component
 * @param props - properties sent by the server
 * @returns a PopupMenuButton as component
 */
export const createPopupMenuButton: FC<IMenuButton> = (props) => {
    return <UIMenuButton {...props} key={props.id}/>
}

/**
 * Returns a RadioButton as component
 * @param props - properties sent by the server
 * @returns a RadioButton as component
 */
export const createRadioButton: FC<IButtonSelectable> = (props) => {
    return <UIRadioButton {...props} key={props.id}/>
}

/**
 * Returns a CheckBox as component
 * @param props - properties sent by the server
 * @returns a CheckBox as component
 */
export const createCheckBox: FC<IButtonSelectable> = (props) => {
    return <UICheckBox {...props} key={props.id}/>
}

/**
 * Returns a Label as component
 * @param props - properties sent by the server
 * @returns a Label as component
 */
export const createLabel: FC<BaseComponent> = (props) => {
    return <UILabel {...props} key={props.id}/>
}

/**
 * Returns a Dummy as component
 * @param props - properties sent by the server
 * @returns a Dummy as component
 */
export const createDummy: FC<BaseComponent> = (props) => {
    return <Dummy {...props} key={props.id}/>
}

/**
 * Returns an ImageViewer as component
 * @param props - properties sent by the server
 * @returns an ImageViewer as component
 */
export const createEditorImage: FC<IEditorImage> = (props) => {
    return <UIEditorImage {...props} key={props.id} />
}

/**
 * Returns a TextCellEditor as component
 * @param props - properties sent by the server
 * @returns a TextCellEditor as component
 */
export const createEditorText: FC<IEditorText> = (props) => {
    return <UIEditorText {...props} key={props.id}/>
}

/**
 * Returns a NumberCellEditor as component
 * @param props - properties sent by the server
 * @returns a NumberCellEditor as component
 */
export const createEditorNumber: FC<IEditorNumber> = (props) => {
    return <UIEditorNumber {...props} key={props.id}/>
}

/**
 * Returns a DateCellEditor as component
 * @param props - properties sent by the server
 * @returns a DateCellEditor as component
 */
export const createEditorDate: FC<IEditorDate> = (props) => {
    return <UIEditorDate {...props} key={props.id}/>
}

/**
 * Returns a ChoiceCellEditor as component
 * @param props - properties sent by the server
 * @returns a ChoiceCellEditor as component
 */
export const createEditorChoice: FC<IEditorChoice> = (props) => {
    return <UIEditorChoice {...props} key={props.id}/>
}

/**
 * Returns a CheckBoxCellEditor as component
 * @param props - properties sent by the server
 * @returns a CheckBoxCellEditor as component
 */
export const createEditorCheckbox: FC<IEditorCheckBox> = (props) => {
    return <UIEditorCheckBox {...props} key={props.id}/>
}

/**
 * Returns a LinkedCellEditor as component
 * @param props - properties sent by the server
 * @returns a LinkedCellEditor as component
 */
export const createEditorLinked: FC<IEditorLinked> = (props) => {
    return <UIEditorLinked {...props} key={props.id}/>
}

/**
 * Returns a Table as component
 * @param props - properties sent by the server
 * @returns a Table as component
 */
export const createTable: FC<TableProps> = (props) => {
    return <UITable {...props} key={props.id}/>
}

/**
 * Returns an Icon as component
 * @param props - properties sent by the server
 * @returns an Icon as component
 */
export const createIcon: FC<BaseComponent> = (props) => {
    return <UIIcon {...props} key={props.id}/>
}

/**
 * Returns a TextField as component
 * @param props - properties sent by the server
 * @returns a TextField as component
 */
export const createTextField: FC<BaseComponent> = (props) => {
    return <UIText {...props} key={props.id}/>
}

/**
 * Returns a TextArea as component
 * @param props - properties sent by the server
 * @returns a TextArea as component
 */
export const createTextArea: FC<BaseComponent> = (props) => {
    return <UITextArea {...props} key={props.id}/>
}

/**
 * Returns a PasswordField as component
 * @param props - properties sent by the server
 * @returns a PasswordField as component
 */
export const createPassword: FC<BaseComponent> = (props) => {
    return <UIPassword {...props} key={props.id}/>
}

/**
 * Returns a TabsetPanel as component as popup or normal
 * @param props - properties sent by the server
 * @returns a TabsetPanel as component as popup or normal
 */
export const createTabsetPanel: FC<ITabsetPanel|IPopup> = (props) => {
    if (props.screen_modal_)
        return <UIPopupWrapper {...props} render={<UITabsetPanel {...props} key={props.id}/>} key={'PopupWrapper-' + props.id}/>
    else
        return <UITabsetPanel {...props} key={props.id}/>
}

/**
 * Returns a Chart as component
 * @param props - properties sent by the server
 * @returns a Chart as component
 */
export const createChart: FC<IChart> = (props) => {
    return <UIChart {...props} key={props.id}/>
}

/**
 * Returns a Gauge as component
 * @param props - properties sent by the server
 * @returns a tree as component
 */
 export const createGauge: FC<IGauge> = (props) => {
    return <UIGauge {...props} key={props.id}/>
}

/**
 * Returns a Map either Google Maps or OpenStreetMaps as component
 * @param props - properties sent by the server
 * @returns a Map either Google Maps or OpenStreetMaps as component
 */
export const createMap: FC<IMap> = (props) => {
    if (props.tileProvider === "google")
        return <UIMapGoogle {...props} key={props.id}/>
    else
        return <UIMapOSM {...props} key={props.id}/>
}

/**
 * Returns a Tree as component
 * @param props - properties sent by the server
 * @returns a tree as component
 */
export const createTree: FC<ITree> = (props) => {
    return <UITree {...props} key={props.id}/>
}

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
 * Decides which CellEditor function should be used
 * @param props - properties sent by the server
 */
export const createEditor: FC<IEditor|LengthBasedColumnDescription|NumericColumnDescription> = ( props ) => {
    if(props.cellEditor) {
        if(props.cellEditor.className === "ImageViewer"){
            return createEditorImage((props as IEditorImage));
        }
        else if(props.cellEditor.className === "TextCellEditor"){
            return createEditorText((props as IEditorText));
        }
        else if (props.cellEditor.className === "NumberCellEditor") {
            return createEditorNumber((props as IEditorNumber));
        }
        else if (props.cellEditor.className === "DateCellEditor") {
            return createEditorDate((props as IEditorDate));
        }
        else if (props.cellEditor.className === "ChoiceCellEditor") {
            return createEditorChoice((props as IEditorChoice));
        }
        else if (props.cellEditor.className === "CheckBoxCellEditor") {
            return createEditorCheckbox((props as IEditorCheckBox));
        }
        else if (props.cellEditor.className === "LinkedCellEditor") {
            return createEditorLinked((props as IEditorLinked));
        }
        else{
            return createDummy(props as IEditor)
        }
    } else {
        return createDummy(props as IEditor)
    }
}

/**
 * Map to get the correct function to build a component for className
 */
const classNameMapper = new Map<string, Function>()
    .set("Panel", createPanel)
    .set("GroupPanel", createGroupPanel)
    .set("ScrollPanel", createScrollPanel)
    .set("SplitPanel", createSplitPanel)
    .set("Button", createButton)
    .set("ToggleButton", createToggleButton)
    .set("PopupMenuButton", createPopupMenuButton)
    .set("RadioButton", createRadioButton)
    .set("CheckBox", createCheckBox)
    .set("Label", createLabel)
    .set("Editor", createEditor)
    .set("Table", createTable)
    .set("Icon", createIcon)
    .set("TextField", createTextField)
    .set("TextArea", createTextArea)
    .set("PasswordField", createPassword)
    .set("TabsetPanel", createTabsetPanel)
    .set("Chart", createChart)
    .set("Map", createMap)
    .set("Tree", createTree)
    .set("Gauge", createGauge)

/**
 * Returns the function to build the component
 * @param component - the component to build
 * @returns the function to build the component
 */
export const componentHandler = (component: BaseComponent) => {
    const builder = classNameMapper.get(component.className as string);
    if(builder) {
        return builder(component);
    } else {
        return <div> </div>
    }
}