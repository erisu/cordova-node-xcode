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

describe('addHeaderFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        var newFile = proj.addHeaderFile('file.h');
        assert.equal(newFile.constructor, pbxFile);
    });

    it('should set a fileRef on the pbxFile', () => {
        var newFile = proj.addHeaderFile('file.h');
        assert.ok(newFile.fileRef);
    });

    it('should populate the PBXFileReference section with 2 fields', () => {
        var newFile = proj.addHeaderFile('file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);
    });

    it('should populate the PBXFileReference comment correctly', () => {
        var newFile = proj.addHeaderFile('file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'file.h');
    });

    it('should add the PBXFileReference object correctly', () => {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.fileEncoding, 4);
        assert.equal(fileRefEntry.lastKnownFileType, 'sourcecode.c.h');
        assert.equal(fileRefEntry.name, '"file.h"');
        assert.equal(fileRefEntry.path, '"file.h"');
        assert.equal(fileRefEntry.sourceTree, '"<group>"');
    });

    it('should add to the Plugins PBXGroup group', () => {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            plugins = proj.pbxGroupByName('Plugins');

        assert.equal(plugins.children.length, 1);
    });

    it('should have the right values for the PBXGroup entry', () => {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            plugins = proj.pbxGroupByName('Plugins'),
            pluginObj = plugins.children[0];

        assert.equal(pluginObj.comment, 'file.h');
        assert.equal(pluginObj.value, newFile.fileRef);
    });

    it('addHeaderFile duplicate entries: should return false', () => {
        var newFile = proj.addHeaderFile('Plugins/file.h');
        assert.ok(!proj.addHeaderFile('Plugins/file.h'));
    });

    it('addHeaderFile duplicate entries: should not add another entry anywhere', () => {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            frsLength = Object.keys(fileRefSection).length,
            plugins = proj.pbxGroupByName('Plugins');

        proj.addHeaderFile('Plugins/file.h');

        assert.equal(68, frsLength);
        assert.equal(plugins.children.length, 1);
    });
});
