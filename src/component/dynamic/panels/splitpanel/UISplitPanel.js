import React, { useEffect, useContext } from 'react';
import Split from 'react-split'
import "./UISplitPanel.css";
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import useCompStartUp from '../../../hooks/useCompStartUp';

function UISplitPanel(props) {
    const content = useCompStartUp(props);
    const con = useContext(RefContext);

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        )
    }, [props, con]);

    const getLeftComponents = () => {
        let leftComp = [];

        if (content) {
            content.forEach(component => {
                if (component.props.constraints === "FIRST_COMPONENT") {
                    let style = {height: '100%', width: '100%'}
                    let clonedComponent = React.cloneElement(component, {layoutStyle: style});
                    leftComp.push(clonedComponent);
                }
            });
        }
        return leftComp;
    }

    const getRightComponents = () => {
        let rightComp = [];

        if (content) {
            content.forEach(component => {
                if (component.props.constraints === "SECOND_COMPONENT") {
                    let style = {height: '100%', width: '100%'}
                    let clonedComponent = React.cloneElement(component, {layoutStyle: style});
                    rightComp.push(clonedComponent);
                }
            });
        }
        return rightComp;
    }

    const getSplitDividerPos = dividerPos => {
        if (dividerPos !== -1) {
            let panelSize = getPreferredSize(props);
            if (panelSize) {
                let posPerc = dividerPos*100/panelSize.width;
                return [posPerc, 100-posPerc];
            }
            else {
                return [0, 0]
            }
        }
        else {
            return [30, 70];
        }
    }

    return (
        <Split
            className="splitHolder"
            id={props.id}
            sizes={getSplitDividerPos(props.dividerPosition)}
            minSize={0}
            gutterSize={30}
            gutterAlign="center"
            dragInterval={2}
            direction="horizontal"
            cursor="col-resize">
            <div className="split">
                {getLeftComponents()}
            </div>
            <div className="split" >
                {getRightComponents()}
            </div>
        </Split>
    );
}
export default UISplitPanel;