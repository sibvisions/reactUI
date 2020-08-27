import React from 'react';
import Base from '../../Base';
import './UIPanel.scss'
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIPanel extends Base {

    componentDidMount() {
        this.startUp();
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render() {
        let overflowYVal;
        let bgdColor = this.getPanelBgdColor();
        if (this.context.contentStore.layoutMode === 'Small' || this.context.contentStore.layoutMode === 'Mini') {
            overflowYVal = 'auto'
        }
        else {
            overflowYVal = null
        }
        
        return (
        <span id={this.props.id} style={ {height: '100%', background: bgdColor, borderTop: '1px solid transparent', overflowY: overflowYVal, ...this.props.layoutStyle, } }>
            {this.insertLayout()}
        </span>
        );
    }
}
UIPanel.contextType = RefContext
export default UIPanel;