import React, {CSSProperties, FC, ReactElement, useContext, useState} from "react";
import SplitPanel, {splitSize} from "./SplitPanel";
import useChildren from "../../zhooks/useChildren";
import {jvxContext} from "../../../jvxProvider";
import ChildWithProps from "../../util/ChildWithProps";
import {LayoutContext} from "../../../LayoutContext";

export type UISplitPanelProps ={
    className: string,
    constraints: string,
    dividerAlignment: number,
    dividerPosition: number,
    id: string,
    indexOf: number,
    orientation: number,
    parent: string,
    isVisible: boolean
}

type childProps = {
    props: {
        constraints: string
        id: string
    }
}

const UISplitPanel: FC<UISplitPanelProps> = (props) => {

    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return children.find(child => {
            const childWithProps = (child as childProps);
            return childWithProps.props.constraints === constraint;
        });
    }

    const [children] = useChildren(props.id);
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    const firstChild = getChildByConstraint("FIRST_COMPONENT");
    const secondChild = getChildByConstraint("SECOND_COMPONENT");

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
                onResize={handleResize}
                leftComponent={firstChild}
                rightComponent={secondChild}
            />
        </LayoutContext.Provider>
    )
}
export default UISplitPanel