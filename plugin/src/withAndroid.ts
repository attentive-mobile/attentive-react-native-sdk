import type { CodeGenerator, ConfigPlugin } from 'expo/config-plugins'
import { type AttentivePluginProps } from '.'
import {
  configPlugins,
  requireFromExpoConfigPlugins,
} from './expoConfigPlugins'

const { withMainApplication } = configPlugins

type MergeContentsFn = typeof CodeGenerator.mergeContents

// The public re-export of the generateCode utils (the CodeGenerator
// namespace) only exists from Expo SDK 54; on SDK 50–53 mergeContents is
// reachable only via @expo/config-plugins' internal build path. We resolve
// that path *through the app's expo package*: expo declares
// @expo/config-plugins as a dependency, so the edge is valid under every
// package manager, including pnpm's strict layout. SDK 50–53 are frozen on
// npm, so the internal path cannot move for the only versions that use it.
function resolveMergeContents(): MergeContentsFn {
  if (configPlugins.CodeGenerator?.mergeContents) {
    return configPlugins.CodeGenerator.mergeContents
  }
  return requireFromExpoConfigPlugins(
    '@expo/config-plugins/build/utils/generateCode'
  ).mergeContents
}

const ATTENTIVE_TAG = 'attentive-react-native-sdk'

function generateMode(props: AttentivePluginProps): string {
  const mode =
    props.mode === 'debug'
      ? 'AttentiveConfig.Mode.DEBUG'
      : 'AttentiveConfig.Mode.PRODUCTION'

  return mode
}

// Kotlin string literal for a JS string. JSON escaping covers quotes,
// backslashes, and control characters; Kotlin additionally treats `$` as
// template interpolation inside string literals, so escape that too.
function kotlinStringLiteral(value: string): string {
  return JSON.stringify(value).replace(/\$/g, '\\$')
}

function generateInitCode(props: AttentivePluginProps): string {
  const lines = [
    'val attentiveConfig = AttentiveConfig.Builder()',
    `  .applicationContext(this)`,
    `  .domain(${kotlinStringLiteral(props.domain)})`,
    `  .mode(${generateMode(props)})`,
    `  .build()`,
    `AttentiveSdk.initialize(attentiveConfig)`,
  ]

  return lines.join('\n    ')
}

function getImports(): string {
  const imports = [
    'import com.attentive.androidsdk.AttentiveConfig',
    'import com.attentive.androidsdk.AttentiveSdk',
  ]

  return imports.join('\n')
}

// Removes our @generated blocks so detection only sees code the app owns.
function stripGeneratedBlocks(contents: string): string {
  const pattern = new RegExp(
    `// @generated begin ${ATTENTIVE_TAG}-[\\s\\S]*?` +
      `// @generated end ${ATTENTIVE_TAG}-\\w+\\n?`,
    'g'
  )
  return contents.replace(pattern, '')
}

// True when MainApplication references the Attentive SDK outside the blocks
// this plugin generated — i.e. the app has (also) integrated manually. Our
// own blocks don't count: mergeContents replaces those when props change.
function hasManualAttentiveInit(contents: string): boolean {
  const appOwned = stripGeneratedBlocks(contents)
  return (
    appOwned.includes('AttentiveConfig') || appOwned.includes('AttentiveSdk')
  )
}

function addAttentiveToApplication(
  contents: string,
  props: AttentivePluginProps
) {
  const mergeContents = resolveMergeContents()

  const withImports = mergeContents({
    src: contents,
    newSrc: getImports(),
    anchor: /^package .+$/m,
    offset: 1,
    tag: `${ATTENTIVE_TAG}-import`,
    comment: '//',
  })

  const initCode = generateInitCode(props)

  let result = withImports.contents

  const withInit = mergeContents({
    src: result,
    newSrc: `\n    ${initCode}\n`,
    anchor: /super\.onCreate\(\)/,
    offset: 1,
    tag: `${ATTENTIVE_TAG}-init`,
    comment: '//',
  })

  result = withInit.contents

  return result
}

// Pure core of the mod, extracted so tests can exercise it without Expo's
// prebuild machinery. Returns the (possibly unchanged) file contents.
export function modifyMainApplication(
  modResults: { contents: string; language: string },
  props: AttentivePluginProps
): string {
  const { contents, language } = modResults

  if (hasManualAttentiveInit(contents)) {
    // App-owned Attentive code is present, so we defer to it and inject
    // nothing. But if a plugin-generated block from a prior prebuild is also
    // present, leaving it in place would initialize the SDK twice — so strip
    // our own (plugin-owned) blocks, leaving exactly the app's manual init.
    // This only ever removes code this plugin generated, never app-owned code.
    const withoutGenerated = stripGeneratedBlocks(contents)
    const removedGeneratedBlock = withoutGenerated !== contents
    console.warn(
      '[attentive-react-native-sdk] Found a manual Attentive integration in ' +
        'MainApplication that this plugin did not generate; leaving it in place ' +
        'and skipping injection.' +
        (removedGeneratedBlock
          ? ' Removed a previously plugin-generated block to avoid initializing ' +
            'the SDK twice.'
          : '') +
        ' Remove the manual initialization if you want the plugin to manage it.'
    )
    return withoutGenerated
  }

  if (language !== 'kt') {
    throw new Error(
      `[attentive-react-native-sdk] requires Expo SDK 50+ / Kotlin MainApplication. ` +
        `Initialize manually per README otherwise.`
    )
  }

  return addAttentiveToApplication(contents, props)
}

export const withAndroid: ConfigPlugin<AttentivePluginProps> = (
  config,
  props
) => {
  return withMainApplication(config, (modConfig) => {
    modConfig.modResults.contents = modifyMainApplication(
      modConfig.modResults,
      props
    )
    return modConfig
  })
}
