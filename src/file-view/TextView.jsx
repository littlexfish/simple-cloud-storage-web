import {useState} from "react";
import {bytesToHumanReadable, getUrl} from "../file.service.js";
import {Panel, PanelMain, PanelMainBody, Stack, StackItem} from "@patternfly/react-core";
import {DataLoadingErrorElement, Loading} from "../FileView.jsx";
import {useComponentDidMount} from "../helper.jsx";


export default function TextView(props) {
    /* hooks */
    const [content, setContent] = useState(null);
    const [isError, setIsError] = useState(false);
    useComponentDidMount(() => {
        fetch(getUrl('/api/file/text?path=' + props.path))
            .then(res => res.json())
            .catch(error => {
                setContent(null);
                setIsError(true);
                console.error('Error:', error);
            })
            .then(data => {
                setContent(data);
            });
    });

    /* render */
    if (content === null) {
        return isError ? <DataLoadingErrorElement /> : <Loading/>;
    }
    if (content.content.length === 0) {
        return <span className="hint-text">Empty</span>
    }
    return <Stack>
        <StackItem>
            <Panel isScrollable>
                <PanelMain>
                    <PanelMainBody><pre>{content.content}</pre></PanelMainBody>
                </PanelMain>
            </Panel>
        </StackItem>
        {
            content.truncate ?
                <StackItem>
                    <span className="hint-text">Truncated (Total: {bytesToHumanReadable(content.size)})</span>
                </StackItem> :
                ''
        }
    </Stack>;
}