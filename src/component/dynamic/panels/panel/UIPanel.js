import React from 'react';
import Base from '../../Base';
import './UIPanel.scss'
import { RefContext } from '../../../helper/Context';

class UIPanel extends Base {
    render() {
        let overflowYVal;
        if (this.context.contentStore.layoutMode === 'Small' || this.context.contentStore.layoutMode === 'Mini') {
            overflowYVal = 'auto'
        }
        else {
            overflowYVal = null
        }
        return (
        <div id={this.props.id} className="p-col-12" style={ {...this.props.layoutStyle, borderTop: '1px solid transparent', overflowY: overflowYVal} }>
            {this.insertLayout()}
        </div>
        );
    }
}
UIPanel.contextType = RefContext
export default UIPanel;