import React, { Component } from 'react';

class BorderLayout extends Component {
    render() {
        return (
        <div className="p-grid p-nogutter borderlayout" style={{height:"100%", "flexFlow":"column", width:"100%", padding: '0', margin: '0'}}>
            <div className="p-col-12 north" style={{textAlign:"center", padding: '0'}}>
                {this.props.north}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto", padding: '0', margin: '0'}}>
                    {this.props.west}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%", padding: '0'}}>
                    {this.props.center}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto", padding: '0'}}>
                    {this.props.east}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center", padding: '0'}}>
                {this.props.south}
            </div>
        </div>);
    }
} export default BorderLayout;