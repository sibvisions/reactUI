import React, { Component } from 'react';

class BorderLayout extends Component {
    render() {
        return (
        <div className="p-grid p-nogutter " style={{height:"100%", "flexFlow":"column"}}>
            <div className="p-col-12" style={{textAlign:"center"}}>
                {this.props.north}a
            </div>
            <div className="p-grid p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed" style={{textAlign:"center", width:"auto"}}>
                    {this.props.west}b
                </span>
                <span className="p-col" style={{textAlign:"center"}}>
                    {this.props.center}
                    {this.props.content}
                </span>
                <span className="p-col-fixed" style={{textAlign:"center", width:"auto"}}>
                    {this.props.east}d
                </span>
            </div>
            <div className="p-col-12" style={{textAlign:"center"}}>
                {this.props.south}e
            </div>
        </div>);
    }
} export default BorderLayout;