import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins'
import { withAndroid } from './withAndroid'

const packageName = '@attentive-mobile/attentive-react-native-sdk'

export type AttentivePluginProps = {
  domain: string
  mode: 'debug' | 'production'
}

const withAttentive: ConfigPlugin<AttentivePluginProps> = (config, props) => {
  return withAndroid(config, props)
}

export default createRunOncePlugin(withAttentive, packageName)
