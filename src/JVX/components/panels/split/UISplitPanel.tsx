import React, {FC, ReactElement, useContext} from "react";
import SplitPanel, {splitSize} from "./SplitPanel";
import useChildren from "../../zhooks/useChildren";
import {jvxContext} from "../../../jvxProvider";
import ChildWithProps from "../../util/ChildWithProps";

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
    const context = useContext(jvxContext)
    const firstChild = getChildByConstraint("FIRST_COMPONENT");
    const secondChild = getChildByConstraint("SECOND_COMPONENT");

    const handleResize = (firstSize: splitSize, secondSize: splitSize) => {

        const sizeMap = new Map<string, {width: number, height: number}>();
        const firstProps = (firstChild as ChildWithProps);
        const secondProps = (secondChild as ChildWithProps);

        sizeMap.set(firstProps.props.id, firstSize);
        sizeMap.set(secondProps.props.id, secondSize);

        context.eventStream.resizeEvent.next(sizeMap);
    }

    return(
        <SplitPanel
            onResize={handleResize}
            leftComponent={firstChild}
            rightComponent={secondChild}
        />
    )
}
export default UISplitPanel