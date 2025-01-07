import React, {memo, useEffect, useRef, useState} from "react";
import {
    Alert,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Divider,
    Drawer,
    DrawerCloseButton,
    DrawerContent,
    DrawerContentBody,
    DrawerHead,
    DrawerPanelContent,
    Dropdown,
    DropdownItem,
    DropdownList,
    Flex,
    FlexItem,
    HelperText,
    HelperTextItem,
    List,
    ListItem,
    ListVariant,
    MenuToggle,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    MultipleFileUpload,
    MultipleFileUploadMain,
    MultipleFileUploadStatus,
    MultipleFileUploadStatusItem,
    Select,
    SelectList,
    SelectOption,
    SimpleList,
    SimpleListItem,
    Spinner,
    Split,
    SplitItem,
    Stack,
    StackItem,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarGroup,
    ToolbarItem,
    Tooltip,
    TreeView
} from "@patternfly/react-core";
import {bytesToHumanReadable, getUrl, isFilenameValid} from "./file.service.js";
import ImageView from "./file-view/ImageView.jsx";
import TextView from "./file-view/TextView.jsx";
import ZipView from "./file-view/ZipView.jsx";
import PdfView from "./file-view/PdfView.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useComponentDidMount, useComponentDidUpdate, useForceUpdate} from "./helper.jsx";

function FileView(props) {
    /* hooks */
    const [selectedDirectory, setSelectedDirectory] = useState('');
    const [view, setView] = useState({
        onlyDirectory: false,
        showHidden: false,
    });
    const [drawerExpanded, setDrawerExpanded] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    // componentDidMount
    useEffect(() => { // only call once on mount
        window.addEventListener('resize', () => {
            setWindowWidth(window.innerWidth);
        });
        setTimeout(() => {
            setDrawerExpanded(windowWidth > 768);
        }, 100);
    }, []);

    /* inner functions */
    function breadcrumbItem(name, path, isActive) {
        if (!isActive) {
            return <BreadcrumbItem key={path}>
                <Button variant="plain" isDisabled={true}>{name}</Button>
            </BreadcrumbItem>
        }
        return <BreadcrumbItem key={path}>
            <Button variant="link" onClick={() => setSelectedDirectory(path)}>{name}</Button>
        </BreadcrumbItem>
    }

    /* render */
    const pathList = selectedDirectory ? selectedDirectory.split('/') : [];
    return (
        <Drawer className="file-view" style={{height: '100vh'}} isExpanded={drawerExpanded}
                isInline position="start">
            <DrawerContent panelContent={
                <DrawerPanelContent isResizable defaultSize="250px" minSize="100px" maxSize="50vw">
                    <DrawerHead>
                        {windowWidth < 768 && <DrawerCloseButton style={{display: 'flex', justifyContent: 'end'}} onClose={() => setDrawerExpanded(!drawerExpanded)} />}
                        <FileTree showHidden={view.showHidden} onlyDirectory={view.onlyDirectory} onDirectorySelect={(path) => setSelectedDirectory(path)} />
                    </DrawerHead>
                </DrawerPanelContent>}>
                <DrawerContentBody>
                    <Stack>
                        <StackItem>
                            <Flex>
                                <FlexItem>
                                    <Button variant="plain" onFocus={(evt) => evt.target.blur()}
                                            onClick={() => setDrawerExpanded(!drawerExpanded)}>
                                        <FontAwesomeIcon icon="fas fa-bars" />
                                    </Button>
                                </FlexItem>
                                <Divider
                                    orientation={{
                                        default: 'vertical'
                                    }}
                                />
                                <FlexItem>
                                    <Breadcrumb style={{padding: '8px'}}>
                                        {breadcrumbItem('/', '', pathList.length !== 0)}
                                        {pathList.map((item, index) => {
                                            return breadcrumbItem(item, pathList.slice(0, index + 1).join('/'), index !== pathList.length - 1);
                                        })}
                                    </Breadcrumb>
                                </FlexItem>
                            </Flex>
                        </StackItem>
                        <StackItem isFilled>
                            <DirectoryView showHidden={view.showHidden} onlyDirectory={view.onlyDirectory}
                                           onShowHiddenChange={(showHidden) => setView({...view, showHidden: showHidden})}
                                           onDirectorySelect={(path) => setSelectedDirectory(path)}
                                           selectedDirectory={selectedDirectory}/>
                        </StackItem>
                    </Stack>
                </DrawerContentBody>
            </DrawerContent>
        </Drawer>
    );
}

