import { _IConfig, _IThis } from "./types";

import fs from 'fs'
import path from 'path'
import pkg from '../package.json'

const __config_: _IConfig = Object.create(null)
const __this_ = Object.create(null) as _IThis


export function load() {
    //@ts-ignore
    Editor.Message.addBroadcastListener('scene:ready', _load);
    _load();
}
export function unload() {}

export const methods: { [key: string]: (...any: any) => any } = {
    onChangedGameId: function() {

    },
    onChangedPlatform: function() {

    },
    onChangedLocation: async function<_TKey extends (keyof _IConfig)>(key: _TKey, value: _IConfig[_TKey]) {
        const _dir = _getConfigDir();
        if(!_dir) {
            __config_[key] = value;
            _shippingProjectSettingPlugin();
            return;
        }

        const [ list, data ] = await Promise.all([
            Editor.Profile.getProject('project', "script.sortingPlugin"),
            Editor.Message.request('asset-db', 'query-asset-info', `${_dir.db}/${__config_.plugin_name_mg}.js`)
        ]);

        const _new_list = (list as string[]).filter(_ => data?.uuid != _);

        Promise.all([
            Editor.Message.request('asset-db', 'delete-asset', `${_dir.db}/${__config_.plugin_name_mg}.js`),
            Editor.Message.request('asset-db', 'delete-asset', `${_dir.db}/${__config_.plugin_name_mg}.d.ts`),
        ])
        .then(_ => console.log("DELTE SUCCESS", _))
        .catch(_ => console.log("CAN NOT DELETE: ", _))
        .finally(async () => {
            __config_[key] = value;
            await _shippingProjectSettingPlugin();

            const _new = _getConfigDir();
            if(!_new) return

                const _url = `${_new.db}/${__config_.plugin_name_mg}.js`
            const _new_info = await Editor.Message.request('asset-db', 'query-asset-info', _url)
            _new_info?.uuid && _new_list.push(_new_info.uuid)

            await Editor.Profile.setProject('project', "script.sortingPlugin", _new_list);
        })


    },
    onChangedSetting: function<_TKey extends (keyof _IConfig)>(key: _TKey, value: _IConfig[_TKey]) {
        __config_[key] = value;
        _shippingProjectSettingPlugin();
        //_this.save(key, value);
    },
    onSaved: function() {

        Editor.Profile.getProject(pkg.name).then(async _ => {
            _shippingProjectSettingPlugin()
        })
    },
};

function _getConfigDir() {
    const plugin_location = __config_.plugin_location_mg || '';
    if (!plugin_location) {
        console.warn("Plugin location is not specified.");
        return null
    }

    let db = '';
    if (plugin_location.startsWith('project://assets')) {
        db = 'db://' + plugin_location.substring('project://'.length);
    } else if (plugin_location.startsWith('db://assets')) {
        db = plugin_location;
    } else if (plugin_location.startsWith('project://')) {
        const rel = plugin_location.substring('project://'.length);
        if (rel.startsWith('assets')) {
            db = 'db://' + rel;
        } else {
            db = 'db://assets/' + rel;
        }
    } else if (path.isAbsolute(plugin_location)) {
        const normalizedAbsDir = plugin_location.replace(/\\/g, '/');
        const normalizedAssetsDir = path.join(Editor.Project.path, 'assets').replace(/\\/g, '/');
        if (normalizedAbsDir.startsWith(normalizedAssetsDir)) {
            const rel = normalizedAbsDir.substring(normalizedAssetsDir.length);
            db = 'db://assets' + (rel.startsWith('/') ? rel : '/' + rel);
        } else {
            db = 'db://assets';
        }
    } else {
        // It's relative to assets/ directory! E.g. "scripts/__plugins__"
        db = 'db://assets/' + plugin_location;
    }

    if (db.endsWith('/')) {
        db = db.substring(0, db.length - 1);
    }

    // Ensure the folder exists physically on disk
    return {
        physic: db.replace('db://assets', path.join(Editor.Project.path, 'assets')),
        db
    }
}

