/**
 * Stores a stringified Map in JSON
 * @see https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 * @param {*} key
 * @param {*} value
 * @returns {object}
*/
export function replacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    }
  } else {
    return value
  }
}

/**
 * Revives a stringified Map in JSON
 * @see https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 * @param {*} key
 * @param {*} value
 * @returns {Map} map
 */
export function reviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
  }
  return value
}
