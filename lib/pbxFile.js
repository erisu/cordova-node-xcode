/*
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

const path = require('node:path');
const util = require('node:util');

/**
 * PBXFile's constructor options argument
 * @typedef {object} PBXFileOptions
 * @property {string} lastKnownFileType
 * @property {boolean} customFramework
 * @property {string} defaultEncoding
 * @property {string} explicitFileType
 * @property {object} sourceTree
 * @property {boolean} weak - When true, the "Weak" configuration attribute
 *  is set.
 * @property {string} compilerFlags - The build configuration COMPILER_FLAGS.
 * @property {boolean} embed - When true, the framework will be embedded
 *  in the app bundle.
 * @property {boolean} sign - When true, the "CodeSignOnCopy" configuration
 *  attribute is set, which automatically code signs embedded frameworks
 *  as they are copied in the app bundle. Requires {PBXFileOptions.embed} to
 *  also be set to true.
 */

/**
 * PBXFileReference
 * @typedef {object} PBXFileReference
 * @property {string} basename
 * @property {string} lastKnownFileType
 * @property {string} explicitFileType
 * @property {boolean} customFramework
 */

/**
 * Class representing a PBXFile
 */
class PBXFile {
    /**
     * Default source tree is "\"<group>\""
     * @type {string}
     */
    static #DEFAULT_SOURCETREE = '"<group>"';

    /**
     * Default product source tree is "BUILT_PRODUCTS_DIR"
     * @type {string}
     */
    static #DEFAULT_PRODUCT_SOURCETREE = 'BUILT_PRODUCTS_DIR';

    /**
     * Default group is "Resources"
     * @type {string}
     */
    static #DEFAULT_GROUP = 'Resources';

    /**
     * Default file type is unknown.
     * @type {string}
     */
    static #DEFAULT_FILETYPE = 'unknown';