async function _shippingProjectSettingPlugin() {
    if (!__config_) return;

    const _dir = _getConfigDir();
    if(!_dir) {
        console.warn("Plugin location is not specified.");
        return;

    }
    try {
        if (!fs.existsSync(_dir.physic)) {
            fs.mkdirSync(_dir.physic, { recursive: true });
            await Editor.Message.request('asset-db', 'refresh-asset', _dir.db);
        }
    } catch (e) {
        console.error("Failed to create directory physically:", _dir, e);
        return;
    }

    const head = __config_.head_version !== undefined ? __config_.head_version : 1;
    const sub = __config_.sub_version !== undefined ? __config_.sub_version : 0;
    const tail = __config_.tail_version !== undefined ? __config_.tail_version : 1;
    const versionStr = `${head}.${sub}.${tail}`;
    const prefixKey = __config_.prefix_key !== undefined ? __config_.prefix_key : '';

    const parts = (__config_.global_variable_key_mg || '').split('.');

    // JS generation
    let jsCode = `const _ = Object.create(null);\n`;
    jsCode += `_.version = "${versionStr}";\n`;
    jsCode += `_.prefix_key = "${prefixKey}";\n`;

    if (parts.length > 0 && parts[0]) {
        let current = 'globalThis';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                jsCode += `${current}['${part}'] = _;\n`;
            } else {
                const next = `${current}['${part}']`;
                const init = i === 0 ? '{}' : 'Object.create(null)';
                jsCode += `${next} = ${next} || ${init};\n`;
                current = next;
            }
        }
    }

    jsCode += `
const _$pts = globalThis.pTS;
if (!!_$pts) {
    const _$bridge = _$pts.bridge;
    (!!_$bridge && typeof _$bridge.set == 'function') ? _$bridge.set('config', _) : console.warn('${pkg.name} ~ [pTS.bridge] is not defined');
}
`

    // DTS generation
    let dtsCode = `
interface _IData {
   version: string;
   prefix_key: string;
}

`
    if (parts.length > 0 && parts[0]) {
        for (let i = 0; i < parts.length - 1; i++) {
            const indent = '\t'.repeat(i);
            const keyword = i === 0 ? 'declare namespace' : 'export namespace';
            dtsCode += `${indent}${keyword} ${parts[i]} {\n`;
        }

        const innerIndent = '\t'.repeat(parts.length - 1);

        const exportKeyword = parts.length === 1 ? 'declare const' : 'export const';
        dtsCode += `${innerIndent}${exportKeyword} ${parts[parts.length - 1]}: _IData;\n`;

        for (let i = parts.length - 2; i >= 0; i--) {
            const indent = '\t'.repeat(i);
            dtsCode += `${indent}}\n`;
        }

        dtsCode += `
declare namespace pTS {
    export namespace bridge {
        export type _TData_Definded_By_Extensions = {
            config: _IData
        }
    }
}
`
    }

    const __actSaveFile_ = async (_strUrl: string, _strContent: string) => {
        const __objInfo = await Editor.Message.request('asset-db', 'query-asset-info', _strUrl);
        if (__objInfo) {
            console.log(`[pTS Config] Saved existing asset: ${_strUrl}`);
            return Editor.Message.request('asset-db', 'save-asset', _strUrl, _strContent);
        } else {
            console.log(`[pTS Config] Created new asset: ${_strUrl}`);
            return Editor.Message.request('asset-db', 'create-asset', _strUrl, _strContent).catch(_ => console.log("Oh >>", _))
        }
    };
    const pluginName = __config_.plugin_name_mg;

    try {
        const jsUrl = `${_dir.db}/${pluginName}.js`;
        const dtsUrl = `${_dir.db}/${pluginName}.d.ts`;

        // Save JS file
        await __actSaveFile_(jsUrl, jsCode);

        // Force refresh to make sure Cocos Creator registers the asset and generates its .meta file
        await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);

        // Update meta for JS to make it a plugin
        const __objMeta = await Editor.Message.request('asset-db', 'query-asset-meta', jsUrl);
        console.log("[pTS Config] >> _OBJ MEta >>", __objMeta);

        if (__objMeta) {
            __objMeta.userData = __objMeta.userData || {};
            const __objPluginSettings = {
                isPlugin: true,
                loadPluginInWeb: true,
                loadPluginInNative: true,
                loadPluginInEditor: true,
                loadPluginInPreview: true,
                loadPluginInMiniGame: true
            };

            let __bNeedUpdate = false;
            for (const __strKey in __objPluginSettings) {
                if (__objMeta.userData[__strKey] !== (__objPluginSettings as any)[__strKey]) {
                    __objMeta.userData[__strKey] = (__objPluginSettings as any)[__strKey];
                    __bNeedUpdate = true;
                }
            }

            if (__bNeedUpdate) {
                await Editor.Message.request('asset-db', 'save-asset-meta', __objMeta.uuid, JSON.stringify(__objMeta));
                await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);
            }
        }

        // Save DTS file
        await __actSaveFile_(dtsUrl, dtsCode);
        await Editor.Message.request('asset-db', 'refresh-asset', dtsUrl);

    } catch (e) {
        console.warn("Failed to write plugin files via AssetDB", e);
    } finally {
        console.log("[_shippingProjectSettingPlugin] DONE >>>>")
    }
}

async function _load() {
    if(__this_.is_loaded) return;
    __this_.is_loaded = true;

    Editor.Profile.getProject(pkg.name).then(async _ => {
        Object.assign(__config_, _)
        await _shippingProjectSettingPlugin();
    })

}

