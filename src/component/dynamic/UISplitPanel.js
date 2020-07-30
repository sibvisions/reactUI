import React from 'react';
import Split from 'react-split'
import Base from './Base';
import "./UISplitPanel.css";

class UISplitPanel extends Base {

    getLeftComponents(){
        let leftComp = [];

        if(this.state.content){
            this.state.content.forEach(x => {
                if(x.props.constraints === "SECOND_COMPONENT"){
                    leftComp.push(x);
                }
            });
        }
        return leftComp;
    }

    getRightComponents(){
        let rightComp = [];
        if(this.state.content){
            this.state.content.forEach(x => {
                if(x.props.constraints === "FIRST_COMPONENT"){
                    rightComp.push(x);
                } 
            });
            console.log(rightComp)
        }
        return rightComp;
    }

    render() {
        return (
            <Split className= "splitHolder"
            sizes={[75, 25]}
            minSize={0}
            gutterSize={30}
            gutterAlign="center"
            dragInterval={2}
            direction="horizontal"
            cursor="col-resize"
            ref={(x) => this.split = x}
            >
                <div className="split">
                    {this.getRightComponents()}
                </div>
                <div className="split" >
                    {this.getLeftComponents()}
                </div>
            </Split>


        );
    }
}
 
export default UISplitPanel;