const DataLoadingErrorElement = memo((props) => <Alert {...props} className="nowrap" variant="danger" title="Error on loading data"></Alert>)
const Loading = memo((props) => <span><Spinner isInline={true} {...props} /> Loading...</span>)

function FileTree(props) {
    /* hooks */
    const [data, setData] = useState([{
        id: '<root>',
        name: <Loading />,
    }]);
    const [selected, setSelected] = useState([]);
    const forceUpdate = useForceUpdate();
    // componentDidMount
    useComponentDidMount(() => {
        // get root directories
        fetch(getUrl('/api/directory'))
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
            })
            .then(data => {
                if(data) {
                    setData(apiDataToTreeData(data))
                }
                else {
                    setData([{
                        id: '<root>',
                        name: <DataLoadingErrorElement />
                    }]);
                }
            });
    })
    useEffect(() => {
        if (selected.length > 0) scrollToItem(selected[0], selected[0]);
    }, [selected]);

    /* inner functions */
    function apiDataToTreeData(apiData) {
        const idPrefix = apiData.path === '' ? '' : apiData.path + '/';
        return apiData.files.map((item) => {
            return {
                id: idPrefix + item.name,
                name: getNameFromApiDataItem(item),
                icon: item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />,
                expandedIcon: item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder-open" /> : <FontAwesomeIcon icon="fas fa-file" />,
                children: item.isDirectory ? [] : null,
                // additional data
                isDirectory: item.isDirectory,
                isHidden: item.isHidden,
            };
        });
    }

    function getNameFromApiDataItem(apiDataItem) {
        return <span className={apiDataItem.isHidden ? 'hidden' : ''} style={{textWrap: 'nowrap'}}>{apiDataItem.name}</span>;
    }

    function filterTreeData(treeData) {
        let ret = treeData
        if (props.onlyDirectory) {
            ret = ret.filter(it => it.id === '<root>' || it.isDirectory);
        }
        if (!props.showHidden) {
            ret = ret.filter(it => it.id === '<root>' || !it.isHidden);
        }
        return ret;
    }

    function injectRefItemAndCopy(item) {
        return {...item, ref: item};
    }

    function filterTree(data) {
        if (data.id === '<root>' || !data.isDirectory || !Array.isArray(data.children)) return;
        data.children = data.children.map(it => injectRefItemAndCopy(it));
        data.children = filterTreeData(data.children);
        data.children.forEach(it => {
            filterTree(it);
        });
    }

    function onTreeExpend(evt, item, parent) {
        const ref = item.ref !== undefined ? item.ref : item;
        const hasAnyChild = ref.children.length > 0;
        if (!hasAnyChild) {
            ref.children = [
                {
                    id: `${ref.id}/<loading>`,
                    name: <span><Spinner isInline={true}/> Loading...</span>
                }
            ];
            forceUpdate();
        }
        fetch(getUrl('/api/directory?path=' + ref.id))
            .catch(error => {
                console.error('Error:', error);
            })
            .then(response => response.json()).then(data => {
            const treeData = apiDataToTreeData(data);
            const idExists = ref.children
                .map(it => it.id)
                .filter(it => !it.endsWith('<loading>'));
            if (idExists.length === 0) {
                ref.children = treeData;
            }
            else {
                const newId = treeData.map(it => it.id);
                const needAdd = treeData.filter(it => !idExists.includes(it.id));
                let children = ref.children.filter(it => newId.includes(it.id));
                children.push(...needAdd);
                ref.children = children;
            }
            forceUpdate(() => {
                const vScrollToItem = ref.children.length > 0 ? ref.children[0] : ref;
                const hScrollToItem = ref.children.length > 0 ? ref.children.reduce((p, c) => p.id.length > c.id.length ? p : c, {id: ''}) : ref;
                scrollToItem(vScrollToItem, hScrollToItem);
            });
        });
    }

    function onNodeSelect(evt, item, parent) {
        const ref = item.ref !== undefined ? item.ref : item;
        setSelected([ref]);
        const selectId = Array.isArray(ref.children) ? ref.id : parent ? parent.id : '';
        props.onDirectorySelect && props.onDirectorySelect(selectId);
    }

    function scrollToItem(vItem, hItem) {
        if (!vItem || !hItem) return;

        const scrollView = document.getElementsByClassName('pf-v6-c-drawer__panel-main')[0];
        const vUlElement = document.getElementById(vItem.id);
        const hUlElement = document.getElementById(hItem.id);
        if (!vUlElement || !hUlElement) return;

        const vTextElement = vUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);
        const hTextElement = hUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);
        if (!vTextElement || !hTextElement) return;

        const scrollRect = scrollView.getBoundingClientRect();
        const scrollContainerRect = scrollView.firstElementChild.getBoundingClientRect();
        const vUlRect = vUlElement.getBoundingClientRect();
        const hTextRect = hTextElement?.getBoundingClientRect() || {y: 0, x: 0, width: 0, height: 0};

        const vPos = vUlRect.y - scrollContainerRect.y + vUlRect.height / 2 - scrollRect.height / 2;
        const hPos = hTextRect.x - scrollContainerRect.x - 46 /* button padding */ - 22 /* icon width */;
        scrollView.scrollTo({
            top: vPos,
            left: hPos,
            behavior: 'smooth',
        });
    }

    /* render */
    const renderTree = {
        id: '',
        children: data,
        // additional data
        isDirectory: true,
        isHidden: false,
    }
    filterTree(renderTree);
    return (
        <TreeView data={renderTree.children}
                  hasGuides={true}
                  useMemo={true}
                  activeItems={selected}
                  onExpand={onTreeExpend.bind(this)}
                  onSelect={onNodeSelect.bind(this)} />
    );
}

