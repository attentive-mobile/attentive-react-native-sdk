import type { ConfigPlugin } from 'expo/config-plugins'
import { configPlugins } from './expoConfigPlugins'
import { withAndroid } from './withAndroid'

const { createRunOncePlugin } = configPlugins

const packageName = '@attentive-mobile/attentive-react-native-sdk'

export type AttentivePluginProps = {
  domain: string
  mode: 'debug' | 'production'
}

const withAttentive: ConfigPlugin<AttentivePluginProps> = (config, props) => {
  return withAndroid(config, props)
}

export default createRunOncePlugin(withAttentive, packageName)
