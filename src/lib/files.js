
/**
 * Reads and parses a JSON file using the File System API
 * @param {FileSystemFileHandle} handle file handle
 * @returns {Promise<object>} parsed JSON
 */
export async function readJsonFile(handle) {
  const buffer = await handle.getFile()
  const json = await buffer.text()
  return JSON.parse(json)
}

/**
 * Checks whether a file already exists using the File System API
 * @param {FileSystemDirectoryHandle} dirHandle directory handle
 * @param {string} name file name
 * @returns {Promise<boolean>} true eif file exists
 */
export async function fileExists(dirHandle, name) {
  try {
    await dirHandle.getFileHandle(name)
    return true
  } catch (e) {
    return false
  }
}
