import React, { Component } from 'react';

class BorderLayout extends Component {
    render() {
        return (
        <div className="p-grid p-nogutter borderlayout" style={{height:"100%", "flexFlow":"column", width:"100%"}}>
            <div className="p-col-12 north" style={{textAlign:"center"}}>
                {this.props.north}
            </div>
            <div className="p-grid p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto"}}>
                    {this.props.west}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%"}}>
                    {this.props.center}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto"}}>
                    {this.props.east}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center"}}>
                {this.props.south}
            </div>
        </div>);
    }
} 
export default BorderLayout;