import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import Split from 'react-split'
import "./UISplitPanel.css";
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { getPanelBgdColor } from '../../ComponentProperties';
import useCompStartUp from '../../../hooks/useCompStartUp';

function UISplitPanel(props) {
    const [bgdColor, setBgdColor] = useState();
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

    useLayoutEffect(() => {
        setBgdColor(getPanelBgdColor(props, con));
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

    return (
        <Split
            className="splitHolder"
            id={props.id}
            style={{ background: bgdColor }}
            sizes={[30, 70]}
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