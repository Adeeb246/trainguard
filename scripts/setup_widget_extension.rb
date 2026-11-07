require 'xcodeproj'

project_path = File.expand_path('ios/App/App.xcodeproj', Dir.pwd)
puts "Opening Xcode project at: #{project_path}"
project = Xcodeproj::Project.open(project_path)

ext_name = 'TrainGuardWidgets'
extension_target = project.targets.find { |t| t.name == ext_name }

if extension_target.nil?
  puts "Creating new app_extension target: #{ext_name}"
  extension_target = project.new_target(:app_extension, ext_name, :ios, '16.2')
end

# 1. Group and file references
ext_group = project.main_group.find_subpath(ext_name, true)
w_ref = ext_group.find_file_by_path('TrainGuardIslandWidget.swift') || ext_group.new_reference('TrainGuardWidgets/TrainGuardIslandWidget.swift')
b_ref = ext_group.find_file_by_path('TrainGuardWidgetsBundle.swift') || ext_group.new_reference('TrainGuardWidgets/TrainGuardWidgetsBundle.swift')
p_ref = ext_group.find_file_by_path('Info.plist') || ext_group.new_reference('TrainGuardWidgets/Info.plist')

app_group = project.main_group.find_subpath('App', true)
a_ref = app_group.find_file_by_path('TrainGuardAttributes.swift') || app_group.new_reference('App/TrainGuardAttributes.swift')

# 2. Add files to extension compile sources
extension_target.source_build_phase.files.clear
[w_ref, b_ref, a_ref].compact.each do |file_ref|
  build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  build_file.file_ref = file_ref
  extension_target.source_build_phase.files << build_file
  puts "Added to #{ext_name} sources: #{file_ref.path}"
end

# 3. Configure build settings
extension_target.build_configuration_list.set_setting('PRODUCT_NAME', ext_name)
extension_target.build_configuration_list.set_setting('PRODUCT_BUNDLE_IDENTIFIER', 'com.trainguard.app.TrainGuardWidgets')
extension_target.build_configuration_list.set_setting('INFOPLIST_FILE', 'TrainGuardWidgets/Info.plist')
extension_target.build_configuration_list.set_setting('SWIFT_VERSION', '5.0')
extension_target.build_configuration_list.set_setting('IPHONEOS_DEPLOYMENT_TARGET', '16.2')
extension_target.build_configuration_list.set_setting('TARGETED_DEVICE_FAMILY', '1')
extension_target.build_configuration_list.set_setting('ENABLE_BITCODE', 'NO')
extension_target.build_configuration_list.set_setting('CODE_SIGNING_ALLOWED', 'NO')
extension_target.build_configuration_list.set_setting('CODE_SIGNING_REQUIRED', 'NO')
extension_target.build_configuration_list.set_setting('GENERATE_INFOPLIST_FILE', 'NO')
extension_target.build_configuration_list.set_setting('CURRENT_PROJECT_VERSION', '1')
extension_target.build_configuration_list.set_setting('MARKETING_VERSION', '1.3.0')
extension_target.build_configuration_list.set_setting('SKIP_INSTALL', 'YES')

# 4. Link & embed in App target
main_app_target = project.targets.find { |t| t.name == 'App' }
if main_app_target
  unless main_app_target.dependencies.any? { |d| d.target == extension_target }
    main_app_target.add_dependency(extension_target)
    puts "Added target dependency: App -> #{ext_name}"
  end

  copy_files_phase = main_app_target.copy_files_build_phases.find { |phase| phase.name == 'Embed App Extensions' }
  unless copy_files_phase
    copy_files_phase = project.new(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
    copy_files_phase.name = 'Embed App Extensions'
    copy_files_phase.symbol_dst_subfolder_spec = :plug_ins
    main_app_target.build_phases << copy_files_phase
    puts "Created Embed App Extensions build phase"
  end

  product_ref = extension_target.product_reference || project.products_group.find_file_by_path("#{ext_name}.appex") || project.products_group.new_reference("#{ext_name}.appex")
  unless copy_files_phase.files.any? { |bf| bf.file_ref == product_ref }
    build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
    build_file.file_ref = product_ref
    build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
    copy_files_phase.files << build_file
    puts "Embedded #{ext_name}.appex into App PlugIns"
  end
end

project.save
puts "Successfully configured and saved Xcode project with #{ext_name} extension target!"
