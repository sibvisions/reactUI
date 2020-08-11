import Base from "../../Base";
import React from 'react';

class UIEditorImage extends Base {

    placeHolder = process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg";

    constructor(props) {
        super(props);
        this.setImgAlignments = this.setImgAlignments.bind(this)
    }

    componentDidMount() {
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.data.columnName]){
                this.setState({img: "data:image/png;base64," + selection[this.props.data.columnName]});
            } else {
                this.setState({img: process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg"})
            }
        })
    }

    checkAlignments() {
        if (this.props.data["cellEditor.horizontalAlignment"] !== undefined && this.props.data["cellEditor.verticalAlignment"] !== undefined) {
            return {ha: this.props.data["cellEditor.horizontalAlignment"], va: this.props.data["cellEditor.verticalAlignment"]};
        }
        else if (this.props.data["cellEditor.horizontalAlignment"] !== undefined) {
            return {ha: this.props.data["cellEditor.horizontalAlignment"], va: this.props.data.cellEditor.verticalAlignment};
        }
        else if (this.props.data["cellEditor.verticalAlignment"] !== undefined) {
            return {ha: this.props.data.cellEditor.horizontalAlignment, va: this.props.data["cellEditor.verticalAlignment"]};
        }
        else {
            return {ha: this.props.data.cellEditor.horizontalAlignment, va: this.props.data.cellEditor.verticalAlignment}
        }
    }

    setImgAlignments() {
        let alignments = this.checkAlignments()
        var address = this.imgRef.getAttribute('href');
        var y = new Image();
        y.src = address;
        if (alignments.ha === 0) {
            if (alignments.va === 0) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '0%');
            }
            else if (alignments.va === 1) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 2) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(0,' + -y.height + ')');
            }
            else if (alignments.va === 3) {
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 1) {
            if (alignments.va === 0) {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
            }
            else if (alignments.va === 1) {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 2) {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 3) {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 2) {
            if (alignments.va === 0) {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
            }
            else if (alignments.va === 1) {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 2) {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 3) {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 3) {
            if (alignments.va === 0) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
            }
            else if (alignments.va === 1) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 2) {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height) + ')');
            }
            else if (alignments.va === 3) {
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', '100%');
            }
        }
    }

    componentWillUnmount() {
        this.selectionSub.unsubscribe();
    }

    render() {
        console.log(this.props)
        return (
            <svg id={this.props.data.id} style={{ ...this.props.style, backgroundColor: this.props.data["cellEditor.background"] }}>
                <image
                    href={this.state.img ? this.state.img : this.placeHolder}
                    ref={ref => this.imgRef = ref}
                    onLoad={this.setImgAlignments}
                    preserveAspectRatio={this.props.data.cellEditor.preserveAspectRatio ? 'xMidYMid meet' : 'none'}
                />
            </svg>
        );
    }
}
export default UIEditorImage;