function DirectoryView(props) {
    /* hooks */
    const [openedFile, setOpenedFile] = useState(null);
    const files = useRef([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [menu, setMenu] = useState({
        popup: false,
        x: 0,
        y: 0,
    });
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [nameModal, setNameModal] = useState({
        open: false,
        title: '',
        placeholder: '',
        content: '',
        confirmText: '',
        onConfirm: () => {},
    });
    const forceUpdate = useForceUpdate();
    useComponentDidMount(() => {
        getFiles();
    });
    useComponentDidUpdate(props, (prevProps) => {
        if (prevProps.selectedDirectory !== props.selectedDirectory) {
            setIsLoading(true);
            getFiles()
        }
    });

    /* inner functions */
    function getFiles() {
        fetch(getUrl('/api/directory?path=' + (props.selectedDirectory || '')))
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
                setIsError(true);
                setIsLoading(false);
            })
            .then(data => {
                files.current = apiDataToFiles(data);
                if (data.path !== '') {
                    const pathSplit = data.path.split('/');
                    pathSplit.pop();
                    files.current.unshift({
                        name: <Tooltip content='Back to Parent Directory' position='right'><FontAwesomeIcon icon="fa-solid fa-left-long" /></Tooltip>,
                        isDirectory: true,
                        isHidden: false,
                        size: 0,
                        path: pathSplit.join('/'),
                        isSelected: false,
                    })
                }
                setIsLoading(false);
                setIsError(false);
            });
    }

    function reload() {
        setIsLoading(true);
        setIsError(false);
        getFiles();
    }

    function filterFiles(apiData) {
        let ret = apiData
        if (props.onlyDirectory) {
            ret = ret.filter(it => it.isDirectory);
        }
        if (!props.showHidden) {
            ret = ret.filter(it => !it.isHidden);
        }
        return ret;
    }

    function apiDataToFiles(apiData) {
        const pathPrefix = apiData.path === '' ? '' : apiData.path + '/';
        return apiData.files.map((item) => {
            return {
                name: item.name,
                isDirectory: item.isDirectory,
                isHidden: item.isHidden,
                size: item.size,
                path: pathPrefix + item.name,
                isSelected: false,
            }
        });
    }

    function buildNameLabel(item) {
        let classList = [];
        if (item.isHidden) {
            classList.push('hidden');
        }
        return <span className={classList.join(' ')}>{item.name}</span>;
    }

    function onNewPath(path) {
        props.onDirectorySelect && props.onDirectorySelect(path);
    }

    function onOpenFile(path) {
        unSelectAll();
        setOpenedFile(path);
    }

    function tryOpenItem(item) {
        if (item.isDirectory) {
            onNewPath(item.path);
        }
        else {
            onOpenFile(item.path);
        }
    }

    function unSelectAll() {
        files.current.forEach(it => it.isSelected = false);
        forceUpdate();
    }

    function selectItem(item, ctrl, shift) {
        if (ctrl || shift) {
            item.isSelected = !item.isSelected;
        }
        else {
            unSelectAll();
            item.isSelected = true;
        }
        forceUpdate();
    }

    function buildSimpleListItem(item) {
        return <SimpleListItem key={item.path}
                               className={item.isSelected ? 'selected' : ''}
                               itemId={item.path}
                               onDoubleClick={tryOpenItem.bind(this, item)}
                               isActive={item.isSelected}
                               onContextMenu={(evt) => selectItem(item, evt.ctrlKey, evt.shiftKey)}
                               onClick={(evt) => selectItem(item, evt.ctrlKey, evt.shiftKey)}>
            <Split hasGutter>
                <SplitItem>
                    {item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />}
                </SplitItem>
                <SplitItem isFilled>
                    {buildNameLabel(item)}
                </SplitItem>
                <SplitItem>
                    {item.isDirectory ? '' : bytesToHumanReadable(item.size)}
                </SplitItem>
            </Split>
        </SimpleListItem>
    }

    function getFilename(path) {
        const idx = path.lastIndexOf('/')
        return idx === -1 ? path : path.slice(idx + 1)
    }

    function download(f) {
        f.forEach(file => {
            fetch(getUrl('/api/file/download?path=' + file))
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // a.target = '_blank';
                    a.download = getFilename(file);
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                });
        })
    }

    function getSelectedFiles() {
        return files.current.filter(it => it.isSelected && (!it.isHidden || props.showHidden));
    }

    function setContextOpen(isOpen) {
        setMenu(old => ({...old, popup: isOpen}));
    }

    function contextToggle(ref) {
        return <div ref={ref} style={{position: 'absolute', top: menu.y, left: menu.x}}></div>
    }

    function onContextMenu(evt) {
        evt.preventDefault();
        setContextOpen(false); // force close dropdown
        setTimeout(() => {
            setMenu({x: evt.clientX, y: evt.clientY, popup: true});
        }, 10); // reopen dropdown
    }

    function closeNameModal() {
        setNameModal(old => ({...old, open: false}));
    }

    function rename(name, newName) {
        const selected = getSelectedFiles()[0].path;
        fetch(getUrl('/api/file/rename?path=' + selected), {
            method: 'PUT',
            body: newName
        })
            .then(res => res.json())
            .then(data => reload())
            .catch(err => {
                console.error(err);
            });
    }

    function deleteFile(rec) {
        const selected = getSelectedFiles();
        Promise.all(selected.map(it => {
            return fetch(getUrl('/api/file/delete?path=' + it.path + '&recursive=' + rec), {
                method: 'DELETE'
            })
        }))
            .then(res => Promise.all(res.map(it => it.json())))
            .then(data => reload())
            .catch(err => {
                console.error(err);
            });
        setDeleteModalOpen(false);
    }

    function openRenameModal() {
        const oldName = getSelectedFiles()[0].name;
        setNameModal(old => ({open: true, title: 'Rename',
            confirmText: 'Rename', placeholder: oldName,
            content: oldName, onConfirm: () => {
                rename(oldName, old.content);
                closeNameModal();
            }}));
    }

    function createDir(name) {
        fetch(getUrl('/api/directory/create?path=' + props.selectedDirectory + '/' + name), {
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => reload())
            .catch(err => {
                console.error(err);
            });
    }

    function openCreateDirModal() {
        setNameModal(old => ({open: true, title: 'Create Directory',
            confirmText: 'Create', placeholder: '<new>',
            content: 'New Directory', onConfirm: () => {
                createDir(old.content);
                closeNameModal();
            }}));
    }

    function getDropdownItems(selectedFiles) {
        const hasSelectedFiles = selectedFiles.length > 0;
        const hasMultiSelectedFiles = selectedFiles.length > 1;
        const onlyOneSelectedFile = selectedFiles.length === 1;
        return <>
            <DropdownItem icon={<FontAwesomeIcon icon="fas fa-upload" />} onClick={() => setUploadModalOpen(true)}>Upload</DropdownItem>
            <DropdownItem icon={<FontAwesomeIcon icon="fas fa-folder-plus" />} onClick={() => openCreateDirModal()}>New Directory</DropdownItem>
            {onlyOneSelectedFile && <>
                <Divider component="li" key="separator" />
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-pen-to-square" />} onClick={() => openRenameModal()}>Rename</DropdownItem>
            </>}
            {hasSelectedFiles && <>
                <Divider component="li" key="separator" />
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-arrow-up-right-from-square" />}
                              onClick={tryOpenItem.bind(this, selectedFiles[0])}>Open{hasMultiSelectedFiles && ' First File/Directory'}</DropdownItem>
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-download" />}
                              onClick={() => download(selectedFiles.filter(it => !it.isDirectory).map(it => it.path))}>Download</DropdownItem>
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-trash" />} isDanger
                              onClick={() => setDeleteModalOpen(true)}>Delete</DropdownItem>
            </>}
        </>
    }

    function getToolbarItems(selectedFiles) {
        const hasSelectedFiles = selectedFiles.length > 0;
        const hasMultiSelectedFiles = selectedFiles.length > 1;
        const onlyOneSelectedFile = selectedFiles.length === 1;
        return <>
            <ToolbarGroup alignSelf="center">
                <ToolbarItem variant="label" alignItems="center">
                    <Tooltip content={<>{props.showHidden ? 'Hide' : 'Show'} Hidden Files</>}>
                        <Button variant="link" onClick={() => (props.onShowHiddenChange || (() => {}))(!props.showHidden)}>
                            {props.showHidden ? <FontAwesomeIcon icon="fas fa-eye-slash" /> : <FontAwesomeIcon icon="fas fa-eye" />}
                        </Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup alignSelf="center"
                          visibility={{default: hasMultiSelectedFiles ? "visible" : "hidden"}}>
                <ToolbarItem variant="label" alignItems="center">
                    Select {selectedFiles.length} files
                </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup variant="label-group"></ToolbarGroup>
            <ToolbarGroup visibility={{default: hasSelectedFiles ? "visible" : "hidden"}}>
                <ToolbarItem>
                    <Tooltip content={<>Open{hasMultiSelectedFiles && ' First File/Directory'}</>}>
                        <Button variant="link" onClick={tryOpenItem.bind(this, selectedFiles[0])}>
                            <FontAwesomeIcon icon="fas fa-arrow-up-right-from-square" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: hasSelectedFiles ? "visible" : "hidden"}}>
                    <Tooltip content="Download">
                        <Button variant="link" onClick={() => download(selectedFiles.filter(it => !it.isDirectory).map(it => it.path))}>
                            <FontAwesomeIcon icon="fas fa-download" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem>
                    <Tooltip content="Delete">
                        <Button variant="link" isDanger onClick={() => setDeleteModalOpen(true)}>
                            <FontAwesomeIcon icon="fas fa-trash" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: onlyOneSelectedFile ? "visible" : "hidden"}}>
                    <Tooltip content="Rename">
                        <Button variant="link" onClick={() => openRenameModal()}><FontAwesomeIcon icon="fas fa-pen-to-square" /></Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: hasMultiSelectedFiles ? "visible" : "hidden"}}>
                    <Tooltip content="Unselect All">
                        <Button variant="link" onClick={unSelectAll.bind(this)}><FontAwesomeIcon icon="fas fa-ban" /></Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
            {hasSelectedFiles && <ToolbarItem variant="separator" />}
            <ToolbarGroup>
                <ToolbarItem>
                    <Tooltip content="New Directory">
                        <Button variant="link" onClick={() => openCreateDirModal()}><FontAwesomeIcon icon="fas fa-folder-plus" /></Button>
                    </Tooltip>
                    <Tooltip content="Upload">
                        <Button variant="link" onClick={() => setUploadModalOpen(true)}><FontAwesomeIcon icon="fas fa-upload" /></Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
        </>
    }

    /* render */
    const selectedFiles = getSelectedFiles();
    const closeUploadModal = () => setUploadModalOpen(false);
    const closeDeleteModal = () => setDeleteModalOpen(false);
    const showContent = filterFiles(files.current)
    return (
        <Stack className="directory-view">
            <StackItem>
                <Toolbar inset={{default: 'insetMd'}} colorVariant="primary" isSticky={true}>
                    <ToolbarContent alignItems="center">{getToolbarItems(selectedFiles)}</ToolbarContent>
                </Toolbar>
            </StackItem>
            <StackItem isFilled onContextMenu={onContextMenu.bind(this)} style={{overflow: 'auto'}}>
                {
                    isLoading ? <Loading /> :
                        isError ? <DataLoadingErrorElement /> :
                            showContent.length > 0 ?
                                <SimpleList isControlled={false}>
                                    {showContent.map(buildSimpleListItem.bind(this))}
                                </SimpleList> :
                                ''
                }
            </StackItem>
            <Dropdown isOpen={menu.popup}
                      onSelect={setContextOpen.bind(this, false)}
                      onOpenChange={setContextOpen.bind(this)}
                      toggle={contextToggle.bind(this)}
                      popperProps={{preventOverflow: true}}>
                <DropdownList>
                    {getDropdownItems(selectedFiles)}
                </DropdownList>
            </Dropdown>
            <Modal variant="medium"
                   disableFocusTrap
                   isOpen={openedFile !== null}
                   onEscapePress={onOpenFile.bind(this, null)}
                   onClose={onOpenFile.bind(this, null)}>
                <ModalHeader title={getFilename(openedFile || '')} />
                <ModalBody>
                    <FileContentView path={openedFile} />
                </ModalBody>
                <ModalFooter style={{justifyContent: 'end'}}>
                    <Button variant="link" onClick={() => download([openedFile])}>Download</Button>
                </ModalFooter>
            </Modal>
            <FileUploadModal path={props.selectedDirectory} onUploadReload={() => reload()}
                             isOpen={uploadModalOpen} onClose={closeUploadModal} />
            <Modal variant="medium"
                   disableFocusTrap
                   isOpen={deleteModalOpen}
                   onEscapePress={closeDeleteModal}>
                <ModalHeader titleIconVariant="danger" title="Are you sure you want to delete the followings files?"/>
                <ModalBody>
                    <List variant={ListVariant.inline} style={{padding: '0 8px'}}>
                        {selectedFiles.map(it => {
                            return <ListItem key={it.name}
                                             icon={it.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />}>
                                {buildNameLabel(it)}
                            </ListItem>
                        })}
                    </List>
                </ModalBody>
                <ModalFooter style={{justifyContent: 'end'}}>
                    <Button variant="link" onClick={closeDeleteModal}>Cancel</Button>
                    <Button variant="link" isDanger onDoubleClick={() => deleteFile(true)}>Delete Recursively(Double Click)</Button>
                    <Button variant="link" isDanger onDoubleClick={() => deleteFile(false)}>Delete(Double Click)</Button>
                </ModalFooter>
            </Modal>
            <NameModal isOpen={nameModal.open} title={nameModal.title} placeholder={nameModal.placeholder}
                       content={nameModal.content} confirmText={nameModal.confirmText}
                       onCancel={closeNameModal.bind(this)} onConfirm={nameModal.onConfirm}
                       onChangeContent={(content) => setNameModal(old => ({...old, content: content}))} />
        </Stack>
    );

}

