
function getUrl(pathWithQuery) {
    let baseUrl = import.meta.env.SCS_SERVER_URL || '';
    let afterBase = pathWithQuery;
    if (!pathWithQuery.startsWith('/')) {
        afterBase = '/' + pathWithQuery;
    }
  return `${baseUrl}${afterBase}`;
}

function bytesToHumanReadable(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

const fileValidRegex = /^([^/\\*:<>?"|\s][^/\\*:<>?"|]*[^/\\*:<>?"|\s]|[^/\\*:<>?"|\s])$/;

function isFilenameValid(name) {
    if (name === null || name === undefined || name === '' ||
        name === '.' || name === '..') {
        return false
    }
    return fileValidRegex.test(name);
}

export { getUrl, bytesToHumanReadable, isFilenameValid };