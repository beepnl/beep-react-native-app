"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const config_1 = require("./modules/config");
const file_processing_1 = require("./services/file.processing");
const ANDROID_MAIN_MANIFEST_PATH = `${config_1.ANDROID_MAIN_PATH}/AndroidManifest.xml`;
const IOS_PODFILE_PATH = `./ios/Podfile`;
//Resort to read file content to fetch package value rather than adding package to parse xml/podfile
const ANDROID_PACKAGE_EXP = new RegExp(/package=\"(.+)\"/);
const IOS_PACKAGE_EXP = new RegExp(/target\s*["'](.+)['"]\s*do/);
function fetchFileLocation(filePath) {
    return path_1.join(process.cwd(), filePath);
}
function getPackageFileName(platform) {
    let packageName;
    switch (platform) {
        case 'android':
            const appBuildFile = file_processing_1.readFile(fetchFileLocation(ANDROID_MAIN_MANIFEST_PATH)).toString();
            packageName = appBuildFile.match(ANDROID_PACKAGE_EXP)[1];
            packageName && packageName.toString();
            break;
        case 'ios':
            const podfile = file_processing_1.readFile(fetchFileLocation(IOS_PODFILE_PATH)).toString();
            packageName = podfile.match(IOS_PACKAGE_EXP)[1];
            packageName && packageName.toString();
            break;
    }
    return packageName;
}
/**
 * Fetch Android package name by reading string content of main AndroidManifest.xml
 */
function getAndroidPackageName() {
    return getPackageFileName('android');
}
exports.getAndroidPackageName = getAndroidPackageName;
/**
 * Convert extracted package name to uri by replacing
 * @param packageName Android module package name
 */
function convertAndroidPackageNameToUri(packageName) {
    return packageName.replace(new RegExp(/\./, 'g'), '/');
}
exports.convertAndroidPackageNameToUri = convertAndroidPackageNameToUri;
/**
 * Fetch Ios package name by reading string content of Podfile
 */
function getIosPackageName() {
    return getPackageFileName('ios');
}
exports.getIosPackageName = getIosPackageName;
