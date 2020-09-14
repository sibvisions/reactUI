import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import './UITabsetPanel.scss'
import { TabView,TabPanel } from 'primereact/tabview';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import useCompStartUp from '../../../hooks/useCompStartUp';
import { getPanelBgdColor } from '../../ComponentProperties';

function UITabsetPanel(props) {
    const [bgdColor, setBgdColor] = useState();
    const [activeIndex, setActiveIndex] = useState();
    const content = useCompStartUp(props)
    const con = useContext(RefContext);

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
    }

    const handleSelect = id => {
        console.log('yo')
        con.serverComm.selectTab(props.name, id);
    }

    const buildTabs = content => {
        let builtTabs = [];
        if (content) {
            content.forEach(subject => {
                let constraints = subject.props.constraints.split(';');
                let header = <span className="p-tabview-title">{constraints[2]} {constraints[1] === 'true' && <button className="tabview-button pi pi-times" onClick={() => handleClose(subject.props.id)}/>}</span>
                builtTabs.push(<TabPanel key={subject.props.id} disabled={!constraints[0]} header={header}>{subject}</TabPanel>)
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