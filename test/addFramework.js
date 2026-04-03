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

function nonComments(obj) {
    var keys = Object.keys(obj),
        newObj = {}, i = 0;

    for (i; i < keys.length; i++) {
        if (!/_comment$/.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function frameworkSearchPaths(proj) {
    var configs = nonComments(proj.pbxXCBuildConfigurationSection()),
        allPaths = [],
        ids = Object.keys(configs), i, buildSettings;

    for (i = 0; i< ids.length; i++) {
        buildSettings = configs[ids[i]].buildSettings;

        if (buildSettings['FRAMEWORK_SEARCH_PATHS']) {
            allPaths.push(buildSettings['FRAMEWORK_SEARCH_PATHS']);
        }
    }

    return allPaths;
}

describe('addFramework', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        var newFile = proj.addFramework('libsqlite3.dylib');
        assert.equal(newFile.constructor, pbxFile);
    });

    it('should set a fileRef on the pbxFile', () => {
        var newFile = proj.addFramework('libsqlite3.dylib');
        assert.ok(newFile.fileRef);
    });

    it('should populate the PBXFileReference section with 2 fields', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            fileRefSection = proj.pbxFileReferenceSection(),
            frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);
    ;
    });

    it('should populate the PBXFileReference comment correctly', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            fileRefSection = proj.pbxFileReferenceSection(),
            commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'libsqlite3.dylib');
    });

    it('should add the PBXFileReference object correctly', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            fileRefSection = proj.pbxFileReferenceSection(),
            fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.lastKnownFileType, 'compiled.mach-o.dylib');
        assert.equal(fileRefEntry.name, '"libsqlite3.dylib"');
        assert.equal(fileRefEntry.path, '"usr/lib/libsqlite3.dylib"');
        assert.equal(fileRefEntry.sourceTree, 'SDKROOT');
    ;
    });

    it('should populate the PBXBuildFile section with 2 fields', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            buildFileSection = proj.pbxBuildFileSection(),
            bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    ;
    });

    it('should add the PBXBuildFile comment correctly', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            commentKey = newFile.uuid + '_comment',
            buildFileSection = proj.pbxBuildFileSection();

        assert.equal(buildFileSection[commentKey], 'libsqlite3.dylib in Frameworks');
    });

    it('should add the PBXBuildFile object correctly', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            buildFileSection = proj.pbxBuildFileSection(),
            buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'libsqlite3.dylib');
        assert.equal(buildFileEntry.settings, undefined);
    ;
    });

    it('should add the PBXBuildFile object correctly /w weak linked frameworks', () => {
        var newFile = proj.addFramework('libsqlite3.dylib', { weak: true }),
            buildFileSection = proj.pbxBuildFileSection(),
            buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'libsqlite3.dylib');
        assert.deepEqual(buildFileEntry.settings, { ATTRIBUTES: [ 'Weak' ] });
    ;
    });

    it('should add to the Frameworks PBXGroup', () => {
        var newLength = proj.pbxGroupByName('Frameworks').children.length + 1;
        proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxGroupByName('Frameworks');

        assert.equal(frameworks.children.length, newLength);
    });

    it('should have the right values for the PBXGroup entry', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            frameworks = proj.pbxGroupByName('Frameworks').children,
            framework = frameworks[frameworks.length - 1];

        assert.equal(framework.comment, 'libsqlite3.dylib');
        assert.equal(framework.value, newFile.fileRef);
    });

    it('should add to the PBXFrameworksBuildPhase', () => {
        proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 16);
    });

    it('should not add to the PBXFrameworksBuildPhase', () => {
        proj.addFramework('Private.framework', {link: false});
        var frameworks = proj.pbxFrameworksBuildPhaseObj();

        assert.equal(frameworks.files.length, 15);
    });

    it('should have the right values for the Sources entry', () => {
        var newFile = proj.addFramework('libsqlite3.dylib'),
            frameworks = proj.pbxFrameworksBuildPhaseObj(),
            framework = frameworks.files[15];

        assert.equal(framework.comment, 'libsqlite3.dylib in Frameworks');
        assert.equal(framework.value, newFile.uuid);
    });

    it('should return false', () => {
        proj.addFramework('libsqlite3.dylib');
        assert.ok(!proj.addFramework('libsqlite3.dylib'));
    });

    it('should pbxFile correctly for custom frameworks', () => {
        var newFile = proj.addFramework('/path/to/Custom.framework', {customFramework: true});

        assert.ok(newFile.customFramework);
        assert.ok(!newFile.fileEncoding);
        assert.equal(newFile.sourceTree, '"<group>"');
        assert.equal(newFile.group, 'Frameworks');
        assert.equal(newFile.basename, 'Custom.framework');
        assert.equal(newFile.dirname, '/path/to');
        // XXX framework has to be copied over to PROJECT root. That is what XCode does when you drag&drop
        assert.equal(newFile.path, '/path/to/Custom.framework');


        // should add path to framework search path
        var frameworkPaths = frameworkSearchPaths(proj);
            expectedPath = '"\\"/path/to\\""';

        for (i = 0; i < frameworkPaths.length; i++) {
            var current = frameworkPaths[i];
            assert.ok(current.indexOf('"$(inherited)"') >= 0);
            assert.ok(current.indexOf(expectedPath) >= 0);
        };
    });

    it('should add to the Embed Frameworks PBXCopyFilesBuildPhase', () => {
        proj.addFramework('/path/to/SomeEmbeddableCustom.framework', {customFramework: true, embed: true});
        var frameworks = proj.pbxEmbedFrameworksBuildPhaseObj();
        var buildPhaseInPbx = proj.pbxEmbedFrameworksBuildPhaseObj();
        assert.equal(buildPhaseInPbx.dstSubfolderSpec, 10);

        assert.equal(frameworks.files.length, 1);
    });

    it('should not add to the Embed Frameworks PBXCopyFilesBuildPhase by default', () => {
        proj.addFramework('/path/to/Custom.framework', {customFramework: true});
        var frameworks = proj.pbxEmbedFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 0);
    });

    it('should add the PBXBuildFile object correctly /w signable frameworks', () => {
        var newFile = proj.addFramework('/path/to/SomeSignable.framework', { customFramework: true, embed: true, sign: true }),
            buildFileSection = proj.pbxBuildFileSection(),
            buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(newFile.group, 'Embed Frameworks');
        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'SomeSignable.framework');
        assert.deepEqual(buildFileEntry.settings, { ATTRIBUTES: [ 'CodeSignOnCopy' ] });
    });
});
