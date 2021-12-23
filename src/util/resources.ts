import { Uri, window, workspace } from 'vscode';

export function loadResource(uri: Uri) {
  const fileType = 'json';
  const formattedUri = substituteSlashes(uri.with({ path: uri.path + `.${fileType}` }));
  workspace.openTextDocument(formattedUri)
    .then((doc) => {
      if (doc) {
        window.showTextDocument(doc);
      }
    },
      (err) => window.showErrorMessage(`Error loading document: ${err}`));
}

function substituteSlashes(uri: Uri): Uri {
  const resultUri = `${uri.scheme}:/` + uri.toString()
    .replace(uri.scheme + ':', '')
    .replace('/', '-');

  return Uri.parse(resultUri);
}