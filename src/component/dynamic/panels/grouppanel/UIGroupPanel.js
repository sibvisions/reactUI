import React from 'react';
import Base from '../../Base';

class UIGroupPanel extends Base {
    render() {
        let bgdColor = this.getPanelBgdColor();
        return (
            <div id={this.props.id} className="p-col-12" style={{height: '100%', background: bgdColor, ...this.props.layoutStyle}}>
                {this.insertLayout()}
            </div>
        )
    }
}
export default UIGroupPanel