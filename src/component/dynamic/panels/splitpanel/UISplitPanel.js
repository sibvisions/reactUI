import React from 'react';
import Split from 'react-split'
import Base from '../../Base';
import "./UISplitPanel.css";
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UISplitPanel extends Base {

    componentDidMount() {
        this.startUp();
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    getLeftComponents(){
        let leftComp = [];

        if(this.state.content){
            this.state.content.forEach(x => {
                if(x.props.constraints === "SECOND_COMPONENT"){
                    let style = {
                        height: '100%',
                        width: '100%'
                    }
                    let clonedComponent = React.cloneElement(x, {layoutStyle: style});
                    leftComp.push(clonedComponent);
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
        }
        return rightComp;
    }

    render() {
        let bgdColor = this.getPanelBgdColor();
        return (
            <Split className= "splitHolder"
            id={this.props.id}
            style={{background: bgdColor}}
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
UISplitPanel.contextType = RefContext
export default UISplitPanel;