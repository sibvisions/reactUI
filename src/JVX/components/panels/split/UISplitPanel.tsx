import React, {FC, ReactElement} from "react";
import SplitPanel from "./SplitPanel";
import useChildren from "../../zhooks/useChildren";

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
    }
}

const UISplitPanel: FC<UISplitPanelProps> = (props) => {

    const [children] = useChildren(props.id);

    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return children.find(child => {
            const childWithProps = (child as childProps)
            return childWithProps.props.constraints === constraint;
        });
    }

    return(
        <SplitPanel
            leftComponent={getChildByConstraint("FIRST_COMPONENT")}
            rightComponent={getChildByConstraint("SECOND_COMPONENT")}
        />
    )
}
export default UISplitPanel