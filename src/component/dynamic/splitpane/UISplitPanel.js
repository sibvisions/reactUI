import React from 'react';
import Split from 'react-split'
import Base from '../Base';
import "./UISplitPanel.css";

class UISplitPanel extends Base {

    getLeftComponents(){
        let leftComp = [];

        if(this.state.content){
            this.state.content.forEach(x => {
                if(x.props.data.constraints === "SECOND_COMPONENT"){
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
                if(x.props.data.constraints === "FIRST_COMPONENT"){
                    rightComp.push(x);
                } 
            });
        }
        return rightComp;
    }

    render() {
        return (
            <Split className= "splitHolder"
            sizes={[30, 70]}
            minSize={0}
            gutterSize={30}
            gutterAlign="center"
            dragInterval={2}
            direction="horizontal"
            cursor="col-resize"
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