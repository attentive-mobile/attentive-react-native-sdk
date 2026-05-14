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
  s.public_header_files = "ios/AttentiveReactNativeSdk.h"

  s.dependency 'attentive-ios-sdk', '2.0.13'
  s.swift_versions = ['5']

  install_modules_dependencies(s)
end
