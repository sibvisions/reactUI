import React from 'react';
import Base from '../../Base';

class UIGroupPanel extends Base {
    render() {
        return (
            <div id={this.props.id} className="p-col-12" style={{height: '100%', ...this.props.layoutStyle}}>
                {this.insertLayout()}
            </div>
        )
    }
}
export default UIGroupPanel