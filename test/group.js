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

var pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    project,
    projectHash;

var findChildInGroup = function(obj, target) {
    var found = false;

    for (var i = 0, j = obj.children.length; i < j; i++) {
        if (obj.children[i].value === target) {
            found = true;
            break;
        }
    }

    return found;
}

var findFileByUUID = function(obj, target) {
    var found = false;

    for (var k = 0, l = obj.files.length; k < l; k++) {
        if (obj.files[k].value === target) {
            found = true;
            break;
        }
    }

    return found;
}

var findByFileRef = function(obj, target) {
    var found = false;

    for (var property in obj) {
        if (!/comment/.test(property)) {
            if (obj[property].fileRef === target) {
                found = true;
                break;
            }
        }
    }
    return found;
}

var findByName = function(obj, target) {
    var found = false;
    for (var property in obj) {
        if (!/comment/.test(property)) {
            var value = obj[property];
            if (value.name === target) {
                found = true;
            }
        }
    }
    return found;
}

describe('group', () => {
    beforeEach(() => {
        project = new pbx('test/parser/projects/group.pbxproj');
        projectHash = project.parseSync();
    });

    describe('getGroupByKey', () => {
        it('should return PBXGroup for Classes', () => {
            var groupKey = project.findPBXGroupKey({name: 'Classes'});
            var group = project.getPBXGroupByKey(groupKey);
            assert.ok(group.name === 'Classes');
        });

        it('should return PBXGroup for Plugins', () => {
            var groupKey = project.findPBXGroupKey({name: 'Plugins'});
            var group = project.getPBXGroupByKey(groupKey);
            assert.ok(group.name === 'Plugins');
        });
    });

    describe('createGroup', () => {
        it('should create a new Test Group', () => {
            var found = false;
            var groups = project.getPBXObject('PBXGroup');

            var found = findByName(groups, 'Test');
            assert.ok(found === false);


            var group = project.findPBXGroupKey({name:'Test'});
            assert.ok(group === undefined);

            project.pbxCreateGroup('Test', 'Test');

            groups = project.getPBXObject('PBXGroup');
            found = findByName(groups, 'Test');
            assert.ok(found === true);

            group = project.findPBXGroupKey({name:'Test'});
            assert.ok(typeof group === 'string');
        });
    });

    describe('findGroupKey', () => {
        it('should return a valid group key', () => {
            var keyByName = project.findPBXGroupKey({ name: 'Classes'});
            var keyByPath = project.findPBXGroupKey({ path: 'icons'});
            var keyByPathName = project.findPBXGroupKey({ path: '"HelloCordova/Plugins"', name: 'Plugins'});
            var nonExistingKey = project.findPBXGroupKey({ name: 'Foo'});

            assert.ok(keyByName === '080E96DDFE201D6D7F000001');
            assert.ok(keyByPath === '308D052D1370CCF300D202BF');
            assert.ok(keyByPathName === '307C750510C5A3420062BCA9');
            assert.ok(nonExistingKey === undefined);

        });
    });

    describe('addGroupToGroup', () => {
        it('should create a new test group then add group to Classes group', () => {
            var testKey = project.pbxCreateGroup('Test', 'Test');
            var classesKey = project.findPBXGroupKey({name: 'Classes'});
            project.addToPbxGroup(testKey, classesKey);

            var classesGroup = project.getPBXGroupByKey(classesKey);
            var foundTestGroup = false;
            for (var i = 0, j = classesGroup.children.length; i < j; i++) {
                var child = classesGroup.children[i];
                if (child.value === testKey && child.comment === 'Test') {
                    foundTestGroup = true;
                }
            }

            assert.ok(foundTestGroup);

        });
    });

    describe('predefinedPbxGroups', () => {
        beforeEach(() => {
            project = new pbx('test/parser/projects/empty-groups.pbxproj').parseSync();

            this.file = new pbxFile('some-file.m');
            this.file.fileRef = project.generateUuid();
            project.addToPbxFileReferenceSection(this.file);
        });

        it('should add a file to "Plugins" group', () => {
            project.addToPluginsPbxGroup(this.file);
            var foundInGroup = findChildInGroup(project.pbxGroupByName('Plugins'), this.file.fileRef);
            assert.ok(foundInGroup);
        });

        it('should remove a file from "Plugins" group', () => {
            project.addToPluginsPbxGroup(this.file);
            project.removeFromPluginsPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Plugins'), this.file.fileRef);
            assert.ok(!foundInGroup);
        });

        it('should add a file to "Resources" group', () => {
            project.addToResourcesPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Resources'), this.file.fileRef);
            assert.ok(foundInGroup);
        });

        it('should remove a file from "Resources" group', () => {
            project.addToResourcesPbxGroup(this.file);
            project.removeFromResourcesPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Resources'), this.file.fileRef);
            assert.ok(!foundInGroup);
        });

        it('should add a file to "Frameworks" group', () => {
            project.addToFrameworksPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Frameworks'), this.file.fileRef);
            assert.ok(foundInGroup);
        });

        it('should remove a file from "Frameworks" group', () => {
            project.addToFrameworksPbxGroup(this.file);
            project.removeFromFrameworksPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Frameworks'), this.file.fileRef);
            assert.ok(!foundInGroup);
        });

        it('should add a file to "Products" group', () => {
            project.addToProductsPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Products'), this.file.fileRef);
            assert.ok(foundInGroup);
        });

        it('should remove a file from "Products" group', () => {
            project.addToProductsPbxGroup(this.file);
            project.removeFromProductsPbxGroup(this.file);

            var foundInGroup = findChildInGroup(project.pbxGroupByName('Products'), this.file.fileRef);
            assert.ok(!foundInGroup);
        });
    });

    describe('addSourceFileToGroup', () => {
        it('should create group + add source file', () => {
            var testKey = project.pbxCreateGroup('Test', 'Test');
            var file = project.addSourceFile('Notifications.m', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

            var foundInBuildFileSection = findByFileRef(project.pbxBuildFileSection(), file.fileRef);
            assert.ok(foundInBuildFileSection);

            var foundInBuildPhase = findFileByUUID(project.pbxSourcesBuildPhaseObj(), file.uuid);
            assert.ok(foundInBuildPhase);

        });
    });

    describe('removeSourceFileFromGroup', () => {
        it('should create group + add source file then remove source file', () => {
            var testKey = project.pbxCreateGroup('Test', 'Test');
            var file = project.addSourceFile('Notifications.m', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

            var foundInBuildFileSection = findByFileRef(project.pbxBuildFileSection(), file.fileRef);
            assert.ok(foundInBuildFileSection);

            var foundInBuildPhase = findFileByUUID(project.pbxSourcesBuildPhaseObj(), file.uuid);
            assert.ok(foundInBuildPhase);

            project.removeSourceFile('Notifications.m', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(!foundInGroup);

            var foundInBuildFileSection = findByFileRef(project.pbxBuildFileSection(), file.fileRef);
            assert.ok(!foundInBuildFileSection);

            var foundInBuildPhase = findFileByUUID(project.pbxSourcesBuildPhaseObj(), file.uuid);
            assert.ok(!foundInBuildPhase);

        });
    });

    describe('addHeaderFileToGroup', () => {
        it('should create group + add header file', () => {
            var testKey = project.pbxCreateGroup('Test', 'Test');
            var file = project.addHeaderFile('Notifications.h', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

        });
    });

    describe('removeHeaderFileFromGroup', () => {
        it('should create group + add source file then remove header file', () => {
            var testKey = project.pbxCreateGroup('Test', 'Test');
            var file = project.addHeaderFile('Notifications.h', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

            project.removeHeaderFile('Notifications.h', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(!foundInGroup);

        });
    });

    describe('addResourceFileToGroup', () => {
        it('should add resource file (PNG) to the splash group', () => {

            var testKey = project.findPBXGroupKey({path:'splash'});
            var file = project.addResourceFile('DefaultTest-667h.png', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

        });
    });

    describe('removeResourceFileFromGroup', () => {
        it('should add resource file (PNG) then remove resource file from splash group', () => {
            var testKey = project.findPBXGroupKey({path:'splash'});
            var file = project.addResourceFile('DefaultTest-667h.png', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(foundInGroup);

            project.removeResourceFile('DefaultTest-667h.png', {}, testKey);

            var foundInGroup = findChildInGroup(project.getPBXGroupByKey(testKey),file.fileRef );
            assert.ok(!foundInGroup);

        });
    });

    describe('retrieveBuildPropertyForBuild', () => {
        it('should retrieve valid build property ', () => {
            var releaseTargetedDeviceFamily = project.getBuildProperty('TARGETED_DEVICE_FAMILY', 'Release');
            var debugTargetedDeviceFamily = project.getBuildProperty('TARGETED_DEVICE_FAMILY', 'Debug');
            var nonExistingProperty = project.getBuildProperty('FOO', 'Debug');
            var nonExistingBuild = project.getBuildProperty('TARGETED_DEVICE_FAMILY', 'Foo');

            assert.equal(releaseTargetedDeviceFamily, '"1,2"');
            assert.equal(debugTargetedDeviceFamily,'"1"');
            assert.equal(nonExistingProperty, undefined);
            assert.equal(nonExistingBuild, undefined);

        });
    });

    describe('retrieveBuildConfigByName', () => {
        it('should retrieve valid build config', () => {
            var releaseBuildConfig = project.getBuildConfigByName('Release');
            for (var property in releaseBuildConfig) {
                var value = releaseBuildConfig[property];
                assert.ok(value.name === 'Release');
            }

            var debugBuildConfig = project.getBuildConfigByName('Debug');
            for (var property in debugBuildConfig) {
                var value = debugBuildConfig[property];
                assert.ok(value.name === 'Debug');
            }

            var nonExistingBuildConfig = project.getBuildConfigByName('Foo');
            assert.deepEqual(nonExistingBuildConfig, {});

        });
    });

    /* This proves the issue in 0.6.7
    describe('validatePropReplaceException', () => {
        it('should throw TypeError for updateBuildProperty VALID_ARCHS when none existed', () => {
            assert.throws(
                function() {
                    project.updateBuildProperty('VALID_ARCHS', '"armv7 armv7s');
                },
                TypeError,
                "Object object has no method 'hasOwnProperty'"
            );
        });
    }
    */

    describe('validatePropReplaceFix', () => {
        it('should create build configuration for VALID_ARCHS when none existed', () => {
            project.updateBuildProperty('VALID_ARCHS', '"armv7 armv7s"', 'Debug');
        });
    });

    describe('validateHasFile', () => {
        it('should return true for has file MainViewController.m', () => {
            var result = project.hasFile('MainViewController.m');
            assert.ok(result.path == "MainViewController.m");
        });
    });

    describe('testWritingPBXProject', () => {
        it('should successfully write to PBXProject TargetAttributes', () => {
            var pbxProjectObj = project.getPBXObject('PBXProject');
            var pbxProject;
            for (var property in pbxProjectObj) {
                if (!/comment/.test(property)) {
                    pbxProject = pbxProjectObj[property];
                }
            }

            var target;
            for (var i = 0, j = pbxProject.targets.length; i < j; i++ ) {
                target = pbxProject.targets[i].value;
            }

            pbxProject.attributes.TargetAttributes = {};
            pbxProject.attributes.TargetAttributes[target] = {
                DevelopmentTeam: 'N6X4RJZZ5D',
                SystemCapabilities: {
                    "com.apple.BackgroundModes": {
                        enabled : 0
                    },
                    "com.apple.DataProtection" : {
                        enabled : 0
                    },
                    "com.apple.Keychain" : {
                        enabled: 1
                    }
                }
            };

            project.writeSync();
        });

        it('should add target attribute to PBXProject TargetAttributes', () => {
            project.addTargetAttribute('ProvisioningStyle', 'Manual');
            var output = project.writeSync();
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

        });

        it('should change target attribute at PBXProject TargetAttributes', () => {
            project.addTargetAttribute('ProvisioningStyle', 'Manual');
            var output = project.writeSync();
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

            project.addTargetAttribute('ProvisioningStyle', 'Automatic');
            output = project.writeSync();
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g), null);
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Automatic/g).length, 1);

        });

        it('should remove target attribute from PBXProject TargetAttributes', () => {
            project.addTargetAttribute('ProvisioningStyle', 'Manual');
            var output = project.writeSync();
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

            project.removeTargetAttribute('ProvisioningStyle');
            output = project.writeSync();
            assert.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g), null);

        });
    });
});
