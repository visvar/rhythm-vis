export const SETTINGS_KEY = 'demo-settings'

/**
 * @see https://stackoverflow.com/questions/4391575/how-to-find-the-size-of-localstorage
 * @returns {number} current localStorage usage in KB
 */
export function localStorageKBytes() {
  let _lsTotal = 0
  let entryLength
  let entry
  for (entry in localStorage) {
    if (!localStorage.hasOwnProperty(entry)) {
      continue
    }
    entryLength = ((localStorage[entry].length + entry.length) * 2)
    _lsTotal += entryLength
    // console.log(entry.substring(0, 50) + ' = ' + (entryLength / 1024).toFixed(2) + ' KB')
  };
  const total = _lsTotal / 1024
  // console.log('Total = ' + (_lsTotal / 1024).toFixed(2) + ' KB')
  return total
}

/**
 * TODO: this only check how much is still left, so we would need to back current values up, test, and then restore them
 * TODO: use binary search for better result, might underestimate by 50% currently
 * @returns {number} localStorage limit in KB
 */
export function localStorageSizeKBytes() {
  let string = ' '
  let characters = 0
  while (true) {
    try {
      localStorage.setItem('__test__', string)
    } catch (e) {
      break
    }
    string = `${string}${string}`
    characters = string.length
  }

  localStorage.removeItem('__test__')
  return (characters * 2) / 1024
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


export function localStorageGetUsageData() {
  let usage
  if (localStorage.getItem('usage') !== null) {
    usage = localStorage.getItem('usage')
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
    localStorage.setItem('usage', JSON.stringify(usage))
  } catch (e) {
    alert('localStorage might be full: ', e)
  }
}

export function localStorageGetSetting() {
  let usage
  if (localStorage.getItem('usage') !== null) {
    usage = localStorage.getItem('usage')
    usage = JSON.parse(usage)
  } else {
    usage = {
      demoClicks: {},
      demoRecordedData: {}
    }
  }
  return usage
}
