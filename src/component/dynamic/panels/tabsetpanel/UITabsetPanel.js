import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import './UITabsetPanel.scss'
import { TabView,TabPanel } from 'primereact/tabview';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import useCompStartUp from '../../../hooks/useCompStartUp';
import { getPanelBgdColor, parseIconData } from '../../ComponentProperties';
import { stringToBoolean } from '../../../helper/StringToBoolean'

function UITabsetPanel(props) {
    const [bgdColor, setBgdColor] = useState();
    const content = useCompStartUp(props)
    const con = useContext(RefContext);
    let closing;

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [props, con]);

    useLayoutEffect(() => {
        setBgdColor(getPanelBgdColor(props, con));
        
    }, [props, con]);

    const handleClose = id => {
        con.serverComm.closeTab(props.name, content.findIndex(elem => elem.props.id === id));
        closing = true
    }

    const handleSelect = id => {
        if (!closing) {
            con.serverComm.selectTab(props.name, id);
        }
        closing = false
    }

    const buildTabs = content => {
        let builtTabs = [];
        if (content) {
            content.forEach(subject => {
                let constraints
                let icon = null;
                if (subject.props.constraints.includes('FontAwesome')) {
                    let splitConstIcon = subject.props.constraints.slice(0, subject.props.constraints.indexOf(';FontAwesome'));
                    constraints = splitConstIcon.split(';');
                    icon = parseIconData(props, subject.props.constraints.slice(subject.props.constraints.indexOf(';FontAwesome')))
                }
                else {
                    constraints = subject.props.constraints.split(';');
                }
                let header = <span className="p-tabview-title">{constraints[2]} {constraints[1] === 'true' && <button className="tabview-button pi pi-times" onClick={() => handleClose(subject.props.id)}/>}</span>
                builtTabs.push(<TabPanel key={subject.props.id} disabled={!stringToBoolean(constraints[0])} header={header} leftIcon={icon ? icon.icon : null}>{subject}</TabPanel>)
            });
        }
        return builtTabs;
    }

    return (
        <TabView id={props.id} style={{...props.layoutStyle, background: bgdColor }} activeIndex={props.selectedIndex} onTabChange={e => handleSelect(e.index)}>
            {buildTabs(content)}
        </TabView>
    )
}
export default UITabsetPanel