function NameModal(props) {
    const onCancel = props.onCancel || (() => {})
    const valid = isFilenameValid(props.content)
    return <Modal variant="small"
                  disableFocusTrap
                  isOpen={props.isOpen || false}
                  onEscapePress={onCancel}
                  onClose={onCancel}>
        <ModalHeader title={props.title || ""} />
        <ModalBody>
            <TextInput placeholder={props.placeholder} value={props.content} type="text"
                       aria-label={props.placeholder} isRequired={true}
                       validated={valid ? 'success' : 'error'}
                       onChange={(evt, value) => (props.onChangeContent || (() => {}))(value)}/>
            <HelperText>
                {!valid && <HelperTextItem variant="error">
                    Filename is invalid<br />
                    <List>
                        <ListItem>Must not be empty</ListItem>
                        <ListItem>Must not be . or ..</ListItem>
                        <ListItem>Must not contain / \ * : &lt; &gt; ? &#34; |</ListItem>
                        <ListItem>Must not have a space at the beginning or end</ListItem>
                    </List>
                </HelperTextItem>}
            </HelperText>
        </ModalBody>
        <ModalFooter style={{justifyContent: 'end'}}>
            <Button variant="link" isDisabled={!valid} onClick={props.onConfirm || (() => {})}>
                {props.confirmText || "Confirm"}
            </Button>
        </ModalFooter>
    </Modal>
}

