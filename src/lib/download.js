/**
 * Download a text file
 * @param {Document} document HTMl document of the current page
 * @param {string} text JSON content
 * @param {string} fileName file name
 */
export function downloadTextFile(document, text, fileName) {
  const a = document.createElement('a')
  a.href = 'data:text/plaincharset=utf-8,' + encodeURIComponent(text)
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Download a blob as binary file
 * @param {Document} document HTMl document of the current page
 * @param {Blob} blob content
 * @param {string} fileName file name
*/
export function downloadBlob(document, blob, fileName) {
  const a = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
