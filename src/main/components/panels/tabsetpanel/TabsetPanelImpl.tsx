import { TabPanel, TabView } from "primereact/tabview";
import React, { CSSProperties, FC, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { appContext } from "../../../AppProvider";
import { LayoutContext } from "../../../LayoutContext";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import { IconProps, parseIconData } from "../../compprops";
import { checkComponentName, Dimension, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../../util";
import { ComponentSizes, useComponentConstants, useMouseListener, usePopupMenu } from "../../zhooks";
import { isFAIcon } from "../../zhooks/useButtonMouseImages";
import { ITabsetPanel, TabProperties } from "./UITabsetPanel";

interface ITabsetImpl extends ITabsetPanel {
    components: React.ReactElement<any, string | React.JSXElementConstructor<any>>[]
    compSizes: Map<string, ComponentSizes> | undefined
    compStyle: CSSProperties
    layoutStyle: CSSProperties|undefined
    onTabChange: Function
    onTabClose: Function
}

/**
 * Returns a tabs properties
 * @param constraint - the constraints of a tab
 * @param foreground - the foreground color of a tab
 */
 function parseTabConstraints(constraint:string, foreground?:string):TabProperties {
    const newTab:TabProperties = { enabled: true, closable: false, text: "" };
    const splitConstraint = constraint.split(";");
    newTab.enabled = splitConstraint[0] === "true";
    newTab.closable = splitConstraint[1] === "true";
    newTab.text = splitConstraint[2];
    newTab.icon = parseIconData(foreground, splitConstraint[3]);

    return newTab;
}

const TabsetPanelImpl: FC<ITabsetImpl> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for TabsetPanel element */
    const panelRef = useRef<any>();

    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * Builds the sizeMap for the Panels of TabsetPanel, sets their size to the height of the TabsetPanel
     * minus 48 for the TabsetPanel navigationbar
     */
     useLayoutEffect(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
            const sizeMap = new Map<string, CSSProperties>();
            const external = props.layoutStyle;
            let width:number|undefined;
            let height:number|undefined;
            if (external?.width && external?.height) {
                width = external.width as number;
                height = external.height as number - 48;
            }
            props.components.forEach((component: any) => {
                sizeMap.set(component.props.id, { width, height })
            });
            setComponentSizes(sizeMap);
    }, [props.components, props.layoutStyle?.width, props.layoutStyle?.height, id]);

    /**
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     */
     useLayoutEffect(() => {
        if (onLoadCallback) {
            if (props.compSizes && props.compSizes.size > 0 && props.selectedIndex !== -1) {
                const selectedPanel = props.compSizes.get(props.components[(props.selectedIndex as number)].props.id)?.preferredSize;
                if (selectedPanel) {
                    const prefSize:Dimension = {height: selectedPanel.height + 48, width: selectedPanel.width};
                    sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }
            }
            // If there are tabs or no tabs are selected, send a default size
            else {
                sendOnLoadCallback(id, props.className, { height: 0, width: 0 }, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
            }
        }
    }, [id, props.compSizes, onLoadCallback, props.components, props.selectedIndex, props.maximumSize, props.minimumSize]);

    /**
     * Returns the built Tab elements for the TabsetPanel
     */
    const builtTabs = useMemo(() => {
        const buildHeader = (iconProps: IconProps | undefined, title: string) => {
            return (
            <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                {(!isFAIcon(iconProps?.icon) && iconProps?.icon) &&
                    <span
                        className="rc-tabset-tabicon"
                        style={{
                            backgroundImage: iconProps?.icon ? "url('" + context.server.RESOURCE_URL + iconProps?.icon + "')" : undefined,
                            width: iconProps.size?.width,
                            height: iconProps.size?.height,
                            backgroundSize: iconProps.size?.width + "px " + iconProps.size?.height + "px"
                        }} />}
                <span className="rc-tab-title">{title}</span>
            </span>)
        }

        /** Array for the built tabs */
        let tempTabs: Array<JSX.Element> = [];
        if (props.components) {
            props.components.forEach(component => {
                if (component.props.className !== COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                    const tabProps = parseTabConstraints(component.props.constraints, props.foreground)
                    /** Content/styling of tabs */
                    const header = buildHeader(tabProps.icon, tabProps.text);
                    tempTabs.push(
                        <TabPanel
                            key={component.props.id}
                            disabled={!tabProps.enabled}
                            closable={tabProps.closable}
                            headerClassName={"black"}
                            header={header}
                            leftIcon={tabProps.icon ? isFAIcon(tabProps.icon.icon) ? tabProps.icon.icon : undefined : undefined}>
                            {component}
                        </TabPanel>
                    )
                }
                else {
                    const iconProps = parseIconData(props.foreground, component.props.iconImage);
                    const header = buildHeader(iconProps, component.props.title);
                    tempTabs.push(
                        <TabPanel
                            key={component.props.id}
                            closable
                            headerClassName={"black"}
                            header={header}
                            leftIcon={iconProps ? isFAIcon(iconProps.icon) ? iconProps.icon : undefined : undefined}>
                            {component}
                        </TabPanel>
                    )
                }
            });
        }
        return tempTabs;
    }, [props.components, props.foreground, context.server]);

    return (
        <LayoutContext.Provider value={componentSizes}>
            <div 
                className="rc-tabset"
                style={props.screen_modal_ || props.content_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : { ...props.layoutStyle, ...props.compStyle }}>
                <TabView
                    ref={panelRef}
                    id={checkComponentName(props.name)}
                    style={{"--nav-background": props.compStyle.background}}
                    activeIndex={props.selectedIndex}
                    onTabChange={event => props.onTabChange(event.index)}
                    onTabClose={event => props.onTabClose(event.index)}
                    {...usePopupMenu(props)}>
                    {builtTabs}
                </TabView>
            </div>
        </LayoutContext.Provider>
    )
}
export default TabsetPanelImpl