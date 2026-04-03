/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

var fullProject = require('./fixtures/full-project'),
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

var TARGET_NAME = 'TestExtension',
    TARGET_TYPE = 'app_extension',
    TARGET_SUBFOLDER_NAME = 'TestExtensionFiles',
    TARGET_BUNDLE_ID ="com.cordova.test.appextension";


describe('addTarget', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should throw when target name is missing', () => {
        assert.throws(function() {
            proj.addTarget(null, TARGET_TYPE);
        });

    });

    it('should throw when provided blank or empty target name', () => {
        assert.throws(function() {
            proj.addTarget('', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });

        assert.throws(function() {
            proj.addTarget('   ', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });

    });

    it('should throw when target type missing', () => {
        assert.throws(function() {
            proj.addTarget(TARGET_NAME, null);
        }, function (error) {
            return (error instanceof Error) && /Target type missing/i.test(error);
        });

    });

    it('should throw when invalid target type', () => {
        assert.throws(function() {
            proj.addTarget(TARGET_NAME, 'invalid_target_type');
        }, function (error) {
            return (error instanceof Error) && /Target type invalid/i.test(error);
        });

    });

    it('should create a new target', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

    });

    it('should create a new target with bundleid', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME, TARGET_BUNDLE_ID);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

    });

    it('should add debug and release configurations to build configuration list', () => {
        var pbxXCBuildConfigurationSection = proj.pbxXCBuildConfigurationSection(),
            pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        var buildConfigurations = pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].buildConfigurations;
        assert.ok(buildConfigurations);
        assert.equal(buildConfigurations.length, 2);

        buildConfigurations.forEach((config, index) => {
            var configUuid = config.value;
            assert.ok(configUuid);
            var pbxConfig = pbxXCBuildConfigurationSection[configUuid];
            assert.ok(pbxConfig);
            assert.equal(pbxConfig.name, index === 0 ? 'Debug' : 'Release');
            assert.equal(pbxConfig.isa, 'XCBuildConfiguration');
            assert.ok(pbxConfig.buildSettings);
            if (index === 0) {
                var debugConfig = pbxConfig.buildSettings['GCC_PREPROCESSOR_DEFINITIONS'];
                assert.ok(debugConfig);
                assert.equal(debugConfig.length, 2);
                assert.equal(debugConfig[0], '"DEBUG=1"');
                assert.equal(debugConfig[1], '"$(inherited)"');
            }
            assert.equal(pbxConfig.buildSettings['INFOPLIST_FILE'], '"' + TARGET_SUBFOLDER_NAME + '/' + TARGET_SUBFOLDER_NAME + '-Info.plist"');
            assert.equal(pbxConfig.buildSettings['LD_RUNPATH_SEARCH_PATHS'], '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"');
            assert.equal(pbxConfig.buildSettings['PRODUCT_NAME'], '"' + TARGET_NAME + '"');
            assert.equal(pbxConfig.buildSettings['SKIP_INSTALL'], 'YES');
        });

    });

    it('should add to build configuration list with default configuration name', () => {
        var pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        assert.equal(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].defaultConfigurationName, 'Release');

    });

    it('should add to build configuration list with comment', () => {
        var pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        var buildCommentKey = target.pbxNativeTarget.buildConfigurationList + '_comment';
        assert.ok(pbxXCConfigurationList[buildCommentKey]);
        assert.equal(pbxXCConfigurationList[buildCommentKey], 'Build configuration list for PBXNativeTarget "' + TARGET_NAME + '"');

    });

    it('should create a new target and add source, framework, resource and header files and the corresponding build phases', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME),
            options = { 'target' : target.uuid };

        var sourceFile = proj.addSourceFile('Plugins/file.m', options),
            sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid),
            resourceFile = proj.addResourceFile('assets.bundle', options),
            resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid),
            frameworkFile = proj.addFramework('libsqlite3.dylib', options),
            frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid),
            headerFile = proj.addHeaderFile('file.h', options);

        assert.ok(sourcePhase);
        assert.ok(resourcePhase);
        assert.ok(frameworkPhase);

        assert.equal(sourceFile.constructor, pbxFile);
        assert.equal(resourceFile.constructor, pbxFile);
        assert.equal(frameworkFile.constructor, pbxFile);
        assert.equal(headerFile.constructor, pbxFile);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

    });

    it('should create target with correct pbxNativeTarget name', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        var quotedTargetName = '"' + TARGET_NAME + '"';
        assert.equal(target.pbxNativeTarget.name, quotedTargetName);
        assert.equal(target.pbxNativeTarget.productName, quotedTargetName);

    });

    it('should add build phase for extension target', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        assert.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        assert.ok(phases);
        assert.ok(phases.files);
        assert.equal(phases.files.length, 1);

    });

    it('should not add build phase for non-extension target', () => {
        var target = proj.addTarget(TARGET_NAME, 'application');
        assert.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        assert.ok(!phases);

    });

    it('should add target as a target dependency to the main target', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        assert.ok(target);
        assert.ok(target.uuid);

        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'];

        var targetDependencyUuid = Object.keys(pbxTargetDependencySection).find( (key) => pbxTargetDependencySection[key].target === target.uuid);
        assert.ok(targetDependencyUuid);

        var firstTarget = proj.getFirstTarget();
        assert.ok(firstTarget);
        assert.ok(firstTarget.firstTarget);
        assert.ok(firstTarget.firstTarget.dependencies);

        var firstTargetMatchingDependency = firstTarget.firstTarget.dependencies.find( (elem) => elem.value === targetDependencyUuid);
        assert.ok(firstTargetMatchingDependency);

    });

    it('should have "wrapper.application" filetype for application product', () => {
        var target = proj.addTarget(TARGET_NAME, 'application');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');

    });

    it('should have "wrapper.app-extension" filetype for app_extension product', () => {
        var target = proj.addTarget(TARGET_NAME, 'app_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');

    });

    it('should have "wrapper.plug-in" filetype for bundle product', () => {
        var target = proj.addTarget(TARGET_NAME, 'bundle');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.plug-in"');

    });

    it('should have "compiled.mach-o.dylib" filetype for command_line_tool product', () => {
        var target = proj.addTarget(TARGET_NAME, 'command_line_tool');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

    });

    it('should have "compiled.mach-o.dylib" filetype for dynamic_library product', () => {
        var target = proj.addTarget(TARGET_NAME, 'dynamic_library');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

    });

    it('should have "wrapper.framework" filetype for framework product', () => {
        var target = proj.addTarget(TARGET_NAME, 'framework');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.framework"');

    });

    it('should have "archive.ar" filetype for static_library product', () => {
        var target = proj.addTarget(TARGET_NAME, 'static_library');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"archive.ar"');

    });

    it('should have "wrapper.cfbundle" filetype for unit_test_bundle product', () => {
        var target = proj.addTarget(TARGET_NAME, 'unit_test_bundle');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.cfbundle"');

    });

    it('should have "wrapper.application" filetype for watch_app product', () => {
        var target = proj.addTarget(TARGET_NAME, 'watch_app');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');

    });

    it('should have "wrapper.application" filetype for watch2_app product', () => {
        var target = proj.addTarget(TARGET_NAME, 'watch2_app');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');

    });

    it('should have "wrapper.app-extension" filetype for watch_extension product', () => {
        var target = proj.addTarget(TARGET_NAME, 'watch_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');

    });

    it('should have "wrapper.app-extension" filetype for watch2_extension product', () => {
        var target = proj.addTarget(TARGET_NAME, 'watch2_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');

    });
});
