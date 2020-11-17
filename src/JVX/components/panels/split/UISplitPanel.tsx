import React, {CSSProperties, FC, ReactElement, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";
import SplitPanel, {splitSize} from "./SplitPanel";
import useComponents from "../../zhooks/useComponents";
import ChildWithProps from "../../util/ChildWithProps";
import {LayoutContext} from "../../../LayoutContext";
import BaseComponent from "../../BaseComponent";
import {jvxContext} from "../../../jvxProvider";

export interface UISplitPanelProps extends BaseComponent{
    dividerAlignment: number,
    dividerPosition: number,
    orientation: 0|1
}

const UISplitPanel: FC<UISplitPanelProps> = (props) => {

    const context = useContext(jvxContext);

    const componentProps = useMemo(() => {
        return context.contentStore.getChildren(props.id);
    }, [context.contentStore, props.id])

    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return components.find((component) => {
            const compProp = componentProps.get(component.props.id);
            if(compProp)
                return compProp.constraints === constraint;

            return false;
        });
    }

    const [components] = useComponents(props.id);
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    const firstChild = getChildByConstraint("FIRST_COMPONENT");
    const secondChild = getChildByConstraint("SECOND_COMPONENT");
    const sizeValue = useContext(LayoutContext);
    const splitRef = useRef(null);
    const {onLoadCallback, id} = props

    useLayoutEffect(() => {
        if (splitRef.current) {
            //@ts-ignore
            const size = splitRef.current.getBoundingClientRect();
            if(onLoadCallback)
                onLoadCallback(id, size.height, size.width);
        }
    }, [id, onLoadCallback])

    const handleResize = (firstSize: splitSize, secondSize: splitSize) => {
        const sizeMap = new Map<string, CSSProperties>();
        const firstProps = (firstChild as ChildWithProps);
        const secondProps = (secondChild as ChildWithProps);

        sizeMap.set(firstProps.props.id, firstSize);
        sizeMap.set(secondProps.props.id, secondSize);

        setComponentSizes(sizeMap);
    }

    return(
        <LayoutContext.Provider value={componentSizes}>
            <SplitPanel
                style={sizeValue.get(props.id)}
                forwardedRef={splitRef}
                trigger={sizeValue}
                onTrigger={handleResize}
                onResize={handleResize}
                leftComponent={firstChild}
                rightComponent={secondChild}
                dividerPosition={props.dividerPosition}
                orientation={props.orientation}
            />
        </LayoutContext.Provider>
    )
}
export default UISplitPanel