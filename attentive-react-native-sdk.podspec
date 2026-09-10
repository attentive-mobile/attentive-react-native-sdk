require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "attentive-react-native-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/attentive-mobile/attentive-react-native-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  # `ios/build/generated` holds codegen output from opening this repo's own Xcode project, which
  # is produced against the devDependency React Native — a different version than the host app's.
  # Without this exclusion the glob compiles those files into the pod and, worse, publishes their
  # headers (e.g. FBReactNativeSpecJSI.h) into Pods/Headers/Public, where React Native's own pods
  # resolve them instead of the host's freshly generated ones. Only local path installs hit this;
  # the npm tarball already omits ios/build via package.json "files".
  s.exclude_files = "ios/build/**/*"
  s.public_header_files = "ios/AttentiveReactNativeSdk.h"

  s.dependency 'ATTNSDKFramework', '2.0.18-beta.1'
  s.swift_versions = ['5']

  install_modules_dependencies(s)
end
