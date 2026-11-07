require 'xcodeproj'
require 'fileutils'

project_path = File.expand_path('ios/App/App.xcodeproj', Dir.pwd)
puts "Opening Xcode project at: #{project_path}"
project = Xcodeproj::Project.open(project_path)

# 1. Check or create TrainGuardWidgets target
target_name = 'TrainGuardWidgets'
existing_target = project.targets.find { |t| t.name == target_name }

if existing_target
  puts "Target #{target_name} already exists."
  target = existing_target
else
  puts "Creating new app_extension target: #{target_name}"
  target = project.new_target(:app_extension, target_name, :ios, '16.2')
end

# 2. Configure build settings for TrainGuardWidgets
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_NAME'] = target_name
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.trainguard.app.TrainGuardWidgets'
  config.build_settings['INFOPLIST_FILE'] = 'TrainGuardWidgets/Info.plist'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.2'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
  config.build_settings['ENABLE_BITCODE'] = 'NO'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
  config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  config.build_settings['MARKETING_VERSION'] = '1.3.0'
  config.build_settings['SKIP_INSTALL'] = 'YES'
end

# 3. Add files to the project group & compile phase
main_group = project.main_group
widgets_group = main_group.find_subpath('TrainGuardWidgets', false) || main_group.new_group('TrainGuardWidgets', 'TrainGuardWidgets')

widget_file = widgets_group.find_file_by_path('TrainGuardIslandWidget.swift') || widgets_group.new_file('TrainGuardIslandWidget.swift')
bundle_file = widgets_group.find_file_by_path('TrainGuardWidgetsBundle.swift') || widgets_group.new_file('TrainGuardWidgetsBundle.swift')
info_file = widgets_group.find_file_by_path('Info.plist') || widgets_group.new_file('Info.plist')

# Find TrainGuardAttributes.swift in App group
app_group = main_group.find_subpath('App', false)
attr_file = app_group ? app_group.find_file_by_path('TrainGuardAttributes.swift') : nil
if attr_file.nil?
  attr_file = main_group.find_file_by_path('App/TrainGuardAttributes.swift') || (app_group ? app_group.new_file('TrainGuardAttributes.swift') : main_group.new_file('App/TrainGuardAttributes.swift'))
end

files_to_compile = [widget_file, bundle_file, attr_file].compact
files_to_compile.each do |file_ref|
  unless target.source_build_phase.files.any? { |bf| bf.file_ref == file_ref }
    target.add_file_references([file_ref])
    puts "Added to #{target_name} compile sources: #{file_ref.path}"
  end
end

# 4. Add system frameworks (WidgetKit, SwiftUI, ActivityKit)
frameworks_group = project.frameworks_group
['WidgetKit', 'SwiftUI', 'ActivityKit'].each do |fw_name|
  fw_ref = frameworks_group.find_file_by_path("System/Library/Frameworks/#{fw_name}.framework") ||
           frameworks_group.new_file("System/Library/Frameworks/#{fw_name}.framework", :sdk_root)
  unless target.frameworks_build_phase.files.any? { |bf| bf.file_ref == fw_ref }
    target.frameworks_build_phase.add_file_reference(fw_ref)
    puts "Added framework #{fw_name} to #{target_name}"
  end
end

# 5. Link TrainGuardWidgets as dependency of App target and Embed in PlugIns
app_target = project.targets.find { |t| t.name == 'App' }
if app_target
  unless app_target.dependencies.any? { |dep| dep.target == target }
    app_target.add_dependency(target)
    puts "Added #{target_name} as dependency of App target"
  end

  # Embed in PlugIns (dst_subfolder_spec 13 = PlugIns)
  embed_phase = app_target.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' || p.dst_subfolder_spec == 13 }
  if embed_phase.nil?
    embed_phase = app_target.new_copy_files_build_phase('Embed Foundation Extensions')
    embed_phase.dst_subfolder_spec = 13
    puts "Created Embed Foundation Extensions build phase"
  end

  unless embed_phase.files.any? { |bf| bf.file_ref == target.product_reference }
    build_file = embed_phase.add_file_reference(target.product_reference)
    build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
    puts "Embedded #{target.product_reference.name || target.product_reference.path} into App PlugIns"
  end
end

project.save
puts "Successfully saved project.pbxproj with TrainGuardWidgets extension target!"
