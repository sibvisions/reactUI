import React, { Component } from 'react';

class BorderLayout extends Component {

    elemNorth;
    elemWest;
    elemCenter;
    elemEast;
    elemSouth;

    setSubjectsToArea(){
        this.props.subjects.forEach(subject => {
            if (subject.props.constraints) {
                switch(subject.props.constraints) {
                    case 'North':
                        this.elemNorth = subject;
                        break;
                    case 'West':
                        this.elemWest = subject;
                        break;
                    case 'Center':
                        this.elemCenter = subject;
                        break;
                    case 'East':
                        this.elemEast = subject;
                        break;
                    case 'South':
                        this.elemSouth = subject;
                        break;
                    default: return null
                }
            }
        });
    }

    toPx(value){
        return value + 'px'
    }

    render() {
        this.setSubjectsToArea()
        return (
        <div className="p-grid p-nogutter borderlayout" style={{height:"100%", "flexFlow":"column", width:"100%", padding: '0', 
                                                                marginTop: this.toPx(this.props.margins[0]), marginLeft: this.toPx(this.props.margins[1]),
                                                                marginBottom: this.toPx(this.props.margins[2]), marginRight: this.toPx(this.props.margins[3])}}>
            <div className="p-col-12 north" style={{textAlign:"center", padding: '0', marginBottom: this.toPx(this.props.gaps[1])}}>
                {this.elemNorth}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto", padding: '0', marginRight: this.toPx(this.props.gaps[0])}}>
                    {this.elemWest}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%", padding: '0'}}>
                    {this.elemCenter}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto", padding: '0', marginLeft: this.toPx(this.props.gaps[0])}}>
                    {this.elemEast}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center", padding: '0', marginTop: this.toPx(this.props.gaps[1])}}>
                {this.elemSouth}
            </div>
        </div>);
    }
} 
export default BorderLayout;