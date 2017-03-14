/* global Lua,allocate,run,Runtime,_luaL_newstate,_luaL_openlibs,_luaL_loadbufferx,
_free,_lua_close,_lua_pcallk,_lua_setmetatable,_lua_setglobal,_lua_type,_lua_typename,
Pointer_stringify,_lua_topointer,_lua_toboolean,_lua_tonumberx,_lua_rawlen,
_lua_tolstring,_lua_pushstring,_lua_rawget,_luaL_getmetafield,_lua_pushnil,
_lua_next,_lua_iscfunction,_lua_pushvalue,_lua_gettop,_lua_getglobal,
_lua_settop,_lua_pushboolean,_lua_pushnumber,_lua_pushcclosure,
_lua_createtable,_lua_rawset,
intArrayFromString,intArrayToString,HEAPU8,FUNCTION_TABLE */

// This file is appended to the end of build/liblua.js

// WEBLUA API =================================================================
//
// Written by Philip Horger
// Based on https://github.com/replit/jsrepl/blob/master/extern/lua/entry_point.js
//
// ============================================================================

var Lua = {
    isRun: false,
    isInitialized: false,
    state: null,
    tmp_id: 0,
    errorHandlerCallback: null,
    default_source_name: 'stdin',
    preallocated_strings: {
        '__handle': null,
        '__index': null
    },
    js_string_to_lua: function jsStringToLua(str) {
        return intArrayFromString(str);
    },
    lua_string_to_js: function luaStringToJs(int8array) {
        return decodeURIComponent(escape(intArrayToString(int8array)));
    },
    set_js_string_to_lua: function setJsStringToLua(f) {
        this.js_string_to_lua = f;
    },
    set_lua_string_to_js: function setLuaStringToJs(f) {
        this.lua_string_to_js = f;
    },
    initialize: function initialize(sourceName, stdout, stderr) {
        if (this.isInitialized) throw new Error('Lua already initialized');
        this.default_source_name = sourceName || this.default_source_name;
        this.stdout = stdout || this.stdout;
        this.stderr = stderr || this.stderr;

        if (!this.isRun) {
            run();
            this.isRun = true;
        }
        this.state = _luaL_newstate();
        _luaL_openlibs(this.state);
        for (var key in this.preallocated_strings) {
            if (this.preallocated_strings.hasOwnProperty(key)) {
                this.preallocated_strings[key] = this.allocate_string(key);
            }
        }
        this.isInitialized = true;
    },
    destroy: function destroy() {
        if (!this.isInitialized) throw new Error('Lua is not initialized');
        _lua_close(this.state);

        for (var i = 0; i < Runtime.functionPointers.length; i++) {
            Runtime.functionPointers[i] = null;
        }

        this.isInitialized = false;
    },
    require_initialization: function requireInitialization() {
        if (!this.isInitialized) throw new Error('Lua not yet initialized');
    },
    parse: function parse(command, sourceName) {
        // Put new function, from buffer, at the top of the stack
        this.require_initialization();
        var commandArray = this.js_string_to_lua(command);
        var commandPtr = allocate(commandArray, 'i8', 0); // ALLOC_NORMAL
        var namePtr    = this.allocate_string(sourceName);
        var parseFailed = _luaL_loadbufferx(
            this.state, commandPtr, commandArray.length - 1, namePtr
        );
        if (parseFailed) {
            this.report_error('Parsing failure');
        }
        _free(commandPtr);
        _free(namePtr);
        return !parseFailed;
    },
    eval: function luaEval(command, sourceName, source) {
        return this.exec('return ' + command,
                         sourceName || this.default_source_name,
                         source || command);
    },
    exec: function luaExec(command, sourceName) {
        this.require_initialization();
        var src = sourceName || this.default_source_name;

        if (this.parse(command, src)) {
            // Parse success, now try calling func at top of stack
            var callFailed = _lua_pcallk(this.state, 0, -1, 0);
            if (callFailed) {
                this.report_error('Evaluation failure');
            } else {
                return this.get_stack_args();
            }
        } else {
            this.report_error('Parsing failure');
        }
        return null;
    },
    inject: function luaInject(object, injName, finalLocation, metatable) {
        var name = injName || this.get_tmp_name();
        this.pushStack(object);
        if (metatable) {
            this.pushStack(metatable);
            _lua_setmetatable(this.state, -2);
        }
        var strptr = this.allocate_string(name);
        _lua_setglobal(this.state, strptr);
        _free(strptr);
        if (finalLocation) {
            this.exec(finalLocation + ' = ' + name + '\n' + name + ' = nil');
        }
        return (finalLocation || name);
    },
    cache: function luaCache(evalstring) {
        if (!(evalstring in this.cache.items)) {
            this.cache.items[evalstring] = this.eval(evalstring);
        }
        return this.cache.items[evalstring];
    },
    call: function luaCall(evalstring, args) {
        var func = this.cache(evalstring)[0];
        return func.apply(null, args);
    },
    allocate_string: function allocateString(str) {
        var arr = this.js_string_to_lua(str);
        return allocate(arr, 'i8', 0);  // ALLOC_NORMAL
    },
    inspect: function luaInspect(index) {
        var type = _lua_type(this.state, index);
        var ptr = _lua_typename(this.state, type);
        var typename = Pointer_stringify(ptr);
        var address = _lua_topointer(this.state, index);
        return {
            'type': type,
            'typename': typename,
            'address': address,
            'addrstr': address.toString(16)
        };
    },
    peekStack: function peekStack(index, source) {
        this.require_initialization();
        var ret;
        var ptr;
        var type = _lua_type(this.state, index);
        switch (type) {
        case -1: // LUA_TNONE
        case 0:  // LUA_TNIL
            ret = null;
            break;
        case 1:  // LUA_TBOOLEAN
            var result = _lua_toboolean(this.state, index);
            ret = result ? true : false;
            break;
        case 3:  // LUA_TNUMBER
            ret = _lua_tonumberx(this.state, index);
            break;
        case 4:  // LUA_TSTRING
            ptr = _lua_tolstring(this.state, index, 0);
            var len = _lua_rawlen(this.state, index);
            ret = this.lua_string_to_js(HEAPU8.subarray(ptr, ptr + len));
            break;
        case 5:  // LUA_TTABLE
            var isArray = true;
            var maxKey = 0;

            // Check for handle
            _lua_pushstring(this.state, this.preallocated_strings.__handle);
            _lua_rawget(this.state, index - 1);
            var handle = this.popStack();
            if (handle) {
                // Return original value
                ptr = this.preallocated_strings.__index;
                _luaL_getmetafield(this.state, index, ptr);
                var __indexfunc = this.popStack();
                return __indexfunc.source;
            }

            ret = {};
            // Populate with values
            _lua_pushnil(this.state);
            _lua_pushnil(this.state);
            while (_lua_next(this.state, index - 2)) {
                var value = this.popStack();
                var key = this.peekStack(-1);
                ret[key] = value;

                if (isArray && typeof key === 'number') {
                    if (key > maxKey) {
                        maxKey = key;
                    }
                } else {
                    isArray = false;
                }
            }
            this.popStack(); // Clear out leftover key
            if (isArray) {
                var newret = [];
                for (var i = 1; i <= maxKey; i++) {
                    if (typeof ret[i] === 'undefined') {
                        // Abort
                        isArray = false;
                        break;
                    }
                    newret.push(ret[i]);
                }
                if (isArray) {
                    // not aborted
                    ret = newret;
                }
            }
            break;
        case 6:  // LUA_TFUNCTION
            var self = this;
            var address = _lua_topointer(this.state, index);

            if (_lua_iscfunction(this.state, index)) {
                var func = FUNCTION_TABLE[address];
                if (func.unwrapped) {
                    return func.unwrapped;
                }
            }

            // Don't allocate this stuff for wrapped funcs
            var name = this.get_tmp_name();
            var aname = this.allocate_string(name);

            _lua_pushvalue(this.state, index); // For non-destructive pop
            _lua_setglobal(this.state, aname);
            _free(aname);
            ret = function retfn() {
                var origTop = _lua_gettop(self.state);

                // Push function to stack
                var afname = self.allocate_string(name);
                _lua_getglobal(self.state, afname);
                _free(afname);

                // Convert arguments to Lua
                for (var j = 0; j < arguments.length; j++) {
                    self.pushStack(arguments[j]);
                }

                // Call
                var failure = _lua_pcallk(self.state, arguments.length, -1, 0); // LUA_MULTRET
                if (failure) {
                    self.report_error('Failure calling Lua function');
                }
                var numArgs = _lua_gettop(self.state) - origTop;
                return self.get_stack_args(numArgs);
            };
            var src = source || '';
            ret.toString = function toString() {
                return 'Lua function ' + src + ': ' + name + ' at ' + address;
            };
            ret.source = src;
            ret.name = name;
            ret.address = address;
            break;
        default: // Other Lua type
            var inspection = this.inspect(index);
            ret = inspection.typename + ' (typecode ' + type + '): 0x' + inspection.addrstr;
        }
        return ret;
    },
    popStack: function popStack(source) {
        var ret = this.peekStack(-1, source);
        _lua_settop(this.state, -2);
        return ret;
    },
    pushStack: function pushStack(obj) {
        var object = obj;
        if (object === null) {
            object = undefined;
        }
        switch (typeof object) {
        case 'undefined':
            _lua_pushnil(this.state);
            return 1;
        case 'boolean':
            _lua_pushboolean(this.state, object);
            return 1;
        case 'number':
            _lua_pushnumber(this.state, object);
            return 1;
        case 'string':
            var strptr = this.allocate_string(object);
            _lua_pushstring(this.state, strptr);
            _free(strptr);
            return 1;
        case 'function':
            var self = this;
            var wrapper = function wrapperFn() {
                var result = object.apply(self, self.get_stack_args());
                if (typeof result === 'undefined' || result === null) {
                    result = [];
                }
                if (!( typeof result === 'object' && typeof result.length === 'number')) {
                    throw new Error('Expected array return type from JS function');
                }
                for (var i = 0; i < result.length; i++) {
                    self.pushStack(result[i]);
                }
                return result.length;
            };
            wrapper.unwrapped = object;
            var pointer = Runtime.addFunction(wrapper);
            _lua_pushcclosure(this.state, pointer, 0);
            return 1;
        case 'object':
            if (typeof object.length === 'undefined') {
                // Object
                _lua_createtable(this.state, 0, 0);
                if (object.__handle) {
                    // Handled object
                    var source = object;
                    var metatable = {
                        '__index': function __index(table, key) {
                            return [source[key]];
                        },
                        '__newindex': function __newindex(table, key, value) {
                            source[key] = value;
                            return [];
                        }
                    };
                    metatable.__index.source = source;

                    this.pushStack(metatable);
                    _lua_setmetatable(this.state, -2);

                    object = {'__handle': object.toString()};
                }
                for (var k in object) {
                    if (object.hasOwnProperty(k)) {
                        this.pushStack(k);
                        this.pushStack(object[k]);
                        _lua_rawset(this.state, -3);
                    }
                }
            } else {
                // Array
                _lua_createtable(this.state, object.length, 0);
                for (var kx in object) {
                    if (object.hasOwnProperty(kx)) {
                        kx = 1 * kx;
                        this.pushStack(kx + 1);
                        this.pushStack(object[kx]);
                        _lua_rawset(this.state, -3);
                    }
                }
            }
            return 1;
        default:
            throw new Error('Cannot push object to stack: ' + object);
        }
    },
    get_stack_args: function getStackArgs(numArgs) {
        var num = (typeof numArgs === 'undefined') ? _lua_gettop(this.state) : numArgs;
        var args = [];
        for (var i = 0; i < num; i++) {
            args.push(this.popStack());
        }
        return args.reverse();
    },
    anon_lua_object: function anonLuaObject(object) {
        // Create anonymous Lua object or literal from JS object
        if (typeof object === 'undefined' || object === null) {
            return 'nil';
        }
        switch (typeof object) {
        case 'string':
            return '"' + object.replace('"', '\\"') + '"';
        case 'function':
        case 'object':
            return this.inject(object);
        default:
            return object.toString();
        }
    },
    get_tmp_name: function getTmpName() {
        return '_weblua_tmp_' + this.tmp_id++;
    },
    cleanup_tmp: function cleanupTmp(name) {
        if (name === '_weblua_tmp_' + (this.tmp_id - 1)) {
            // Latest tmp_id, can safely decrement
            this.tmp_id--;
        }
        // Set global to nil
        _lua_pushnil(this.state);
        var strptr = this.allocate_string(name);
        _lua_setglobal(this.state, strptr);
        _free(strptr);
    },
    stdout: function luaStdout(str) {
        console.log('stdout: ' + str);
    },
    stderr: function luaStderr(str) {
        console.log('stderr: ' + str);
        if (this.errorHandlerCallback) {
            this.errorHandlerCallback(str);
        }
    },
    report_error: function reportError(defaultMessage) {
        if (this.isInitialized) {
            var errorMessage = this.popStack();
            if (!(errorMessage && errorMessage.length)) errorMessage = defaultMessage;
            this.stderr(errorMessage);
        } else {
            this.stderr(defaultMessage);
        }
        _lua_settop(this.state, 0);
    },
    set_error_callback: function setErrorCallback(cb) {
        this.errorHandlerCallback = cb;
    }
};

