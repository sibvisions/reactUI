/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** 3rd Party imports */
import {Button} from "primereact/button";
import tinycolor from 'tinycolor2';

/** Hook imports */
import useProperties from "../../zhooks/useProperties";

/** Other imports */
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, centerElem, renderButtonIcon} from "../ButtonStyling";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseJVxSize} from "../../util/parseJVxSize";

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null)
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const btnBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    /** Server set or default horizontal alignment */
    const btnHAlign = btnData.style.justifyContent || "center";
    /** Server set or default vertical alignment */
    const btnVAlign = btnData.style.alignItems || "center";

    /** Apply all server sent styling and add a custom hover effect to the button */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            const btnRef = buttonRef.current.element;
            if (btnData.iconProps.icon) {
                renderButtonIcon(btnRef.children[0] as HTMLElement, props, btnData.iconProps, context.server.RESOURCE_URL);
                /** if the horizontalTextPosition is 1 the icon needs to be centered relative to the label */
                if (props.horizontalTextPosition === 1)
                    centerElem(btnRef.children[0], btnRef.children[1], props.horizontalAlignment)
            }
            (btnData.btnBorderPainted && tinycolor(btnBgd).isDark()) ? btnRef.classList.add("bright") : btnRef.classList.add("dark");
            addHoverEffect(btnRef as HTMLElement, props.borderOnMouseEntered, btnBgd, null, 5, btnData.btnBorderPainted, undefined, props.background ? true : false);
        }
    }, [props, btnData.btnBorderPainted, btnData.iconProps, btnData.style, context.server.RESOURCE_URL, btnBgd]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);


    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <span ref={buttonWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Button
                ref={buttonRef}
                className={"rc-button" + (props.borderPainted === false ? " border-notpainted" : "") + (props.style?.includes('hyperlink') ? " p-button-link" : "")}
                style={{...btnData.style, justifyContent: btnHAlign, alignItems: btnVAlign}}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                onClick={onButtonPress}
                disabled={props.enabled === false}
            />
        </span>
    )
}
export default UIButton;