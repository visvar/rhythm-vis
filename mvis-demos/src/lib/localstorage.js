import { version } from '../../package.json'

export const SETTINGS_KEY = 'demo-settings'
export const USAGE_KEY = 'usage'

const localSt = window.localStorage

/**
 * @see https://stackoverflow.com/questions/4391575/how-to-find-the-size-of-localstorage
 * @returns {number} current localStorage usage in KB
 */
export function localStorageKBytes() {
  let _lsTotal = 0
  let entryLength
  let entry
  for (entry in localSt) {
    if (!localSt.hasOwnProperty(entry)) {
      continue
    }
    entryLength = ((localSt[entry].length + entry.length) * 2)
    _lsTotal += entryLength
  };
  const total = _lsTotal / 1024
  return total
}

/**
 * TODO: this only check how much is still left, so we would need to back current values up, test, and then restore them
 * TODO: use binary search for better result, might underestimate by 50% currently
 * @returns {number} localStorage limit in KB
 */
export function localStorageSizeKBytes() {
  let string = '12345678'
  let characters = 0
  while (true) {
    try {
      localSt.setItem('__test__', string)
    } catch (e) {
      break
    }
    string = `${string}${string}`
    characters = string.length
  }
  // console.log('semi')
  // while (true) {
  //   try {
  //     localSt.setItem('__test__', string)
  //     console.log(characters)
  //     break
  //   } catch (e) {
  //     string = string.slice(0, string.length - 1024 * 1024)
  //     console.log(characters)
  //   }
  //   characters = string.length
  // }

  localSt.removeItem('__test__')
  return (characters * 32) / 1024
}

export function localStorageReport() {
  const currentKb = localStorageKBytes()
  const limitKb = localStorageSizeKBytes()
  return {
    currentKb,
    limitKb,
    percentFull: currentKb / limitKb * 100
  }
}

// /**
//  * @see https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
//  * @returns {Promise<object>} information on usage
//  */
// export async function localStorageReport2() {
//   const estimate = await navigator.storage.estimate()
//   const percentFull = (estimate.usage / estimate.quota) *
//     100
//   return {
//     currentKb: estimate.usage / 1024,
//     limitKb: estimate.quota / 1024,
//     percentFull
//   }
// }

export function localStorageGetUsageData() {
  let usage
  if (localSt.getItem(USAGE_KEY) !== null) {
    usage = localSt.getItem(USAGE_KEY)
    usage = JSON.parse(usage)
  } else {
    usage = {
      demoClicks: {},
      demoRecordedData: {}
    }
  }
  return usage
}

export function localStorageSetUsageData(usage) {
  try {
    localSt.setItem(USAGE_KEY, JSON.stringify(usage))
  } catch (e) {
    window.alert('localStorage might be full: ' + e.toString())
  }
}

export function localStorageGetSetting(key) {
  const item = localSt.getItem(SETTINGS_KEY)
  if (!item) {
    return undefined
  } else {
    const obj = JSON.parse(item)
    return obj[key]
  }
}

/**
 * Stores the recorded data of the demo in the usage localSorage
 * @param {string} demoId demo ID
 * @param {object} data data to save
 */
export function localStorageAddRecording(demoId, data) {
  console.log(`saving recording for ${demoId}`, data)
  const usage = localStorageGetUsageData()
  console.log(usage)
  if (!usage.demoRecordedData) {
    usage.demoRecordedData = {}
  }
  if (!usage.demoRecordedData[demoId]) {
    usage.demoRecordedData[demoId] = []
  }
  console.log(usage)
  usage.demoRecordedData[demoId].push({
    date: (new Date()).toISOString(),
    softwareVersion: version,
    data
  })
  localStorageSetUsageData(usage)
}

/**
 * Returns all locally stored recordings for the given demo
 * @param {string} demoId demo ID
 * @returns {object[]} recording objects
 */
export function localSorageGetRecordings(demoId) {
  const usage = localStorageGetUsageData()
  if (!usage.demoRecordedData) {
    return []
  }
  if (!usage.demoRecordedData[demoId]) {
    return []
  }
  return usage.demoRecordedData[demoId]
}
