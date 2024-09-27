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

import React, { CSSProperties, FC, useMemo, useRef } from "react";
import IBaseComponent from "../util/types/IBaseComponent";
import useComponentConstants from "../hooks/components-hooks/useComponentConstants";
import useRepaintResizer from "../hooks/designer-hooks/useRepaintResizer";
import useMouseListener from "../hooks/event-hooks/useMouseListener";
import { AppContextType } from "../contexts/AppProvider";
import { TopBarContextType } from "./topbar/TopBar";
import COMPONENT_CLASSNAMES from "./COMPONENT_CLASSNAMES";
import useHandleDesignerUpdate from "../hooks/style-hooks/useHandleDesignerUpdate";
import { sendOnLoadCallback } from "../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../util/component-util/SizeUtil";
import useDesignerUpdates from "../hooks/style-hooks/useDesignerUpdates";
import { IEditor } from "./editors/IEditor";
import CELLEDITOR_CLASSNAMES from "./editors/CELLEDITOR_CLASSNAMES";
import { ICellEditorDate } from "./editors/date/UIEditorDate";

interface BaseComponentRender {
    //baseComponentRender: Function
    children?: React.ReactNode
}

export interface IComponentConstants {
    context: AppContextType,
    topbar: TopBarContextType,
    layoutStyle?: CSSProperties,
    translation: Map<string, string>,
    compStyle: CSSProperties,
    styleClassNames: string[],
    forwardedRef: any,
    designerUpdate: boolean|undefined
}

const BaseComponent: FC<IBaseComponent & BaseComponentRender> = (baseProps) => {
    /** The forwarded ref to all components */
    const forwardedRef = useRef<any>(null);

    /** Returns true, if there is a fallback for the layoutStyle */
    const hasConstantFallback = useMemo(() => {
        if ([COMPONENT_CLASSNAMES.INTERNAL_FRAME, COMPONENT_CLASSNAMES.MOBILELAUNCHER, COMPONENT_CLASSNAMES.DESKTOPPANEL, COMPONENT_CLASSNAMES.GROUPPANEL, COMPONENT_CLASSNAMES.PANEL, COMPONENT_CLASSNAMES.SCROLLPANEL, COMPONENT_CLASSNAMES.SPLITPANEL, COMPONENT_CLASSNAMES.TABSETPANEL, COMPONENT_CLASSNAMES.TOOLBARPANEL, COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER, COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN].indexOf(baseProps.className as COMPONENT_CLASSNAMES) !== -1) {
            return true;
        }
        return false;
    }, [baseProps.className])

    /** Component constants for contexts, properties and style */
    const [context, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IBaseComponent>(baseProps, hasConstantFallback ? {visibility: "hidden"} : undefined);

    /** Hook for MouseListener */
    useMouseListener(props.name, forwardedRef.current ? forwardedRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Repaints the resizers of the selectedComponent in the designer */
    useRepaintResizer(props.name, layoutStyle, forwardedRef.current);

    /** Returns the correct string for each component for designer updates */
    const designerUpdatesString = useMemo(() => {
        if (props.className === COMPONENT_CLASSNAMES.EDITOR) {
            switch ((props as IEditor).cellEditor?.className) {
                case CELLEDITOR_CLASSNAMES.CHECKBOX:
                    return "checkbox";
                case CELLEDITOR_CLASSNAMES.DATE:
                case CELLEDITOR_CLASSNAMES.LINKED:
                    return "linked-date";
                case CELLEDITOR_CLASSNAMES.NUMBER:
                case CELLEDITOR_CLASSNAMES.TEXT:
                    return "inputfield";
            }
        }
        else {
            switch (props.className) {
                case COMPONENT_CLASSNAMES.BUTTON:
                case COMPONENT_CLASSNAMES.TOGGLEBUTTON:
                    return props.text ? "default-button" : "icon-only-button";
                case COMPONENT_CLASSNAMES.CHECKBOX:
                    return "checkbox";
                case COMPONENT_CLASSNAMES.POPUPMENUBUTTON:
                    return "menubutton";
                case COMPONENT_CLASSNAMES.RADIOBUTTON:
                    return "radiobutton";
                case COMPONENT_CLASSNAMES.TABSETPANEL:
                    return "tabset";
                case COMPONENT_CLASSNAMES.TABLE:
                    return "table";
                case COMPONENT_CLASSNAMES.PASSWORD:
                case COMPONENT_CLASSNAMES.TEXTAREA:
                case COMPONENT_CLASSNAMES.TEXTFIELD:
                    return "inputfield";
                case COMPONENT_CLASSNAMES.LABEL:
                    return "label";
            }
        }
        return "invalid"
    }, [props.className, props.text])

    /** A flag which changes, when the designer updates the components css properties */
    const designerUpdate = useDesignerUpdates(designerUpdatesString);

    /** Returns the correct element which needs to be adjusted/resend the size when the designer updates */
    const getCorrectElementForDesignerUpdate = () => {
        if (forwardedRef.current) {
            if (props.className === COMPONENT_CLASSNAMES.EDITOR) {
                if ((props as IEditor).cellEditor) {
                    if ((props as IEditor).cellEditor!.className === CELLEDITOR_CLASSNAMES.TEXT) {
                        if ((props as IEditor).cellEditor!.contentType === "text/html") {
                            return undefined;
                        }
                    }
                    else if ((props as IEditor).cellEditor!.className === CELLEDITOR_CLASSNAMES.NUMBER) {
                        return forwardedRef.current
                    }
                }
            }
            return forwardedRef.current;
        }
        return undefined
    }

    /** Returns additional dependencies which are needed to report the size again */
    const getAdditionalDependency = () => {
        if ([COMPONENT_CLASSNAMES.LABEL, COMPONENT_CLASSNAMES.BUTTON].indexOf(props.className as COMPONENT_CLASSNAMES) !== -1) {
            return props.text;
        }
        else if (props.className === COMPONENT_CLASSNAMES.EDITOR && (props as IEditor).cellEditor?.className === CELLEDITOR_CLASSNAMES.DATE) {
            return ((props as IEditor).cellEditor as ICellEditorDate).dateFormat
        }
        return undefined;
    }

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        props.className,
        designerUpdate,
        getCorrectElementForDesignerUpdate(),
        layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            baseProps.id,
            props.className === COMPONENT_CLASSNAMES.EDITOR ? (props as IEditor).cellEditor ? (props as IEditor).cellEditor!.className : props.className : props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            props.onLoadCallback
        ),
        props.onLoadCallback,
        getAdditionalDependency()
    );

    const childrenWithProps = React.Children.map(baseProps.children, (child: any) => {
        // Checking isValidElement is the safe way and avoids a
        // typescript error too.
        if (React.isValidElement(child)) {
            return React.cloneElement<any>(child, {
                ...props,
                forwardedRef: forwardedRef,
                context: context,
                topbar: context.server.topbar,
                layoutStyle: layoutStyle,
                compStyle: compStyle,
                styleClassNames: styleClassNames,
                designerUpdate: designerUpdate
            });
        }
        return child;
    });

    return (
        <>
            {childrenWithProps}
        </>
    )
}
export default BaseComponent