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

describe('removeSourceFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });


    it('should return a pbxFile', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        assert.equal(newFile.constructor, pbxFile);
    });

    it('should set a uuid on the pbxFile', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        assert.ok(newFile.uuid);
    });

    it('should set a fileRef on the pbxFile', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        assert.ok(newFile.fileRef);
    });

    it('should remove 2 fields from the PBXBuildFile section', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m'),
            buildFileSection = proj.pbxBuildFileSection(),
            bfsLength = Object.keys(buildFileSection).length;

        assert.equal(58, bfsLength);
        assert.ok(!buildFileSection[newFile.uuid]);
        assert.ok(!buildFileSection[newFile.uuid + '_comment']);

    });

    it('should remove comment from the PBXBuildFile correctly', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m'),
            commentKey = newFile.uuid + '_comment',
            buildFileSection = proj.pbxBuildFileSection();
        assert.notEqual(!buildFileSection[commentKey], 'file.m in Sources');
    });

    it('should remove the PBXBuildFile object correctly', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m'),
            buildFileSection = proj.pbxBuildFileSection(),
            buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry, undefined);

    });

    it('should remove 2 fields from the PBXFileReference section', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m'),
            fileRefSection = proj.pbxFileReferenceSection(),
            frsLength = Object.keys(fileRefSection).length;

        assert.equal(66, frsLength);
        assert.ok(!fileRefSection[newFile.fileRef]);
        assert.ok(!fileRefSection[newFile.fileRef + '_comment']);

    });

    it('should remove the PBXFileReference comment correctly', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m'),
            fileRefSection = proj.pbxFileReferenceSection(),
            commentKey = newFile.fileRef + '_comment';

        assert.ok(!fileRefSection[commentKey]);
    });

    it('should remove the PBXFileReference object correctly', () => {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m'),
            fileRefSection = proj.pbxFileReferenceSection(),
            fileRefEntry = fileRefSection[newFile.fileRef];
        assert.ok(!fileRefEntry);
    });

    it('should remove from the Plugins PBXGroup group', () => {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m'),
            plugins = proj.pbxGroupByName('Plugins');
        assert.equal(plugins.children.length, 0);
    });

    it('should have the right values for the PBXGroup entry', () => {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m'),
            plugins = proj.pbxGroupByName('Plugins'),
            pluginObj = plugins.children[0];

        assert.ok(!pluginObj);
    });

    it('should remove from the PBXSourcesBuildPhase', () => {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m'),
            sources = proj.pbxSourcesBuildPhaseObj();

        assert.equal(sources.files.length, 2);
    });

    it('should have the right values for the Sources entry', () => {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m'),
            sources = proj.pbxSourcesBuildPhaseObj(),
            sourceObj = sources.files[2];

        assert.ok(!sourceObj);
    });

    it('should remove file from PBXFileReference after modified by Xcode', () => {
        var fileRef = proj.addSourceFile('Plugins/file.m').fileRef;

        // Simulate Xcode's behaviour of stripping quotes around path and name
        // properties.
        var entry = proj.pbxFileReferenceSection()[fileRef];
        entry.name = entry.name.replace(/^"(.*)"$/, "$1");
        entry.path = entry.path.replace(/^"(.*)"$/, "$1");

        var newFile = proj.removeSourceFile('Plugins/file.m');

        assert.ok(newFile.uuid);
        assert.ok(!proj.pbxFileReferenceSection()[fileRef]);
    });
});
