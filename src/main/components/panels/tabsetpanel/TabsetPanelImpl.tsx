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

import { TabPanel, TabView } from "primereact/tabview";
import React, { CSSProperties, FC, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { LayoutContext } from "../../../LayoutContext";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages";
import { ITabsetPanel, TabProperties } from "./UITabsetPanel";
import { parseIconData } from "../../comp-props/ComponentProperties";
import { ComponentSizes } from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import Dimension from "../../../util/types/Dimension";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import IconProps from "../../comp-props/IconProps";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { IComponentConstants } from "../../BaseComponent";

interface ITabsetImpl extends ITabsetPanel {
    components: React.ReactElement<any, string | React.JSXElementConstructor<any>>[]
    compSizes: Map<string, ComponentSizes> | undefined
    compStyle: CSSProperties
    layoutStyle: CSSProperties|undefined
    onTabChange: Function
    onTabClose: Function,
    style?: string
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

/**
 * This component renders its children as a TabsetPanel
 * @param props - the properties provided by the parent
 */
const TabsetPanelImpl: FC<ITabsetImpl & IComponentConstants> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for TabsetPanel element */
    const panelRef = useRef<any>(null);

    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** 
     * Builds the sizeMap for the Panels of TabsetPanel, sets their size to the height of the TabsetPanel
     * minus the TabsetPanel navigationbar
     */
     useLayoutEffect(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
            const sizeMap = new Map<string, CSSProperties>();
            const external = props.layoutStyle;
            let width:number|undefined;
            let height:number|undefined;
            // External means the size set by the parent
            if (external?.width && external?.height && panelRef.current) {
                width = external.width as number;
                const navbarHeight = panelRef.current.nav ? panelRef.current.nav.offsetHeight : 48;
                height = external.height as number - navbarHeight;
            }
            props.components.forEach((component: any) => {
                sizeMap.set(component.props.id, { width, height })
            });
            setComponentSizes(sizeMap);
    }, [props.components, props.layoutStyle?.width, props.layoutStyle?.height, id, props.designerUpdate]);

    /**
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     */
     useLayoutEffect(() => {
        if (onLoadCallback && panelRef.current) {
            if (props.compSizes && props.compSizes.size > 0 && props.selectedIndex !== -1 && props.selectedIndex !== undefined && props.selectedIndex < props.components.length) {
                const selectedPanel = props.compSizes.get(props.components[(props.selectedIndex as number)].props.id)?.preferredSize;
                if (selectedPanel) {
                    const navbarHeight = panelRef.current.nav ? panelRef.current.nav.offsetHeight : 48;
                    const prefSize:Dimension = {height: selectedPanel.height + navbarHeight, width: selectedPanel.width};
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
        let tempTabs: Array<React.JSX.Element> = [];
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
                ref={props.forwardedRef}
                id={props.name}
                className={concatClassnames("rc-tabset", props.style)}
                style={props.screen_modal_ || props.content_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : { ...props.layoutStyle, ...props.compStyle }}>
                <TabView
                    ref={panelRef}
                    style={{"--nav-background": props.compStyle.background, "--tab-navbar-background": props.compStyle.background} as CSSProperties}
                    activeIndex={props.selectedIndex}
                    onTabChange={event => props.onTabChange(event.index)}
                    onBeforeTabClose={event => props.onTabClose(event.index)}
                    {...usePopupMenu(props)}>
                    {builtTabs}
                </TabView>
            </div>
        </LayoutContext.Provider>
    )
}
export default TabsetPanelImpl