function FileUploadModal(props) {
    /* hooks */
    const [uploadFiles, setUploadFiles] = useState([]);
    const [existsNames, setExistsNames] = useState([]);
    const [finishFiles, setFinishFiles] = useState([]);
    const reloadTimer = useRef(null);
    const reloadInterval = 1000;
    const forceUpdate = useForceUpdate();
    useEffect(() => {
        if (uploadFiles.length === 0) return;
        fetch(getUrl('/api/file/exists?path=' + props.path), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadFiles.map(it => it.name))
        })
            .then(res => res.json())
            .then(data => {
                const innerExistsNames = data.filter(it => it.isDirectory !== null);
                if (innerExistsNames.length > 0) {
                    setExistsNames(innerExistsNames.map(it => it.name));
                }
                else {
                    uploadFilesFunction(uploadFiles);
                }
            })
            .catch(err => {
                console.error(err);
            });
    }, [uploadFiles]);

    /* inner functions */
    function reloadFiles() {
        clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(props.onUploadReload || (() => {}), reloadInterval);
    }

    /**
     * @param files {File[]}
     */
    function onFilesUpload(files) {
        setUploadFiles(files);
    }

    function setProcessingFileStatus(file, state) {
        const files = finishFiles;
        const index = files.findIndex(it => it.file === file);
        if (index !== -1) {
            files[index].state = state;
        }
        else {
            files.push({file: file, state: state, reloaded: false});
        }
        forceUpdate();
    }

    function uploadFile(file) {
        removeFileFromProcessing(file);
        const formData = new FormData();
        formData.set('file', file);
        const xhr = new XMLHttpRequest();
        xhr.onloadstart = () => {
            setProcessingFileStatus(file, '0');
        }
        xhr.onload = () => {
            setProcessingFileStatus(file, 'success');
            reloadFiles();
        }
        xhr.onerror = () => {
            setProcessingFileStatus(file, 'error');
        }
        xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
                const percentComplete = (evt.loaded / evt.total) * 100;
                setProcessingFileStatus(file, '' + percentComplete);
            }
        }
        xhr.open('POST', getUrl('/api/file/upload?path=' + props.path), true);
        xhr.send(formData);
    }

    function uploadFilesFunction(f) {
        f.forEach(it => {
            uploadFile(it);
        });
    }

    function removeFileFromProcessing(file) {
        const files = uploadFiles;
        const index = files.findIndex(it => it === file);
        if (index !== -1) {
            files.splice(index, 1);
            setUploadFiles(files);
        }
    }

    function removeFileFromFinish(file) {
        const files = finishFiles;
        const index = files.findIndex(it => it === file);
        if (index !== -1) {
            files.splice(index, 1);
            setFinishFiles(files);
        }
    }

    function onClose() {
        setUploadFiles([]);
        setFinishFiles([]);
        props.onClose();
    }

    /* render */
    const successFiles = finishFiles.filter(it => it.state === 'success');
    const errorFiles = finishFiles.filter(it => it.state === 'error');
    const finishCount = successFiles.length + errorFiles.length;
    const hasErrorFiles = errorFiles.length > 0;
    return <Modal variant="medium"
                  disableFocusTrap
                  isOpen={props.isOpen}
                  onEscapePress={onClose.bind(this)}
                  onClose={onClose.bind(this)}>
        <ModalHeader title={"Upload Files"} />
        <ModalBody>
            <MultipleFileUpload
                onFileDrop={(evt, files) => onFilesUpload(files)}>
                <MultipleFileUploadMain
                    titleIcon={<FontAwesomeIcon icon="fas fa-upload" size="2x" />}
                    titleText="Drag and drop files here"
                    titleTextSeparator="or"
                />
                {finishFiles.length > 0 && (
                    <MultipleFileUploadStatus
                        statusToggleText={`${finishCount} of ${finishFiles.length} files uploaded`}
                        statusToggleIcon={finishCount < finishFiles.length ? 'inProgress' : hasErrorFiles ? 'danger' : 'success'}>
                        {finishFiles.map(file => <MultipleFileUploadStatusItem
                            key={file.file.name}
                            file={file.file} onClearClick={removeFileFromFinish.bind(this, file)}
                            progressValue={file.state === 'success' ? 100 : isNaN(file.state) ? 0 : +file.state}
                            progressVariant={file.state === 'error' ? 'danger' : 'success'}>
                        </MultipleFileUploadStatusItem>)}
                    </MultipleFileUploadStatus>
                )}
            </MultipleFileUpload>
        </ModalBody>
        <Modal variant="medium"
               disableFocusTrap
               isOpen={existsNames.length > 0}
               onEscapePress={() => setExistsNames([])}
               onClose={() => setExistsNames([])}>
            <ModalHeader titleIconVariant="warning" title="Files Exists" />
            <ModalBody>
                Following files already exists:
                <List>
                    {existsNames.map(it => {
                        return <ListItem key={it}>
                            {it}
                        </ListItem>
                    })}
                </List>
            </ModalBody>
            <ModalFooter style={{justifyContent: 'end'}}>
                <Button variant="link" onClick={() => {
                    setExistsNames([]);
                    setUploadFiles([]);
                }}>Cancel</Button>
                <Button variant="link"
                        onClick={() => {
                            setExistsNames([]);
                            uploadFilesFunction(uploadFiles.filter(it => !existsNames.includes(it.name)));
                            }}>Upload Not Exists</Button>
                <Button variant="link" isDanger
                        onClick={() => {
                            setExistsNames([]);
                            uploadFilesFunction(uploadFiles);
                        }}>Override</Button>
            </ModalFooter>
        </Modal>
    </Modal>

}

