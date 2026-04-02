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


var PRODUCT_NAME = '"KitchenSinktablet"';

describe('addAndRemoveToFromOtherLinkerFlags', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('add should add the flag to each configuration section', () => {
        var flag = 'some/flag';
        proj.addToOtherLinkerFlags(flag);
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            var lib = config[ref].buildSettings.OTHER_LDFLAGS;
            assert.ok(lib[1].indexOf(flag) > -1);
        }
    });
    it('remove should remove from the path to each configuration section', () => {
        var flag = 'some/flag';
        proj.addToOtherLinkerFlags(flag);
        proj.removeFromOtherLinkerFlags(flag);
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            var lib = config[ref].buildSettings.OTHER_LDFLAGS;
            assert.ok(lib.length === 1);
            assert.ok(lib[0].indexOf(flag) == -1);
        }
    });
});
