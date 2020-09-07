import React, { useContext, useRef, useEffect } from 'react';
import placeHolder from "../../../../assets/imgs/IMAGE.png"
import { getPreferredSize } from "../../../helper/GetSizes";
import { RefContext } from "../../../helper/Context";
import useRowSelect from "../../../hooks/useRowSelect";
import { getAlignments } from "../../ComponentProperties";

function UIEditorImage(props) {
    const [selectedColumn] = useRowSelect(props.columnName, props.initialValue ? props.initialValue : placeHolder || "", props.id);
    const con = useContext(RefContext);
    const imgRef = useRef();
    const alignments = getAlignments(props)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con, props]);

    const setImgAlignments = () => {
        var address = imgRef.current.getAttribute('href');
        var y = new Image();
        y.src = address;
        if (alignments.ha === 'left') {
            if (alignments.va === 'top') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '0%');
            }
            else if (alignments.va === 'center') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '50%');
                imgRef.current.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '100%');
                imgRef.current.setAttribute('transform', 'translate(0,' + -y.height + ')');
            }
            else if (alignments.va === 'stretch') {
                imgRef.current.setAttribute('height', '100%');
                imgRef.current.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'center') {
            if (alignments.va === 'top') {
                imgRef.current.setAttribute('x', '50%');
                imgRef.current.setAttribute('y', '0%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
            }
            else if (alignments.va === 'center') {
                imgRef.current.setAttribute('x', '50%');
                imgRef.current.setAttribute('y', '50%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                imgRef.current.setAttribute('x', '50%');
                imgRef.current.setAttribute('y', '100%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                imgRef.current.setAttribute('x', '50%');
                imgRef.current.setAttribute('y', '0%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
                imgRef.current.setAttribute('height', '100%');
                imgRef.current.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'right') {
            if (alignments.va === 'top') {
                imgRef.current.setAttribute('x', '100%');
                imgRef.current.setAttribute('y', '0%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
            }
            else if (alignments.va === 'center') {
                imgRef.current.setAttribute('x', '100%');
                imgRef.current.setAttribute('y', '50%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                imgRef.current.setAttribute('x', '100%');
                imgRef.current.setAttribute('y', '100%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                imgRef.current.setAttribute('x', '100%');
                imgRef.current.setAttribute('y', '0%');
                imgRef.current.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
                imgRef.current.setAttribute('height', '100%');
                imgRef.current.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'stretch') {
            if (alignments.va === 'top') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '0%');
                imgRef.current.setAttribute('width', '100%');
                imgRef.current.setAttribute('height', y.height);
            }
            else if (alignments.va === 'center') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '50%');
                imgRef.current.setAttribute('width', '100%');
                imgRef.current.setAttribute('height', y.height);
                imgRef.current.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                imgRef.current.setAttribute('x', '0%');
                imgRef.current.setAttribute('y', '100%');
                imgRef.current.setAttribute('width', '100%');
                imgRef.current.setAttribute('height', y.height);
                imgRef.current.setAttribute('transform', 'translate(0,' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                imgRef.current.setAttribute('width', '100%');
                imgRef.current.setAttribute('height', '100%');
            }
        }
    }

    return (
        <svg id={props.id} style={{ ...props.layoutStyle, backgroundColor: props["cellEditor.background"] }}>
                <image
                    href={(selectedColumn.indexOf('data') === -1 && selectedColumn !== "") ? "data:image/png;base64," + selectedColumn : placeHolder}
                    ref={imgRef}
                    onLoad={setImgAlignments}
                    preserveAspectRatio={props.cellEditor.preserveAspectRatio ? 'xMidYMid meet' : 'none'}
                />
            </svg>
    )
}
export default UIEditorImage;