function FileContentView(props) {
    /* hooks */
    const [type, setType] = useState(null);
    const [viewable, setViewable] = useState(true);
    const [forceViewType, setForceViewType] = useState('text');
    const [forceViewDropdownOpen, setForceViewDropdownOpen] = useState(false);
    const allViewType = [
        {
            value: 'text',
            label: 'Text'
        },
        {
            value: 'image',
            label: 'Image'
        },
        {
            value: 'zip',
            label: 'Zip'
        },
        {
            value: 'pdf',
            label: 'PDF'
        }
    ];
    // componentDidMount
    useComponentDidMount(() => {
        updateContent();
    });
    // componentDidUpdate
    useComponentDidUpdate(props, (prevProps) => {
        if (prevProps.path !== props.path) {
            updateContent();
        }
    });

    /* inner functions */
    function updateContent() {
        fetch(getUrl('/api/file/type?path=' + props.path))
            .then(res => res.json())
            .catch(error => {
                setType('error');
                setViewable(true);
                console.error('Error:', error);
            })
            .then(data => {
                setType(data.type.toLowerCase());
                setViewable(data.viewable);
            });
    }

    function getComponent() {
        if (!viewable) {
            return <Alert variant="warning" title="The preview for this file is not available.">
                <Button variant="link" isInline onClick={() => {
                    setViewable(true);
                    setType(forceViewType);
                }}>
                    Force preview as
                </Button>
                {' '}
                <Select isOpen={forceViewDropdownOpen} selected={forceViewType}
                        onSelect={(evt , v) => {
                            setForceViewType(v);
                            setForceViewDropdownOpen(false)
                        }}
                        onOpenChange={(isOpen) => setForceViewDropdownOpen(isOpen)}
                        toggle={(t) => <MenuToggle ref={t} onClick={() => setForceViewDropdownOpen(old => !old)}
                                                   isExpanded={forceViewDropdownOpen}>
                            {allViewType.find(it => it.value === forceViewType)?.label}
                        </MenuToggle>} shouldFocusToggleOnSelect>
                    <SelectList>
                        {allViewType.map(it => {
                            return <SelectOption key={it.value} value={it.value}>{it.label}</SelectOption>
                        })}
                    </SelectList>
                </Select>
            </Alert>;
        }
        switch (type) {
            case 'text':
            case 'unknown':
                return <TextView path={props.path} />;
            case 'image':
                return <ImageView path={props.path} />;
            case 'zip':
                return <ZipView path={props.path} />;
            case 'pdf':
                return <PdfView path={props.path} />;
            case 'error':
                return <DataLoadingErrorElement />;
            default:
                return <Loading />;
        }
    }

    /* render */
    return getComponent();
}

export default FileView;
export {Loading, DataLoadingErrorElement};

