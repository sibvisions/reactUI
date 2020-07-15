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
            rightComp.push(<h1>DO</h1>)
        }
        return rightComp;
    }

    finSized(){
        console.log("si")
    }

    render() {
        console.log(this)
        return (
            <Split 
            sizes={[75, 25]}
            minSize={100}
            expandToMin={true}
            gutterSize={30}
            gutterAlign="center"
            dragInterval={2}
            direction="horizontal"
            cursor="col-resize"
            onDragEnd={() => this.finSized()}
            >
                <div class="split" >
                    {this.getleftComponents()}
                    here
                </div>
                <div class="split" >
                    here
                    {this.getRightComponent()}
                </div>
            </Split>


        );
    }
}
 
export default UISplitPanel;