    /**
     * Maps file extensions to file type.
     * @type {object<string, string>}
     */
    static #FILETYPE_BY_EXTENSION = Object.freeze({
        a: 'archive.ar',
        app: 'wrapper.application',
        appex: 'wrapper.app-extension',
        bundle: 'wrapper.plug-in',
        dylib: 'compiled.mach-o.dylib',
        framework: 'wrapper.framework',
        h: 'sourcecode.c.h',
        m: 'sourcecode.c.objc',
        markdown: 'text',
        mdimporter: 'wrapper.cfbundle',
        octest: 'wrapper.cfbundle',
        pch: 'sourcecode.c.h',
        plist: 'text.plist.xml',
        sh: 'text.script.sh',
        swift: 'sourcecode.swift',
        tbd: 'sourcecode.text-based-dylib-definition',
        xcassets: 'folder.assetcatalog',
        xcconfig: 'text.xcconfig',
        xcdatamodel: 'wrapper.xcdatamodel',
        xcodeproj: 'wrapper.pb-project',
        xctest: 'wrapper.cfbundle',
        xib: 'file.xib',
        strings: 'text.plist.strings'
    });

    /**
     * Maps file types to group.
     * @type {object<string, string>}
     */
    static #GROUP_BY_FILETYPE = Object.freeze({
        'archive.ar': 'Frameworks',
        'compiled.mach-o.dylib': 'Frameworks',
        'sourcecode.text-based-dylib-definition': 'Frameworks',
        'wrapper.framework': 'Frameworks',
        'embedded.framework': 'Embed Frameworks',
        'sourcecode.c.h': 'Resources',
        'sourcecode.c.objc': 'Sources',
        'sourcecode.swift': 'Sources'
    });

    /**
     * Maps file types to path.
     * @type {object<string, string>}
     */
    static #PATH_BY_FILETYPE = Object.freeze({
        'compiled.mach-o.dylib': 'usr/lib/',
        'sourcecode.text-based-dylib-definition': 'usr/lib/',
        'wrapper.framework': 'System/Library/Frameworks/'
    });

    /**
     * Maps file types to source tree.
     * @type {object<string, string>}
     */
    static #SOURCETREE_BY_FILETYPE = Object.freeze({
        'compiled.mach-o.dylib': 'SDKROOT',
        'sourcecode.text-based-dylib-definition': 'SDKROOT',
        'wrapper.framework': 'SDKROOT'
    });

    /**
     * Maps file types to encoding.
     * @type {object<string, number>}
     */
    static #ENCODING_BY_FILETYPE = Object.freeze({
        'sourcecode.c.h': 4,
        'sourcecode.c.objc': 4,
        'sourcecode.swift': 4,
        text: 4,
        'text.plist.xml': 4,
        'text.script.sh': 4,
        'text.xcconfig': 4,
        'text.plist.strings': 4
    });

    /**
     * Create a PBXFile
     * @param {string} filepath - Path to the file
     * @param {PBXFileOptions} opt
     */
    constructor (filepath, opt = {}) {
        opt = opt || {};

        this.basename = path.basename(filepath);
        this.lastKnownFileType = opt.lastKnownFileType || this.#detectType(filepath);
        this.group = this.#detectGroup(this, opt);

        // for custom frameworks
        if (opt.customFramework === true) {
            this.customFramework = true;
            this.dirname = path.dirname(filepath).replace(/\\/g, '/');
        }

        this.path = this.#defaultPath(this, filepath).replace(/\\/g, '/');
        this.fileEncoding = this.defaultEncoding = opt.defaultEncoding || this.#defaultEncoding(this);

        // When referencing products / build output files
        if (opt.explicitFileType) {
            this.explicitFileType = opt.explicitFileType;
            this.basename = this.basename + '.' + this.#defaultExtension(this);
            delete this.path;
            delete this.lastKnownFileType;
            delete this.group;
            delete this.defaultEncoding;
        }

        this.sourceTree = opt.sourceTree || this.#detectSourcetree(this);
        this.includeInIndex = 0;

        if (opt.weak && opt.weak === true) { this.settings = { ATTRIBUTES: ['Weak'] }; }

        if (opt.compilerFlags) {
            if (!this.settings) { this.settings = {}; }
            this.settings.COMPILER_FLAGS = util.format('"%s"', opt.compilerFlags);
        }

        if (opt.embed && opt.sign) {
            if (!this.settings) { this.settings = {}; }
            if (!this.settings.ATTRIBUTES) { this.settings.ATTRIBUTES = []; }
            this.settings.ATTRIBUTES.push('CodeSignOnCopy');
        }
    }

    /**
     * Returns an unquoted string
     * @param {string} [text] - String text to be unquoted
     * @returns {string} unquoted string
     */
    #unquoted (text) {
        return typeof text === 'string' ? text.replace(/(^")|("$)/g, '') : '';
    }

    /**
     * Detects the file type identifier from the file's extension extracted
     * from the provided file path.
     * @param {string} filePath - path to the file
     * @returns {string} file type identifier
     */
    #detectType (filePath) {
        const extension = path.extname(filePath).substring(1);
        const filetype = PBXFile.#FILETYPE_BY_EXTENSION[this.#unquoted(extension)];

        if (!filetype) {
            return PBXFile.#DEFAULT_FILETYPE;
        }

        return filetype;
    }

    /**
     * @param {PBXFileReference} fileRef
     * @returns {string}
     */
    #defaultExtension (fileRef) {
        const filetype = fileRef.lastKnownFileType && fileRef.lastKnownFileType !== PBXFile.#DEFAULT_FILETYPE
            ? fileRef.lastKnownFileType
            : fileRef.explicitFileType;

        for (const extension in PBXFile.#FILETYPE_BY_EXTENSION) {
            if (Object.prototype.hasOwnProperty.call(PBXFile.#FILETYPE_BY_EXTENSION, this.#unquoted(extension))) {
                if (PBXFile.#FILETYPE_BY_EXTENSION[this.#unquoted(extension)] === this.#unquoted(filetype)) {
                    return extension;
                }
            }
        }
    }

    /**
     * @param {PBXFileReference} fileRef
     * @returns {number}
     */
    #defaultEncoding (fileRef) {
        const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
        const encoding = PBXFile.#ENCODING_BY_FILETYPE[this.#unquoted(filetype)];

        if (encoding) {
            return encoding;
        }
    }

    /**
     * Detects the group that the file belongs to.
     *  - When the extension is xcdatamodeld, the group is "Sources"
     *  - When it is an embedded custom framework, the group is "Embed Frameworks"
     *  - When there is no group associated by the file type, group defalts to "Resources"
     *  - Lastly, it will return the group associated by the file type.
     * @param {PBXFileReference} fileRef
     * @param {PBXFileOptions} opt
     * @returns {string}
     */
    #detectGroup (fileRef, opt) {
        const extension = path.extname(fileRef.basename).substring(1);
        const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
        const groupName = PBXFile.#GROUP_BY_FILETYPE[this.#unquoted(filetype)];

        if (extension === 'xcdatamodeld') {
            return 'Sources';
        }

        if (opt.customFramework && opt.embed) {
            return PBXFile.#GROUP_BY_FILETYPE['embedded.framework'];
        }

        if (!groupName) {
            return PBXFile.#DEFAULT_GROUP;
        }

        return groupName;
    }

    /**
     * Detects source tree based on the last known or explicit file type.
     * @param {PBXFileReference} fileRef
     * @returns {string}
     */
    #detectSourcetree (fileRef) {
        const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
        const sourcetree = PBXFile.#SOURCETREE_BY_FILETYPE[this.#unquoted(filetype)];

        if (fileRef.explicitFileType) {
            return PBXFile.#DEFAULT_PRODUCT_SOURCETREE;
        }

        if (fileRef.customFramework) {
            return PBXFile.#DEFAULT_SOURCETREE;
        }

        if (!sourcetree) {
            return PBXFile.#DEFAULT_SOURCETREE;
        }

        return sourcetree;
    }

    /**
     * @param {PBXFileReference} fileRef
     * @param {string} filePath
     * @returns {string}
     */
    #defaultPath (fileRef, filePath) {
        const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
        const defaultPath = PBXFile.#PATH_BY_FILETYPE[this.#unquoted(filetype)];

        if (fileRef.customFramework) {
            return filePath;
        }

        if (defaultPath) {
            return path.posix.join(defaultPath, path.basename(filePath));
        }

        return filePath;
    }
}

module.exports = PBXFile;
