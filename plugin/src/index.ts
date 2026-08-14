import type { ConfigPlugin } from 'expo/config-plugins'
import { configPlugins } from './expoConfigPlugins'
import { withAndroid } from './withAndroid'

const { createRunOncePlugin } = configPlugins

const packageName = '@attentive-mobile/attentive-react-native-sdk'

export type AttentivePluginProps = {
  domain: string
  mode?: 'debug' | 'production'
}

// Runs at config-evaluation time on every platform (not inside the Android
// mod), so a misconfigured plugin fails any prebuild loudly instead of
// producing an app whose Android SDK silently never initializes.
function validateProps(props: unknown): asserts props is AttentivePluginProps {
  const usage =
    'Configure it in app.json: ["@attentive-mobile/attentive-react-native-sdk", ' +
    '{ "domain": "yourAttentiveDomain", "mode": "production" }]'

  if (props === null || typeof props !== 'object') {
    throw new Error(
      `[attentive-react-native-sdk] The config plugin requires options. ${usage}`
    )
  }
  const { domain, mode } = props as Record<string, unknown>
  if (typeof domain !== 'string' || domain.length === 0) {
    throw new Error(
      `[attentive-react-native-sdk] The config plugin requires a \`domain\` option (your Attentive domain slug). ${usage}`
    )
  }
  if (mode !== undefined && mode !== 'debug' && mode !== 'production') {
    throw new Error(
      `[attentive-react-native-sdk] Invalid mode ${JSON.stringify(
        mode
      )} — expected "debug" or "production" (defaults to "production" when omitted).`
    )
  }
}

export const withAttentive: ConfigPlugin<AttentivePluginProps> = (
  config,
  props
) => {
  validateProps(props)
  return withAndroid(config, props)
}

export default createRunOncePlugin(withAttentive, packageName)
