import {Panel, PanelMain, PanelMainBody} from "@patternfly/react-core";
import {getUrl} from "../file.service.js";

export default function PdfView(props){
    return <Panel>
        <PanelMain>
            <PanelMainBody>
                <iframe src={getUrl('/api/file/download?path=' + (props.path || ''))} className="pdf-preview" />
            </PanelMainBody>
        </PanelMain>
    </Panel>;
}