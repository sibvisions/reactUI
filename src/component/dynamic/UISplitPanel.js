import React from 'react';
import Split from 'react-split'
import Base from './Base';
import "./UISplitPanel.css";

class UISplitPanel extends Base {

    getleftComponents(){
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

    getRightComponent(){
        let rightComp = [];
        if(this.state.content){
            this.state.content.forEach(x => {
                if(x.constraints === "FIRST_COMPONENT"){
                    rightComp.push(x);
                } 
            });
            rightComp.push(<h1 key="do">DO</h1>)
        }
        return rightComp;
    }

    finSized(){
        console.log(this.split)
    }

    render() {
        console.log(this)
        return (
            <Split className= "splitHolder"
            sizes={[75, 25]}
            minSize={220}
            gutterSize={30}
            gutterAlign="center"
            dragInterval={2}
            direction="horizontal"
            cursor="col-resize"
            onDragEnd={() => this.finSized()}
            ref={(x) => this.split = x}
            >
                <div className="split">
                    {this.getleftComponents()}
                </div>
                <div className="split" >
                    {this.getRightComponent()}
                </div>
            </Split>


        );
    }
}
 
export default UISplitPanel;