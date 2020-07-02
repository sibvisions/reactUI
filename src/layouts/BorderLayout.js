import React, { Component } from 'react';

class BorderLayout extends Component {
    render() {
        return (
        <div className="p-grid p-nogutter " style={{height:"100%", "flexFlow":"column"}}>
            <div className="p-col-12" style={{textAlign:"center"}}>
                {this.props.north}
            </div>
            <div className="p-grid p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed" style={{textAlign:"center", width:"auto"}}>
                    {this.props.west}
                </span>
                <span className="p-col" style={{textAlign:"center"}}>
                    {this.props.center}
                </span>
                <span className="p-col-fixed" style={{textAlign:"center", width:"auto"}}>
                    {this.props.east}
                </span>
            </div>
            <div className="p-col-12" style={{textAlign:"center"}}>
                {this.props.south}
            </div>
        </div>);
    }
} export default BorderLayout;