window['Lua'] = Lua; // eslint-disable-line dot-notation

// Public functions
window['Lua']['initialize'] = Lua.initialize; // eslint-disable-line dot-notation
window['Lua']['destroy'] = Lua.destroy; // eslint-disable-line dot-notation
window['Lua']['stdout'] = Lua.stdout; // eslint-disable-line dot-notation
window['Lua']['stderr'] = Lua.stderr; // eslint-disable-line dot-notation
window['Lua']['eval'] = Lua.eval; // eslint-disable-line dot-notation
window['Lua']['exec'] = Lua.exec; // eslint-disable-line dot-notation
window['Lua']['anon_lua_object'] = Lua.anon_lua_object; // eslint-disable-line dot-notation
window['Lua']['inject'] = Lua.inject; // eslint-disable-line dot-notation
window['Lua']['cache'] = Lua.cache; // eslint-disable-line dot-notation
window['Lua']['set_js_string_to_lua'] = Lua.set_js_string_to_lua; // eslint-disable-line dot-notation
window['Lua']['set_lua_string_to_js'] = Lua.set_lua_string_to_js; // eslint-disable-line dot-notation
window['Lua']['set_error_callback'] = Lua.set_error_callback; // eslint-disable-line dot-notation

window['Lua']['cache']['items'] = {}; // eslint-disable-line dot-notation
window['Lua']['cache']['clear'] = function luaClearCache(evalstring) { // eslint-disable-line dot-notation
    delete Lua.cache['items'][evalstring]; // eslint-disable-line dot-notation
};
