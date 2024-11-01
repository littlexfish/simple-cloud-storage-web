import React from "react";
import {Panel, PanelMain, PanelMainBody} from "@patternfly/react-core";
import {getUrl} from "../file.service.js";

export default class PdfView extends React.Component {


    render() {
        return <Panel>
            <PanelMain>
                <PanelMainBody>
                    <iframe src={getUrl('/api/file/download?path=' + (this.props.path || ''))} style={{height: '50vh', width: '100%'}} />
                </PanelMainBody>
            </PanelMain>
        </Panel>
    }
}