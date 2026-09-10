import { readFileSync } from 'fs'
import { join } from 'path'

import { DEVICE_EVENT_NAMES } from '../eventNames'

/**
 * Guards the one contract in this package that fails silently.
 *
 * A device-event name is shared verbatim between `src/eventNames.ts` and both native bridges.
 * Nothing checks that at build time: if a name drifts on one side, the native side emits onto a
 * name nobody listens to and JS waits for a name nobody emits. There is no error, no warning, and
 * no crash — the feature is simply dead (no creative events at all, or an inbox badge stuck at its
 * initial value). That is expensive to debug precisely because everything looks fine.
 *
 * Reading the native sources from disk is the same approach `plugin/src/__tests__` already uses.
 * It is a substring check rather than a parse: enough to catch a typo or a rename, without this
 * test needing to understand Objective-C or Kotlin.
 */
const repoRoot = join(__dirname, '..', '..')

const readSource = (relativePath: string): string =>
  readFileSync(join(repoRoot, relativePath), 'utf8')

const IOS_BRIDGE = 'ios/AttentiveReactNativeSdk.mm'
const ANDROID_BRIDGE =
  'android/src/main/kotlin/com/attentivereactnativesdk/AttentiveReactNativeSdkModule.kt'

describe('device event names', () => {
  const iosSource = readSource(IOS_BRIDGE)
  const androidSource = readSource(ANDROID_BRIDGE)

  const names = Object.entries(DEVICE_EVENT_NAMES)

  it('has at least one name to check', () => {
    // Guards against the table being emptied or renamed, which would make every case below
    // vacuously pass.
    expect(names.length).toBeGreaterThan(0)
  })

  it.each(names)(
    '%s is declared verbatim in the iOS bridge',
    (_key, eventName) => {
      expect(iosSource).toContain(`@"${eventName}"`)
    }
  )

  it.each(names)(
    '%s is declared verbatim in the Android bridge',
    (_key, eventName) => {
      expect(androidSource).toContain(`"${eventName}"`)
    }
  )
})
