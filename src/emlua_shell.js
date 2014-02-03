// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;

function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}








//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 12608;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });









var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([117,115,101,114,100,97,116,97,0,0,0,0,0,0,0,0,96,41,0,0,10,1,0,0,224,32,0,0,238,0,0,0,136,25,0,0,98,0,0,0,144,19,0,0,34,0,0,0,216,17,0,0,84,0,0,0,200,15,0,0,182,0,0,0,152,14,0,0,68,1,0,0,0,0,0,0,0,0,0,0,216,26,0,0,50,0,0,0,32,43,0,0,72,0,0,0,104,34,0,0,206,0,0,0,96,26,0,0,64,1,0,0,112,20,0,0,28,1,0,0,24,16,0,0,242,0,0,0,208,14,0,0,68,0,0,0,224,12,0,0,8,1,0,0,160,11,0,0,222,0,0,0,96,10,0,0,62,0,0,0,232,46,0,0,128,0,0,0,0,0,0,0,0,0,0,0,136,33,0,0,220,0,0,0,16,26,0,0,60,0,0,0,224,19,0,0,104,0,0,0,216,15,0,0,70,0,0,0,168,14,0,0,138,0,0,0,184,12,0,0,118,0,0,0,96,11,0,0,144,0,0,0,72,10,0,0,2,1,0,0,184,46,0,0,212,0,0,0,24,45,0,0,78,0,0,0,32,44,0,0,126,0,0,0,240,42,0,0,58,0,0,0,232,41,0,0,252,0,0,0,0,41,0,0,100,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,7,7,7,7,7,7,10,9,5,4,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,1,0,0,104,19,0,0,80,0,0,0,232,18,0,0,210,0,0,0,72,18,0,0,44,1,0,0,0,0,0,0,0,0,0,0,184,36,0,0,208,35,0,0,32,35,0,0,88,34,0,0,88,33,0,0,96,10,0,0,0,0,0,0,0,0,0,0,6,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,96,35,0,0,38,0,0,0,200,27,0,0,42,0,0,0,176,21,0,0,124,0,0,0,232,16,0,0,158,0,0,0,240,14,0,0,22,0,0,0,136,13,0,0,186,0,0,0,192,11,0,0,60,1,0,0,136,10,0,0,192,0,0,0,0,47,0,0,74,0,0,0,192,45,0,0,96,0,0,0,96,44,0,0,92,0,0,0,48,43,0,0,232,0,0,0,32,42,0,0,184,0,0,0,64,41,0,0,236,0,0,0,112,40,0,0,32,0,0,0,128,39,0,0,248,0,0,0,152,38,0,0,218,0,0,0,240,37,0,0,214,0,0,0,232,36,0,0,116,0,0,0,16,36,0,0,164,0,0,0,48,35,0,0,82,0,0,0,128,34,0,0,148,0,0,0,144,33,0,0,224,0,0,0,192,32,0,0,36,0,0,0,200,31,0,0,20,1,0,0,232,30,0,0,58,1,0,0,32,30,0,0,194,0,0,0,136,29,0,0,174,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,127,64,88,35,0,0,184,34,0,0,176,33,0,0,232,32,0,0,40,32,0,0,32,31,0,0,112,30,0,0,168,29,0,0,16,29,0,0,112,28,0,0,192,27,0,0,224,26,0,0,40,26,0,0,144,25,0,0,224,24,0,0,64,24,0,0,240,23,0,0,120,23,0,0,216,22,0,0,96,22,0,0,168,21,0,0,240,20,0,0,40,20,0,0,152,19,0,0,40,19,0,0,136,18,0,0,24,18,0,0,184,17,0,0,128,17,0,0,40,17,0,0,216,16,0,0,80,16,0,0,240,15,0,0,0,0,0,0,88,17,0,0,80,41,0,0,208,32,0,0,8,0,0,0,120,25,0,0,112,19,0,0,184,15,0,0,136,14,0,0,8,0,0,0,176,12,0,0,48,11,0,0,40,10,0,0,144,46,0,0,0,45,0,0,240,43,0,0,176,42,0,0,224,41,0,0,240,40,0,0,248,39,0,0,24,39,0,0,72,38,0,0,80,37,0,0,120,36,0,0,136,35,0,0,224,34,0,0,8,34,0,0,16,33,0,0,72,32,0,0,120,31,0,0,0,0,0,0,96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,176,19,0,0,64,19,0,0,192,18,0,0,40,18,0,0,208,17,0,0,136,17,0,0,64,17,0,0,248,16,0,0,160,16,0,0,64,16,0,0,224,15,0,0,0,0,0,0,144,38,0,0,84,1,0,0,232,37,0,0,140,0,0,0,0,0,0,0,0,0,0,0,48,15,0,0,106,0,0,0,168,40,0,0,122,0,0,0,0,0,0,0,0,0,0,0,200,11,0,0,142,0,0,0,144,10,0,0,78,1,0,0,112,25,0,0,32,1,0,0,8,47,0,0,102,0,0,0,200,24,0,0,246,0,0,0,48,24,0,0,196,0,0,0,216,23,0,0,178,0,0,0,200,45,0,0,234,0,0,0,80,23,0,0,66,0,0,0,176,22,0,0,18,1,0,0,40,42,0,0,16,0,0,0,0,0,0,0,0,0,0,0,104,35,0,0,192,34,0,0,184,33,0,0,240,32,0,0,48,32,0,0,0,0,0,0,200,11,0,0,142,0,0,0,144,10,0,0,228,0,0,0,8,47,0,0,48,0,0,0,200,45,0,0,152,0,0,0,112,44,0,0,6,0,0,0,88,43,0,0,82,1,0,0,40,42,0,0,54,0,0,0,72,41,0,0,66,1,0,0,120,40,0,0,14,0,0,0,0,0,0,0,0,0,0,0,24,36,0,0,64,35,0,0,136,34,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,160,33,0,0,200,32,0,0,208,31,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,168,12,0,0,4,1,0,0,8,39,0,0,80,1,0,0,144,30,0,0,40,0,0,0,8,24,0,0,72,1,0,0,48,18,0,0,52,0,0,0,80,15,0,0,34,1,0,0,208,13,0,0,20,0,0,0,0,12,0,0,130,0,0,0,176,10,0,0,132,0,0,0,168,9,0,0,44,0,0,0,48,46,0,0,26,1,0,0,208,44,0,0,204,0,0,0,152,43,0,0,254,0,0,0,80,42,0,0,108,0,0,0,136,41,0,0,64,0,0,0,216,40,0,0,74,1,0,0,0,0,0,0,0,0,0,0,208,12,0,0,136,0,0,0,104,39,0,0,0,1,0,0,208,30,0,0,156,0,0,0,24,24,0,0,250,0,0,0,64,18,0,0,154,0,0,0,96,15,0,0,202,0,0,0,0,0,0,0,0,0,0,0,160,14,0,0,70,1,0,0,0,40,0,0,24,0,0,0,128,31,0,0,56,1,0,0,96,24,0,0,18,0,0,0,200,18,0,0,110,0,0,0,104,15,0,0,36,1,0,0,0,14,0,0,170,0,0,0,48,12,0,0,198,0,0,0,248,10,0,0,24,1,0,0,248,9,0,0,112,0,0,0,112,46,0,0,40,1,0,0,232,44,0,0,168,0,0,0,0,0,0,0,0,0,0,0,216,24,0,0,88,0,0,0,24,19,0,0,42,1,0,0,120,15,0,0,216,0,0,0,56,14,0,0,208,0,0,0,104,12,0,0,230,0,0,0,0,11,0,0,12,1,0,0,0,10,0,0,240,0,0,0,120,46,0,0,50,1,0,0,240,44,0,0,50,1,0,0,216,43,0,0,28,0,0,0,168,42,0,0,8,0,0,0,216,41,0,0,190,0,0,0,232,40,0,0,244,0,0,0,232,39,0,0,226,0,0,0,0,39,0,0,200,0,0,0,64,38,0,0,62,1,0,0,72,37,0,0,38,1,0,0,112,36,0,0,30,1,0,0,120,35,0,0,6,1,0,0,208,34,0,0,134,0,0,0,248,33,0,0,90,0,0,0,8,33,0,0,12,0,0,0,64,32,0,0,150,0,0,0,0,0,0,0,0,0,0,0,43,45,0,0,0,0,0,0,117,112,118,97,108,117,101,105,100,0,0,0,0,0,0,0,99,111,114,111,117,116,105,110,101,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,110,111,110,45,115,117,115,112,101,110,100,101,100,32,99,111,114,111,117,116,105,110,101,0,0,0,114,101,112,108,97,99,101,0,108,111,97,100,102,105,108,101,0,0,0,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,32,105,110,0,0,0,0,0,117,112,118,97,108,0,0,0,112,111,115,105,116,105,111,110,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,108,101,110,0,0,0,0,0,115,101,108,102,0,0,0,0,103,108,111,98,97,108,0,0,116,105,109,101,0,0,0,0,76,85,65,95,67,80,65,84,72,95,53,95,50,0,0,0,110,111,32,109,101,115,115,97,103,101,0,0,0,0,0,0,99,111,115,0,0,0,0,0,102,108,117,115,104,0,0,0,109,97,116,104,0,0,0,0,110,0,0,0,0,0,0,0,80,112,0,0,0,0,0,0,117,112,118,97,108,117,101,106,111,105,110,0,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,101,114,114,111,114,32,104,97,110,100,108,105,110,103,0,108,115,104,105,102,116,0,0,105,112,97,105,114,115,0,0,39,102,111,114,39,32,115,116,101,112,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,0,110,111,116,32,97,0,0,0,112,114,111,116,111,0,0,0,105,110,118,97,108,105,100,32,111,114,100,101,114,32,102,117,110,99,116,105,111,110,32,102,111,114,32,115,111,114,116,105,110,103,0,0,0,0,0,0,103,115,117,98,0,0,0,0,99,97,110,110,111,116,32,117,115,101,32,39,46,46,46,39,32,111,117,116,115,105,100,101,32,97,32,118,97,114,97,114,103,32,102,117,110,99,116,105,111,110,0,0,0,0,0,0,95,69,78,86,0,0,0,0,115,101,116,108,111,99,97,108,101,0,0,0,0,0,0,0,34,93,0,0,0,0,0,0,99,112,97,116,104,0,0,0,99,111,115,104,0,0,0,0,99,108,111,115,101,0,0,0,98,105,116,51,50,0,0,0,39,37,99,39,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,40,37,115,41,0,0,0,88,120,0,0,0,0,0,0,103,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,108,114,111,116,97,116,101,0,97,116,116,101,109,112,116,32,116,111,32,108,111,97,100,32,97,32,37,115,32,99,104,117,110,107,32,40,109,111,100,101,32,105,115,32,39,37,115,39,41,0,0,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,39,102,111,114,39,32,108,105,109,105,116,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,99,111,114,114,117,112,116,101,100,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,116,104,114,101,97,100,0,0,103,109,97,116,99,104,0,0,67,32,108,101,118,101,108,115,0,0,0,0,0,0,0,0,99,114,101,97,116,101,0,0,108,111,99,97,108,0,0,0,114,101,110,97,109,101,0,0,91,115,116,114,105,110,103,32,34,0,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,46,47,63,46,108,117,97,0,0,0,0,0,0,0,99,101,105,108,0,0,0,0,95,95,105,110,100,101,120,0,115,116,114,105,110,103,0,0,10,9,40,46,46,46,116,97,105,108,32,99,97,108,108,115,46,46,46,41,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,69,101,0,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,101,120,116,114,97,99,116,0,102,117,110,99,116,105,111,110,32,111,114,32,101,120,112,114,101,115,115,105,111,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,0,116,101,120,116,0,0,0,0,101,114,114,111,114,0,0,0,39,102,111,114,39,32,105,110,105,116,105,97,108,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,37,115,58,32,37,115,32,112,114,101,99,111,109,112,105,108,101,100,32,99,104,117,110,107,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,115,111,114,116,0,0,0,0,97,114,115,104,105,102,116,0,102,111,114,109,97,116,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,114,101,109,111,118,101,0,0,46,46,46,0,0,0,0,0,76,85,65,95,80,65,84,72,0,0,0,0,0,0,0,0,97,116,97,110,0,0,0,0,99,97,110,110,111,116,32,99,108,111,115,101,32,115,116,97,110,100,97,114,100,32,102,105,108,101,0,0,0,0,0,0,111,115,0,0,0,0,0,0,32,105,110,32,0,0,0,0,95,71,0,0,0,0,0,0,114,117,110,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,46,0,0,0,0,0,0,0,103,101,116,114,101,103,105,115,116,114,121,0,0,0,0,0,121,105,101,108,100,0,0,0,98,116,101,115,116,0,0,0,98,105,110,97,114,121,0,0,100,111,102,105,108,101,0,0,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,33,0,0,0,0,0,0,0,103,101,116,32,108,101,110,103,116,104,32,111,102,0,0,0,116,114,117,110,99,97,116,101,100,0,0,0,0,0,0,0,116,97,98,108,101,0,0,0,37,115,0,0,0,0,0,0,114,101,109,111,118,101,0,0,37,46,49,52,103,0,0,0,102,105,110,100,0,0,0,0,105,110,99,114,101,109,101,110,116,97,108,0,0,0,0,0,60,115,116,114,105,110,103,62,0,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,103,101,116,101,110,118,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,37,115,32,119,105,116,104,32,37,115,0,0,0,103,101,110,101,114,97,116,105,111,110,97,108,0,0,0,0,60,110,97,109,101,62,0,0,61,40,100,101,98,117,103,32,99,111,109,109,97,110,100,41,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,108,117,97,95,112,117,115,104,102,115,116,114,105,110,103,39,0,0,0,0,0,0,105,115,114,117,110,110,105,110,103,0,0,0,0,0,0,0,76,85,65,95,80,65,84,72,95,53,95,50,0,0,0,0,102,117,110,99,116,105,111,110,32,60,37,115,58,37,100,62,0,0,0,0,0,0,0,0,60,110,117,109,98,101,114,62,0,0,0,0,0,0,0,0,97,116,97,110,50,0,0,0,99,111,110,116,10,0,0,0,115,101,116,109,97,106,111,114,105,110,99,0,0,0,0,0,70,73,76,69,42,0,0,0,105,111,0,0,0,0,0,0,109,97,105,110,32,99,104,117,110,107,0,0,0,0,0,0,60,101,111,102,62,0,0,0,108,117,97,95,100,101,98,117,103,62,32,0,0,0,0,0,115,101,116,115,116,101,112,109,117,108,0,0,0,0,0,0,105,110,105,116,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,39,37,115,39,0,0,0,37,100,58,0,0,0,0,0,58,58,0,0,0,0,0,0,115,101,116,112,97,117,115,101,0,0,0,0,0,0,0,0,97,98,115,101,110,116,0,0,105,110,118,97,108,105,100,32,109,111,100,101,0,0,0,0,46,0,0,0,0,0,0,0,126,61,0,0,0,0,0,0,101,120,116,101,114,110,97,108,32,104,111,111,107,0,0,0,115,116,101,112,0,0,0,0,117,110,112,97,99,107,0,0,95,95,105,110,100,101,120,0,114,119,97,0,0,0,0,0,105,110,118,97,108,105,100,32,108,111,110,103,32,115,116,114,105,110,103,32,100,101,108,105,109,105,116,101,114,0,0,0,102,0,0,0,0,0,0,0,60,61,0,0,0,0,0,0,102,117,110,99,0,0,0,0,99,111,117,110,116,0,0,0,103,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,119,114,97,112,0,0,0,0,115,101,101,97,108,108,0,0,99,97,110,110,111,116,32,111,112,101,110,32,102,105,108,101,32,39,37,115,39,32,40,37,115,41,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,37,115,0,0,0,0,0,62,61,0,0,0,0,0,0,97,99,116,105,118,101,108,105,110,101,115,0,0,0,0,0,99,111,110,116,114,111,108,32,115,116,114,117,99,116,117,114,101,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,99,111,108,108,101,99,116,0,98,120,111,114,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,110,105,108,0,0,0,0,0,0,115,101,97,114,99,104,112,97,116,104,0,0,0,0,0,0,119,0,0,0,0,0,0,0,99,97,110,110,111,116,32,37,115,32,37,115,58,32,37,115,0,0,0,0,0,0,0,0,99,111,108,108,101,99,116,103,97,114,98,97,103,101,0,0,61,61,0,0,0,0,0,0,105,115,116,97,105,108,99,97,108,108,0,0,0,0,0,0,114,101,115,116,97,114,116,0,115,116,114,105,110,103,32,108,101,110,103,116,104,32,111,118,101,114,102,108,111,119,0,0,25,147,13,10,26,10,0,0,108,111,97,100,108,105,98,0,115,116,114,105,110,103,0,0,39,112,111,112,101,110,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,112,97,99,107,0,0,0,0,46,46,46,0,0,0,0,0,110,97,109,101,119,104,97,116,0,0,0,0,0,0,0,0,115,116,111,112,0,0,0,0,10,9,110,111,32,102,105,101,108,100,32,112,97,99,107,97,103,101,46,112,114,101,108,111,97,100,91,39,37,115,39,93,0,0,0,0,0,0,0,0,100,117,109,112,0,0,0,0,114,0,0,0,0,0,0,0,80,65,78,73,67,58,32,117,110,112,114,111,116,101,99,116,101,100,32,101,114,114,111,114,32,105,110,32,99,97,108,108,32,116,111,32,76,117,97,32,65,80,73,32,40,37,115,41,10,0,0,0,0,0,0,0,46,46,0,0,0,0,0,0,110,97,109,101,0,0,0,0,108,97,98,101,108,115,47,103,111,116,111,115,0,0,0,0,95,95,105,112,97,105,114,115,0,0,0,0,0,0,0,0,115,116,114,105,110,103,32,115,108,105,99,101,32,116,111,111,32,108,111,110,103,0,0,0,101,120,105,116,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,116,119,111,32,37,115,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,98,97,100,32,99,111,110,118,101,114,115,105,111,110,32,110,117,109,98,101,114,45,62,105,110,116,59,32,109,117,115,116,32,114,101,99,111,109,112,105,108,101,32,76,117,97,32,119,105,116,104,32,112,114,111,112,101,114,32,115,101,116,116,105,110,103,115,0,0,0,0,0,119,104,105,108,101,0,0,0,105,115,118,97,114,97,114,103,0,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,114,101,97,100,101,114,32,102,117,110,99,116,105,111,110,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,0,0,0,0,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,114,0,0,0,0,0,0,0,112,97,116,104,0,0,0,0,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,58,32,97,112,112,46,32,110,101,101,100,115,32,37,102,44,32,76,117,97,32,99,111,114,101,32,112,114,111,118,105,100,101,115,32,37,102,0,0,0,117,110,116,105,108,0,0,0,97,115,105,110,0,0,0,0,110,112,97,114,97,109,115,0,116,111,111,32,109,97,110,121,32,110,101,115,116,101,100,32,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,117,110,97,98,108,101,32,116,111,32,100,117,109,112,32,103,105,118,101,110,32,102,117,110,99,116,105,111,110,0,0,0,115,116,100,101,114,114,0,0,10,9,110,111,32,102,105,108,101,32,39,37,115,39,0,0,115,116,97,110,100,97,114,100,32,37,115,32,102,105,108,101,32,105,115,32,99,108,111,115,101,100,0,0,0,0,0,0,116,97,98,108,101,0,0,0,109,117,108,116,105,112,108,101,32,76,117,97,32,86,77,115,32,100,101,116,101,99,116,101,100,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,110,117,112,115,0,0,0,0,61,40,108,111,97,100,41,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,119,105,100,116,104,32,111,114,32,112,114,101,99,105,115,105,111,110,32,116,111,111,32,108,111,110,103,41,0,0,0,0,63,0,0,0,0,0,0,0,116,121,112,101,0,0,0,0,116,111,111,32,109,97,110,121,32,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,10,9,37,115,58,0,0,0,116,104,101,110,0,0,0,0,99,117,114,114,101,110,116,108,105,110,101,0,0,0,0,0,98,116,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,114,101,112,101,97,116,101,100,32,102,108,97,103,115,41,0,110,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,0,0,0,0,0,0,0,39,112,97,99,107,97,103,101,46,37,115,39,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,116,109,112,102,105,108,101,0,110,97,109,101,32,99,111,110,102,108,105,99,116,32,102,111,114,32,109,111,100,117,108,101,32,39,37,115,39,0,0,0,114,101,116,117,114,110,0,0,119,104,97,116,0,0,0,0,95,95,112,97,105,114,115,0,45,43,32,35,48,0,0,0,100,121,110,97,109,105,99,32,108,105,98,114,97,114,105,101,115,32,110,111,116,32,101,110,97,98,108,101,100,59,32,99,104,101,99,107,32,121,111,117,114,32,76,117,97,32,105,110,115,116,97,108,108,97,116,105,111,110,0,0,0,0,0,0,112,111,112,101,110,0,0,0,95,69,78,86,0,0,0,0,95,76,79,65,68,69,68,0,114,101,112,101,97,116,0,0,108,97,115,116,108,105,110,101,100,101,102,105,110,101,100,0,103,101,116,105,110,102,111,0,92,37,48,51,100,0,0,0,115,116,97,116,117,115,0,0,108,117,97,111,112,101,110,95,37,115,0,0,0,0,0,0,111,117,116,112,117,116,0,0,37,115,58,32,37,112,0,0,111,114,0,0,0,0,0,0,108,105,110,101,100,101,102,105,110,101,100,0,0,0,0,0,111,112,99,111,100,101,115,0,98,111,114,0,0,0,0,0,92,37,100,0,0,0,0,0,60,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,110,111,116,32,105,110,115,105,100,101,32,97,32,108,111,111,112,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,102,114,111,109,32,111,117,116,115,105,100,101,32,97,32,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,111,112,101,110,0,0,0,0,110,105,108,0,0,0,0,0,97,115,115,101,114,116,0,0,110,111,116,0,0,0,0,0,115,104,111,114,116,95,115,114,99,0,0,0,0,0,0,0,39,116,111,115,116,114,105,110,103,39,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,32,116,111,32,39,112,114,105,110,116,39,0,0,0,0,0,0,108,111,111,112,32,105,110,32,115,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,102,111,114,109,97,116,39,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,105,110,112,117,116,0,0,0,110,117,109,98,101,114,0,0,102,97,108,115,101,0,0,0,105,110,115,101,114,116,0,0,110,105,108,0,0,0,0,0,115,111,117,114,99,101,0,0,105,110,118,97,108,105,100,32,107,101,121,32,116,111,32,39,110,101,120,116,39,0,0,0,116,97,98,108,101,32,111,114,32,115,116,114,105,110,103,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,110,111,116,32,97,32,110,111,110,45,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,99,104,97,114,0,0,0,0,37,115,0,0,0,0,0,0,116,114,117,101,0,0,0,0,108,111,99,97,108,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,98,114,101,97,107,0,0,0,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,101,120,101,99,117,116,101,0,101,114,114,111,114,32,108,111,97,100,105,110,103,32,109,111,100,117,108,101,32,39,37,115,39,32,102,114,111,109,32,102,105,108,101,32,39,37,115,39,58,10,9,37,115,0,0,0,102,105,108,101,32,105,115,32,97,108,114,101,97,100,121,32,99,108,111,115,101,100,0,0,112,101,114,102,111,114,109,32,97,114,105,116,104,109,101,116,105,99,32,111,110,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,99,108,111,99,107,0,0,0,105,110,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,108,101,118,101,108,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,37,112,0,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,97,32,112,114,111,116,101,99,116,101,100,32,109,101,116,97,116,97,98,108,101,0,0,0,0,0,110,111,116,32,97,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,10,9,110,111,32,109,111,100,117,108,101,32,39,37,115,39,32,105,110,32,102,105,108,101,32,39,37,115,39,0,0,0,115,101,97,114,99,104,101,114,115,0,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,111,112,116,105,111,110,115,0,0,0,0,0,0,0,0,111,98,106,101,99,116,32,108,101,110,103,116,104,32,105,115,32,110,111,116,32,97,32,110,117,109,98,101,114,0,0,0,105,102,0,0,0,0,0,0,97,99,111,115,0,0,0,0,62,37,115,0,0,0,0,0,95,95,109,101,116,97,116,97,98,108,101,0,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,110,118,101,114,115,105,111,110,32,115,112,101,99,105,102,105,101,114,32,39,37,37,37,115,39,0,0,0,0,0,115,116,100,111,117,116,0,0,47,0,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,37,108,102,0,0,0,0,0,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,114,101,97,100,0,0,0,0,103,111,116,111,0,0,0,0,102,108,110,83,116,117,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,105,110,118,97,108,105,100,32,117,115,101,32,111,102,32,39,37,99,39,32,105,110,32,114,101,112,108,97,99,101,109,101,110,116,32,115,116,114,105,110,103,0,0,0,0,0,0,0,76,85,65,95,78,79,69,78,86,0,0,0,0,0,0,0,105,110,116,101,114,118,97,108,32,105,115,32,101,109,112,116,121,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,0,0,114,101,111,112,101,110,0,0,83,108,110,116,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,76,117,97,32,102,117,110,99,116,105,111,110,32,101,120,112,101,99,116,101,100,0,0,0,32,12,10,13,9,11,0,0,105,110,118,97,108,105,100,32,114,101,112,108,97,99,101,109,101,110,116,32,118,97,108,117,101,32,40,97,32,37,115,41,0,0,0,0,0,0,0,0,97,65,98,66,99,100,72,73,106,109,77,112,83,85,119,87,120,88,121,89,122,37,0,0,1,0,0,0,0,0,0,0,116,97,110,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,114,98,0,0,0,0,0,0,102,111,114,0,0,0,0,0,105,110,118,97,108,105,100,32,117,112,118,97,108,117,101,32,105,110,100,101,120,0,0,0,98,97,115,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,115,116,114,105,110,103,47,102,117,110,99,116,105,111,110,47,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,0,121,100,97,121,0,0,0,0,59,1,59,0,0,0,0,0,116,97,110,104,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,39,37,115,39,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,37,115,32,39,37,115,39,32,40,97,32,37,115,32,118,97,108,117,101,41,0,0,0,0,0,0,102,97,108,115,101,0,0,0,62,117,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,103,101,116,104,111,111,107,0,94,36,42,43,63,46,40,91,37,45,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,32,40,116,111,32,99,108,111,115,101,32,37,115,32,97,116,32,108,105,110,101,32,37,100,41,0,0,0,0,114,117,110,110,105,110,103,0,119,100,97,121,0,0,0,0,59,59,0,0,0,0,0,0,115,113,114,116,0,0,0,0,110,111,116,32,97,110,32,105,110,116,101,103,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,110,78,0,0,0,0,0,0,111,112,101,110,0,0,0,0,101,110,100,0,0,0,0,0,102,117,108,108,32,117,115,101,114,100,97,116,97,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,108,105,103,104,116,32,117,115,101,114,100,97,116,97,0,0,0,0,0,0,99,111,110,115,116,97,110,116,115,0,0,0,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,95,95,99,97,108,108,0,0,98,110,111,116,0,0,0,0,105,110,118,97,108,105,100,32,112,97,116,116,101,114,110,32,99,97,112,116,117,114,101,0,40,102,111,114,32,115,116,101,112,41,0,0,0,0,0,0,42,116,0,0,0,0,0,0,95,80,65,67,75,65,71,69,0,0,0,0,0,0,0,0,115,105,110,0,0,0,0,0,101,110,100,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,97,99,114,111,115,115,32,97,32,67,45,99,97,108,108,32,98,111,117,110,100,97,114,121,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,95,86,69,82,83,73,79,78,0,0,0,0,0,0,0,0,45,49,0,0,0,0,0,0,101,108,115,101,105,102,0,0,116,97,105,108,32,99,97,108,108,0,0,0,0,0,0,0,120,112,99,97,108,108,0,0,95,95,99,111,110,99,97,116,0,0,0,0,0,0,0,0,108,111,111,112,32,105,110,32,103,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,37,37,98,39,41,0,0,40,102,111,114,32,108,105,109,105,116,41,0,0,0,0,0,37,99,0,0,0,0,0,0,95,77,0,0,0,0,0,0,115,105,110,104,0,0,0,0,99,117,114,0,0,0,0,0,98,111,111,108,101,97,110,0,64,37,115,0,0,0,0,0,109,97,120,110,0,0,0,0,101,108,115,101,0,0,0,0,99,111,117,110,116,0,0,0,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,116,121,112,101,0,0,0,0,95,95,108,101,0,0,0,0,40,42,118,97,114,97,114,103,41,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,39,93,39,41,0,40,102,111,114,32,105,110,100,101,120,41,0,0,0,0,0,110,117,109,101,114,105,99,0,39,109,111,100,117,108,101,39,32,110,111,116,32,99,97,108,108,101,100,32,102,114,111,109,32,97,32,76,117,97,32,102,117,110,99,116,105,111,110,0,98,121,116,101,0,0,0,0,114,97,110,100,111,109,115,101,101,100,0,0,0,0,0,0,115,101,116,0,0,0,0,0,61,115,116,100,105,110,0,0,100,111,0,0,0,0,0,0,108,105,110,101,0,0,0,0,60,103,111,116,111,32,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,106,117,109,112,115,32,105,110,116,111,32,116,104,101,32,115,99,111,112,101,32,111,102,32,108,111,99,97,108,32,39,37,115,39,0,116,111,115,116,114,105,110,103,0,0,0,0,0,0,0,0,95,95,108,116,0,0,0,0,40,42,116,101,109,112,111,114,97,114,121,41,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,101,110,100,115,32,119,105,116,104,32,39,37,37,39,41,0,0,0,0,0,0,40,102,111,114,32,99,111,110,116,114,111,108,41,0,0,0,109,111,110,101,116,97,114,121,0,0,0,0,0,0,0,0,100,105,102,102,116,105,109,101,0,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,114,97,110,100,111,109,0,0,108,105,110,101,0,0,0,0,99,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,98,117,102,102,101,114,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,98,114,101,97,107,0,0,0,114,101,116,117,114,110,0,0,40,110,117,108,108,41,0,0,116,111,110,117,109,98,101,114,0,0,0,0,0,0,0,0,95,95,117,110,109,0,0,0,76,117,97,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,32,37,37,37,100,0,0,0,0,0,0,40,102,111,114,32,115,116,97,116,101,41,0,0,0,0,0,99,116,121,112,101,0,0,0,95,78,65,77,69,0,0,0,114,97,100,0,0,0,0,0,108,111,97,100,101,114,115,0,102,117,108,108,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,97,110,100,0,0,0,0,0,97,98,115,0,0,0,0,0,99,97,108,108,0,0,0,0,95,67,76,73,66,83,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,95,95,112,111,119,0,0,0,109,97,105,110,0,0,0,0,109,105,115,115,105,110,103,32,39,91,39,32,97,102,116,101,114,32,39,37,37,102,39,32,105,110,32,112,97,116,116,101,114,110,0,0,0,0,0,0,40,102,111,114,32,103,101,110,101,114,97,116,111,114,41,0,99,111,108,108,97,116,101,0,95,73,79,95,111,117,116,112,117,116,0,0,0,0,0,0,109,111,100,117,108,101,32,39,37,115,39,32,110,111,116,32,102,111,117,110,100,58,37,115,0,0,0,0,0,0,0,0,10,9,46,46,46,0,0,0,112,111,119,0,0,0,0,0,110,111,0,0,0,0,0,0,112,97,99,107,97,103,101,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,37,115,32,110,101,97,114,32,37,115,0,0,0,0,0,0,95,95,109,111,100,101,0,0,115,101,108,101,99,116,0,0,95,95,109,111,100,0,0,0,61,63,0,0,0,0,0,0,112,97,116,116,101,114,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,39,61,39,32,111,114,32,39,105,110,39,32,101,120,112,101,99,116,101,100,0,0,0,0,97,108,108,0,0,0,0,0,39,112,97,99,107,97,103,101,46,115,101,97,114,99,104,101,114,115,39,32,109,117,115,116,32,98,101,32,97,32,116,97,98,108,101,0,0,0,0,0,109,111,100,102,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,117,115,101,32,97,32,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,32,40,37,115,41,0,0,0,0,0,63,0,0,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,107,0,0,0,0,0,0,0,114,97,119,115,101,116,0,0,95,95,100,105,118,0,0,0,67,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,99,97,112,116,117,114,101,0,0,0,0,0,0,108,97,98,101,108,32,39,37,115,39,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,111,110,32,108,105,110,101,32,37,100,0,0,0,102,105,101,108,100,32,39,37,115,39,32,109,105,115,115,105,110,103,32,105,110,32,100,97,116,101,32,116,97,98,108,101,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,95,95,103,99,32,109,101,116,97,109,101,116,104,111,100,32,40,37,115,41,0,0,0,114,101,113,117,105,114,101,0,109,105,110,0,0,0,0,0,37,46,49,52,103,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,115,39,0,0,0,0,0,99,104,117,110,107,32,104,97,115,32,116,111,111,32,109,97,110,121,32,108,105,110,101,115,0,0,0,0,0,0,0,0,95,72,75,69,89,0,0,0,114,97,119,103,101,116,0,0,95,95,109,117,108,0,0,0,61,91,67,93,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,0,0,0,117,110,101,120,112,101,99,116,101,100,32,115,121,109,98,111,108,0,0,0,0,0,0,0,105,115,100,115,116,0,0,0,109,111,100,117,108,101,0,0,109,97,120,0,0,0,0,0,102,105,108,101,32,40,37,112,41,0,0,0,0,0,0,0,99,104,97,114,40,37,100,41,0,0,0,0,0,0,0,0,101,120,105,116,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,99,111,109,109,101,110,116,0,108,101,118,101,108,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,112,105,0,0,0,0,0,0,114,97,119,108,101,110,0,0,103,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,95,95,115,117,98,0,0,0,109,101,116,97,109,101,116,104,111,100,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,101,115,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,97,114,103,117,109,101,110,116,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,114,101,115,117,109,101,0,0,121,101,97,114,0,0,0,0,112,114,101,108,111,97,100,0,108,111,103,0,0,0,0,0,102,105,108,101,32,40,99,108,111,115,101,100,41,0,0,0,37,115,58,32,37,115,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,115,116,114,105,110,103,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,99,111,110,115,116,114,117,99,116,111,114,32,116,111,111,32,108,111,110,103,0,0,0,0,114,97,119,101,113,117,97,108,0,0,0,0,0,0,0,0,95,95,97,100,100,0,0,0,98,97,110,100], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([102,111,114,32,105,116,101,114,97,116,111,114,0,0,0,0,114,101,115,117,108,116,105,110,103,32,115,116,114,105,110,103,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,32,105,110,32,37,115,0,109,111,110,116,104,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,108,111,103,49,48,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,67,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,76,117,97,32,53,46,50,0,114,117,110,95,115,116,114,105,110,103,0,0,0,0,0,0,104,101,120,97,100,101,99,105,109,97,108,32,100,105,103,105,116,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,112,114,105,110,116,0,0,0,95,95,101,113,0,0,0,0,105,110,100,101,120,0,0,0,117,112,112,101,114,0,0,0,102,117,110,99,116,105,111,110,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,98,105,110,97,114,121,32,115,116,114,105,110,103,0,0,0,100,97,121,0,0,0,0,0,108,111,97,100,101,100,0,0,108,100,101,120,112,0,0,0,95,95,103,99,0,0,0,0,110,105,108,0,0,0,0,0,37,115,58,37,100,58,32,0,99,111,110,99,97,116,0,0,100,101,99,105,109,97,108,32,101,115,99,97,112,101,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,115,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,116,114,121,105,110,103,32,116,111,32,97,99,99,101,115,115,32,110,111,110,45,101,120,105,115,116,101,110,116,32,98,105,116,115,0,0,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,78,97,78,0,0,0,0,0,0,112,99,97,108,108,0,0,0,95,95,108,101,110,0,0,0,115,117,98,0,0,0,0,0,63,0,0,0,0,0,0,0,109,97,105,110,32,102,117,110,99,116,105,111,110,0,0,0,104,111,117,114,0,0,0,0,95,76,79,65,68,69,68,0,95,95,105,110,100,101,120,0,102,114,101,120,112,0,0,0,119,114,105,116,101,0,0,0,83,108,0,0,0,0,0,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,119,105,100,116,104,32,109,117,115,116,32,98,101,32,112,111,115,105,116,105,118,101,0,0,110,111,32,118,105,115,105,98,108,101,32,108,97,98,101,108,32,39,37,115,39,32,102,111,114,32,60,103,111,116,111,62,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,112,97,105,114,115,0,0,0,95,95,109,111,100,101,0,0,105,110,118,97,108,105,100,32,118,97,108,117,101,32,40,37,115,41,32,97,116,32,105,110,100,101,120,32,37,100,32,105,110,32,116,97,98,108,101,32,102,111,114,32,39,99,111,110,99,97,116,39,0,0,0,0,114,101,118,101,114,115,101,0,109,101,116,104,111,100,0,0,105,116,101,109,115,32,105,110,32,97,32,99,111,110,115,116,114,117,99,116,111,114,0,0,109,105,110,0,0,0,0,0,100,97,116,101,0,0,0,0,99,111,110,102,105,103,0,0,102,109,111,100,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,116,111,32,39,37,115,39,32,40,37,115,41,0,0,0,115,101,116,118,98,117,102,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,97,32,37,115,32,118,97,108,117,101,0,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,115,116,114,105,110,103,0,0,0,0,0,0,0,115,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,100,101,97,100,0,0,0,0,120,88,0,0,0,0,0,0,102,105,101,108,100,32,99,97,110,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,0,0,0,0,0,0,0,0,110,101,120,116,0,0,0,0,95,73,79,95,105,110,112,117,116,0,0,0,0,0,0,0,95,95,103,99,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,105,110,115,101,114,116,39,0,0,0,114,101,112,0,0,0,0,0,99,111,110,115,116,97,110,116,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,115,101,99,0,0,0,0,0,47,10,59,10,63,10,33,10,45,10,0,0,0,0,0,0,102,108,111,111,114,0,0,0,95,95,103,99,0,0,0,0,115,101,101,107,0,0,0,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,101,114,114,111,114,58,32,98,108,111,99,107,32,116,111,111,32,98,105,103,0,0,63,0,0,0,0,0,0,0,108,101,120,105,99,97,108,32,101,108,101,109,101,110,116,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,0,0,104,117,103,101,0,0,0,0,115,101,116,104,111,111,107,0,110,111,114,109,97,108,0,0,99,97,108,108,0,0,0,0,114,115,104,105,102,116,0,0,108,111,97,100,115,116,114,105,110,103,0,0,0,0,0,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,110,0,0,0,0,0,0,0,109,97,116,99,104,0,0,0,117,112,118,97,108,117,101,0,108,111,99,97,108,32,118,97,114,105,97,98,108,101,115,0,117,110,97,98,108,101,32,116,111,32,103,101,110,101,114,97,116,101,32,97,32,117,110,105,113,117,101,32,102,105,108,101,110,97,109,101,0,0,0,0,115,116,100,105,110,0,0,0,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,115,111,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,108,111,97,100,97,108,108,46,115,111,59,46,47,63,46,115,111,0,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,101,120,112,0,0,0,0,0,114,101,97,100,0,0,0,0,95,71,0,0,0,0,0,0,106,115,0,0,0,0,0,0,115,116,97,99,107,32,116,114,97,99,101,98,97,99,107,58,0,0,0,0,0,0,0,0,99,97,108,108,105,110,103,32,39,37,115,39,32,111,110,32,98,97,100,32,115,101,108,102,32,40,37,115,41,0,0,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,115,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,114,114,111,116,97,116,101,0,108,111,97,100,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,0,0,0,0,95,95,105,110,100,101,120,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,117,110,112,97,99,107,0,0,0,0,0,0,108,111,119,101,114,0,0,0,102,105,101,108,100,0,0,0,60,110,97,109,101,62,32,111,114,32,39,46,46,46,39,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,116,109,112,110,97,109,101,0,76,85,65,95,67,80,65,84,72,0,0,0,0,0,0,0,100,101,103,0,0,0,0,0,108,105,110,101,115,0,0,0,109,101,116,104,111,100,0,0,100,101,98,117,103,0,0,0,37,115,10,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


   
  Module["_strlen"] = _strlen;

  function _emscripten_exit_with_live_runtime() {
      Module['noExitRuntime'] = true;
      throw 'SimulateInfiniteLoop';
    }

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }

  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  
   
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
  
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
  
        if (!total) {
          // early out
          return callback(null);
        }
  
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
  
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
  
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
  
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat, node;
  
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
  
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
  
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
  
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
  
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          FS.FSNode.prototype = {};
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
  
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }

  
  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }

  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }


  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }

  
  
  
  
  
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision === -1) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }


  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }

  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }

  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;
  
   
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }

  function _abort() {
      Module['abort']();
    }

  var _setjmp=undefined;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;


  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }

  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }

  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }

  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      stream = FS.getStream(stream);
      if (!stream) {
        return;
      }
      stream.eof = false;
      stream.error = false;
    }

  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }


  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_;
      }
      HEAP8[(((s)+(i))|0)]=0;
      return s;
    }

  
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      writeAsciiToMemory(result, s);
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }

  function _memchr(ptr, chr, num) {
      chr = unSign(chr);
      for (var i = 0; i < num; i++) {
        if (HEAP8[(ptr)] == chr) return ptr;
        ptr++;
      }
      return 0;
    }

  var _tan=Math_tan;

  
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }
  
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }function _tanh(x) {
      return _sinh(x) / _cosh(x);
    }

  var _sqrt=Math_sqrt;

  var _sin=Math_sin;


  function _srand(seed) {}

  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }

  var _floor=Math_floor;

  var _llvm_pow_f64=Math_pow;

  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x);
      return x - HEAPF64[((intpart)>>3)];
    }

  var _log=Math_log;

  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }

  function _frexp(x, exp_addr) {
      var sig = 0, exp_ = 0;
      if (x !== 0) {
        var sign = 1;
        if (x < 0) {
          x = -x;
          sign = -1;
        }
        var raw_exp = Math.log(x)/Math.log(2);
        exp_ = Math.ceil(raw_exp);
        if (exp_ === raw_exp) exp_ += 1;
        sig = sign*x/Math.pow(2, exp_);
      }
      HEAP32[((exp_addr)>>2)]=exp_;
      return sig;
    }

  function _fmod(x, y) {
      return x % y;
    }

  var _exp=Math_exp;

  var _cos=Math_cos;


  var _ceil=Math_ceil;

  var _atan=Math_atan;

  var _atan2=Math_atan2;

  var _asin=Math_asin;

  var _acos=Math_acos;

  var _fabs=Math_abs;

  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }

  
  
  
  
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }

  function _strpbrk(ptr1, ptr2) {
      var curr;
      var searchSet = {};
      while (1) {
        var curr = HEAP8[((ptr2++)|0)];
        if (!curr) break;
        searchSet[curr] = 1;
      }
      while (1) {
        curr = HEAP8[(ptr1)];
        if (!curr) break;
        if (curr in searchSet) return ptr1;
        ptr1++;
      }
      return 0;
    }

  
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }


  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _mktime(tmPtr) {
      _tzset();
      var year = HEAP32[(((tmPtr)+(20))>>2)];
      var timestamp = new Date(year >= 1900 ? year : year + 1900,
                               HEAP32[(((tmPtr)+(16))>>2)],
                               HEAP32[(((tmPtr)+(12))>>2)],
                               HEAP32[(((tmPtr)+(8))>>2)],
                               HEAP32[(((tmPtr)+(4))>>2)],
                               HEAP32[((tmPtr)>>2)],
                               0).getTime() / 1000;
      HEAP32[(((tmPtr)+(24))>>2)]=new Date(timestamp).getDay();
      var yday = Math.round((timestamp - (new Date(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      return timestamp;
    }

  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }

  function _rename(old_path, new_path) {
      // int rename(const char *old, const char *new);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rename.html
      old_path = Pointer_stringify(old_path);
      new_path = Pointer_stringify(new_path);
      try {
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }

  function _difftime(time1, time0) {
      return time1 - time0;
    }

  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  
  function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }

  var _llvm_memset_p0i8_i32=_memset;

   
  Module["_memcmp"] = _memcmp;

  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }

   
  Module["_tolower"] = _tolower;

  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }

  function _isgraph(chr) {
      return 0x20 < chr && chr < 0x7F;
    }

  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }

  function _ispunct(chr) {
      return (chr >= 33 && chr <= 47) ||
             (chr >= 58 && chr <= 64) ||
             (chr >= 91 && chr <= 96) ||
             (chr >= 123 && chr <= 126);
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }

  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }

  function _llvm_uadd_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return ((asm["setTempRet0"](x+y > 4294967295),(x+y)>>>0)|0);
    }

  var _strcoll=_strcmp;

  function _emscripten_run_script_string(ptr) {
      var s = eval(Pointer_stringify(ptr)) + '';
      var me = _emscripten_run_script_string;
      if (!me.bufferSize || me.bufferSize < s.length+1) {
        if (me.bufferSize) _free(me.buffer);
        me.bufferSize = s.length+1;
        me.buffer = _malloc(me.bufferSize);
      }
      writeStringToMemory(s, me.buffer);
      return me.buffer;
    }

  function _emscripten_run_script_int(ptr) {
      return eval(Pointer_stringify(ptr))|0;
    }

  function _strspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (!setcurr) return str - pstr;
        str++;
      }
    }


  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
        me.ret = allocate([allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL)], 'i8*', ALLOC_NORMAL); // just decimal point, for now
      }
      return me.ret;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  var _fmodl=_fmod;






  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env._stderr|0;var q=env._stdout|0;var r=+env.NaN;var s=+env.Infinity;var t=0;var u=0;var v=0;var w=0;var x=0,y=0,z=0,A=0,B=0.0,C=0,D=0,E=0,F=0.0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=global.Math.floor;var R=global.Math.abs;var S=global.Math.sqrt;var T=global.Math.pow;var U=global.Math.cos;var V=global.Math.sin;var W=global.Math.tan;var X=global.Math.acos;var Y=global.Math.asin;var Z=global.Math.atan;var _=global.Math.atan2;var $=global.Math.exp;var aa=global.Math.log;var ba=global.Math.ceil;var ca=global.Math.imul;var da=env.abort;var ea=env.assert;var fa=env.asmPrintInt;var ga=env.asmPrintFloat;var ha=env.min;var ia=env.jsCall;var ja=env.invoke_ii;var ka=env.invoke_vi;var la=env.invoke_vii;var ma=env.invoke_iiiii;var na=env.invoke_iiii;var oa=env.invoke_v;var pa=env.invoke_iii;var qa=env._llvm_lifetime_end;var ra=env._lseek;var sa=env._rand;var ta=env.__scanString;var ua=env._fclose;var va=env._freopen;var wa=env._emscripten_run_script_string;var xa=env._fflush;var ya=env._fputc;var za=env._fwrite;var Aa=env._send;var Ba=env._mktime;var Ca=env._tmpnam;var Da=env._isspace;var Ea=env._localtime;var Fa=env._read;var Ga=env._ceil;var Ha=env._strstr;var Ia=env._fsync;var Ja=env._fscanf;var Ka=env._remove;var La=env._modf;var Ma=env._strcmp;var Na=env._memchr;var Oa=env._llvm_va_end;var Pa=env._tmpfile;var Qa=env._snprintf;var Ra=env._fgetc;var Sa=env._cosh;var Ta=env.__getFloat;var Ua=env._fgets;var Va=env._close;var Wa=env._strchr;var Xa=env._asin;var Ya=env._clock;var Za=env.___setErrNo;var _a=env._emscripten_exit_with_live_runtime;var $a=env._isxdigit;var ab=env._ftell;var bb=env._exit;var cb=env._sprintf;var db=env._strrchr;var eb=env._fmod;var fb=env.__isLeapYear;var gb=env._copysign;var hb=env._ferror;var ib=env._llvm_uadd_with_overflow_i32;var jb=env._gmtime;var kb=env._localtime_r;var lb=env._sinh;var mb=env._recv;var nb=env._cos;var ob=env._putchar;var pb=env._islower;var qb=env._acos;var rb=env._isupper;var sb=env._strftime;var tb=env._strncmp;var ub=env._tzset;var vb=env._setlocale;var wb=env._toupper;var xb=env._pread;var yb=env._fopen;var zb=env._open;var Ab=env._frexp;var Bb=env.__arraySum;var Cb=env._log;var Db=env._isalnum;var Eb=env._system;var Fb=env._isalpha;var Gb=env._rmdir;var Hb=env._log10;var Ib=env._srand;var Jb=env.__formatString;var Kb=env._getenv;var Lb=env._llvm_pow_f64;var Mb=env._sbrk;var Nb=env._tanh;var Ob=env._localeconv;var Pb=env.___errno_location;var Qb=env._strerror;var Rb=env._llvm_lifetime_start;var Sb=env._strspn;var Tb=env._ungetc;var Ub=env._rename;var Vb=env._sysconf;var Wb=env._fread;var Xb=env._abort;var Yb=env._fprintf;var Zb=env._tan;var _b=env.___buildEnvironment;var $b=env._feof;var ac=env.__addDays;var bc=env._gmtime_r;var cc=env._ispunct;var dc=env._clearerr;var ec=env._fabs;var fc=env._floor;var gc=env.__reallyNegative;var hc=env._fseek;var ic=env._sqrt;var jc=env._write;var kc=env._sin;var lc=env._longjmp;var mc=env._atan;var nc=env._strpbrk;var oc=env._isgraph;var pc=env._unlink;var qc=env.__exit;var rc=env._pwrite;var sc=env._strerror_r;var tc=env._emscripten_run_script_int;var uc=env._difftime;var vc=env._iscntrl;var wc=env._atan2;var xc=env._exp;var yc=env._time;var zc=env._setvbuf;var Ac=0.0;
// EMSCRIPTEN_START_FUNCS
function Ic(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Jc(){return i|0}function Kc(a){a=a|0;i=a}function Lc(a,b){a=a|0;b=b|0;if((t|0)==0){t=a;u=b}}function Mc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Nc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Oc(a){a=a|0;G=a}function Pc(a){a=a|0;H=a}function Qc(a){a=a|0;I=a}function Rc(a){a=a|0;J=a}function Sc(a){a=a|0;K=a}function Tc(a){a=a|0;L=a}function Uc(a){a=a|0;M=a}function Vc(a){a=a|0;N=a}function Wc(a){a=a|0;O=a}function Xc(a){a=a|0;P=a}function Yc(){}function Zc(a,b){a=a|0;b=b|0;b=kf()|0;c[3152]=b;he(b,0,0)|0;zg(c[3152]|0);he(c[3152]|0,1,0)|0;_a();return 0}function _c(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+8|0;e=d|0;c[e>>2]=b;f=c[a+16>>2]|0;g=a+8|0;h=c[g>>2]|0;j=h;do{if(((c[a+24>>2]|0)-j>>4|0)>(b|0)){k=1;l=h;m=b}else{if(((j-(c[a+28>>2]|0)>>4)+5|0)>(1e6-b|0)){n=0;i=d;return n|0}o=(Ff(a,18,e)|0)==0;if(o){k=o&1;l=c[g>>2]|0;m=c[e>>2]|0;break}else{n=0;i=d;return n|0}}}while(0);e=f+4|0;f=l+(m<<4)|0;if((c[e>>2]|0)>>>0>=f>>>0){n=k;i=d;return n|0}c[e>>2]=f;n=k;i=d;return n|0}function $c(a,b){a=a|0;b=b|0;Hf(a,c[b>>2]|0);return}function ad(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((a|0)==(b|0)){return}e=a+8|0;a=(c[e>>2]|0)+(-d<<4)|0;c[e>>2]=a;if((d|0)<=0){return}f=b+8|0;b=0;g=a;while(1){a=c[f>>2]|0;c[f>>2]=a+16;h=g+(b<<4)|0;i=a;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[a+8>>2]=c[g+(b<<4)+8>>2];a=b+1|0;if((a|0)>=(d|0)){break}b=a;g=c[e>>2]|0}return}function bd(a,b){a=a|0;b=b|0;var d=0;d=(c[a+12>>2]|0)+168|0;a=c[d>>2]|0;c[d>>2]=b;return a|0}function cd(a){a=a|0;var b=0;if((a|0)==0){b=920;return b|0}b=c[(c[a+12>>2]|0)+176>>2]|0;return b|0}function dd(a,b){a=a|0;b=b|0;var d=0;if((b+1000999|0)>>>0>1000999>>>0){d=b;return d|0}d=((c[a+8>>2]|0)-(c[c[a+16>>2]>>2]|0)>>4)+b|0;return d|0}function ed(a){a=a|0;return(c[a+8>>2]|0)-((c[c[a+16>>2]>>2]|0)+16)>>4|0}function fd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((b|0)<=-1){d=a+8|0;c[d>>2]=(c[d>>2]|0)+(b+1<<4);return}d=a+8|0;e=c[d>>2]|0;f=(c[c[a+16>>2]>>2]|0)+(b+1<<4)|0;if(e>>>0<f>>>0){b=e;do{c[d>>2]=b+16;c[b+8>>2]=0;b=c[d>>2]|0;}while(b>>>0<f>>>0)}c[d>>2]=f;return}function gd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=g+16|0;b=a+8|0;a=c[b>>2]|0;if(e>>>0<a>>>0){j=g;k=e}else{l=a;m=l-16|0;c[b>>2]=m;return}while(1){a=k;e=j;g=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=g;c[j+8>>2]=c[j+24>>2];g=k+16|0;e=c[b>>2]|0;if(g>>>0<e>>>0){j=k;k=g}else{l=e;break}}m=l-16|0;c[b>>2]=m;return}function hd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;if(a>>>0>g>>>0){b=a;while(1){f=b-16|0;i=f;h=b;j=c[i+4>>2]|0;c[h>>2]=c[i>>2];c[h+4>>2]=j;c[b+8>>2]=c[b-16+8>>2];if(f>>>0>g>>>0){b=f}else{break}}k=c[e>>2]|0}else{k=a}a=k;e=g;b=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=b;c[g+8>>2]=c[k+8>>2];return}function id(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b+8|0;g=c[f>>2]|0;h=g-16|0;i=b+16|0;j=c[i>>2]|0;do{if((e|0)>0){k=(c[j>>2]|0)+(e<<4)|0;l=k>>>0<g>>>0?k:1224}else{if((e|0)>=-1000999){l=g+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[b+12>>2]|0)+40|0;break}k=-1001e3-e|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);j=h;k=l;n=c[j+4>>2]|0;c[k>>2]=c[j>>2];c[k+4>>2]=n;n=g-16+8|0;c[l+8>>2]=c[n>>2];do{if((e|0)<-1001e3){if((c[n>>2]&64|0)==0){break}l=c[h>>2]|0;if((a[l+5|0]&3)==0){break}g=c[c[c[i>>2]>>2]>>2]|0;if((a[g+5|0]&4)==0){break}eg(b,g,l)}}while(0);c[f>>2]=(c[f>>2]|0)-16;return}function jd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=b+16|0;h=c[g>>2]|0;do{if((e|0)>0){i=(c[h>>2]|0)+(e<<4)|0;j=i>>>0<(c[b+8>>2]|0)>>>0?i:1224}else{if((e|0)>=-1000999){j=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){j=(c[b+12>>2]|0)+40|0;break}i=-1001e3-e|0;k=c[h>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(i-1<<4)|0}}while(0);do{if((f|0)>0){e=(c[h>>2]|0)+(f<<4)|0;m=e>>>0<(c[b+8>>2]|0)>>>0?e:1224}else{if((f|0)>=-1000999){m=(c[b+8>>2]|0)+(f<<4)|0;break}if((f|0)==-1001e3){m=(c[b+12>>2]|0)+40|0;break}e=-1001e3-f|0;i=c[h>>2]|0;if((c[i+8>>2]|0)==22){m=1224;break}l=c[i>>2]|0;if((e|0)>(d[l+6|0]|0|0)){m=1224;break}m=l+16+(e-1<<4)|0}}while(0);h=j;e=m;l=c[h+4>>2]|0;c[e>>2]=c[h>>2];c[e+4>>2]=l;l=j+8|0;c[m+8>>2]=c[l>>2];if((f|0)>=-1001e3){return}if((c[l>>2]&64|0)==0){return}l=c[j>>2]|0;if((a[l+5|0]&3)==0){return}j=c[c[c[g>>2]>>2]>>2]|0;if((a[j+5|0]&4)==0){return}eg(b,j,l);return}function kd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;b=g;f=a;i=c[b+4>>2]|0;c[f>>2]=c[b>>2];c[f+4>>2]=i;c[a+8>>2]=c[g+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function ld(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){i=-1;return i|0}j=c[h>>2]|0;if((f|0)>(d[j+6|0]|0|0)){i=-1;return i|0}else{g=j+16+(f-1<<4)|0;break}}}while(0);if((g|0)==1224){i=-1;return i|0}i=c[g+8>>2]&15;return i|0}function md(a,b){a=a|0;b=b|0;return c[1064+(b+1<<2)>>2]|0}function nd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==22){j=1;return j|0}j=(e|0)==102|0;return j|0}function od(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;f=e|0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;j=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((h|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(h-1<<4)|0}}while(0);if((c[j+8>>2]|0)==3){m=1;i=e;return m|0}m=(Zj(j,f)|0)!=0|0;i=e;return m|0}function pd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224;h=10}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;h=10;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;h=10;break}f=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){j=-1;break}k=c[i>>2]|0;if((f|0)>(d[k+6|0]|0|0)){j=-1;break}g=k+16+(f-1<<4)|0;h=10}}while(0);do{if((h|0)==10){if((g|0)==1224){j=-1;break}e=c[g+8>>2]&15;if((e|0)==4){l=1}else{j=e;break}return l|0}}while(0);l=(j|0)==3|0;return l|0}function qd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[f>>2]|0)+(e<<4)|0;k=b>>>0<(c[a+8>>2]|0)>>>0?b:1224}else{if((e|0)>=-1000999){k=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;g=c[f>>2]|0;if((c[g+8>>2]|0)==22){l=0;return l|0}j=c[g>>2]|0;if((b|0)>(d[j+6|0]|0|0)){l=0;return l|0}else{k=j+16+(b-1<<4)|0;break}}}while(0);if((h|0)==1224|(k|0)==1224){l=0;return l|0}if((c[h+8>>2]|0)!=(c[k+8>>2]|0)){l=0;return l|0}l=(dk(0,h,k)|0)!=0|0;return l|0}function rd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[g>>2]|0)+(e<<4)|0;l=b>>>0<(c[a+8>>2]|0)>>>0?b:1224}else{if((e|0)>=-1000999){l=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;h=c[g>>2]|0;if((c[h+8>>2]|0)==22){m=0;return m|0}k=c[h>>2]|0;if((b|0)>(d[k+6|0]|0|0)){m=0;return m|0}else{l=k+16+(b-1<<4)|0;break}}}while(0);if((i|0)==1224|(l|0)==1224){m=0;return m|0}if((f|0)==0){if((c[i+8>>2]|0)!=(c[l+8>>2]|0)){m=0;return m|0}m=(dk(a,i,l)|0)!=0|0;return m|0}else if((f|0)==1){m=bk(a,i,l)|0;return m|0}else if((f|0)==2){m=ck(a,i,l)|0;return m|0}else{m=0;return m|0}return 0}function sd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=Zj(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0.0;i=f;return+p}c[e>>2]=0;p=0.0;i=f;return+p}}while(0);if((e|0)!=0){c[e>>2]=1}p=+h[o>>3];i=f;return+p}function td(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=Zj(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0;i=f;return p|0}c[e>>2]=0;p=0;i=f;return p|0}}while(0);g=~~+h[o>>3];if((e|0)==0){p=g;i=f;return p|0}c[e>>2]=1;p=g;i=f;return p|0}function ud(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+24|0;g=f|0;j=f+16|0;k=c[a+16>>2]|0;do{if((b|0)>0){l=(c[k>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1224}else{if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;n=c[k>>2]|0;if((c[n+8>>2]|0)==22){m=1224;break}o=c[n>>2]|0;if((l|0)>(d[o+6|0]|0|0)){m=1224;break}m=o+16+(l-1<<4)|0}}while(0);do{if((c[m+8>>2]|0)==3){p=m}else{k=Zj(m,g)|0;if((k|0)!=0){p=k;break}if((e|0)==0){q=0;i=f;return q|0}c[e>>2]=0;q=0;i=f;return q|0}}while(0);h[j>>3]=+h[p>>3]+6755399441055744.0;p=c[j>>2]|0;if((e|0)==0){q=p;i=f;return q|0}c[e>>2]=1;q=p;i=f;return q|0}function vd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==0){j=0;return j|0}if((e|0)!=1){j=1;return j|0}j=(c[g>>2]|0)!=0|0;return j|0}function wd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a+16|0;g=c[f>>2]|0;h=(b|0)>0;do{if(h){i=(c[g>>2]|0)+(b<<4)|0;j=i>>>0<(c[a+8>>2]|0)>>>0?i:1224}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}i=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(i-1<<4)|0}}while(0);do{if((c[j+8>>2]&15|0)==4){m=j}else{if((_j(a,j)|0)==0){if((e|0)==0){n=0;return n|0}c[e>>2]=0;n=0;return n|0}g=a+12|0;if((c[(c[g>>2]|0)+12>>2]|0)>0){sg(a)}i=c[f>>2]|0;if(h){l=(c[i>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1224;break}if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[g>>2]|0)+40|0;break}g=-1001e3-b|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){m=1224;break}i=c[l>>2]|0;if((g|0)>(d[i+6|0]|0|0)){m=1224;break}m=i+16+(g-1<<4)|0}}while(0);b=m;if((e|0)!=0){c[e>>2]=c[(c[b>>2]|0)+12>>2]}n=(c[b>>2]|0)+16|0;return n|0}function xd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==5){j=Hj(c[g>>2]|0)|0;return j|0}else if((e|0)==4){j=c[(c[g>>2]|0)+12>>2]|0;return j|0}else if((e|0)==7){j=c[(c[g>>2]|0)+16>>2]|0;return j|0}else{j=0;return j|0}return 0}function yd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=(c[g>>2]|0)+24|0;return j|0}else if((e|0)==2){j=c[g>>2]|0;return j|0}else{j=0;return j|0}return 0}function zd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);if((c[g+8>>2]|0)!=72){j=0;return j|0}j=c[g>>2]|0;return j|0}function Ad(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;f=(b|0)>0;do{if(f){g=(c[e>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);switch(c[h+8>>2]&63|0){case 5:{k=c[h>>2]|0;return k|0};case 6:{k=c[h>>2]|0;return k|0};case 38:{k=c[h>>2]|0;return k|0};case 22:{k=c[h>>2]|0;return k|0};case 8:{k=c[h>>2]|0;return k|0};case 7:case 2:{do{if(f){h=(c[e>>2]|0)+(b<<4)|0;l=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;g=c[e>>2]|0;if((c[g+8>>2]|0)==22){l=1224;break}j=c[g>>2]|0;if((h|0)>(d[j+6|0]|0|0)){l=1224;break}l=j+16+(h-1<<4)|0}}while(0);e=c[l+8>>2]&15;if((e|0)==7){k=(c[l>>2]|0)+24|0;return k|0}else if((e|0)==2){k=c[l>>2]|0;return k|0}else{k=0;return k|0}break};default:{k=0;return k|0}}return 0}function Bd(a){a=a|0;var b=0;b=a+8|0;c[(c[b>>2]|0)+8>>2]=0;c[b>>2]=(c[b>>2]|0)+16;return}function Cd(a,b){a=a|0;b=+b;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=b;c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function Dd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=+(b|0);c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function Ed(a,b){a=a|0;b=b|0;var d=0.0;if((b|0)>-1){d=+(b|0)}else{d=+(b>>>0>>>0)}b=a+8|0;a=c[b>>2]|0;h[a>>3]=d;c[a+8>>2]=3;c[b>>2]=(c[b>>2]|0)+16;return}function Fd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}f=Yi(a,b,e)|0;e=a+8|0;a=c[e>>2]|0;c[a>>2]=f;c[a+8>>2]=d[f+4|0]|0|64;c[e>>2]=(c[e>>2]|0)+16;return f+16|0}function Gd(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)==0){e=a+8|0;c[(c[e>>2]|0)+8>>2]=0;c[e>>2]=(c[e>>2]|0)+16;f=0;return f|0}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}e=Zi(a,b)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=e;c[a+8>>2]=d[e+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;f=e+16|0;return f|0}function Hd(a,b,d){a=a|0;b=b|0;d=d|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}return ai(a,b,d)|0}function Id(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}g=f;c[g>>2]=d;c[g+4>>2]=0;g=ai(a,b,f|0)|0;i=e;return g|0}function Jd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){e=c[a+8>>2]|0;c[e>>2]=b;c[e+8>>2]=22;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}e=Xf(a,d)|0;c[e+12>>2]=b;b=a+8|0;i=(c[b>>2]|0)+(-d<<4)|0;c[b>>2]=i;j=d;d=i;do{j=j-1|0;i=d+(j<<4)|0;k=e+16+(j<<4)|0;l=c[i+4>>2]|0;c[k>>2]=c[i>>2];c[k+4>>2]=l;c[e+16+(j<<4)+8>>2]=c[d+(j<<4)+8>>2];d=c[b>>2]|0}while((j|0)!=0);c[d>>2]=e;c[d+8>>2]=102;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}function Kd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=(b|0)!=0;c[a+8>>2]=1;c[d>>2]=(c[d>>2]|0)+16;return}function Ld(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=b;c[a+8>>2]=2;c[d>>2]=(c[d>>2]|0)+16;return}function Md(a){a=a|0;var b=0,d=0;b=a+8|0;d=c[b>>2]|0;c[d>>2]=a;c[d+8>>2]=72;c[b>>2]=(c[b>>2]|0)+16;return(c[(c[a+12>>2]|0)+172>>2]|0)==(a|0)|0}function Nd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=Ej(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=Zi(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=(c[f>>2]|0)-16|0;$j(a,e,h,h);return}function Od(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=(c[a+8>>2]|0)-16|0;$j(a,g,e,e);return}function Pd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;g=Zi(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;c[f>>2]=g+16;$j(a,h,g,g);return}function Qd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=Gj(c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;e=a;b=g-16|0;f=c[e+4>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=f;c[g-16+8>>2]=c[a+8>>2];return}function Rd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=Ej(c[h>>2]|0,e)|0;e=a+8|0;a=c[e>>2]|0;h=f;b=a;g=c[h+4>>2]|0;c[b>>2]=c[h>>2];c[b+4>>2]=g;c[a+8>>2]=c[f+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function Sd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}e=Aj(a)|0;f=a+8|0;g=c[f>>2]|0;c[g>>2]=e;c[g+8>>2]=69;c[f>>2]=(c[f>>2]|0)+16;if(!((b|0)>0|(d|0)>0)){return}vj(a,e,b,d);return}function Td(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=c[(c[g>>2]|0)+8>>2]|0}else if((e|0)==5){j=c[(c[g>>2]|0)+8>>2]|0}else{j=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((j|0)==0){k=0;return k|0}e=a+8|0;a=c[e>>2]|0;c[a>>2]=j;c[a+8>>2]=69;c[e>>2]=(c[e>>2]|0)+16;k=1;return k|0}function Ud(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[(c[g>>2]|0)+12>>2]|0;g=a+8|0;a=c[g>>2]|0;if((e|0)==0){c[a+8>>2]=0;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}else{c[a>>2]=e;c[a+8>>2]=69;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}}function Vd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=Ej(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=Zi(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=c[f>>2]|0;ak(a,e,h-16|0,h-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function Wd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=c[e>>2]|0;ak(a,g,b-32|0,b-16|0);c[e>>2]=(c[e>>2]|0)-32;return}function Xd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;c[f>>2]=b+16;g=Zi(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;ak(a,h,g-16|0,g-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function Yd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;g=h;h=yj(b,c[g>>2]|0,e-32|0)|0;j=e-16|0;i=h;k=c[j+4>>2]|0;c[i>>2]=c[j>>2];c[i+4>>2]=k;c[h+8>>2]=c[e-16+8>>2];a[(c[g>>2]|0)+6|0]=0;e=c[f>>2]|0;if((c[e-16+8>>2]&64|0)==0){l=e;m=l-32|0;c[f>>2]=m;return}if((a[(c[e-16>>2]|0)+5|0]&3)==0){l=e;m=l-32|0;c[f>>2]=m;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){l=e;m=l-32|0;c[f>>2]=m;return}gg(b,h);l=c[f>>2]|0;m=l-32|0;c[f>>2]=m;return}function Zd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1224}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);g=i;i=b+8|0;xj(b,c[g>>2]|0,f,(c[i>>2]|0)-16|0);f=c[i>>2]|0;if((c[f-16+8>>2]&64|0)==0){l=f;m=l-16|0;c[i>>2]=m;return}if((a[(c[f-16>>2]|0)+5|0]&3)==0){l=f;m=l-16|0;c[i>>2]=m;return}e=c[g>>2]|0;if((a[e+5|0]&4)==0){l=f;m=l-16|0;c[i>>2]=m;return}gg(b,e);l=c[i>>2]|0;m=l-16|0;c[i>>2]=m;return}function _d(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){k=0}else{k=c[e-16>>2]|0}e=c[h+8>>2]&15;if((e|0)==5){g=h;c[(c[g>>2]|0)+8>>2]=k;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}gg(b,j)}}while(0);kg(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else if((e|0)==7){g=h;h=k;c[(c[g>>2]|0)+8>>2]=h;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}eg(b,j,h)}}while(0);kg(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else{c[(c[b+12>>2]|0)+252+(e<<2)>>2]=k;l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}return 0}function $d(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){c[(c[h>>2]|0)+12>>2]=0;k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}g=h;c[(c[g>>2]|0)+12>>2]=c[e-16>>2];e=c[(c[f>>2]|0)-16>>2]|0;if((a[e+5|0]&3)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}eg(b,h,e);k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}function ae(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=b+16|0;b=c[f>>2]|0;if((a[b+18|0]&8)==0){g=0;return g|0}if((e|0)==0){h=b}else{c[e>>2]=c[b+24>>2];h=c[f>>2]|0}g=d[h+37|0]|0;return g|0}function be(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a+8|0;i=(c[h>>2]|0)+(~d<<4)|0;do{if((g|0)==0){j=4}else{if((b[a+36>>1]|0)!=0){j=4;break}d=a+16|0;c[(c[d>>2]|0)+28>>2]=g;c[(c[d>>2]|0)+24>>2]=f;Mf(a,i,e,1)}}while(0);if((j|0)==4){Mf(a,i,e,0)}if((e|0)!=-1){return}e=(c[a+16>>2]|0)+4|0;a=c[h>>2]|0;if((c[e>>2]|0)>>>0>=a>>>0){return}c[e>>2]=a;return}function ce(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=i;i=i+8|0;m=l|0;if((h|0)==0){n=0}else{o=c[e+16>>2]|0;do{if((h|0)>0){p=(c[o>>2]|0)+(h<<4)|0;q=p>>>0<(c[e+8>>2]|0)>>>0?p:1224}else{if((h|0)>=-1000999){q=(c[e+8>>2]|0)+(h<<4)|0;break}if((h|0)==-1001e3){q=(c[e+12>>2]|0)+40|0;break}p=-1001e3-h|0;r=c[o>>2]|0;if((c[r+8>>2]|0)==22){q=1224;break}s=c[r>>2]|0;if((p|0)>(d[s+6|0]|0)){q=1224;break}q=s+16+(p-1<<4)|0}}while(0);n=q-(c[e+28>>2]|0)|0}q=e+8|0;o=(c[q>>2]|0)+(~f<<4)|0;f=m|0;c[f>>2]=o;do{if((k|0)==0){t=14}else{if((b[e+36>>1]|0)!=0){t=14;break}h=c[e+16>>2]|0;c[h+28>>2]=k;c[h+24>>2]=j;c[h+20>>2]=(c[f>>2]|0)-(c[e+28>>2]|0);a[h+36|0]=a[e+41|0]|0;p=e+68|0;s=h+32|0;c[s>>2]=c[p>>2];c[p>>2]=n;r=h+18|0;a[r]=a[r]|16;Mf(e,c[f>>2]|0,g,1);a[r]=a[r]&-17;c[p>>2]=c[s>>2];u=0}}while(0);if((t|0)==14){c[m+4>>2]=g;u=Rf(e,8,m,o-(c[e+28>>2]|0)|0,n)|0}if((g|0)!=-1){i=l;return u|0}g=(c[e+16>>2]|0)+4|0;e=c[q>>2]|0;if((c[g>>2]|0)>>>0>=e>>>0){i=l;return u|0}c[g>>2]=e;i=l;return u|0}function de(a,b){a=a|0;b=b|0;Mf(a,c[b>>2]|0,c[b+4>>2]|0,0);return}function ee(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+24|0;j=h|0;lk(b,j,d,e);e=Sf(b,j,(f|0)==0?9512:f,g)|0;if((e|0)!=0){i=h;return e|0}g=c[(c[b+8>>2]|0)-16>>2]|0;if((a[g+6|0]|0)!=1){i=h;return e|0}f=Ej(c[(c[b+12>>2]|0)+40>>2]|0,2)|0;j=g+16|0;g=c[(c[j>>2]|0)+8>>2]|0;d=f;k=g;l=c[d+4>>2]|0;c[k>>2]=c[d>>2];c[k+4>>2]=l;l=f+8|0;c[g+8>>2]=c[l>>2];if((c[l>>2]&64|0)==0){i=h;return e|0}l=c[f>>2]|0;if((a[l+5|0]&3)==0){i=h;return e|0}f=c[j>>2]|0;if((a[f+5|0]&4)==0){i=h;return e|0}eg(b,f,l);i=h;return e|0}function fe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+8>>2]|0;if((c[e-16+8>>2]|0)!=70){f=1;return f|0}f=Vf(a,c[(c[e-16>>2]|0)+12>>2]|0,b,d,0)|0;return f|0}function ge(a){a=a|0;return d[a+6|0]|0|0}function he(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=c[b+12>>2]|0;a:do{switch(e|0){case 0:{a[g+63|0]=0;h=0;break};case 10:{lg(b,2);h=0;break};case 11:{lg(b,0);h=0;break};case 6:{i=g+156|0;j=c[i>>2]|0;c[i>>2]=f;h=j;break};case 8:{j=g+160|0;i=c[j>>2]|0;c[j>>2]=f;h=i;break};case 5:{if((a[g+62|0]|0)==2){i=(c[g+20>>2]|0)==0|0;qg(b);h=i;break a}i=(f<<10)-1600|0;if((a[g+63|0]|0)==0){k=i;Li(g,k);qg(b);l=g+61|0;m=a[l]|0;n=m<<24>>24==5;o=n&1;return o|0}k=(c[g+12>>2]|0)+i|0;Li(g,k);qg(b);l=g+61|0;m=a[l]|0;n=m<<24>>24==5;o=n&1;return o|0};case 7:{i=g+164|0;j=c[i>>2]|0;c[i>>2]=f;h=j;break};case 3:{h=((c[g+12>>2]|0)+(c[g+8>>2]|0)|0)>>>10;break};case 9:{h=d[g+63|0]|0;break};case 1:{Li(g,0);a[g+63|0]=1;h=0;break};case 2:{tg(b,0);h=0;break};case 4:{h=(c[g+12>>2]|0)+(c[g+8>>2]|0)&1023;break};default:{h=-1}}}while(0);return h|0}function ie(a){a=a|0;Df(a);return 0}function je(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=uj(a,c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;c[e>>2]=(b|0)==0?g-16|0:g+16|0;return b|0}function ke(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)>1){if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}fk(a,b);return}else{if((b|0)!=0){return}b=a+8|0;e=c[b>>2]|0;f=Yi(a,12128,0)|0;c[e>>2]=f;c[e+8>>2]=d[f+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;return}}function le(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;gk(a,c[e>>2]|0,g);c[e>>2]=(c[e>>2]|0)+16;return}function me(a,b){a=a|0;b=b|0;var d=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){sg(a)}d=_i(a,b,0)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=d;c[a+8>>2]=71;c[b>>2]=(c[b>>2]|0)+16;return d+24|0}function ne(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=c[h+8>>2]&63;do{if((f|0)==38){b=c[h>>2]|0;if((e|0)<=0){k=0;return k|0}if((d[b+6|0]|0|0)<(e|0)){k=0;return k|0}else{l=b+16+(e-1<<4)|0;m=12128;break}}else if((f|0)==6){b=c[h>>2]|0;g=c[b+12>>2]|0;if((e|0)<=0){k=0;return k|0}if((c[g+40>>2]|0)<(e|0)){k=0;return k|0}j=e-1|0;i=c[(c[b+16+(j<<2)>>2]|0)+8>>2]|0;b=c[(c[g+28>>2]|0)+(j<<3)>>2]|0;if((b|0)==0){l=i;m=12128;break}j=b+16|0;if((j|0)==0){k=0;return k|0}else{l=i;m=j;break}}else{k=0;return k|0}}while(0);e=a+8|0;a=c[e>>2]|0;h=l;f=a;j=c[h+4>>2]|0;c[f>>2]=c[h>>2];c[f+4>>2]=j;c[a+8>>2]=c[l+8>>2];c[e>>2]=(c[e>>2]|0)+16;k=m;return k|0}function oe(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1224}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);g=c[i+8>>2]&63;do{if((g|0)==38){e=c[i>>2]|0;if((f|0)<=0){l=0;return l|0}if((d[e+6|0]|0|0)<(f|0)){l=0;return l|0}else{m=e+16+(f-1<<4)|0;n=e;o=12128;break}}else if((g|0)==6){e=c[i>>2]|0;h=c[e+12>>2]|0;if((f|0)<=0){l=0;return l|0}if((c[h+40>>2]|0)<(f|0)){l=0;return l|0}k=f-1|0;j=c[e+16+(k<<2)>>2]|0;e=c[j+8>>2]|0;p=j;j=c[(c[h+28>>2]|0)+(k<<3)>>2]|0;if((j|0)==0){m=e;n=p;o=12128;break}k=j+16|0;if((k|0)==0){l=0;return l|0}else{m=e;n=p;o=k;break}}else{l=0;return l|0}}while(0);f=b+8|0;i=c[f>>2]|0;g=i-16|0;c[f>>2]=g;k=g;g=m;p=c[k+4>>2]|0;c[g>>2]=c[k>>2];c[g+4>>2]=p;c[m+8>>2]=c[i-16+8>>2];i=c[f>>2]|0;if((c[i+8>>2]&64|0)==0){l=o;return l|0}f=c[i>>2]|0;if((a[f+5|0]&3)==0){l=o;return l|0}if((a[n+5|0]&4)==0){l=o;return l|0}eg(b,n,f);l=o;return l|0}function pe(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[a+16>>2]|0;g=(b|0)>0;do{if(g){h=(c[f>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);h=c[i+8>>2]&63;if((h|0)==38){l=(c[i>>2]|0)+16+(e-1<<4)|0;return l|0}else if((h|0)==6){do{if(g){h=(c[f>>2]|0)+(b<<4)|0;m=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){m=1224;break}k=c[i>>2]|0;if((h|0)>(d[k+6|0]|0|0)){m=1224;break}m=k+16+(h-1<<4)|0}}while(0);l=c[(c[m>>2]|0)+16+(e-1<<2)>>2]|0;return l|0}else{l=0;return l|0}return 0}function qe(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=c[b+16>>2]|0;do{if((e|0)>0){j=(c[i>>2]|0)+(e<<4)|0;k=j>>>0<(c[b+8>>2]|0)>>>0?j:1224}else{if((e|0)>=-1000999){k=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){k=1224;break}m=c[l>>2]|0;if((j|0)>(d[m+6|0]|0|0)){k=1224;break}k=m+16+(j-1<<4)|0}}while(0);e=c[k>>2]|0;k=e+16+(f-1<<2)|0;do{if((g|0)>0){f=(c[i>>2]|0)+(g<<4)|0;n=f>>>0<(c[b+8>>2]|0)>>>0?f:1224}else{if((g|0)>=-1000999){n=(c[b+8>>2]|0)+(g<<4)|0;break}if((g|0)==-1001e3){n=(c[b+12>>2]|0)+40|0;break}f=-1001e3-g|0;j=c[i>>2]|0;if((c[j+8>>2]|0)==22){n=1224;break}m=c[j>>2]|0;if((f|0)>(d[m+6|0]|0|0)){n=1224;break}n=m+16+(f-1<<4)|0}}while(0);i=(c[n>>2]|0)+16+(h-1<<2)|0;c[k>>2]=c[i>>2];k=c[i>>2]|0;if((a[k+5|0]&3)==0){return}if((a[e+5|0]&4)==0){return}eg(b,e,k);return}function re(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+208|0;h=g|0;j=g+104|0;k=ed(b)|0;l=1;m=1;while(1){if((sf(d,m,h)|0)==0){break}else{l=m;m=m<<1}}if((l|0)<(m|0)){n=m;o=l;while(1){l=(n+o|0)/2|0;p=(sf(d,l,h)|0)==0;q=p?l:n;r=p?o:l+1|0;if((r|0)<(q|0)){n=q;o=r}else{s=q;break}}}else{s=m}m=(s-1|0)>22?12:0;if((e|0)!=0){Id(b,12064,(t=i,i=i+8|0,c[t>>2]=e,t)|0)|0;i=t}Fd(b,11744,16)|0;if((sf(d,f,j)|0)==0){u=ed(b)|0;v=u-k|0;ke(b,v);i=g;return}e=s-11|0;s=j+36|0;o=j+20|0;n=j+8|0;h=j+12|0;q=j+24|0;r=j+35|0;l=j+4|0;p=f;while(1){f=p+1|0;if((f|0)==(m|0)){Fd(b,9224,5)|0;w=e}else{wf(d,7432,j)|0;Id(b,5840,(t=i,i=i+8|0,c[t>>2]=s,t)|0)|0;i=t;x=c[o>>2]|0;if((x|0)>0){Id(b,4472,(t=i,i=i+8|0,c[t>>2]=x,t)|0)|0;i=t}Fd(b,3872,4)|0;do{if((a[c[n>>2]|0]|0)==0){x=a[c[h>>2]|0]|0;if((x<<24>>24|0)==109){Fd(b,4376,10)|0;break}else if((x<<24>>24|0)==67){if((ue(b,j)|0)==0){Fd(b,11424,1)|0;break}else{x=wd(b,-1,0)|0;Id(b,4456,(t=i,i=i+8|0,c[t>>2]=x,t)|0)|0;i=t;gd(b,-2);break}}else{x=c[q>>2]|0;Id(b,4288,(t=i,i=i+16|0,c[t>>2]=s,c[t+8>>2]=x,t)|0)|0;i=t;break}}else{Id(b,4456,(t=i,i=i+8|0,c[t>>2]=c[l>>2],t)|0)|0;i=t}}while(0);if((a[r]|0)!=0){Fd(b,3488,20)|0}ke(b,(ed(b)|0)-k|0);w=f}if((sf(d,w,j)|0)==0){break}else{p=w}}u=ed(b)|0;v=u-k|0;ke(b,v);i=g;return}function se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+104|0;f=e|0;if((sf(a,0,f)|0)==0){g=te(a,3040,(h=i,i=i+16|0,c[h>>2]=b,c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}wf(a,2720,f)|0;do{if((Ma(c[f+8>>2]|0,12048)|0)==0){g=b-1|0;if((g|0)!=0){k=g;break}g=te(a,11768,(h=i,i=i+16|0,c[h>>2]=c[f+4>>2],c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}else{k=b}}while(0);b=f+4|0;g=c[b>>2]|0;if((g|0)==0){if((ue(a,f)|0)==0){l=11424}else{l=wd(a,-1,0)|0}c[b>>2]=l;m=l}else{m=g}g=te(a,11064,(h=i,i=i+24|0,c[h>>2]=k,c[h+8>>2]=m,c[h+16>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}function te(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+120|0;f=e|0;g=e+104|0;h=g|0;j=g;c[j>>2]=d;c[j+4>>2]=0;do{if((sf(a,1,f)|0)!=0){wf(a,10800,f)|0;j=c[f+20>>2]|0;if((j|0)<=0){break}Id(a,10584,(d=i,i=i+16|0,c[d>>2]=f+36,c[d+8>>2]=j,d)|0)|0;i=d;k=Hd(a,b,h)|0;ke(a,2);l=ie(a)|0;i=e;return l|0}}while(0);Fd(a,12112,0)|0;k=Hd(a,b,h)|0;ke(a,2);l=ie(a)|0;i=e;return l|0}function ue(a,b){a=a|0;b=b|0;var c=0,d=0;c=ed(a)|0;wf(a,4624,b)|0;Rd(a,-1001e3,2);b=c+1|0;if((nf(a,b,2)|0)==0){fd(a,c);d=0;return d|0}else{jd(a,-1,b);fd(a,-3);d=1;return d|0}return 0}function ve(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+104|0;e=d|0;do{if((sf(a,b,e)|0)!=0){wf(a,10800,e)|0;f=c[e+20>>2]|0;if((f|0)<=0){break}Id(a,10584,(g=i,i=i+16|0,c[g>>2]=e+36,c[g+8>>2]=f,g)|0)|0;i=g;i=d;return}}while(0);Fd(a,12112,0)|0;i=d;return}function we(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=c[(Pb()|0)>>2]|0;if((b|0)!=0){Kd(a,1);g=1;i=e;return g|0}Bd(a);b=Qb(f|0)|0;if((d|0)==0){Gd(a,b)|0}else{Id(a,10136,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=b,h)|0)|0;i=h}Dd(a,f);g=3;i=e;return g|0}function xe(a,b){a=a|0;b=b|0;var d=0;if((b|0)==(-1|0)){d=c[(Pb()|0)>>2]|0;Bd(a);Gd(a,Qb(d|0)|0)|0;Dd(a,d);return 3}else if((b|0)==0){Kd(a,1)}else{Bd(a)}Gd(a,9920)|0;Dd(a,b);return 3}function ye(a,b){a=a|0;b=b|0;var c=0;Pd(a,-1001e3,b);if((ld(a,-1)|0)!=0){c=0;return c|0}fd(a,-2);Sd(a,0,0);kd(a,-1);Xd(a,-1001e3,b);c=1;return c|0}function ze(a,b){a=a|0;b=b|0;Pd(a,-1001e3,b);_d(a,-2)|0;return}function Ae(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=yd(a,b)|0;if((d|0)==0){e=0;return e|0}if((Td(a,b)|0)==0){e=0;return e|0}Pd(a,-1001e3,c);c=(qd(a,-1,-2)|0)==0;fd(a,-3);e=c?0:d;return e|0}function Be(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=yd(a,b)|0;do{if((f|0)!=0){if((Td(a,b)|0)==0){break}Pd(a,-1001e3,d);g=(qd(a,-1,-2)|0)==0;h=g?0:f;fd(a,-3);if((h|0)==0){break}else{j=h}i=e;return j|0}}while(0);f=md(a,ld(a,b)|0)|0;h=Id(a,4720,(g=i,i=i+16|0,c[g>>2]=d,c[g+8>>2]=f,g)|0)|0;i=g;se(a,b,h)|0;j=0;i=e;return j|0}function Ce(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;do{if((d|0)==0){g=wd(a,b,0)|0;if((g|0)!=0){h=g;break}g=md(a,4)|0;j=md(a,ld(a,b)|0)|0;k=Id(a,4720,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;se(a,b,k)|0;h=0}else{h=De(a,b,d,0)|0}}while(0);d=0;while(1){k=c[e+(d<<2)>>2]|0;if((k|0)==0){break}if((Ma(k|0,h|0)|0)==0){m=d;n=9;break}else{d=d+1|0}}if((n|0)==9){i=f;return m|0}n=Id(a,9728,(l=i,i=i+8|0,c[l>>2]=h,l)|0)|0;i=l;m=se(a,b,n)|0;i=f;return m|0}function De(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if((ld(a,b)|0)>=1){g=wd(a,b,e)|0;if((g|0)!=0){h=g;i=f;return h|0}g=md(a,4)|0;j=md(a,ld(a,b)|0)|0;k=Id(a,4720,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;se(a,b,k)|0;h=0;i=f;return h|0}if((e|0)==0){h=d;i=f;return h|0}if((d|0)==0){m=0}else{m=Um(d|0)|0}c[e>>2]=m;h=d;i=f;return h|0}function Ee(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=wd(a,b,d)|0;if((f|0)!=0){i=e;return f|0}d=md(a,4)|0;g=md(a,ld(a,b)|0)|0;h=Id(a,4720,(j=i,i=i+16|0,c[j>>2]=d,c[j+8>>2]=g,j)|0)|0;i=j;se(a,b,h)|0;i=e;return f|0}function Fe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((_c(a,b+20|0)|0)!=0){i=e;return}if((d|0)==0){te(a,9288,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;i=e;return}else{te(a,9488,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;i=e;return}}function Ge(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((ld(a,b)|0)==(d|0)){i=e;return}f=md(a,d)|0;d=md(a,ld(a,b)|0)|0;g=Id(a,4720,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=d,h)|0)|0;i=h;se(a,b,g)|0;i=e;return}function He(a,b){a=a|0;b=b|0;if((ld(a,b)|0)!=-1){return}se(a,b,9032)|0;return}function Ie(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=+sd(a,b,e);if((c[e>>2]|0)!=0){i=d;return+f}e=md(a,3)|0;g=md(a,ld(a,b)|0)|0;h=Id(a,4720,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;se(a,b,h)|0;i=d;return+f}function Je(a,b,c){a=a|0;b=b|0;c=+c;var d=0.0;if((ld(a,b)|0)<1){d=c;return+d}d=+Ie(a,b);return+d}function Ke(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=td(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=md(a,3)|0;g=md(a,ld(a,b)|0)|0;h=Id(a,4720,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;se(a,b,h)|0;i=d;return f|0}function Le(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=ud(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=md(a,3)|0;g=md(a,ld(a,b)|0)|0;h=Id(a,4720,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;se(a,b,h)|0;i=d;return f|0}function Me(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((ld(a,b)|0)<1){d=c;return d|0}d=Ke(a,b)|0;return d|0}function Ne(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;e=c[a+12>>2]|0;f=a+4|0;g=c[f>>2]|0;h=a+8|0;j=c[h>>2]|0;if((g-j|0)>>>0>=b>>>0){k=j;l=c[a>>2]|0;m=l+k|0;i=d;return m|0}n=g<<1;g=(n-j|0)>>>0<b>>>0?j+b|0:n;if(g>>>0<j>>>0|(g-j|0)>>>0<b>>>0){te(e,8864,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b}b=me(e,g)|0;j=a|0;Vm(b|0,c[j>>2]|0,c[h>>2]|0)|0;if((c[j>>2]|0)!=(a+16|0)){gd(e,-2)}c[j>>2]=b;c[f>>2]=g;k=c[h>>2]|0;l=b;m=l+k|0;i=d;return m|0}function Oe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;f=c[a+12>>2]|0;g=a+4|0;h=c[g>>2]|0;j=a+8|0;k=c[j>>2]|0;if((h-k|0)>>>0>=d>>>0){l=k;m=c[a>>2]|0;n=m+l|0;Vm(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}q=h<<1;h=(q-k|0)>>>0<d>>>0?k+d|0:q;if(h>>>0<k>>>0|(h-k|0)>>>0<d>>>0){te(f,8864,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}k=me(f,h)|0;q=a|0;Vm(k|0,c[q>>2]|0,c[j>>2]|0)|0;if((c[q>>2]|0)!=(a+16|0)){gd(f,-2)}c[q>>2]=k;c[g>>2]=h;l=c[j>>2]|0;m=k;n=m+l|0;Vm(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}function Pe(a,b){a=a|0;b=b|0;Oe(a,b,Um(b|0)|0);return}function Qe(a){a=a|0;var b=0,d=0;b=c[a+12>>2]|0;d=a|0;Fd(b,c[d>>2]|0,c[a+8>>2]|0)|0;if((c[d>>2]|0)==(a+16|0)){return}gd(b,-2);return}function Re(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+8|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;d=c[a+12>>2]|0;b=a|0;Fd(d,c[b>>2]|0,e)|0;if((c[b>>2]|0)==(a+16|0)){return}gd(d,-2);return}function Se(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;d=b|0;e=c[a+12>>2]|0;f=wd(e,-1,d)|0;g=a|0;h=a+16|0;if((c[g>>2]|0)!=(h|0)){hd(e,-2)}Oe(a,f,c[d>>2]|0);gd(e,(c[g>>2]|0)!=(h|0)?-2:-1);i=b;return}function Te(a,b){a=a|0;b=b|0;c[b+12>>2]=a;c[b>>2]=b+16;c[b+8>>2]=0;c[b+4>>2]=1024;return}function Ue(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;c[b+12>>2]=a;e=b+16|0;f=b|0;c[f>>2]=e;g=b+8|0;c[g>>2]=0;h=b+4|0;c[h>>2]=1024;if(d>>>0<=1024>>>0){i=0;j=e;k=j+i|0;return k|0}b=d>>>0>2048>>>0?d:2048;d=me(a,b)|0;Vm(d|0,c[f>>2]|0,c[g>>2]|0)|0;if((c[f>>2]|0)!=(e|0)){gd(a,-2)}c[f>>2]=d;c[h>>2]=b;i=c[g>>2]|0;j=d;k=j+i|0;return k|0}function Ve(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0;f=i;i=i+1040|0;g=f|0;h=f+1032|0;j=(ed(b)|0)+1|0;k=(d|0)==0;do{if(k){Fd(b,8616,6)|0;c[g+4>>2]=c[o>>2]}else{Id(b,8408,(l=i,i=i+8|0,c[l>>2]=d,l)|0)|0;i=l;m=yb(d|0,8200)|0;c[g+4>>2]=m;if((m|0)!=0){break}m=Qb(c[(Pb()|0)>>2]|0)|0;n=(wd(b,j,0)|0)+1|0;Id(b,4864,(l=i,i=i+24|0,c[l>>2]=7960,c[l+8>>2]=n,c[l+16>>2]=m,l)|0)|0;i=l;gd(b,j);p=7;i=f;return p|0}}while(0);if((We(g,h)|0)!=0){m=g|0;n=c[m>>2]|0;c[m>>2]=n+1;a[g+8+n|0]=10}n=c[h>>2]|0;do{if((n|0)!=27|k){q=n}else{m=g+4|0;r=va(d|0,7584,c[m>>2]|0)|0;c[m>>2]=r;if((r|0)!=0){We(g,h)|0;q=c[h>>2]|0;break}r=Qb(c[(Pb()|0)>>2]|0)|0;m=(wd(b,j,0)|0)+1|0;Id(b,4864,(l=i,i=i+24|0,c[l>>2]=7424,c[l+8>>2]=m,c[l+16>>2]=r,l)|0)|0;i=l;gd(b,j);p=7;i=f;return p|0}}while(0);if((q|0)!=-1){h=g|0;d=c[h>>2]|0;c[h>>2]=d+1;a[g+8+d|0]=q}q=ee(b,6,g,wd(b,-1,0)|0,e)|0;e=c[g+4>>2]|0;g=hb(e|0)|0;if(!k){ua(e|0)|0}if((g|0)==0){gd(b,j);p=q;i=f;return p|0}else{fd(b,j);q=Qb(c[(Pb()|0)>>2]|0)|0;g=(wd(b,j,0)|0)+1|0;Id(b,4864,(l=i,i=i+24|0,c[l>>2]=7272,c[l+8>>2]=g,c[l+16>>2]=q,l)|0)|0;i=l;gd(b,j);p=7;i=f;return p|0}return 0}function We(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b|0;c[e>>2]=0;f=b+4|0;g=Ra(c[f>>2]|0)|0;do{if((g|0)==239){h=c[e>>2]|0;c[e>>2]=h+1;a[b+8+h|0]=-17;h=Ra(c[f>>2]|0)|0;if((h|0)==(-1|0)){i=5;break}else if((h|0)!=187){j=h;break}h=c[e>>2]|0;c[e>>2]=h+1;a[b+8+h|0]=-69;h=Ra(c[f>>2]|0)|0;if((h|0)==(-1|0)){i=5;break}else if((h|0)!=191){j=h;break}a[(c[e>>2]|0)+(b+8)|0]=-65;c[e>>2]=0;j=Ra(c[f>>2]|0)|0}else if((g|0)==(-1|0)){i=5}else{j=g}}while(0);if((i|0)==5){c[d>>2]=-1;k=0;return k|0}c[d>>2]=j;if((j|0)!=35){k=0;return k|0}do{j=Ra(c[f>>2]|0)|0}while(!((j|0)==(-1|0)|(j|0)==10));c[d>>2]=Ra(c[f>>2]|0)|0;k=1;return k|0}function Xe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b;e=c[a>>2]|0;if((e|0)>0){c[d>>2]=e;c[a>>2]=0;f=b+8|0;return f|0}a=b+4|0;if(($b(c[a>>2]|0)|0)!=0){f=0;return f|0}e=b+8|0;c[d>>2]=Wb(e|0,1,1024,c[a>>2]|0)|0;f=e;return f|0}function Ye(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;c[h+4>>2]=d;d=ee(a,8,h,e,f)|0;i=g;return d|0}function Ze(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b+4|0;e=c[a>>2]|0;if((e|0)==0){f=0;return f|0}c[d>>2]=e;c[a>>2]=0;f=c[b>>2]|0;return f|0}function _e(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((Td(a,b)|0)==0){d=0;return d|0}Gd(a,c)|0;Qd(a,-2);if((ld(a,-1)|0)==0){fd(a,-3);d=0;return d|0}else{gd(a,-2);d=1;return d|0}return 0}function $e(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=dd(a,b)|0;if((Td(a,d)|0)==0){e=0;return e|0}Gd(a,c)|0;Qd(a,-2);if((ld(a,-1)|0)==0){fd(a,-3);e=0;return e|0}else{gd(a,-2);kd(a,d);be(a,1,1,0,0);e=1;return e|0}return 0}function af(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;le(a,b);b=td(a,-1,e)|0;if((c[e>>2]|0)!=0){fd(a,-2);i=d;return b|0}te(a,7072,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;fd(a,-2);i=d;return b|0}function bf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;do{if(($e(a,b,6856)|0)==0){f=ld(a,b)|0;if((f|0)==3|(f|0)==4){kd(a,b);break}else if((f|0)==1){g=(vd(a,b)|0)!=0;Gd(a,g?6688:6528)|0;break}else if((f|0)==0){Fd(a,6352,3)|0;break}else{f=md(a,ld(a,b)|0)|0;g=Ad(a,b)|0;Id(a,6200,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=g,h)|0)|0;i=h;break}}}while(0);b=wd(a,-1,d)|0;i=e;return b|0}function cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;df(a,-1001e3,6120,1)|0;Pd(a,-1,b);if((ld(a,-1)|0)==5){gd(a,-2);i=e;return}fd(a,-2);Rd(a,-1001e3,2);if((df(a,0,b,d)|0)!=0){te(a,5976,(d=i,i=i+8|0,c[d>>2]=b,d)|0)|0;i=d}kd(a,-1);Xd(a,-3,b);gd(a,-2);i=e;return}function df(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if((c|0)==0){f=d}else{kd(b,c);f=d}while(1){d=Wa(f|0,46)|0;if((d|0)==0){g=f+(Um(f|0)|0)|0}else{g=d}d=g-f|0;Fd(b,f,d)|0;Qd(b,-2);if((ld(b,-1)|0)==0){fd(b,-2);Sd(b,0,(a[g]|0)==46?1:e);Fd(b,f,d)|0;kd(b,-2);Wd(b,-4)}else{if((ld(b,-1)|0)!=5){break}}gd(b,-2);if((a[g]|0)==46){f=g+1|0}else{h=0;i=10;break}}if((i|0)==10){return h|0}fd(b,-3);h=f;return h|0}function ef(a,b){a=a|0;b=+b;var d=0,e=0,f=0.0,g=0;d=i;e=cd(a)|0;do{if((e|0)==(cd(0)|0)){f=+h[e>>3];if(f==b){break}te(a,5488,(g=i,i=i+16|0,h[g>>3]=b,h[g+8>>3]=f,g)|0)|0;i=g}else{te(a,5696,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}}while(0);Cd(a,-4660.0);do{if((td(a,-1,0)|0)==-4660){if((ud(a,-1,0)|0)!=-4660){break}fd(a,-2);i=d;return}}while(0);te(a,5288,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;fd(a,-2);i=d;return}function ff(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;ef(a,502.0);if((_c(a,d+20|0)|0)==0){te(a,9488,(f=i,i=i+8|0,c[f>>2]=5816,f)|0)|0;i=f}f=b|0;if((c[f>>2]|0)==0){g=~d;fd(a,g);i=e;return}b=-2-d|0;h=-d|0;if((d|0)>0){j=f}else{k=f;do{Jd(a,c[k+4>>2]|0,d);Xd(a,b,c[k>>2]|0);k=k+8|0;}while((c[k>>2]|0)!=0);g=~d;fd(a,g);i=e;return}do{k=0;do{kd(a,h);k=k+1|0;}while((k|0)<(d|0));Jd(a,c[j+4>>2]|0,d);Xd(a,b,c[j>>2]|0);j=j+8|0;}while((c[j>>2]|0)!=0);g=~d;fd(a,g);i=e;return}function gf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;Pd(a,b,c);if((ld(a,-1)|0)==5){d=1;return d|0}fd(a,-2);e=dd(a,b)|0;Sd(a,0,0);kd(a,-1);Xd(a,e,c);d=0;return d|0}function hf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Jd(a,c,0);Gd(a,b)|0;be(a,1,1,0,0);gf(a,-1001e3,6120)|0;kd(a,-2);Xd(a,-2,b);fd(a,-2);if((d|0)==0){return}kd(a,-1);Vd(a,b);return}function jf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+1040|0;g=f|0;h=Um(d|0)|0;j=g+12|0;c[j>>2]=a;k=g+16|0;l=g|0;c[l>>2]=k;m=g+8|0;c[m>>2]=0;n=g+4|0;c[n>>2]=1024;g=Ha(b|0,d|0)|0;if((g|0)==0){o=b;p=a;q=1024;r=0}else{s=b;b=g;g=0;t=a;u=1024;while(1){v=b-s|0;if((u-g|0)>>>0<v>>>0){w=u<<1;x=(w-g|0)>>>0<v>>>0?g+v|0:w;if(x>>>0<g>>>0|(x-g|0)>>>0<v>>>0){te(t,8864,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}w=me(t,x)|0;Vm(w|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){gd(t,-2)}c[l>>2]=w;c[n>>2]=x;z=c[m>>2]|0;A=w}else{z=g;A=c[l>>2]|0}Vm(A+z|0,s|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=Um(e|0)|0;x=c[j>>2]|0;B=c[n>>2]|0;if((B-w|0)>>>0<v>>>0){C=B<<1;B=(C-w|0)>>>0<v>>>0?w+v|0:C;if(B>>>0<w>>>0|(B-w|0)>>>0<v>>>0){te(x,8864,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}C=me(x,B)|0;Vm(C|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){gd(x,-2)}c[l>>2]=C;c[n>>2]=B;D=c[m>>2]|0;E=C}else{D=w;E=c[l>>2]|0}Vm(E+D|0,e|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=b+h|0;C=Ha(v|0,d|0)|0;B=c[j>>2]|0;x=c[n>>2]|0;if((C|0)==0){o=v;p=B;q=x;r=w;break}else{s=v;b=C;g=w;t=B;u=x}}}u=Um(o|0)|0;if((q-r|0)>>>0<u>>>0){t=q<<1;q=(t-r|0)>>>0<u>>>0?r+u|0:t;if(q>>>0<r>>>0|(q-r|0)>>>0<u>>>0){te(p,8864,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}y=me(p,q)|0;Vm(y|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){gd(p,-2)}c[l>>2]=y;c[n>>2]=q;F=c[m>>2]|0;G=y}else{F=r;G=c[l>>2]|0}Vm(G+F|0,o|0,u)|0;o=(c[m>>2]|0)+u|0;c[m>>2]=o;m=c[j>>2]|0;Fd(m,c[l>>2]|0,o)|0;if((c[l>>2]|0)==(k|0)){H=wd(a,-1,0)|0;i=f;return H|0}gd(m,-2);H=wd(a,-1,0)|0;i=f;return H|0}function kf(){var a=0;a=Qi(8,0)|0;if((a|0)==0){return a|0}bd(a,94)|0;return a|0}function lf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;if((d|0)==0){Hm(b);e=0}else{e=Im(b,d)|0}return e|0}function mf(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[p>>2]|0;e=wd(a,-1,0)|0;Yb(d|0,5104,(a=i,i=i+8|0,c[a>>2]=e,a)|0)|0;i=a;xa(d|0)|0;i=b;return 0}function nf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;if((c|0)==0){d=0;return d|0}if((ld(a,-1)|0)!=5){d=0;return d|0}Bd(a);if((je(a,-2)|0)==0){d=0;return d|0}e=c-1|0;while(1){if((ld(a,-2)|0)==4){if((qd(a,b,-1)|0)!=0){f=7;break}if((nf(a,b,e)|0)!=0){f=9;break}}fd(a,-2);if((je(a,-2)|0)==0){d=0;f=11;break}}if((f|0)==7){fd(a,-2);d=1;return d|0}else if((f|0)==9){gd(a,-2);Fd(a,4528,1)|0;hd(a,-2);ke(a,3);d=1;return d|0}else if((f|0)==11){return d|0}return 0}function of(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==0){g=3}else{if((e|0)==0){g=3}else{h=d;i=e&255}}if((g|0)==3){h=0;i=0}g=c[b+16>>2]|0;if((a[g+18|0]&1)!=0){c[b+20>>2]=c[g+28>>2]}c[b+52>>2]=h;c[b+44>>2]=f;c[b+48>>2]=f;a[b+40|0]=i;return 1}function pf(a){a=a|0;return c[a+52>>2]|0}function qf(a){a=a|0;return d[a+40|0]|0|0}function rf(a){a=a|0;return c[a+44>>2]|0}function sf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;a:do{if((b|0)<0){e=0}else{f=c[a+16>>2]|0;if((b|0)>0){g=a+72|0;h=b;i=f;do{if((i|0)==(g|0)){e=0;break a}h=h-1|0;i=c[i+8>>2]|0;}while((h|0)>0);if((h|0)==0){j=i}else{e=0;break}}else{j=f}if((j|0)==(a+72|0)){e=0;break}c[d+96>>2]=j;e=1}}while(0);return e|0}function tf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if((b|0)==0){g=c[a+8>>2]|0;if((c[g-16+8>>2]|0)!=70){h=0;i=e;return h|0}h=dg(c[(c[g-16>>2]|0)+12>>2]|0,d,0)|0;i=e;return h|0}else{c[f>>2]=0;g=uf(a,c[b+96>>2]|0,d,f)|0;if((g|0)==0){h=0;i=e;return h|0}d=c[f>>2]|0;f=a+8|0;a=c[f>>2]|0;b=d;j=a;k=c[b+4>>2]|0;c[j>>2]=c[b>>2];c[j+4>>2]=k;c[a+8>>2]=c[d+8>>2];c[f>>2]=(c[f>>2]|0)+16;h=g;i=e;return h|0}return 0}function uf(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((a[e+18|0]&1)==0){h=(c[e>>2]|0)+16|0;i=7}else{if((f|0)>=0){j=c[e+24>>2]|0;k=c[(c[c[e>>2]>>2]|0)+12>>2]|0;l=dg(k,f,((c[e+28>>2]|0)-(c[k+12>>2]|0)>>2)-1|0)|0;if((l|0)==0){h=j;i=7;break}else{m=l;n=j;break}}j=c[e>>2]|0;l=d[(c[(c[j>>2]|0)+12>>2]|0)+76|0]|0;if((((c[e+24>>2]|0)-j>>4)-l|0)<=(-f|0)){o=0;return o|0}c[g>>2]=j+(l-f<<4);o=8472;return o|0}}while(0);do{if((i|0)==7){if((c[b+16>>2]|0)==(e|0)){p=b+8|0}else{p=c[e+12>>2]|0}if(((c[p>>2]|0)-h>>4|0)>=(f|0)&(f|0)>0){m=8720;n=h;break}else{o=0}return o|0}}while(0);c[g>>2]=n+(f-1<<4);o=m;return o|0}function vf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+8|0;f=e|0;c[f>>2]=0;g=uf(a,c[b+96>>2]|0,d,f)|0;d=a+8|0;if((g|0)==0){h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}a=c[d>>2]|0;b=c[f>>2]|0;f=a-16|0;k=b;l=c[f+4>>2]|0;c[k>>2]=c[f>>2];c[k+4>>2]=l;c[b+8>>2]=c[a-16+8>>2];h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}function wf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;f=i;i=i+16|0;g=f|0;if((a[d]|0)==62){h=b+8|0;j=(c[h>>2]|0)-16|0;c[h>>2]=j;k=d+1|0;l=0;m=j}else{j=c[e+96>>2]|0;k=d;l=j;m=c[j>>2]|0}j=m+8|0;if((c[j>>2]&31|0)==6){n=c[m>>2]|0}else{n=0}d=a[k]|0;a:do{if(d<<24>>24==0){o=1}else{h=(n|0)==0;p=e+16|0;q=e+24|0;r=e+28|0;s=e+12|0;t=e+36|0;u=n+4|0;v=n+12|0;w=(l|0)==0;x=e+20|0;y=l+18|0;z=l|0;A=l+28|0;B=e+32|0;C=e+34|0;D=e+33|0;E=n+6|0;F=e+35|0;G=e+8|0;H=e+4|0;I=l+8|0;J=b+12|0;K=k;L=1;M=d;while(1){b:do{switch(M<<24>>24|0){case 108:{do{if(w){N=-1}else{if((a[y]&1)==0){N=-1;break}O=c[(c[c[z>>2]>>2]|0)+12>>2]|0;P=c[O+20>>2]|0;if((P|0)==0){N=0;break}N=c[P+(((c[A>>2]|0)-(c[O+12>>2]|0)>>2)-1<<2)>>2]|0}}while(0);c[x>>2]=N;Q=L;break};case 83:{do{if(h){R=11}else{if((a[u]|0)==38){R=11;break}O=c[v>>2]|0;P=c[O+36>>2]|0;if((P|0)==0){S=9344}else{S=P+16|0}c[p>>2]=S;P=c[O+64>>2]|0;c[q>>2]=P;c[r>>2]=c[O+68>>2];T=S;U=(P|0)==0?9104:8936}}while(0);if((R|0)==11){R=0;c[p>>2]=9808;c[q>>2]=-1;c[r>>2]=-1;T=9808;U=9560}c[s>>2]=U;ci(t,T,60);Q=L;break};case 117:{do{if(h){a[B]=0}else{a[B]=a[E]|0;if((a[u]|0)==38){break}a[C]=a[(c[v>>2]|0)+77|0]|0;a[D]=a[(c[v>>2]|0)+76|0]|0;Q=L;break b}}while(0);a[C]=1;a[D]=0;Q=L;break};case 116:{if(w){V=0}else{V=a[y]&64}a[F]=V;Q=L;break};case 110:{c:do{if(w){R=47}else{if((a[y]&64)!=0){R=47;break}P=c[I>>2]|0;if((a[P+18|0]&1)==0){R=47;break}O=c[(c[c[P>>2]>>2]|0)+12>>2]|0;W=c[O+12>>2]|0;X=((c[P+28>>2]|0)-W>>2)-1|0;P=c[W+(X<<2)>>2]|0;switch(P&63|0){case 8:case 10:{Y=1;R=46;break};case 24:{Y=5;R=46;break};case 13:{Y=6;R=46;break};case 14:{Y=7;R=46;break};case 15:{Y=8;R=46;break};case 16:{Y=9;R=46;break};case 17:{Y=10;R=46;break};case 18:{Y=11;R=46;break};case 19:{Y=12;R=46;break};case 21:{Y=4;R=46;break};case 25:{Y=13;R=46;break};case 26:{Y=14;R=46;break};case 22:{Y=15;R=46;break};case 12:case 6:case 7:{Y=0;R=46;break};case 34:{Z=10248;_=10248;break};case 29:case 30:{W=yf(O,X,P>>>6&255,H)|0;c[G>>2]=W;if((W|0)==0){break c}else{Q=L;break b}break};default:{R=47;break c}}if((R|0)==46){R=0;Z=10016;_=(c[(c[J>>2]|0)+184+(Y<<2)>>2]|0)+16|0}c[H>>2]=_;c[G>>2]=Z;Q=L;break b}}while(0);if((R|0)==47){R=0;c[G>>2]=0}c[G>>2]=12120;c[H>>2]=0;Q=L;break};case 76:case 102:{Q=L;break};default:{Q=0}}}while(0);W=K+1|0;P=a[W]|0;if(P<<24>>24==0){o=Q;break a}else{K=W;L=Q;M=P}}}}while(0);if((Wa(k|0,102)|0)!=0){Q=b+8|0;R=c[Q>>2]|0;Z=m;m=R;_=c[Z+4>>2]|0;c[m>>2]=c[Z>>2];c[m+4>>2]=_;c[R+8>>2]=c[j>>2];c[Q>>2]=(c[Q>>2]|0)+16}if((Wa(k|0,76)|0)==0){i=f;return o|0}do{if((n|0)!=0){if((a[n+4|0]|0)==38){break}k=n+12|0;Q=c[(c[k>>2]|0)+20>>2]|0;j=Aj(b)|0;R=b+8|0;_=c[R>>2]|0;c[_>>2]=j;c[_+8>>2]=69;c[R>>2]=(c[R>>2]|0)+16;c[g>>2]=1;c[g+8>>2]=1;if((c[(c[k>>2]|0)+52>>2]|0)>0){$=0}else{i=f;return o|0}do{xj(b,j,c[Q+($<<2)>>2]|0,g);$=$+1|0;}while(($|0)<(c[(c[k>>2]|0)+52>>2]|0));i=f;return o|0}}while(0);$=b+8|0;c[(c[$>>2]|0)+8>>2]=0;c[$>>2]=(c[$>>2]|0)+16;i=f;return o|0}function xf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+8|0;h=g|0;g=c[b+16>>2]|0;c[h>>2]=0;j=c[1064+((c[e+8>>2]&15)+1<<2)>>2]|0;if((a[g+18|0]&1)==0){zf(b,11104,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}l=c[c[g>>2]>>2]|0;m=d[l+6|0]|0;n=l+16|0;o=0;while(1){if((o|0)>=(m|0)){break}if((c[(c[n+(o<<2)>>2]|0)+8>>2]|0)==(e|0)){p=5;break}else{o=o+1|0}}if((p|0)==5){n=c[(c[(c[l+12>>2]|0)+28>>2]|0)+(o<<3)>>2]|0;if((n|0)==0){q=10736}else{q=n+16|0}c[h>>2]=q;r=11552;s=q;zf(b,7752,(k=i,i=i+32|0,c[k>>2]=f,c[k+8>>2]=r,c[k+16>>2]=s,c[k+24>>2]=j,k)|0);i=k}q=c[g+24>>2]|0;n=c[g+4>>2]|0;o=q;while(1){if(o>>>0>=n>>>0){p=14;break}if((o|0)==(e|0)){break}else{o=o+16|0}}if((p|0)==14){zf(b,11104,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}p=c[l+12>>2]|0;l=yf(p,((c[g+28>>2]|0)-(c[p+12>>2]|0)>>2)-1|0,e-q>>4,h)|0;if((l|0)==0){zf(b,11104,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}r=l;s=c[h>>2]|0;zf(b,7752,(k=i,i=i+32|0,c[k>>2]=f,c[k+8>>2]=r,c[k+16>>2]=s,c[k+24>>2]=j,k)|0);i=k}function yf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=b+12|0;h=e;e=d;a:while(1){d=dg(b,h+1|0,e)|0;c[f>>2]=d;if((d|0)!=0){i=3288;j=42;break}if((e|0)<=0){i=0;j=42;break}k=c[g>>2]|0;d=-1;l=0;while(1){m=c[k+(l<<2)>>2]|0;n=m&63;o=m>>>6&255;b:do{switch(n|0){case 4:{if((o|0)>(h|0)){p=l;q=d;break b}p=l;q=(o+(m>>>23)|0)<(h|0)?d:l;break};case 29:case 30:{p=l;q=(o|0)>(h|0)?d:l;break};case 27:{p=l;q=(o|0)==(h|0)?l:d;break};case 23:{r=(m>>>14)-131071|0;s=l+1+r|0;p=((l|0)>=(s|0)|(s|0)>(e|0)?0:r)+l|0;q=d;break};case 34:{p=l;q=(o+2|0)>(h|0)?d:l;break};default:{p=l;q=(a[1184+n|0]&64)!=0&(o|0)==(h|0)?l:d}}}while(0);o=p+1|0;if((o|0)<(e|0)){d=q;l=o}else{break}}if((q|0)==-1){i=0;j=42;break}t=c[k+(q<<2)>>2]|0;u=t&63;switch(u|0){case 0:{break};case 6:case 7:{j=17;break a;break};case 5:{j=29;break a;break};case 1:{j=32;break a;break};case 2:{j=33;break a;break};case 12:{j=36;break a;break};default:{i=0;j=42;break a}}l=t>>>23;if(l>>>0<(t>>>6&255)>>>0){h=l;e=q}else{i=0;j=42;break}}if((j|0)==17){e=t>>>14;h=e&511;p=t>>>23;do{if((u|0)==7){v=dg(b,p+1|0,q)|0}else{g=c[(c[b+28>>2]|0)+(p<<3)>>2]|0;if((g|0)==0){v=10736;break}v=g+16|0}}while(0);do{if((e&256|0)==0){p=yf(b,q,h,f)|0;if((p|0)==0){j=26;break}if((a[p]|0)!=99){j=26}}else{p=e&255;u=c[b+8>>2]|0;if((c[u+(p<<4)+8>>2]&15|0)!=4){j=26;break}c[f>>2]=(c[u+(p<<4)>>2]|0)+16}}while(0);if((j|0)==26){c[f>>2]=10736}if((v|0)==0){i=11968;return i|0}e=(Ma(v|0,2968)|0)==0;i=e?2648:11968;return i|0}else if((j|0)==29){e=c[(c[b+28>>2]|0)+(t>>>23<<3)>>2]|0;if((e|0)==0){w=10736}else{w=e+16|0}c[f>>2]=w;i=11552;return i|0}else if((j|0)==32){x=t>>>14}else if((j|0)==33){x=(c[k+(q+1<<2)>>2]|0)>>>6}else if((j|0)==36){k=t>>>14;do{if((k&256|0)==0){t=yf(b,q,k&511,f)|0;if((t|0)==0){break}if((a[t]|0)==99){i=11e3}else{break}return i|0}else{t=k&255;w=c[b+8>>2]|0;if((c[w+(t<<4)+8>>2]&15|0)!=4){break}c[f>>2]=(c[w+(t<<4)>>2]|0)+16;i=11e3;return i|0}}while(0);c[f>>2]=10736;i=11e3;return i|0}else if((j|0)==42){return i|0}j=c[b+8>>2]|0;if((c[j+(x<<4)+8>>2]&15|0)!=4){i=0;return i|0}c[f>>2]=(c[j+(x<<4)>>2]|0)+16;i=11304;return i|0}function zf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+80|0;g=f|0;h=f+64|0;f=h;c[f>>2]=e;c[f+4>>2]=0;f=ai(b,d,h|0)|0;h=g|0;d=c[b+16>>2]|0;if((a[d+18|0]&1)==0){Df(b)}e=c[(c[c[d>>2]>>2]|0)+12>>2]|0;j=c[e+20>>2]|0;if((j|0)==0){k=0}else{k=c[j+(((c[d+28>>2]|0)-(c[e+12>>2]|0)>>2)-1<<2)>>2]|0}d=c[e+36>>2]|0;if((d|0)==0){a[h]=63;a[g+1|0]=0}else{ci(h,d+16|0,60)}bi(b,3776,(d=i,i=i+24|0,c[d>>2]=h,c[d+8>>2]=k,c[d+16>>2]=f,d)|0)|0;i=d;Df(b)}function Af(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+8>>2]|0;xf(a,(e&15|0)==4|(e|0)==3?d:b,8848)}function Bf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=(Zj(b,d|0)|0)==0;xf(a,e?b:c,6832)}function Cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[1064+((c[b+8>>2]&15)+1<<2)>>2]|0;b=c[1064+((c[d+8>>2]&15)+1<<2)>>2]|0;if((e|0)==(b|0)){zf(a,5240,(f=i,i=i+8|0,c[f>>2]=e,f)|0);i=f}else{zf(a,4128,(f=i,i=i+16|0,c[f>>2]=e,c[f+8>>2]=b,f)|0);i=f}}function Df(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=c[a+68>>2]|0;if((b|0)==0){Ef(a,2)}d=c[a+28>>2]|0;e=d+(b+8)|0;if((c[e>>2]&15|0)!=6){Ef(a,6)}f=a+8|0;g=c[f>>2]|0;h=g-16|0;i=g;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[g+8>>2]=c[g-16+8>>2];g=c[f>>2]|0;j=d+b|0;b=g-16|0;d=c[j+4>>2]|0;c[b>>2]=c[j>>2];c[b+4>>2]=d;c[g-16+8>>2]=c[e>>2];e=c[f>>2]|0;c[f>>2]=e+16;Mf(a,e-16|0,1,0);Ef(a,2)}function Ef(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+64|0;f=c[e>>2]|0;if((f|0)!=0){c[f+160>>2]=d;lc((c[e>>2]|0)+4|0,1)}a[b+6|0]=d;e=b+12|0;f=c[e>>2]|0;g=c[f+172>>2]|0;if((c[g+64>>2]|0)!=0){h=c[b+8>>2]|0;i=g+8|0;g=c[i>>2]|0;c[i>>2]=g+16;i=h-16|0;j=g;k=c[i+4>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=k;c[g+8>>2]=c[h-16+8>>2];Ef(c[(c[e>>2]|0)+172>>2]|0,d)}d=c[f+168>>2]|0;if((d|0)==0){Xb()}Bc[d&511](b)|0;Xb()}function Ff(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+168|0;g=1;h=0;j=i;i=i+168|0;c[j>>2]=0;while(1)switch(g|0){case 1:k=f|0;l=a+38|0;m=b[l>>1]|0;n=k+160|0;c[n>>2]=0;o=a+64|0;p=k|0;c[p>>2]=c[o>>2];c[o>>2]=k;q=Wm(k+4|0,g,j)|0;g=4;break;case 4:if((q|0)==0){g=2;break}else{g=3;break};case 2:la(d|0,a|0,e|0);if((t|0)!=0&(u|0)!=0){h=Xm(c[t>>2]|0,j)|0;if((h|0)>0){g=-1;break}else return 0}t=u=0;g=3;break;case 3:c[o>>2]=c[p>>2];b[l>>1]=m;i=f;return c[n>>2]|0;case-1:if((h|0)==1){q=u;g=4}t=u=0;break}return 0}function Gf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=b+28|0;f=c[e>>2]|0;g=b+32|0;h=c[g>>2]|0;if((d+1|0)>>>0>268435455>>>0){Fh(b)}i=Gh(b,f,h<<4,d<<4)|0;c[e>>2]=i;if((h|0)<(d|0)){j=h;h=i;while(1){c[h+(j<<4)+8>>2]=0;k=j+1|0;l=c[e>>2]|0;if((k|0)<(d|0)){j=k;h=l}else{m=l;break}}}else{m=i}c[g>>2]=d;c[b+24>>2]=m+(d-5<<4);d=b+8|0;g=f;c[d>>2]=m+((c[d>>2]|0)-g>>4<<4);d=c[b+56>>2]|0;do{if((d|0)!=0){f=d+8|0;c[f>>2]=m+((c[f>>2]|0)-g>>4<<4);f=c[d>>2]|0;if((f|0)==0){break}else{n=f}do{f=n+8|0;c[f>>2]=(c[e>>2]|0)+((c[f>>2]|0)-g>>4<<4);n=c[n>>2]|0;}while((n|0)!=0)}}while(0);n=c[b+16>>2]|0;if((n|0)==0){return}else{o=n}do{n=o+4|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);n=o|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);if((a[o+18|0]&1)!=0){n=o+24|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4)}o=c[o+8>>2]|0;}while((o|0)!=0);return}function Hf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[a+32>>2]|0;if((e|0)>1e6){Ef(a,6)}f=b+5+((c[a+8>>2]|0)-(c[a+28>>2]|0)>>4)|0;b=e<<1;e=(b|0)>1e6?1e6:b;b=(e|0)<(f|0)?f:e;if((b|0)>1e6){Gf(a,1000200);zf(a,3896,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{Gf(a,b);i=d;return}}function If(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=c[a+8>>2]|0;d=c[a+16>>2]|0;if((d|0)==0){e=b}else{f=b;b=d;while(1){d=c[b+4>>2]|0;g=f>>>0<d>>>0?d:f;d=c[b+8>>2]|0;if((d|0)==0){e=g;break}else{f=g;b=d}}}b=(e-(c[a+28>>2]|0)>>4)+1|0;e=((b|0)/8|0)+10+b|0;f=(e|0)>1e6?1e6:e;if((b|0)>1e6){return}if((f|0)>=(c[a+32>>2]|0)){return}Gf(a,f);return}function Jf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+104|0;g=f|0;h=c[b+52>>2]|0;if((h|0)==0){i=f;return}j=b+41|0;if((a[j]|0)==0){i=f;return}k=c[b+16>>2]|0;l=b+8|0;m=c[l>>2]|0;n=b+28|0;o=m;p=c[n>>2]|0;q=o-p|0;r=k+4|0;s=(c[r>>2]|0)-p|0;c[g>>2]=d;c[g+20>>2]=e;c[g+96>>2]=k;do{if(((c[b+24>>2]|0)-o|0)<336){e=c[b+32>>2]|0;if((e|0)>1e6){Ef(b,6)}d=(q>>4)+25|0;p=e<<1;e=(p|0)>1e6?1e6:p;p=(e|0)<(d|0)?d:e;if((p|0)>1e6){Gf(b,1000200);zf(b,3896,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{Gf(b,p);t=c[l>>2]|0;break}}else{t=m}}while(0);c[r>>2]=t+320;a[j]=0;t=k+18|0;a[t]=a[t]|2;Dc[h&31](b,g);a[j]=1;c[r>>2]=(c[n>>2]|0)+s;c[l>>2]=(c[n>>2]|0)+q;a[t]=a[t]&-3;i=f;return}function Kf(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;h=i;j=e+28|0;k=e+8|0;l=e+24|0;m=e+32|0;n=f;while(1){o=c[j>>2]|0;f=n;p=o;q=f-p|0;r=c[n+8>>2]&63;if((r|0)==22){s=3;break}else if((r|0)==38){s=4;break}else if((r|0)==6){s=18;break}r=Uj(e,n,16)|0;t=f-(c[j>>2]|0)|0;f=r+8|0;if((c[f>>2]&15|0)!=6){s=42;break}u=c[k>>2]|0;if(u>>>0>n>>>0){v=u;while(1){w=v-16|0;x=w;y=v;z=c[x+4>>2]|0;c[y>>2]=c[x>>2];c[y+4>>2]=z;c[v+8>>2]=c[v-16+8>>2];if(w>>>0>n>>>0){v=w}else{break}}A=c[k>>2]|0}else{A=u}v=A+16|0;c[k>>2]=v;w=v;if(((c[l>>2]|0)-w|0)<16){v=c[m>>2]|0;if((v|0)>1e6){s=48;break}z=(w-(c[j>>2]|0)>>4)+5|0;w=v<<1;v=(w|0)>1e6?1e6:w;w=(v|0)<(z|0)?z:v;if((w|0)>1e6){s=50;break}Gf(e,w)}w=c[j>>2]|0;v=w+t|0;z=r;y=v;x=c[z+4>>2]|0;c[y>>2]=c[z>>2];c[y+4>>2]=x;c[w+(t+8)>>2]=c[f>>2];n=v}if((s|0)==3){B=n}else if((s|0)==4){B=(c[n>>2]|0)+12|0}else if((s|0)==18){A=c[(c[n>>2]|0)+12>>2]|0;v=c[k>>2]|0;w=v;x=A+78|0;y=d[x]|0;do{if(((c[l>>2]|0)-w>>4|0)>(y|0)){C=o;D=v}else{z=c[m>>2]|0;if((z|0)>1e6){Ef(e,6);return 0}E=y+5+(w-p>>4)|0;F=z<<1;z=(F|0)>1e6?1e6:F;F=(z|0)<(E|0)?E:z;if((F|0)>1e6){Gf(e,1000200);zf(e,3896,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0);i=G;return 0}else{Gf(e,F);C=c[j>>2]|0;D=c[k>>2]|0;break}}}while(0);w=C;C=w+q|0;y=C;v=(D-C>>4)-1|0;C=A+76|0;o=a[C]|0;a:do{if((v|0)<(o&255|0)){F=v;z=D;while(1){c[k>>2]=z+16;c[z+8>>2]=0;E=F+1|0;H=a[C]|0;if((E|0)>=(H&255|0)){I=E;J=H;break a}F=E;z=c[k>>2]|0}}else{I=v;J=o}}while(0);do{if((a[A+77|0]|0)==0){K=w+(q+16)|0}else{o=J&255;v=c[k>>2]|0;if(J<<24>>24==0){K=v;break}C=-I|0;c[k>>2]=v+16;D=v+(C<<4)|0;z=v;F=c[D+4>>2]|0;c[z>>2]=c[D>>2];c[z+4>>2]=F;F=v+(C<<4)+8|0;c[v+8>>2]=c[F>>2];c[F>>2]=0;if((J&255)>>>0>1>>>0){L=1}else{K=v;break}while(1){F=c[k>>2]|0;C=L-I|0;c[k>>2]=F+16;z=v+(C<<4)|0;D=F;f=c[z+4>>2]|0;c[D>>2]=c[z>>2];c[D+4>>2]=f;f=v+(C<<4)+8|0;c[F+8>>2]=c[f>>2];c[f>>2]=0;f=L+1|0;if((f|0)<(o|0)){L=f}else{K=v;break}}}}while(0);L=e+16|0;I=c[(c[L>>2]|0)+12>>2]|0;if((I|0)==0){M=Mi(e)|0}else{M=I}c[L>>2]=M;b[M+16>>1]=g;c[M>>2]=y;c[M+24>>2]=K;y=K+(d[x]<<4)|0;c[M+4>>2]=y;x=M+28|0;c[x>>2]=c[A+12>>2];A=M+18|0;a[A]=1;c[k>>2]=y;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){sg(e)}if((a[e+40|0]&1)==0){N=0;i=h;return N|0}c[x>>2]=(c[x>>2]|0)+4;y=c[M+8>>2]|0;do{if((a[y+18|0]&1)==0){O=0}else{if((c[(c[y+28>>2]|0)-4>>2]&63|0)!=30){O=0;break}a[A]=a[A]|64;O=4}}while(0);Jf(e,O,-1);c[x>>2]=(c[x>>2]|0)-4;N=0;i=h;return N|0}else if((s|0)==42){xf(e,n,11488);return 0}else if((s|0)==48){Ef(e,6);return 0}else if((s|0)==50){Gf(e,1000200);zf(e,3896,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0);i=G;return 0}s=c[B>>2]|0;B=c[k>>2]|0;do{if(((c[l>>2]|0)-B|0)<336){n=c[m>>2]|0;if((n|0)>1e6){Ef(e,6);return 0}x=(B-p>>4)+25|0;O=n<<1;n=(O|0)>1e6?1e6:O;O=(n|0)<(x|0)?x:n;if((O|0)>1e6){Gf(e,1000200);zf(e,3896,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0);i=G;return 0}else{Gf(e,O);break}}}while(0);G=e+16|0;p=c[(c[G>>2]|0)+12>>2]|0;if((p|0)==0){P=Mi(e)|0}else{P=p}c[G>>2]=P;b[P+16>>1]=g;c[P>>2]=(c[j>>2]|0)+q;c[P+4>>2]=(c[k>>2]|0)+320;a[P+18|0]=0;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){sg(e)}if((a[e+40|0]&1)!=0){Jf(e,0,-1)}P=Bc[s&511](e)|0;Lf(e,(c[k>>2]|0)+(-P<<4)|0)|0;N=1;i=h;return N|0}function Lf(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=a+16|0;g=c[f>>2]|0;h=d[a+40|0]|0;if((h&6|0)==0){i=e;j=g+8|0}else{if((h&2|0)==0){k=e}else{h=a+28|0;l=e-(c[h>>2]|0)|0;Jf(a,1,-1);k=(c[h>>2]|0)+l|0}l=g+8|0;c[a+20>>2]=c[(c[l>>2]|0)+28>>2];i=k;j=l}l=c[g>>2]|0;k=b[g+16>>1]|0;g=k<<16>>16;c[f>>2]=c[j>>2];j=a+8|0;if(k<<16>>16==0){m=l;c[j>>2]=m;n=g+1|0;return n|0}else{o=g;p=l;q=i}while(1){if(q>>>0>=(c[j>>2]|0)>>>0){break}i=p+16|0;l=q;k=p;a=c[l+4>>2]|0;c[k>>2]=c[l>>2];c[k+4>>2]=a;c[p+8>>2]=c[q+8>>2];a=o-1|0;if((a|0)==0){m=i;r=12;break}else{o=a;p=i;q=q+16|0}}if((r|0)==12){c[j>>2]=m;n=g+1|0;return n|0}if((o|0)>0){s=o;t=p}else{m=p;c[j>>2]=m;n=g+1|0;return n|0}while(1){r=s-1|0;c[t+8>>2]=0;if((r|0)>0){s=r;t=t+16|0}else{break}}m=p+(o<<4)|0;c[j>>2]=m;n=g+1|0;return n|0}function Mf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=a+38|0;j=(b[h>>1]|0)+1&65535;b[h>>1]=j;do{if((j&65535)>>>0>199>>>0){if(j<<16>>16==200){zf(a,10376,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k}if((j&65535)>>>0<=224>>>0){break}Ef(a,6)}}while(0);j=(f|0)!=0;if(!j){f=a+36|0;b[f>>1]=(b[f>>1]|0)+1}if((Kf(a,d,e)|0)==0){jk(a)}if(j){l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}j=a+36|0;b[j>>1]=(b[j>>1]|0)-1;l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}function Nf(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;if((f|0)==0){h=1}else{h=(b[f+38>>1]|0)+1&65535}f=e+38|0;b[f>>1]=h;h=e+36|0;b[h>>1]=0;i=e+8|0;j=Ff(e,14,(c[i>>2]|0)+(-g<<4)|0)|0;if((j|0)==-1){k=2;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}if(j>>>0<=1>>>0){k=j;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}g=e+16|0;n=e+28|0;o=e+41|0;p=e+68|0;q=e+32|0;r=e+12|0;s=j;a:while(1){j=g;while(1){t=c[j>>2]|0;if((t|0)==0){break a}u=t+18|0;if((a[u]&16)==0){j=t+8|0}else{break}}j=c[n>>2]|0;v=c[t+20>>2]|0;w=j+v|0;ag(e,w);if((s|0)==6){x=Yi(e,2784,23)|0;c[w>>2]=x;c[j+(v+8)>>2]=d[x+4|0]|0|64}else if((s|0)==4){x=c[(c[r>>2]|0)+180>>2]|0;c[w>>2]=x;c[j+(v+8)>>2]=d[x+4|0]|0|64}else{x=c[i>>2]|0;y=x-16|0;z=w;w=c[y+4>>2]|0;c[z>>2]=c[y>>2];c[z+4>>2]=w;c[j+(v+8)>>2]=c[x-16+8>>2]}x=j+(v+16)|0;c[i>>2]=x;c[g>>2]=t;a[o]=a[t+36|0]|0;b[h>>1]=0;v=x;x=t;do{j=c[x+4>>2]|0;v=v>>>0<j>>>0?j:v;x=c[x+8>>2]|0;}while((x|0)!=0);x=(v-(c[n>>2]|0)>>4)+1|0;j=((x|0)/8|0)+10+x|0;w=(j|0)>1e6?1e6:j;do{if((x|0)<=1e6){if((w|0)>=(c[q>>2]|0)){break}Gf(e,w)}}while(0);c[p>>2]=c[t+32>>2];a[u]=a[u]|32;a[t+37|0]=s;w=Ff(e,20,0)|0;if(w>>>0>1>>>0){s=w}else{k=w;A=24;break}}if((A|0)==24){b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}a[e+6|0]=s;A=c[i>>2]|0;if((s|0)==4){t=c[(c[r>>2]|0)+180>>2]|0;c[A>>2]=t;c[A+8>>2]=d[t+4|0]|0|64}else if((s|0)==6){t=Yi(e,2784,23)|0;c[A>>2]=t;c[A+8>>2]=d[t+4|0]|0|64}else{t=A-16|0;e=A;r=c[t+4>>2]|0;c[e>>2]=c[t>>2];c[e+4>>2]=r;c[A+8>>2]=c[A-16+8>>2]}r=A+16|0;c[i>>2]=r;c[(c[g>>2]|0)+4>>2]=r;k=s;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}function Of(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0,j=0;f=d;g=c[b+16>>2]|0;if((e[b+38>>1]|0)>>>0>199>>>0){Uf(b,10376,f)}h=b+6|0;i=a[h]|0;if((i<<24>>24|0)==0){if((g|0)!=(b+72|0)){Uf(b,2512,f)}if((Kf(b,d-16|0,-1)|0)!=0){return}jk(b);return}else if((i<<24>>24|0)==1){a[h]=0;c[g>>2]=(c[b+28>>2]|0)+(c[g+20>>2]|0);h=g+18|0;i=a[h]|0;if((i&1)==0){d=c[g+28>>2]|0;if((d|0)==0){j=f}else{a[g+37|0]=1;a[h]=i|8;i=Bc[d&511](b)|0;j=(c[b+8>>2]|0)+(-i<<4)|0}Lf(b,j)|0}else{jk(b)}Pf(b,0);return}else{Uf(b,11856,f)}}function Pf(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=d+16|0;f=c[e>>2]|0;g=d+72|0;if((f|0)==(g|0)){return}h=d+8|0;i=d+68|0;j=f;do{f=j+18|0;k=a[f]|0;if((k&1)==0){if((k&16)!=0){a[f]=k&-17;c[i>>2]=c[j+32>>2]}do{if((b[j+16>>1]|0)==-1){k=(c[e>>2]|0)+4|0;l=c[h>>2]|0;if((c[k>>2]|0)>>>0>=l>>>0){break}c[k>>2]=l}}while(0);l=a[f]|0;if((l&32)==0){a[j+37|0]=1}a[f]=l&-57|8;l=Bc[c[j+28>>2]&511](d)|0;Lf(d,(c[h>>2]|0)+(-l<<4)|0)|0}else{ik(d);jk(d)}j=c[e>>2]|0;}while((j|0)!=(g|0));return}function Qf(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;j=c[d+16>>2]|0;if((b[d+36>>1]|0)!=0){if((c[(c[d+12>>2]|0)+172>>2]|0)==(d|0)){zf(d,6296,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}else{zf(d,8152,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}}a[d+6|0]=1;k=j|0;c[j+20>>2]=(c[k>>2]|0)-(c[d+28>>2]|0);if((a[j+18|0]&1)!=0){i=h;return 0}c[j+28>>2]=g;if((g|0)==0){l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;Ef(d,1);return 0}c[j+24>>2]=f;l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;Ef(d,1);return 0}function Rf(e,f,g,h,i){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=e+16|0;k=c[j>>2]|0;l=e+41|0;m=a[l]|0;n=e+36|0;o=b[n>>1]|0;p=e+68|0;q=c[p>>2]|0;c[p>>2]=i;i=Ff(e,f,g)|0;if((i|0)==0){c[p>>2]=q;return i|0}g=e+28|0;f=c[g>>2]|0;r=f+h|0;ag(e,r);if((i|0)==6){s=Yi(e,2784,23)|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else if((i|0)==4){s=c[(c[e+12>>2]|0)+180>>2]|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else{s=c[e+8>>2]|0;t=s-16|0;u=r;r=c[t+4>>2]|0;c[u>>2]=c[t>>2];c[u+4>>2]=r;c[f+(h+8)>>2]=c[s-16+8>>2]}s=f+(h+16)|0;c[e+8>>2]=s;c[j>>2]=k;a[l]=m;b[n>>1]=o;if((k|0)==0){v=s}else{o=s;s=k;while(1){k=c[s+4>>2]|0;n=o>>>0<k>>>0?k:o;k=c[s+8>>2]|0;if((k|0)==0){v=n;break}else{o=n;s=k}}}s=(v-(c[g>>2]|0)>>4)+1|0;g=((s|0)/8|0)+10+s|0;v=(g|0)>1e6?1e6:g;if((s|0)>1e6){c[p>>2]=q;return i|0}if((v|0)>=(c[e+32>>2]|0)){c[p>>2]=q;return i|0}Gf(e,v);c[p>>2]=q;return i|0}function Sf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+64|0;h=g|0;j=a+36|0;b[j>>1]=(b[j>>1]|0)+1;c[h>>2]=d;c[h+56>>2]=e;c[h+52>>2]=f;f=h+16|0;c[f>>2]=0;e=h+24|0;c[e>>2]=0;d=h+28|0;c[d>>2]=0;k=h+36|0;c[k>>2]=0;l=h+40|0;c[l>>2]=0;m=h+48|0;c[m>>2]=0;n=h+4|0;c[n>>2]=0;o=h+12|0;c[o>>2]=0;p=Rf(a,12,h,(c[a+8>>2]|0)-(c[a+28>>2]|0)|0,c[a+68>>2]|0)|0;c[n>>2]=Gh(a,c[n>>2]|0,c[o>>2]|0,0)|0;c[o>>2]=0;Gh(a,c[f>>2]|0,c[e>>2]<<1,0)|0;Gh(a,c[d>>2]|0,c[k>>2]<<4,0)|0;Gh(a,c[l>>2]|0,c[m>>2]<<4,0)|0;b[j>>1]=(b[j>>1]|0)-1;i=g;return p|0}function Tf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=e;h=c[g>>2]|0;j=c[h>>2]|0;c[h>>2]=j-1;h=c[g>>2]|0;if((j|0)==0){k=kk(h)|0}else{j=h+4|0;h=c[j>>2]|0;c[j>>2]=h+1;k=d[h]|0}h=c[e+52>>2]|0;j=(h|0)==0;if((k|0)==27){do{if(!j){if((Wa(h|0,98)|0)!=0){break}bi(b,3128,(l=i,i=i+16|0,c[l>>2]=3952,c[l+8>>2]=h,l)|0)|0;i=l;Ef(b,3)}}while(0);m=Vj(b,c[g>>2]|0,e+4|0,c[e+56>>2]|0)|0}else{do{if(!j){if((Wa(h|0,116)|0)!=0){break}bi(b,3128,(l=i,i=i+16|0,c[l>>2]=3632,c[l+8>>2]=h,l)|0)|0;i=l;Ef(b,3)}}while(0);m=pi(b,c[g>>2]|0,e+4|0,e+16|0,c[e+56>>2]|0,k)|0}k=m+6|0;if((a[k]|0)==0){i=f;return}e=m+16|0;g=m+5|0;l=m;m=0;do{h=Zf(b)|0;c[e+(m<<2)>>2]=h;j=h;do{if((a[h+5|0]&3)!=0){if((a[g]&4)==0){break}eg(b,l,j)}}while(0);m=m+1|0;}while((m|0)<(d[k]|0));i=f;return}function Uf(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a+8|0;c[f>>2]=e;g=Zi(a,b)|0;c[e>>2]=g;c[e+8>>2]=d[g+4|0]|0|64;c[f>>2]=(c[f>>2]|0)+16;Ef(a,-1)}function Vf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+48|0;h=g+24|0;c[h>>2]=a;c[h+4>>2]=d;c[h+8>>2]=e;c[h+12>>2]=f;f=h+16|0;j=g|0;Xj(j);c[f>>2]=Ec[d&15](a,j,18,e)|0;Wf(b,h);i=g;return c[f>>2]|0}function Wf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0;e=i;i=i+216|0;f=e|0;g=e+8|0;j=e+16|0;k=e+24|0;l=e+32|0;m=e+40|0;n=e+48|0;o=e+56|0;p=e+64|0;q=e+72|0;r=e+80|0;s=e+88|0;t=e+96|0;u=e+104|0;v=e+112|0;w=e+120|0;x=e+128|0;y=e+136|0;z=e+144|0;A=e+152|0;B=e+160|0;C=e+168|0;D=e+176|0;E=e+184|0;F=e+192|0;G=e+200|0;H=e+208|0;c[w>>2]=c[b+64>>2];I=d+16|0;J=c[I>>2]|0;if((J|0)==0){K=Ec[c[d+4>>2]&15](c[d>>2]|0,w,4,c[d+8>>2]|0)|0;c[I>>2]=K;L=K}else{L=J}c[v>>2]=c[b+68>>2];if((L|0)==0){J=Ec[c[d+4>>2]&15](c[d>>2]|0,v,4,c[d+8>>2]|0)|0;c[I>>2]=J;M=J}else{M=L}a[u]=a[b+76|0]|0;if((M|0)==0){L=Ec[c[d+4>>2]&15](c[d>>2]|0,u,1,c[d+8>>2]|0)|0;c[I>>2]=L;N=L}else{N=M}a[t]=a[b+77|0]|0;if((N|0)==0){M=Ec[c[d+4>>2]&15](c[d>>2]|0,t,1,c[d+8>>2]|0)|0;c[I>>2]=M;O=M}else{O=N}a[s]=a[b+78|0]|0;if((O|0)==0){N=Ec[c[d+4>>2]&15](c[d>>2]|0,s,1,c[d+8>>2]|0)|0;c[I>>2]=N;P=N}else{P=O}O=c[b+12>>2]|0;N=c[b+48>>2]|0;c[r>>2]=N;do{if((P|0)==0){s=d+4|0;M=d|0;t=d+8|0;L=Ec[c[s>>2]&15](c[M>>2]|0,r,4,c[t>>2]|0)|0;c[I>>2]=L;if((L|0)!=0){Q=L;R=13;break}L=Ec[c[s>>2]&15](c[M>>2]|0,O,N<<2,c[t>>2]|0)|0;c[I>>2]=L;t=c[b+44>>2]|0;c[n>>2]=t;if((L|0)!=0){S=L;T=t;break}L=Ec[c[d+4>>2]&15](c[d>>2]|0,n,4,c[d+8>>2]|0)|0;c[I>>2]=L;S=L;T=t}else{Q=P;R=13}}while(0);if((R|0)==13){P=c[b+44>>2]|0;c[n>>2]=P;S=Q;T=P}if((T|0)>0){P=b+8|0;Q=d+4|0;n=d|0;N=d+8|0;O=g;r=j;t=k;L=0;M=S;while(1){s=c[P>>2]|0;u=s+(L<<4)|0;J=s+(L<<4)+8|0;s=c[J>>2]|0;a[m]=s&15;if((M|0)==0){v=Ec[c[Q>>2]&15](c[n>>2]|0,m,1,c[N>>2]|0)|0;c[I>>2]=v;U=v;V=c[J>>2]|0}else{U=M;V=s}s=V&15;do{if((s|0)==1){a[l]=c[u>>2];if((U|0)!=0){W=U;break}J=Ec[c[Q>>2]&15](c[n>>2]|0,l,1,c[N>>2]|0)|0;c[I>>2]=J;W=J}else if((s|0)==4){J=c[u>>2]|0;if((J|0)==0){c[g>>2]=0;if((U|0)!=0){W=U;break}v=Ec[c[Q>>2]&15](c[n>>2]|0,O,4,c[N>>2]|0)|0;c[I>>2]=v;W=v;break}c[j>>2]=(c[J+12>>2]|0)+1;if((U|0)!=0){W=U;break}v=Ec[c[Q>>2]&15](c[n>>2]|0,r,4,c[N>>2]|0)|0;c[I>>2]=v;if((v|0)!=0){W=v;break}v=Ec[c[Q>>2]&15](c[n>>2]|0,J+16|0,c[j>>2]|0,c[N>>2]|0)|0;c[I>>2]=v;W=v}else if((s|0)==3){h[k>>3]=+h[u>>3];if((U|0)!=0){W=U;break}v=Ec[c[Q>>2]&15](c[n>>2]|0,t,8,c[N>>2]|0)|0;c[I>>2]=v;W=v}else{W=U}}while(0);u=L+1|0;if((u|0)<(T|0)){L=u;M=W}else{X=W;break}}}else{X=S}S=c[b+56>>2]|0;c[f>>2]=S;if((X|0)==0){W=Ec[c[d+4>>2]&15](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[I>>2]=W;Y=W}else{Y=X}if((S|0)>0){X=b+16|0;W=0;do{Wf(c[(c[X>>2]|0)+(W<<2)>>2]|0,d);W=W+1|0;}while((W|0)<(S|0));Z=c[I>>2]|0}else{Z=Y}Y=b+40|0;S=c[Y>>2]|0;c[q>>2]=S;if((Z|0)==0){W=Ec[c[d+4>>2]&15](c[d>>2]|0,q,4,c[d+8>>2]|0)|0;c[I>>2]=W;_=W}else{_=Z}if((S|0)>0){Z=b+28|0;W=d+4|0;q=d|0;X=d+8|0;f=0;M=_;while(1){L=c[Z>>2]|0;a[p]=a[L+(f<<3)+4|0]|0;if((M|0)==0){T=Ec[c[W>>2]&15](c[q>>2]|0,p,1,c[X>>2]|0)|0;c[I>>2]=T;$=c[Z>>2]|0;aa=T}else{$=L;aa=M}a[o]=a[$+(f<<3)+5|0]|0;if((aa|0)==0){L=Ec[c[W>>2]&15](c[q>>2]|0,o,1,c[X>>2]|0)|0;c[I>>2]=L;ba=L}else{ba=aa}L=f+1|0;if((L|0)<(S|0)){f=L;M=ba}else{ca=ba;break}}}else{ca=_}_=d+12|0;do{if((c[_>>2]|0)==0){ba=c[b+36>>2]|0;M=G;f=H;if((ba|0)==0){da=M;ea=f;R=50;break}c[H>>2]=(c[ba+12>>2]|0)+1;if((ca|0)!=0){fa=M;ga=f;break}S=d+4|0;aa=d|0;X=d+8|0;o=Ec[c[S>>2]&15](c[aa>>2]|0,f,4,c[X>>2]|0)|0;c[I>>2]=o;if((o|0)!=0){fa=M;ga=f;break}c[I>>2]=Ec[c[S>>2]&15](c[aa>>2]|0,ba+16|0,c[H>>2]|0,c[X>>2]|0)|0;fa=M;ga=f}else{da=G;ea=H;R=50}}while(0);do{if((R|0)==50){c[G>>2]=0;if((ca|0)!=0){fa=da;ga=ea;break}c[I>>2]=Ec[c[d+4>>2]&15](c[d>>2]|0,da,4,c[d+8>>2]|0)|0;fa=da;ga=ea}}while(0);if((c[_>>2]|0)==0){ha=c[b+52>>2]|0}else{ha=0}ea=c[b+20>>2]|0;c[F>>2]=ha;ga=c[I>>2]|0;do{if((ga|0)==0){da=d+4|0;fa=d|0;ca=d+8|0;G=Ec[c[da>>2]&15](c[fa>>2]|0,F,4,c[ca>>2]|0)|0;c[I>>2]=G;if((G|0)!=0){ia=G;break}G=Ec[c[da>>2]&15](c[fa>>2]|0,ea,ha<<2,c[ca>>2]|0)|0;c[I>>2]=G;ia=G}else{ia=ga}}while(0);if((c[_>>2]|0)==0){ja=c[b+60>>2]|0}else{ja=0}c[E>>2]=ja;if((ia|0)==0){ga=Ec[c[d+4>>2]&15](c[d>>2]|0,E,4,c[d+8>>2]|0)|0;c[I>>2]=ga;ka=ga}else{ka=ia}if((ja|0)>0){ia=b+24|0;ga=C;E=D;ha=d+4|0;ea=d|0;F=d+8|0;G=B;ca=A;fa=0;da=ka;while(1){R=c[(c[ia>>2]|0)+(fa*12|0)>>2]|0;do{if((R|0)==0){c[C>>2]=0;if((da|0)!=0){la=da;break}H=Ec[c[ha>>2]&15](c[ea>>2]|0,ga,4,c[F>>2]|0)|0;c[I>>2]=H;la=H}else{c[D>>2]=(c[R+12>>2]|0)+1;if((da|0)!=0){la=da;break}H=Ec[c[ha>>2]&15](c[ea>>2]|0,E,4,c[F>>2]|0)|0;c[I>>2]=H;if((H|0)!=0){la=H;break}H=Ec[c[ha>>2]&15](c[ea>>2]|0,R+16|0,c[D>>2]|0,c[F>>2]|0)|0;c[I>>2]=H;la=H}}while(0);R=c[ia>>2]|0;c[B>>2]=c[R+(fa*12|0)+4>>2];if((la|0)==0){H=Ec[c[ha>>2]&15](c[ea>>2]|0,G,4,c[F>>2]|0)|0;c[I>>2]=H;ma=c[ia>>2]|0;na=H}else{ma=R;na=la}c[A>>2]=c[ma+(fa*12|0)+8>>2];if((na|0)==0){R=Ec[c[ha>>2]&15](c[ea>>2]|0,ca,4,c[F>>2]|0)|0;c[I>>2]=R;oa=R}else{oa=na}R=fa+1|0;if((R|0)<(ja|0)){fa=R;da=oa}else{pa=oa;break}}}else{pa=ka}if((c[_>>2]|0)==0){qa=c[Y>>2]|0}else{qa=0}c[z>>2]=qa;if((pa|0)==0){Y=Ec[c[d+4>>2]&15](c[d>>2]|0,z,4,c[d+8>>2]|0)|0;c[I>>2]=Y;ra=Y}else{ra=pa}if((qa|0)<=0){i=e;return}pa=b+28|0;b=x;Y=y;z=d+4|0;_=d|0;ka=d+8|0;d=0;oa=ra;while(1){ra=c[(c[pa>>2]|0)+(d<<3)>>2]|0;do{if((ra|0)==0){c[x>>2]=0;if((oa|0)!=0){sa=oa;break}da=Ec[c[z>>2]&15](c[_>>2]|0,b,4,c[ka>>2]|0)|0;c[I>>2]=da;sa=da}else{c[y>>2]=(c[ra+12>>2]|0)+1;if((oa|0)!=0){sa=oa;break}da=Ec[c[z>>2]&15](c[_>>2]|0,Y,4,c[ka>>2]|0)|0;c[I>>2]=da;if((da|0)!=0){sa=da;break}da=Ec[c[z>>2]&15](c[_>>2]|0,ra+16|0,c[y>>2]|0,c[ka>>2]|0)|0;c[I>>2]=da;sa=da}}while(0);ra=d+1|0;if((ra|0)<(qa|0)){d=ra;oa=sa}else{break}}i=e;return}function Xf(b,c){b=b|0;c=c|0;var d=0;d=jg(b,38,(c<<4)+16|0,0,0)|0;a[d+6|0]=c;return d|0}function Yf(b,d){b=b|0;d=d|0;var e=0,f=0;e=jg(b,6,(d<<2)+16|0,0,0)|0;b=e|0;c[e+12>>2]=0;a[e+6|0]=d;if((d|0)==0){return b|0}f=e+16|0;e=d;do{e=e-1|0;c[f+(e<<2)>>2]=0;}while((e|0)!=0);return b|0}function Zf(a){a=a|0;var b=0;b=jg(a,10,32,0,0)|0;c[b+8>>2]=b+16;c[b+24>>2]=0;return b|0}function _f(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[b+12>>2]|0;g=b+56|0;while(1){h=c[g>>2]|0;if((h|0)==0){i=7;break}j=c[h+8>>2]|0;if(j>>>0<e>>>0){i=7;break}k=h;if((j|0)==(e|0)){break}else{g=h|0}}if((i|0)==7){i=jg(b,10,32,g,0)|0;g=i;c[i+8>>2]=e;e=i+16|0;c[e>>2]=f+112;i=f+132|0;b=c[i>>2]|0;c[e+4>>2]=b;c[b+16>>2]=g;c[i>>2]=g;l=g;return l|0}g=h+5|0;h=(d[g]|0)^3;if((((d[f+60|0]|0)^3)&h|0)!=0){l=k;return l|0}a[g]=h;l=k;return l|0}function $f(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;if((c[b+8>>2]|0)==(b+16|0)){d=b;e=Gh(a,d,32,0)|0;return}f=b+16|0;g=f;h=f+4|0;c[(c[h>>2]|0)+16>>2]=c[g>>2];c[(c[g>>2]|0)+20>>2]=c[h>>2];d=b;e=Gh(a,d,32,0)|0;return}function ag(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=c[a+12>>2]|0;f=a+56|0;g=c[f>>2]|0;if((g|0)==0){return}h=e+60|0;i=e+68|0;j=g;while(1){g=j;k=j+8|0;if((c[k>>2]|0)>>>0<b>>>0){l=10;break}m=j|0;c[f>>2]=c[m>>2];if((((d[h]|0)^3)&((d[j+5|0]|0)^3)|0)==0){if((c[k>>2]|0)!=(j+16|0)){n=j+16|0;o=n;p=n+4|0;c[(c[p>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[p>>2]}Gh(a,j,32,0)|0}else{p=j+16|0;o=p;n=p+4|0;c[(c[n>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[n>>2];n=c[k>>2]|0;o=j+16|0;p=n;q=o;r=c[p+4>>2]|0;c[q>>2]=c[p>>2];c[q+4>>2]=r;c[j+24>>2]=c[n+8>>2];c[k>>2]=o;c[m>>2]=c[i>>2];c[i>>2]=j;ig(e,g)}g=c[f>>2]|0;if((g|0)==0){l=10;break}else{j=g}}if((l|0)==10){return}}function bg(b){b=b|0;var d=0;d=jg(b,9,80,0,0)|0;b=d;c[d+8>>2]=0;c[d+44>>2]=0;c[d+16>>2]=0;c[d+56>>2]=0;c[d+12>>2]=0;c[d+32>>2]=0;c[d+48>>2]=0;c[b+20>>2]=0;c[d+52>>2]=0;c[b+28>>2]=0;c[d+40>>2]=0;a[d+76|0]=0;a[d+77|0]=0;a[d+78|0]=0;c[d+24>>2]=0;c[d+60>>2]=0;c[d+64>>2]=0;c[d+68>>2]=0;c[d+36>>2]=0;return b|0}function cg(a,b){a=a|0;b=b|0;Gh(a,c[b+12>>2]|0,c[b+48>>2]<<2,0)|0;Gh(a,c[b+16>>2]|0,c[b+56>>2]<<2,0)|0;Gh(a,c[b+8>>2]|0,c[b+44>>2]<<4,0)|0;Gh(a,c[b+20>>2]|0,c[b+52>>2]<<2,0)|0;Gh(a,c[b+24>>2]|0,(c[b+60>>2]|0)*12|0,0)|0;Gh(a,c[b+28>>2]|0,c[b+40>>2]<<3,0)|0;Gh(a,b,80,0)|0;return}function dg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+60>>2]|0;if((e|0)<=0){f=0;return f|0}g=c[a+24>>2]|0;a=b;b=0;while(1){if((c[g+(b*12|0)+4>>2]|0)>(d|0)){f=0;h=8;break}if((c[g+(b*12|0)+8>>2]|0)>(d|0)){i=a-1|0;if((i|0)==0){h=6;break}else{j=i}}else{j=a}i=b+1|0;if((i|0)<(e|0)){a=j;b=i}else{f=0;h=8;break}}if((h|0)==6){f=(c[g+(b*12|0)>>2]|0)+16|0;return f|0}else if((h|0)==8){return f|0}return 0}function eg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=c[b+12>>2]|0;if((d[g+61|0]|0)>>>0<2>>>0){fg(g,f);return}else{f=e+5|0;a[f]=a[g+60|0]&3|a[f]&-72;return}}function fg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=e+5|0;a[f]=a[f]&-4;a:do{switch(d[e+4|0]|0|0){case 4:case 20:{g=(c[e+12>>2]|0)+17|0;break};case 7:{h=c[e+8>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}fg(b,h)}}while(0);h=c[e+12>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}fg(b,h)}}while(0);g=(c[e+16>>2]|0)+24|0;break};case 8:{h=b+84|0;c[e+60>>2]=c[h>>2];c[h>>2]=e;return};case 5:{h=b+84|0;c[e+24>>2]=c[h>>2];c[h>>2]=e;return};case 9:{h=b+84|0;c[e+72>>2]=c[h>>2];c[h>>2]=e;return};case 10:{h=e+8|0;i=c[h>>2]|0;do{if((c[i+8>>2]&64|0)==0){j=i}else{k=c[i>>2]|0;if((a[k+5|0]&3)==0){j=i;break}fg(b,k);j=c[h>>2]|0}}while(0);if((j|0)==(e+16|0)){g=32;break a}return};case 6:{h=b+84|0;c[e+8>>2]=c[h>>2];c[h>>2]=e;return};case 38:{h=b+84|0;c[e+8>>2]=c[h>>2];c[h>>2]=e;return};default:{return}}}while(0);a[f]=a[f]|4;f=b+16|0;c[f>>2]=(c[f>>2]|0)+g;return}function gg(b,d){b=b|0;d=d|0;var e=0;e=c[b+12>>2]|0;b=d+5|0;a[b]=a[b]&-5;b=e+88|0;c[d+24>>2]=c[b>>2];c[b>>2]=d;return}function hg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;if((c[e+32>>2]|0)!=0){g=c[b+12>>2]|0;h=e+5|0;a[h]=a[h]&-5;h=g+88|0;c[e+72>>2]=c[h>>2];c[h>>2]=e;return}if((a[f+5|0]&3)==0){return}h=e+5|0;e=a[h]|0;if((e&4)==0){return}g=c[b+12>>2]|0;if((d[g+61|0]|0)>>>0<2>>>0){fg(g,f);return}else{a[h]=a[g+60|0]&3|e&-72;return}}function ig(b,e){b=b|0;e=e|0;var f=0,g=0;f=e+5|0;g=a[f]|0;if((g&7)!=0){return}do{if((a[b+62|0]|0)!=2){if((d[b+61|0]|0)>>>0<2>>>0){break}a[f]=a[b+60|0]&3|g&-72;return}}while(0);a[f]=g&-69|4;g=c[e+8>>2]|0;if((c[g+8>>2]&64|0)==0){return}e=c[g>>2]|0;if((a[e+5|0]&3)==0){return}fg(b,e);return}function jg(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=c[b+12>>2]|0;i=Gh(b,0,d&15,e)|0;e=i+g|0;b=e;j=(f|0)==0?h+68|0:f;a[i+(g+5)|0]=a[h+60|0]&3;a[i+(g+4)|0]=d;c[e>>2]=c[j>>2];c[j>>2]=b;return b|0}function kg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+12>>2]|0;h=e+5|0;if((a[h]&24)!=0|(f|0)==0){return}if((a[f+6|0]&4)!=0){return}if((Tj(f,2,c[g+192>>2]|0)|0)==0){return}f=g+76|0;i=c[f>>2]|0;j=e|0;if((i|0)==(j|0)){do{k=og(b,i,1)|0;}while((k|0)==(i|0));c[f>>2]=k}k=g+68|0;while(1){f=c[k>>2]|0;if((f|0)==(e|0)){break}else{k=f|0}}c[k>>2]=c[j>>2];k=g+72|0;c[j>>2]=c[k>>2];c[k>>2]=e;e=a[h]|16;a[h]=e;if((d[g+61|0]|0)>>>0<2>>>0){a[h]=e&-65;return}else{a[h]=a[g+60|0]&3|e&-72;return}}function lg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;if((d[h]|0)==(e|0)){return}if((e|0)==2){e=g+61|0;if((a[e]|0)!=0){do{pg(b)|0;}while((a[e]|0)!=0)}c[g+20>>2]=(c[g+12>>2]|0)+(c[g+8>>2]|0);a[h]=2;return}a[h]=0;h=c[f>>2]|0;a[h+61|0]=2;c[h+64>>2]=0;g=h+72|0;do{i=og(b,g,1)|0;}while((i|0)==(g|0));c[h+80>>2]=i;i=h+68|0;do{j=og(b,i,1)|0;}while((j|0)==(i|0));c[h+76>>2]=j;j=(c[f>>2]|0)+61|0;if((1<<d[j]&-29|0)!=0){return}do{pg(b)|0;}while((1<<d[j]&-29|0)==0);return}function mg(a,b){a=a|0;b=b|0;var e=0;e=(c[a+12>>2]|0)+61|0;if((1<<(d[e]|0)&b|0)!=0){return}do{pg(a)|0;}while((1<<(d[e]|0)&b|0)==0);return}function ng(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+12|0;e=c[d>>2]|0;f=e+104|0;while(1){g=c[f>>2]|0;if((g|0)==0){break}else{f=g|0}}g=e+72|0;h=c[g>>2]|0;if((h|0)==0){i=e}else{j=f;f=h;while(1){h=f+5|0;a[h]=a[h]|8;h=f|0;c[g>>2]=c[h>>2];c[h>>2]=c[j>>2];c[j>>2]=f;k=c[g>>2]|0;if((k|0)==0){break}else{j=h;f=k}}i=c[d>>2]|0}d=i+104|0;i=c[d>>2]|0;if((i|0)!=0){f=i;do{i=f+5|0;a[i]=a[i]&-65;rg(b,0);f=c[d>>2]|0;}while((f|0)!=0)}a[e+60|0]=3;a[e+62|0]=0;og(b,g,-3)|0;og(b,e+68|0,-3)|0;g=e+32|0;if((c[g>>2]|0)<=0){return}f=e+24|0;e=0;do{og(b,(c[f>>2]|0)+(e<<2)|0,-3)|0;e=e+1|0;}while((e|0)<(c[g>>2]|0));return}function og(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=b+12|0;h=c[g>>2]|0;i=a[h+60|0]|0;j=i&255^3;k=(a[h+62|0]|0)==2;h=k?-1:-72;l=k?64:i&3;i=k?64:0;k=c[e>>2]|0;a:do{if((k|0)==0){m=0;n=e}else{o=f;p=e;q=k;b:while(1){r=o-1|0;if((o|0)==0){m=q;n=p;break a}s=q+5|0;t=a[s]|0;u=t&255;c:do{if(((u^3)&j|0)==0){c[p>>2]=c[q>>2];switch(d[q+4|0]|0){case 20:{break};case 8:{Pi(b,q);v=p;break c;break};case 10:{$f(b,q);v=p;break c;break};case 38:{Gh(b,q,(d[q+6|0]<<4)+16|0,0)|0;v=p;break c;break};case 7:{Gh(b,q,(c[q+16>>2]|0)+24|0,0)|0;v=p;break c;break};case 5:{Bj(b,q);v=p;break c;break};case 9:{cg(b,q);v=p;break c;break};case 4:{w=(c[g>>2]|0)+28|0;c[w>>2]=(c[w>>2]|0)-1;break};case 6:{Gh(b,q,(d[q+6|0]<<2)+16|0,0)|0;v=p;break c;break};default:{v=p;break c}}Gh(b,q,(c[q+12>>2]|0)+17|0,0)|0;v=p}else{if((u&i|0)!=0){x=0;break b}do{if((a[q+4|0]|0)==8){w=q;if((c[w+28>>2]|0)==0){break}og(b,q+56|0,-3)|0;Ni(w);if((a[(c[g>>2]|0)+62|0]|0)==1){break}If(w)}}while(0);a[s]=t&h|l;v=q|0}}while(0);t=c[v>>2]|0;if((t|0)==0){m=0;n=v;break a}else{o=r;p=v;q=t}}return x|0}}while(0);x=(m|0)==0?0:n;return x|0}function pg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+8|0;f=e|0;g=b+12|0;h=c[g>>2]|0;j=h+61|0;switch(d[j]|0){case 2:{k=h+64|0;l=h+32|0;m=h+24|0;n=0;while(1){o=c[k>>2]|0;p=o+n|0;q=c[l>>2]|0;if((p|0)>=(q|0)){r=n;s=o;t=q;break}og(b,(c[m>>2]|0)+(p<<2)|0,-3)|0;u=n+1|0;if((u|0)<80){n=u}else{v=96;break}}if((v|0)==96){r=u;s=c[k>>2]|0;t=c[l>>2]|0}l=s+r|0;c[k>>2]=l;if((l|0)>=(t|0)){a[j]=3}w=r*5|0;i=e;return w|0};case 5:{r=h+16|0;c[r>>2]=c[h+32>>2]<<2;Ym(h+84|0,0,20)|0;t=c[h+172>>2]|0;do{if((t|0)!=0){if((a[t+5|0]&3)==0){break}fg(h,t)}}while(0);do{if((c[h+48>>2]&64|0)!=0){t=c[h+40>>2]|0;if((a[t+5|0]&3)==0){break}fg(h,t)}}while(0);wg(h);t=c[h+104>>2]|0;if((t|0)!=0){l=h+60|0;k=t;do{t=k+5|0;a[t]=a[l]&3|a[t]&-72;fg(h,k);k=c[k>>2]|0;}while((k|0)!=0)}a[j]=0;w=c[r>>2]|0;i=e;return w|0};case 0:{if((c[h+84>>2]|0)!=0){r=h+16|0;k=c[r>>2]|0;vg(h);w=(c[r>>2]|0)-k|0;i=e;return w|0}a[j]=1;k=h+20|0;c[k>>2]=c[h+16>>2];r=c[g>>2]|0;l=r+16|0;t=c[l>>2]|0;do{if((b|0)!=0){if((a[b+5|0]&3)==0){break}fg(r,b)}}while(0);do{if((c[r+48>>2]&64|0)!=0){s=c[r+40>>2]|0;if((a[s+5|0]&3)==0){break}fg(r,s)}}while(0);wg(r);s=r+112|0;u=c[r+132>>2]|0;if((u|0)!=(s|0)){v=u;do{do{if((a[v+5|0]&7)==0){u=c[v+8>>2]|0;if((c[u+8>>2]&64|0)==0){break}n=c[u>>2]|0;if((a[n+5|0]&3)==0){break}fg(r,n)}}while(0);v=c[v+20>>2]|0;}while((v|0)!=(s|0))}s=r+84|0;if((c[s>>2]|0)!=0){do{vg(r);}while((c[s>>2]|0)!=0)}v=(c[l>>2]|0)-t|0;t=r+92|0;n=c[t>>2]|0;u=r+88|0;m=c[u>>2]|0;p=r+96|0;q=c[p>>2]|0;c[p>>2]=0;c[u>>2]=0;c[t>>2]=0;c[s>>2]=m;if((m|0)!=0){do{vg(r);}while((c[s>>2]|0)!=0)}c[s>>2]=n;if((n|0)!=0){do{vg(r);}while((c[s>>2]|0)!=0)}c[s>>2]=q;if((q|0)!=0){do{vg(r);}while((c[s>>2]|0)!=0)}q=c[l>>2]|0;while(1){n=c[p>>2]|0;c[p>>2]=0;m=n;n=0;a:while(1){u=m;while(1){if((u|0)==0){break a}x=c[u+24>>2]|0;if((yg(r,u)|0)==0){u=x}else{break}}if((c[s>>2]|0)==0){m=x;n=1;continue}while(1){vg(r);if((c[s>>2]|0)==0){m=x;n=1;continue a}}}if((n|0)==0){break}}xg(r,c[t>>2]|0,0);x=r+100|0;xg(r,c[x>>2]|0,0);m=c[t>>2]|0;u=c[x>>2]|0;o=c[l>>2]|0;y=c[g>>2]|0;z=y+104|0;while(1){A=c[z>>2]|0;if((A|0)==0){break}else{z=A|0}}A=v-q+o|0;o=y+72|0;y=c[o>>2]|0;b:do{if((y|0)!=0){q=o;v=z;B=y;while(1){C=v;D=B;while(1){E=D+5|0;F=a[E]|0;if((F&3)==0){break}a[E]=F|8;F=D|0;c[q>>2]=c[F>>2];c[F>>2]=c[C>>2];c[C>>2]=D;E=c[q>>2]|0;if((E|0)==0){break b}else{C=F;D=E}}E=D|0;F=c[E>>2]|0;if((F|0)==0){break}else{q=E;v=C;B=F}}}}while(0);y=c[r+104>>2]|0;if((y|0)!=0){z=r+60|0;o=y;do{y=o+5|0;a[y]=a[z]&3|a[y]&-72;fg(r,o);o=c[o>>2]|0;}while((o|0)!=0)}if((c[s>>2]|0)!=0){do{vg(r);}while((c[s>>2]|0)!=0)}o=c[l>>2]|0;while(1){z=c[p>>2]|0;c[p>>2]=0;y=z;z=0;c:while(1){B=y;while(1){if((B|0)==0){break c}G=c[B+24>>2]|0;if((yg(r,B)|0)==0){B=G}else{break}}if((c[s>>2]|0)==0){y=G;z=1;continue}while(1){vg(r);if((c[s>>2]|0)==0){y=G;z=1;continue c}}}if((z|0)==0){break}}G=A-o|0;o=c[p>>2]|0;if((o|0)!=0){p=o;do{o=1<<d[p+7|0];A=c[p+16>>2]|0;s=A+(o<<5)|0;if((o|0)>0){o=A;do{A=o+8|0;do{if((c[A>>2]|0)!=0){y=o+24|0;B=c[y>>2]|0;if((B&64|0)==0){break}C=c[o+16>>2]|0;if((B&15|0)==4){if((C|0)==0){break}if((a[C+5|0]&3)==0){break}fg(r,C);break}else{B=C+5|0;if((a[B]&3)==0){break}c[A>>2]=0;if((a[B]&3)==0){break}c[y>>2]=11;break}}}while(0);o=o+32|0;}while(o>>>0<s>>>0)}p=c[p+24>>2]|0;}while((p|0)!=0)}p=c[x>>2]|0;if((p|0)!=0){s=p;do{p=1<<d[s+7|0];o=c[s+16>>2]|0;z=o+(p<<5)|0;if((p|0)>0){p=o;do{o=p+8|0;do{if((c[o>>2]|0)!=0){A=p+24|0;y=c[A>>2]|0;if((y&64|0)==0){break}B=c[p+16>>2]|0;if((y&15|0)==4){if((B|0)==0){break}if((a[B+5|0]&3)==0){break}fg(r,B);break}else{y=B+5|0;if((a[y]&3)==0){break}c[o>>2]=0;if((a[y]&3)==0){break}c[A>>2]=11;break}}}while(0);p=p+32|0;}while(p>>>0<z>>>0)}s=c[s+24>>2]|0;}while((s|0)!=0)}xg(r,c[t>>2]|0,m);xg(r,c[x>>2]|0,u);u=r+60|0;a[u]=a[u]^3;u=G+(c[l>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+u;k=c[g>>2]|0;a[k+61|0]=2;c[k+64>>2]=0;l=k+72|0;G=0;do{G=G+1|0;H=og(b,l,1)|0;}while((H|0)==(l|0));c[k+80>>2]=H;H=k+68|0;l=0;do{l=l+1|0;I=og(b,H,1)|0;}while((I|0)==(H|0));c[k+76>>2]=I;w=((l+G|0)*5|0)+u|0;i=e;return w|0};case 3:{u=h+80|0;G=c[u>>2]|0;if((G|0)==0){a[j]=4;w=0;i=e;return w|0}else{c[u>>2]=og(b,G,80)|0;w=400;i=e;return w|0}break};case 4:{G=h+76|0;u=c[G>>2]|0;if((u|0)!=0){c[G>>2]=og(b,u,80)|0;w=400;i=e;return w|0}c[f>>2]=c[h+172>>2];og(b,f,1)|0;f=c[g>>2]|0;if((a[f+62|0]|0)!=1){g=(c[f+32>>2]|0)/2|0;if((c[f+28>>2]|0)>>>0<g>>>0){Xi(b,g)}g=f+144|0;h=f+152|0;c[g>>2]=Gh(b,c[g>>2]|0,c[h>>2]|0,0)|0;c[h>>2]=0}a[j]=5;w=5;i=e;return w|0};default:{w=0;i=e;return w|0}}return 0}function qg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=c[b+12>>2]|0;a:do{if((a[d+62|0]|0)==2){e=d+20|0;f=c[e>>2]|0;do{if((f|0)==0){tg(b,0);g=c[d+8>>2]|0;h=c[d+12>>2]|0;c[e>>2]=h+g;i=g;j=h}else{h=d+61|0;if((a[h]|0)!=5){do{pg(b)|0;}while((a[h]|0)!=5)}a[h]=0;g=c[d+8>>2]|0;k=c[d+12>>2]|0;if((k+g|0)>>>0>(ca(c[d+160>>2]|0,(f>>>0)/100|0)|0)>>>0){c[e>>2]=0;i=g;j=k;break}else{c[e>>2]=f;i=g;j=k;break}}}while(0);f=i+j|0;e=(f|0)/100|0;k=c[d+156>>2]|0;if((k|0)<(2147483644/(e|0)|0|0)){l=ca(k,e)|0}else{l=2147483644}Li(d,f-l|0);m=d+61|0}else{f=d+12|0;e=c[d+164>>2]|0;k=(e|0)<40?40:e;e=((c[f>>2]|0)/200|0)+1|0;if((e|0)<(2147483644/(k|0)|0|0)){n=ca(e,k)|0}else{n=2147483644}e=d+61|0;g=n;do{g=g-(pg(b)|0)|0;o=(a[e]|0)==5;if((g|0)<=-1600){p=17;break}}while(!o);do{if((p|0)==17){if(o){break}Li(d,((g|0)/(k|0)|0)*200|0);m=e;break a}}while(0);k=(c[d+20>>2]|0)/100|0;g=c[d+156>>2]|0;if((g|0)<(2147483644/(k|0)|0|0)){q=ca(g,k)|0}else{q=2147483644}Li(d,(c[d+8>>2]|0)-q+(c[f>>2]|0)|0);m=e}}while(0);q=d+104|0;if((c[q>>2]|0)==0){return}else{r=0}while(1){if((r|0)>=4){if((a[m]|0)!=5){p=26;break}}rg(b,1);if((c[q>>2]|0)==0){p=26;break}else{r=r+1|0}}if((p|0)==26){return}}function rg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+16|0;g=f|0;h=c[b+12>>2]|0;j=h+104|0;k=c[j>>2]|0;l=k|0;c[j>>2]=c[l>>2];j=h+68|0;c[l>>2]=c[j>>2];c[j>>2]=k;j=k+5|0;l=a[j]|0;a[j]=l&-17;if((d[h+61|0]|0)>>>0>=2>>>0){a[j]=a[h+60|0]&3|l&-88}c[g>>2]=k;l=g+8|0;c[l>>2]=d[k+4|0]|0|64;k=Uj(b,g,2)|0;if((k|0)==0){i=f;return}j=k+8|0;if((c[j>>2]&15|0)!=6){i=f;return}m=b+41|0;n=a[m]|0;o=h+63|0;h=a[o]|0;a[m]=0;a[o]=0;p=b+8|0;q=c[p>>2]|0;r=k;k=q;s=c[r+4>>2]|0;c[k>>2]=c[r>>2];c[k+4>>2]=s;c[q+8>>2]=c[j>>2];j=c[p>>2]|0;q=g;g=j+16|0;s=c[q+4>>2]|0;c[g>>2]=c[q>>2];c[g+4>>2]=s;c[j+24>>2]=c[l>>2];l=c[p>>2]|0;c[p>>2]=l+32;j=Rf(b,6,0,l-(c[b+28>>2]|0)|0,0)|0;a[m]=n;a[o]=h;if((j|0)==0|(e|0)==0){i=f;return}if((j|0)!=2){t=j;Ef(b,t)}j=c[p>>2]|0;if((c[j-16+8>>2]&15|0)==4){u=(c[j-16>>2]|0)+16|0}else{u=2680}bi(b,9672,(j=i,i=i+8|0,c[j>>2]=u,j)|0)|0;i=j;t=5;Ef(b,t)}function sg(b){b=b|0;var d=0;d=c[b+12>>2]|0;if((a[d+63|0]|0)==0){Li(d,-1600);return}else{qg(b);return}}function tg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;i=a[h]|0;j=(e|0)!=0;do{if(j){a[h]=1;k=6}else{a[h]=0;e=(c[f>>2]|0)+104|0;l=c[e>>2]|0;if((l|0)==0){k=6;break}else{m=l}do{l=m+5|0;a[l]=a[l]&-65;rg(b,1);m=c[e>>2]|0;}while((m|0)!=0);if((a[h]|0)==2){k=7}else{k=6}}}while(0);if((k|0)==6){if((d[g+61|0]|0)>>>0<2>>>0){k=7}}if((k|0)==7){k=c[f>>2]|0;a[k+61|0]=2;c[k+64>>2]=0;m=k+72|0;do{n=og(b,m,1)|0;}while((n|0)==(m|0));c[k+80>>2]=n;n=k+68|0;do{o=og(b,n,1)|0;}while((o|0)==(n|0));c[k+76>>2]=o}o=c[f>>2]|0;k=o+61|0;if((a[k]|0)==5){p=o;q=5}else{do{pg(b)|0;}while((a[k]|0)!=5);k=c[f>>2]|0;p=k;q=a[k+61|0]|0}k=p+61|0;if((1<<(q&255)&-33|0)==0){do{pg(b)|0;}while((1<<d[k]&-33|0)==0);k=c[f>>2]|0;r=k;s=a[k+61|0]|0}else{r=p;s=q}q=r+61|0;if(s<<24>>24!=5){do{pg(b)|0;}while((a[q]|0)!=5)}do{if(i<<24>>24==2){q=(c[f>>2]|0)+61|0;if((a[q]|0)==0){break}do{pg(b)|0;}while((a[q]|0)!=0)}}while(0);a[h]=i;i=c[g+8>>2]|0;h=c[g+12>>2]|0;q=(h+i|0)/100|0;s=c[g+156>>2]|0;if((s|0)<(2147483644/(q|0)|0|0)){t=ca(s,q)|0}else{t=2147483644}Li(g,i-t+h|0);if(j){return}j=(c[f>>2]|0)+104|0;f=c[j>>2]|0;if((f|0)==0){return}else{u=f}do{f=u+5|0;a[f]=a[f]&-65;rg(b,1);u=c[j>>2]|0;}while((u|0)!=0);return}function ug(a,b){a=a|0;b=b|0;Mf(a,(c[a+8>>2]|0)-32|0,0,0);return}function vg(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=b+84|0;f=c[e>>2]|0;g=f+5|0;a[g]=a[g]|4;a:do{switch(d[f+4|0]|0){case 5:{h=f;i=f+24|0;c[e>>2]=c[i>>2];j=f+8|0;k=c[j>>2]|0;l=k;do{if((k|0)==0){m=33}else{if((a[k+6|0]&8)==0){n=Tj(l,3,c[b+196>>2]|0)|0;o=c[j>>2]|0;if((o|0)==0){p=n}else{q=o;r=n;m=5}}else{q=l;r=0;m=5}do{if((m|0)==5){if((a[q+5|0]&3)==0){p=r;break}fg(b,q);p=r}}while(0);if((p|0)==0){m=33;break}if((c[p+8>>2]&15|0)!=4){m=33;break}n=(c[p>>2]|0)+16|0;o=Wa(n|0,107)|0;s=(o|0)!=0;o=(Wa(n|0,118)|0)==0;if(o&(s^1)){m=33;break}a[g]=a[g]&-5;if(s){if(o){yg(b,h)|0;break}else{o=b+100|0;c[i>>2]=c[o>>2];c[o>>2]=f;break}}o=1<<d[h+7|0];s=c[f+16>>2]|0;n=s+(o<<5)|0;t=(c[h+28>>2]|0)>0|0;if((o|0)>0){o=s;s=t;while(1){u=o+8|0;v=o+24|0;w=(c[v>>2]&64|0)==0;do{if((c[u>>2]|0)==0){if(w){x=s;break}if((a[(c[o+16>>2]|0)+5|0]&3)==0){x=s;break}c[v>>2]=11;x=s}else{do{if(!w){y=c[o+16>>2]|0;if((a[y+5|0]&3)==0){break}fg(b,y)}}while(0);if((s|0)!=0){x=s;break}y=c[u>>2]|0;if((y&64|0)==0){x=0;break}z=c[o>>2]|0;if((y&15|0)!=4){x=(a[z+5|0]&3)!=0|0;break}if((z|0)==0){x=0;break}if((a[z+5|0]&3)==0){x=0;break}fg(b,z);x=0}}while(0);u=o+32|0;if(u>>>0<n>>>0){o=u;s=x}else{A=x;break}}}else{A=t}if((A|0)==0){s=b+88|0;c[i>>2]=c[s>>2];c[s>>2]=f;break}else{s=b+92|0;c[i>>2]=c[s>>2];c[s>>2]=f;break}}}while(0);do{if((m|0)==33){i=f+16|0;l=c[i>>2]|0;j=l+(1<<d[h+7|0]<<5)|0;k=h+28|0;s=c[k>>2]|0;if((s|0)>0){o=f+12|0;n=0;u=s;while(1){s=c[o>>2]|0;do{if((c[s+(n<<4)+8>>2]&64|0)==0){B=u}else{w=c[s+(n<<4)>>2]|0;if((a[w+5|0]&3)==0){B=u;break}fg(b,w);B=c[k>>2]|0}}while(0);s=n+1|0;if((s|0)<(B|0)){n=s;u=B}else{break}}C=c[i>>2]|0}else{C=l}if(C>>>0<j>>>0){D=C}else{break}do{u=D+8|0;n=c[u>>2]|0;k=D+24|0;o=(c[k>>2]&64|0)==0;do{if((n|0)==0){if(o){break}if((a[(c[D+16>>2]|0)+5|0]&3)==0){break}c[k>>2]=11}else{do{if(o){E=n}else{t=c[D+16>>2]|0;if((a[t+5|0]&3)==0){E=n;break}fg(b,t);E=c[u>>2]|0}}while(0);if((E&64|0)==0){break}t=c[D>>2]|0;if((a[t+5|0]&3)==0){break}fg(b,t)}}while(0);D=D+32|0;}while(D>>>0<j>>>0)}}while(0);F=(c[h+28>>2]<<4)+32+(32<<d[h+7|0])|0;break};case 38:{c[e>>2]=c[f+8>>2];j=f+6|0;l=a[j]|0;if(l<<24>>24==0){G=l&255}else{i=0;u=l;while(1){do{if((c[f+16+(i<<4)+8>>2]&64|0)==0){H=u}else{l=c[f+16+(i<<4)>>2]|0;if((a[l+5|0]&3)==0){H=u;break}fg(b,l);H=a[j]|0}}while(0);l=i+1|0;n=H&255;if((l|0)<(n|0)){i=l;u=H}else{G=n;break}}}F=(G<<4)+16|0;break};case 6:{u=f;c[e>>2]=c[f+8>>2];i=c[f+12>>2]|0;do{if((i|0)!=0){if((a[i+5|0]&3)==0){break}fg(b,i)}}while(0);i=f+6|0;j=a[i]|0;if(j<<24>>24==0){I=j&255}else{h=0;n=j;while(1){j=c[u+16+(h<<2)>>2]|0;do{if((j|0)==0){J=n}else{if((a[j+5|0]&3)==0){J=n;break}fg(b,j);J=a[i]|0}}while(0);j=h+1|0;l=J&255;if((j|0)<(l|0)){h=j;n=J}else{I=l;break}}}F=(I<<2)+16|0;break};case 9:{n=f;c[e>>2]=c[f+72>>2];h=f+32|0;i=c[h>>2]|0;do{if((i|0)!=0){if((a[i+5|0]&3)==0){break}c[h>>2]=0}}while(0);h=c[f+36>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}fg(b,h)}}while(0);h=f+44|0;i=c[h>>2]|0;if((i|0)>0){u=f+8|0;l=0;j=i;while(1){i=c[u>>2]|0;do{if((c[i+(l<<4)+8>>2]&64|0)==0){K=j}else{o=c[i+(l<<4)>>2]|0;if((a[o+5|0]&3)==0){K=j;break}fg(b,o);K=c[h>>2]|0}}while(0);i=l+1|0;if((i|0)<(K|0)){l=i;j=K}else{break}}}j=f+40|0;l=c[j>>2]|0;if((l|0)>0){u=n+28|0;i=0;o=l;while(1){l=c[(c[u>>2]|0)+(i<<3)>>2]|0;do{if((l|0)==0){L=o}else{if((a[l+5|0]&3)==0){L=o;break}fg(b,l);L=c[j>>2]|0}}while(0);l=i+1|0;if((l|0)<(L|0)){i=l;o=L}else{break}}}o=f+56|0;i=c[o>>2]|0;if((i|0)>0){u=f+16|0;n=0;l=i;while(1){k=c[(c[u>>2]|0)+(n<<2)>>2]|0;do{if((k|0)==0){M=l}else{if((a[k+5|0]&3)==0){M=l;break}fg(b,k);M=c[o>>2]|0}}while(0);k=n+1|0;if((k|0)<(M|0)){n=k;l=M}else{N=M;break}}}else{N=i}l=f+60|0;n=c[l>>2]|0;if((n|0)>0){u=f+24|0;k=0;t=n;while(1){s=c[(c[u>>2]|0)+(k*12|0)>>2]|0;do{if((s|0)==0){O=t}else{if((a[s+5|0]&3)==0){O=t;break}fg(b,s);O=c[l>>2]|0}}while(0);s=k+1|0;if((s|0)<(O|0)){k=s;t=O}else{break}}P=O;Q=c[o>>2]|0}else{P=n;Q=N}F=(P*12|0)+80+(c[h>>2]<<4)+(c[j>>2]<<3)+((c[f+48>>2]|0)+Q+(c[f+52>>2]|0)<<2)|0;break};case 8:{t=f+60|0;c[e>>2]=c[t>>2];k=b+88|0;c[t>>2]=c[k>>2];c[k>>2]=f;a[g]=a[g]&-5;k=f+28|0;t=c[k>>2]|0;if((t|0)==0){F=1;break a}l=f+8|0;u=c[l>>2]|0;if(t>>>0<u>>>0){i=t;s=u;while(1){do{if((c[i+8>>2]&64|0)==0){R=s}else{u=c[i>>2]|0;if((a[u+5|0]&3)==0){R=s;break}fg(b,u);R=c[l>>2]|0}}while(0);u=i+16|0;if(u>>>0<R>>>0){i=u;s=R}else{S=u;break}}}else{S=t}do{if((a[b+61|0]|0)==1){s=f+32|0;i=(c[k>>2]|0)+(c[s>>2]<<4)|0;if(S>>>0<i>>>0){T=S}else{U=s;break}while(1){c[T+8>>2]=0;l=T+16|0;if(l>>>0<i>>>0){T=l}else{U=s;break}}}else{U=f+32|0}}while(0);F=(c[U>>2]<<4)+112|0;break};default:{return}}}while(0);U=b+16|0;c[U>>2]=(c[U>>2]|0)+F;return}function wg(b){b=b|0;var d=0;d=c[b+252>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+256>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+260>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+264>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+268>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+272>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+276>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+280>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fg(b,d)}}while(0);d=c[b+284>>2]|0;if((d|0)==0){return}if((a[d+5|0]&3)==0){return}fg(b,d);return}function xg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((e|0)==(f|0)){return}else{g=e}do{e=g;h=g+16|0;i=c[h>>2]|0;j=i+(1<<(d[e+7|0]|0)<<5)|0;k=e+28|0;if((c[k>>2]|0)>0){e=g+12|0;l=0;do{m=c[e>>2]|0;n=m+(l<<4)+8|0;o=c[n>>2]|0;do{if((o&64|0)!=0){p=c[m+(l<<4)>>2]|0;if((o&15|0)!=4){if((a[p+5|0]&3)==0){break}c[n>>2]=0;break}if((p|0)==0){break}if((a[p+5|0]&3)==0){break}fg(b,p)}}while(0);l=l+1|0;}while((l|0)<(c[k>>2]|0));q=c[h>>2]|0}else{q=i}if(q>>>0<j>>>0){k=q;do{l=k+8|0;e=c[l>>2]|0;do{if(!((e|0)==0|(e&64|0)==0)){n=c[k>>2]|0;if((e&15|0)==4){if((n|0)==0){break}if((a[n+5|0]&3)==0){break}fg(b,n);break}if((a[n+5|0]&3)==0){break}c[l>>2]=0;n=k+24|0;if((c[n>>2]&64|0)==0){break}if((a[(c[k+16>>2]|0)+5|0]&3)==0){break}c[n>>2]=11}}while(0);k=k+32|0;}while(k>>>0<j>>>0)}g=c[g+24>>2]|0;}while((g|0)!=(f|0));return}function yg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=e+16|0;g=c[f>>2]|0;h=g+(1<<(d[e+7|0]|0)<<5)|0;i=e+28|0;j=c[i>>2]|0;if((j|0)>0){k=e+12|0;l=0;m=0;n=j;while(1){j=c[k>>2]|0;do{if((c[j+(m<<4)+8>>2]&64|0)==0){o=l;p=n}else{q=c[j+(m<<4)>>2]|0;if((a[q+5|0]&3)==0){o=l;p=n;break}fg(b,q);o=1;p=c[i>>2]|0}}while(0);j=m+1|0;if((j|0)<(p|0)){l=o;m=j;n=p}else{break}}r=o;s=c[f>>2]|0}else{r=0;s=g}do{if(s>>>0<h>>>0){g=0;f=0;o=s;p=r;while(1){n=o+8|0;m=c[n>>2]|0;l=o+24|0;i=c[l>>2]|0;k=(i&64|0)==0;a:do{if((m|0)==0){if(k){t=p;u=f;v=g;break}if((a[(c[o+16>>2]|0)+5|0]&3)==0){t=p;u=f;v=g;break}c[l>>2]=11;t=p;u=f;v=g}else{do{if(k){w=m;x=18}else{j=c[o+16>>2]|0;if((i&15|0)==4){if((j|0)==0){w=m;x=18;break}if((a[j+5|0]&3)==0){w=m;x=18;break}fg(b,j);w=c[n>>2]|0;x=18;break}q=(m&64|0)==0;if((a[j+5|0]&3)==0){if(q){t=p;u=f;v=g;break a}else{break}}if(q){t=p;u=f;v=1;break a}t=p;u=(a[(c[o>>2]|0)+5|0]&3)==0?f:1;v=1;break a}}while(0);if((x|0)==18){x=0;if((w&64|0)==0){t=p;u=f;v=g;break}}q=c[o>>2]|0;if((a[q+5|0]&3)==0){t=p;u=f;v=g;break}fg(b,q);t=1;u=f;v=g}}while(0);m=o+32|0;if(m>>>0<h>>>0){g=v;f=u;o=m;p=t}else{break}}if((u|0)!=0){p=b+96|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}if((v|0)==0){z=t;break}p=b+100|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}else{z=r}}while(0);r=b+88|0;c[e+24>>2]=c[r>>2];c[r>>2]=e;y=z;return y|0}function zg(a){a=a|0;hf(a,11728,270,1);fd(a,-2);hf(a,9248,162,1);fd(a,-2);hf(a,7256,308,1);fd(a,-2);hf(a,5688,304,1);fd(a,-2);hf(a,4368,46,1);fd(a,-2);hf(a,3864,120,1);fd(a,-2);hf(a,3480,86,1);fd(a,-2);hf(a,3024,278,1);fd(a,-2);hf(a,2712,56,1);fd(a,-2);hf(a,12056,180,1);fd(a,-2);hf(a,11736,332,1);fd(a,-2);gf(a,-1001e3,11696)|0;fd(a,-2);return}function Ag(a){a=a|0;var b=0,d=0,e=0;Sd(a,0,11);ff(a,1640,0);ye(a,4360)|0;kd(a,-1);Xd(a,-2,3472);ff(a,1760,0);fd(a,-2);b=c[o>>2]|0;d=me(a,8)|0;e=d+4|0;c[e>>2]=0;ze(a,4360);c[d>>2]=b;c[e>>2]=166;kd(a,-1);Xd(a,-1001e3,11232);Xd(a,-2,11616);e=c[q>>2]|0;b=me(a,8)|0;d=b+4|0;c[d>>2]=0;ze(a,4360);c[b>>2]=e;c[d>>2]=166;kd(a,-1);Xd(a,-1001e3,9176);Xd(a,-2,7200);d=c[p>>2]|0;e=me(a,8)|0;b=e+4|0;c[b>>2]=0;ze(a,4360);c[e>>2]=d;c[b>>2]=166;Xd(a,-2,5632);return 1}function Bg(a){a=a|0;c[(Be(a,1,4360)|0)+4>>2]=166;Bd(a);Fd(a,3832,26)|0;return 2}function Cg(a){a=a|0;var b=0,d=0,e=0;b=i;if((ld(a,1)|0)==-1){Pd(a,-1001e3,9176)}if((c[(Be(a,1,4360)|0)+4>>2]|0)==0){te(a,9456,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d}d=(Be(a,1,4360)|0)+4|0;e=c[d>>2]|0;c[d>>2]=0;d=Bc[e&511](a)|0;i=b;return d|0}function Dg(a){a=a|0;var b=0,d=0,e=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=we(a,(xa(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function Eg(a){a=a|0;var b=0,d=0;b=i;if((c[(Be(a,1,4360)|0)+4>>2]|0)!=0){Og(a,0);i=b;return 1}te(a,9456,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d;Og(a,0);i=b;return 1}function Fg(a){a=a|0;var b=0,d=0,e=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=Mg(a,c[d>>2]|0,2)|0;i=b;return e|0}function Gg(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0,h=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=Ce(a,2,8392,1872)|0;f=+Je(a,3,0.0);g=~~f;if(+(g|0)!=f){se(a,3,7920)|0}if((hc(e|0,g|0,c[1888+(d<<2)>>2]|0)|0)==0){Cd(a,+(ab(e|0)|0));h=1;i=b;return h|0}else{h=we(a,0,0)|0;i=b;return h|0}return 0}function Hg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=Ce(a,2,0,1840)|0;f=Me(a,3,1024)|0;g=we(a,(zc(e|0,0,c[1856+(d<<2)>>2]|0,f|0)|0)==0|0,0)|0;i=b;return g|0}function Ig(a){a=a|0;var b=0,d=0,e=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;kd(a,1);d=Lg(a,e,2)|0;i=b;return d|0}function Jg(a){a=a|0;var b=0,d=0;b=Be(a,1,4360)|0;if((c[b+4>>2]|0)==0){return 0}if((c[b>>2]|0)==0){return 0}b=(Be(a,1,4360)|0)+4|0;d=c[b>>2]|0;c[b>>2]=0;Bc[d&511](a)|0;return 0}function Kg(a){a=a|0;var b=0,d=0;b=i;d=Be(a,1,4360)|0;if((c[d+4>>2]|0)==0){Fd(a,10120,13)|0;i=b;return 1}else{Id(a,9888,(a=i,i=i+8|0,c[a>>2]=c[d>>2],a)|0)|0;i=a;i=b;return 1}return 0}function Lg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0;e=i;i=i+8|0;f=e|0;g=ed(a)|0;if((g|0)==(d|0)){j=1;i=e;return j|0}k=d;l=1;m=g-d|0;while(1){d=m-1|0;do{if((ld(a,k)|0)==3){if((l|0)==0){n=0;break}o=+sd(a,k,0);g=Yb(b|0,9720,(p=i,i=i+8|0,h[p>>3]=o,p)|0)|0;i=p;n=(g|0)>0|0}else{g=Ee(a,k,f)|0;if((l|0)==0){n=0;break}p=za(g|0,1,c[f>>2]|0,b|0)|0;n=(p|0)==(c[f>>2]|0)|0}}while(0);if((d|0)==0){break}else{k=k+1|0;l=n;m=d}}if((n|0)!=0){j=1;i=e;return j|0}j=we(a,0,0)|0;i=e;return j|0}function Mg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+2088|0;g=f|0;j=f+1040|0;k=f+1048|0;l=ed(b)|0;dc(d|0);a:do{if((l|0)==1){m=e+1|0;n=Ng(b,d,1)|0}else{Fe(b,l+19|0,7720);o=k+8|0;p=g+8|0;q=e;r=l-2|0;b:while(1){do{if((ld(b,q)|0)==3){s=td(b,q,0)|0;if((s|0)==0){t=Ra(d|0)|0;Tb(t|0,d|0)|0;Fd(b,0,0)|0;u=(t|0)!=-1|0;break}else{Te(b,k);t=Wb(Ne(k,s)|0,1,s|0,d|0)|0;c[o>>2]=(c[o>>2]|0)+t;Qe(k);u=(t|0)!=0|0;break}}else{t=wd(b,q,0)|0;if((t|0)==0){v=10}else{if((a[t]|0)!=42){v=10}}if((v|0)==10){v=0;se(b,q,7568)|0}s=a[t+1|0]|0;if((s|0)==110){t=Ja(d|0,7248,(w=i,i=i+8|0,c[w>>2]=j,w)|0)|0;i=w;if((t|0)!=1){v=14;break b}Cd(b,+h[j>>3]);u=1;break}else if((s|0)==108){u=Ng(b,d,1)|0;break}else if((s|0)==76){u=Ng(b,d,0)|0;break}else if((s|0)==97){Te(b,g);s=Wb(Ne(g,1024)|0,1,1024,d|0)|0;c[p>>2]=(c[p>>2]|0)+s;if(s>>>0>=1024>>>0){s=1024;do{s=s<<(s>>>0<1073741824>>>0);t=Wb(Ne(g,s)|0,1,s|0,d|0)|0;c[p>>2]=(c[p>>2]|0)+t;}while(t>>>0>=s>>>0)}Qe(g);u=1;break}else{break b}}}while(0);s=q+1|0;if((r|0)==0|(u|0)==0){m=s;n=u;break a}else{q=s;r=r-1|0}}if((v|0)==14){Bd(b);m=q+1|0;n=0;break}x=se(b,q,7408)|0;i=f;return x|0}}while(0);if((hb(d|0)|0)!=0){x=we(b,0,0)|0;i=f;return x|0}if((n|0)==0){fd(b,-2);Bd(b)}x=m-e|0;i=f;return x|0}function Ng(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+1040|0;g=f|0;Te(b,g);h=Ne(g,1024)|0;a:do{if((Ua(h|0,1024,d|0)|0)!=0){j=g+8|0;k=h;while(1){l=Um(k|0)|0;if((l|0)!=0){if((a[k+(l-1)|0]|0)==10){break}}c[j>>2]=(c[j>>2]|0)+l;k=Ne(g,1024)|0;if((Ua(k|0,1024,d|0)|0)==0){break a}}c[j>>2]=l-e+(c[j>>2]|0);Qe(g);m=1;i=f;return m|0}}while(0);Qe(g);m=(xd(b,-1)|0)!=0|0;i=f;return m|0}function Og(a,b){a=a|0;b=b|0;var c=0,d=0;c=ed(a)|0;d=c-1|0;if((d|0)>=18){se(a,17,7048)|0}kd(a,1);Dd(a,d);Kd(a,b);if((d|0)>=1){b=1;do{b=b+1|0;kd(a,b);}while((b|0)<=(d|0))}Jd(a,160,c+2|0);return}function Pg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=yd(a,-1001001)|0;e=td(a,-1001002,0)|0;if((c[d+4>>2]|0)==0){f=te(a,6808,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;h=f;i=b;return h|0}fd(a,1);if((e|0)>=1){f=1;do{kd(a,-1001003-f|0);f=f+1|0;}while((f|0)<=(e|0))}e=Mg(a,c[d>>2]|0,2)|0;if((ld(a,-e|0)|0)!=0){h=e;i=b;return h|0}if((e|0)>1){d=wd(a,1-e|0,0)|0;e=te(a,6680,(g=i,i=i+8|0,c[g>>2]=d,g)|0)|0;i=g;h=e;i=b;return h|0}if((vd(a,-1001003)|0)==0){h=0;i=b;return h|0}fd(a,0);kd(a,-1001001);e=(Be(a,1,4360)|0)+4|0;g=c[e>>2]|0;c[e>>2]=0;Bc[g&511](a)|0;h=0;i=b;return h|0}function Qg(a){a=a|0;var b=0,d=0,e=0;b=i;Pd(a,-1001e3,9176);d=yd(a,-1)|0;if((c[d+4>>2]|0)==0){te(a,5656,(e=i,i=i+8|0,c[e>>2]=9180,e)|0)|0;i=e}e=we(a,(xa(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function Rg(a){a=a|0;ah(a,11232,5096);return 1}function Sg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;if((ld(a,1)|0)==-1){Bd(a)}if((ld(a,1)|0)==0){Pd(a,-1001e3,11232);id(a,1);if((c[(Be(a,1,4360)|0)+4>>2]|0)!=0){d=0;Og(a,d);i=b;return 1}te(a,9456,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;d=0;Og(a,d);i=b;return 1}else{f=Ee(a,1,0)|0;g=me(a,8)|0;h=g+4|0;c[h>>2]=0;ze(a,4360);j=g;c[j>>2]=0;c[h>>2]=272;h=yb(f|0,5096)|0;c[j>>2]=h;if((h|0)==0){h=Qb(c[(Pb()|0)>>2]|0)|0;te(a,4688,(e=i,i=i+16|0,c[e>>2]=f,c[e+8>>2]=h,e)|0)|0;i=e}id(a,1);d=1;Og(a,d);i=b;return 1}return 0}function Tg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=Ee(b,1,0)|0;e=De(b,2,5096,0)|0;f=me(b,8)|0;g=f+4|0;c[g>>2]=0;ze(b,4360);h=f;c[h>>2]=0;c[g>>2]=272;g=a[e]|0;do{if(g<<24>>24==0){i=10}else{f=e+1|0;if((Na(4584,g<<24>>24|0,4)|0)==0){i=10;break}j=a[f]|0;if(j<<24>>24==43){k=e+2|0;if((k|0)==0){i=10;break}l=k;m=a[k]|0}else{l=f;m=j}if(m<<24>>24==98){j=l+1|0;if((j|0)==0){i=10;break}n=a[j]|0}else{n=m}if(n<<24>>24!=0){i=10}}}while(0);if((i|0)==10){se(b,2,4512)|0}i=yb(d|0,e|0)|0;c[h>>2]=i;if((i|0)!=0){o=1;return o|0}o=we(b,0,d)|0;return o|0}function Ug(a){a=a|0;ah(a,9176,4856);return 1}function Vg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Ee(a,1,0)|0;De(a,2,5096,0)|0;e=me(a,8)|0;f=e+4|0;c[f>>2]=0;ze(a,4360);te(a,4984,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;c[e>>2]=0;c[f>>2]=310;f=we(a,0,d)|0;i=b;return f|0}function Wg(a){a=a|0;var b=0,d=0,e=0;b=i;Pd(a,-1001e3,11232);d=yd(a,-1)|0;if((c[d+4>>2]|0)==0){te(a,5656,(e=i,i=i+8|0,c[e>>2]=11236,e)|0)|0;i=e}e=Mg(a,c[d>>2]|0,1)|0;i=b;return e|0}function Xg(a){a=a|0;var b=0,d=0,e=0,f=0;b=me(a,8)|0;d=b+4|0;c[d>>2]=0;ze(a,4360);e=b;c[e>>2]=0;c[d>>2]=272;d=Pa()|0;c[e>>2]=d;if((d|0)!=0){f=1;return f|0}f=we(a,0,0)|0;return f|0}function Yg(a){a=a|0;var b=0;He(a,1);b=Ae(a,1,4360)|0;if((b|0)==0){Bd(a);return 1}if((c[b+4>>2]|0)==0){Fd(a,5472,11)|0;return 1}else{Fd(a,5280,4)|0;return 1}return 0}function Zg(a){a=a|0;var b=0,d=0,e=0;b=i;Pd(a,-1001e3,9176);d=yd(a,-1)|0;if((c[d+4>>2]|0)==0){te(a,5656,(e=i,i=i+8|0,c[e>>2]=9180,e)|0)|0;i=e}e=Lg(a,c[d>>2]|0,1)|0;i=b;return e|0}function _g(a){a=a|0;return we(a,(ua(c[(Be(a,1,4360)|0)>>2]|0)|0)==0|0,0)|0}function $g(a){a=a|0;Be(a,1,4360)|0;return xe(a,-1)|0}function ah(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((ld(a,1)|0)<1){Pd(a,-1001e3,b);i=e;return}f=wd(a,1,0)|0;do{if((f|0)==0){if((c[(Be(a,1,4360)|0)+4>>2]|0)==0){te(a,9456,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}kd(a,1)}else{h=me(a,8)|0;j=h+4|0;c[j>>2]=0;ze(a,4360);k=h;c[k>>2]=0;c[j>>2]=272;j=yb(f|0,d|0)|0;c[k>>2]=j;if((j|0)!=0){break}j=Qb(c[(Pb()|0)>>2]|0)|0;te(a,4688,(g=i,i=i+16|0,c[g>>2]=f,c[g+8>>2]=j,g)|0)|0;i=g}}while(0);Xd(a,-1001e3,b);Pd(a,-1001e3,b);i=e;return}function bh(a){a=a|0;Sd(a,0,28);ff(a,424,0);Cd(a,3.141592653589793);Xd(a,-2,9976);Cd(a,s);Xd(a,-2,11464);return 1}function ch(a){a=a|0;Cd(a,+R(+(+Ie(a,1))));return 1}function dh(a){a=a|0;Cd(a,+X(+Ie(a,1)));return 1}function eh(a){a=a|0;Cd(a,+Y(+Ie(a,1)));return 1}function fh(a){a=a|0;var b=0.0;b=+Ie(a,1);Cd(a,+_(+b,+(+Ie(a,2))));return 1}function gh(a){a=a|0;Cd(a,+Z(+Ie(a,1)));return 1}function hh(a){a=a|0;Cd(a,+ba(+Ie(a,1)));return 1}function ih(a){a=a|0;Cd(a,+Sa(+(+Ie(a,1))));return 1}function jh(a){a=a|0;Cd(a,+U(+Ie(a,1)));return 1}function kh(a){a=a|0;Cd(a,+Ie(a,1)/.017453292519943295);return 1}function lh(a){a=a|0;Cd(a,+$(+Ie(a,1)));return 1}function mh(a){a=a|0;Cd(a,+Q(+Ie(a,1)));return 1}function nh(a){a=a|0;var b=0.0;b=+Ie(a,1);Cd(a,+eb(+b,+(+Ie(a,2))));return 1}function oh(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;Cd(a,+Ab(+(+Ie(a,1)),d|0));Dd(a,c[d>>2]|0);i=b;return 2}function ph(a){a=a|0;var b=0.0;b=+Ie(a,1);Cd(a,+Fm(b,Ke(a,2)|0));return 1}function qh(a){a=a|0;Cd(a,+Hb(+(+Ie(a,1))));return 1}function rh(a){a=a|0;var b=0.0,c=0.0,d=0.0;b=+Ie(a,1);do{if((ld(a,2)|0)<1){c=+aa(b)}else{d=+Ie(a,2);if(d==10.0){c=+Hb(+b);break}else{c=+aa(b)/+aa(d);break}}}while(0);Cd(a,c);return 1}function sh(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0,h=0;b=ed(a)|0;c=+Ie(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+Ie(a,e);g=c>f?c:f;h=e+1|0;if((h|0)>(b|0)){d=g;break}else{e=h;f=g}}}Cd(a,d);return 1}function th(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0,h=0;b=ed(a)|0;c=+Ie(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+Ie(a,e);g=c<f?c:f;h=e+1|0;if((h|0)>(b|0)){d=g;break}else{e=h;f=g}}}Cd(a,d);return 1}function uh(a){a=a|0;var b=0,c=0,d=0.0;b=i;i=i+8|0;c=b|0;d=+La(+(+Ie(a,1)),c|0);Cd(a,+h[c>>3]);Cd(a,d);i=b;return 2}function vh(a){a=a|0;var b=0.0;b=+Ie(a,1);Cd(a,+T(+b,+(+Ie(a,2))));return 1}function wh(a){a=a|0;Cd(a,+Ie(a,1)*.017453292519943295);return 1}function xh(a){a=a|0;var b=0,d=0.0,e=0,f=0,g=0.0,h=0.0;b=i;d=+((sa()|0)%2147483647|0|0)/2147483647.0;e=ed(a)|0;if((e|0)==0){Cd(a,d);f=1;i=b;return f|0}else if((e|0)==2){g=+Ie(a,1);h=+Ie(a,2);if(g>h){se(a,2,7384)|0}Cd(a,g+ +Q(d*(h-g+1.0)));f=1;i=b;return f|0}else if((e|0)==1){g=+Ie(a,1);if(g<1.0){se(a,1,7384)|0}Cd(a,+Q(d*g)+1.0);f=1;i=b;return f|0}else{e=te(a,7216,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;f=e;i=b;return f|0}return 0}function yh(a){a=a|0;Ib(Le(a,1)|0);sa()|0;return 0}function zh(a){a=a|0;Cd(a,+lb(+(+Ie(a,1))));return 1}function Ah(a){a=a|0;Cd(a,+V(+Ie(a,1)));return 1}function Bh(a){a=a|0;Cd(a,+S(+Ie(a,1)));return 1}function Ch(a){a=a|0;Cd(a,+Nb(+(+Ie(a,1))));return 1}function Dh(a){a=a|0;Cd(a,+W(+Ie(a,1)));return 1}function Eh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;k=c[e>>2]|0;do{if((k|0)<((g|0)/2|0|0)){l=k<<1;m=(l|0)<4?4:l}else{if((k|0)<(g|0)){m=g;break}zf(b,9256,(l=i,i=i+16|0,c[l>>2]=h,c[l+8>>2]=g,l)|0);i=l;return 0}}while(0);if((m+1|0)>>>0>(4294967293/(f>>>0)|0)>>>0){Fh(b);return 0}g=ca(k,f)|0;k=ca(m,f)|0;f=c[b+12>>2]|0;h=(d|0)!=0;l=f|0;n=f+4|0;o=Ec[c[l>>2]&15](c[n>>2]|0,d,g,k)|0;if((o|0)!=0|(k|0)==0){p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}if((a[f+63|0]|0)==0){Ef(b,4);return 0}tg(b,1);o=Ec[c[l>>2]&15](c[n>>2]|0,d,g,k)|0;if((o|0)==0){Ef(b,4);return 0}else{p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}return 0}function Fh(a){a=a|0;zf(a,11384,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0);i=a}function Gh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+12>>2]|0;h=(d|0)!=0;i=g|0;j=g+4|0;k=Ec[c[i>>2]&15](c[j>>2]|0,d,e,f)|0;do{if((k|0)!=0|(f|0)==0){l=k}else{if((a[g+63|0]|0)==0){Ef(b,4);return 0}tg(b,1);m=Ec[c[i>>2]&15](c[j>>2]|0,d,e,f)|0;if((m|0)!=0){l=m;break}Ef(b,4);return 0}}while(0);b=g+12|0;c[b>>2]=(h?-e|0:0)+f+(c[b>>2]|0);return l|0}function Hh(a){a=a|0;gf(a,-1001e3,9072)|0;Sd(a,0,1);Jd(a,146,0);Xd(a,-2,11368);_d(a,-2)|0;Sd(a,0,3);ff(a,336,0);Sd(a,4,0);kd(a,-2);Jd(a,114,1);Zd(a,-2,1);kd(a,-2);Jd(a,30,1);Zd(a,-2,2);kd(a,-2);Jd(a,302,1);Zd(a,-2,3);kd(a,-2);Jd(a,10,1);Zd(a,-2,4);kd(a,-1);Xd(a,-3,9016);Xd(a,-2,7032);Jh(a,5464,4272,3808,3320);Jh(a,3e3,2664,12016,11624);Fd(a,11344,10)|0;Xd(a,-2,11048);gf(a,-1001e3,10768)|0;Xd(a,-2,10552);gf(a,-1001e3,10336)|0;Xd(a,-2,10104);Rd(a,-1001e3,2);kd(a,-2);ff(a,1592,1);fd(a,-2);return 1}function Ih(a){a=a|0;var b=0,c=0;b=af(a,1)|0;if((b|0)>0){c=b}else{return 0}do{Rd(a,1,c);yd(a,-1)|0;fd(a,-2);c=c-1|0;}while((c|0)>0);return 0}function Jh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=Kb(c|0)|0;if((f|0)==0){c=Kb(d|0)|0;if((c|0)!=0){g=c;h=3}}else{g=f;h=3}do{if((h|0)==3){Pd(a,-1001e3,7368);f=vd(a,-1)|0;fd(a,-2);if((f|0)!=0){break}jf(a,jf(a,g,7904,7704)|0,7552,e)|0;gd(a,-2);Xd(a,-2,b);return}}while(0);Gd(a,e)|0;Xd(a,-2,b);return}function Kh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+104|0;d=b|0;e=Ee(a,1,0)|0;f=ed(a)|0;cf(a,e,1);Pd(a,-1,9e3);g=(ld(a,-1)|0)==0;fd(a,-2);if(g){kd(a,-1);Xd(a,-2,8376);Gd(a,e)|0;Xd(a,-2,9e3);g=db(e|0,46)|0;Fd(a,e,((g|0)==0?e:g+1|0)-e|0)|0;Xd(a,-2,8120)}kd(a,-1);do{if((sf(a,1,d)|0)==0){h=6}else{if((wf(a,8824,d)|0)==0){h=6;break}if((nd(a,-1)|0)!=0){h=6}}}while(0);if((h|0)==6){te(a,8544,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}kd(a,-2);oe(a,-2,1)|0;fd(a,-2);if((f|0)<2){i=b;return 1}else{j=2}do{if((ld(a,j)|0)==6){kd(a,j);kd(a,-2);be(a,1,0,0,0)}j=j+1|0;}while((j|0)<=(f|0));i=b;return 1}function Lh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+1040|0;d=b|0;e=Ee(a,1,0)|0;fd(a,1);Pd(a,-1001e3,10768);Pd(a,2,e);if((vd(a,-1)|0)!=0){i=b;return 1}fd(a,-2);Te(a,d);Pd(a,-1001001,7032);if((ld(a,3)|0)==5){f=1}else{te(a,9408,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;f=1}while(1){Rd(a,3,f);if((ld(a,-1)|0)==0){fd(a,-2);Qe(d);h=wd(a,-1,0)|0;te(a,9192,(g=i,i=i+16|0,c[g>>2]=e,c[g+8>>2]=h,g)|0)|0;i=g}Gd(a,e)|0;be(a,1,2,0,0);if((ld(a,-2)|0)==6){break}if((pd(a,-2)|0)==0){fd(a,-3)}else{fd(a,-2);Se(d)}f=f+1|0}Gd(a,e)|0;hd(a,-2);be(a,2,1,0,0);if((ld(a,-1)|0)!=0){Xd(a,2,e)}Pd(a,2,e);if((ld(a,-1)|0)!=0){i=b;return 1}Kd(a,1);kd(a,-1);Xd(a,2,e);i=b;return 1}function Mh(a){a=a|0;var b=0,d=0;b=i;d=Ee(a,1,0)|0;Pd(a,-1001e3,10336);Pd(a,-1,d);if((ld(a,-1)|0)!=0){i=b;return 1}Id(a,5048,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;i=b;return 1}function Nh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Ee(a,1,0)|0;Pd(a,-1001001,5464);e=wd(a,-1,0)|0;if((e|0)==0){te(a,5936,(f=i,i=i+8|0,c[f>>2]=5464,f)|0)|0;i=f}g=Sh(a,d,e,6664,7208)|0;if((g|0)==0){h=1;i=b;return h|0}if((Ve(a,g,0)|0)==0){Gd(a,g)|0;h=2;i=b;return h|0}else{e=wd(a,1,0)|0;d=wd(a,-1,0)|0;j=te(a,6760,(f=i,i=i+24|0,c[f>>2]=e,c[f+8>>2]=g,c[f+16>>2]=d,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function Oh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Ee(a,1,0)|0;Pd(a,-1001001,3e3);e=wd(a,-1,0)|0;if((e|0)==0){te(a,5936,(f=i,i=i+8|0,c[f>>2]=3e3,f)|0)|0;i=f}g=Sh(a,d,e,6664,7208)|0;if((g|0)==0){h=1;i=b;return h|0}if((Qh(a,g,d)|0)==0){Gd(a,g)|0;h=2;i=b;return h|0}else{d=wd(a,1,0)|0;e=wd(a,-1,0)|0;j=te(a,6760,(f=i,i=i+24|0,c[f>>2]=d,c[f+8>>2]=g,c[f+16>>2]=e,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function Ph(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Ee(a,1,0)|0;e=Wa(d|0,46)|0;if((e|0)==0){f=0;i=b;return f|0}Fd(a,d,e-d|0)|0;e=wd(a,-1,0)|0;Pd(a,-1001001,3e3);g=wd(a,-1,0)|0;if((g|0)==0){te(a,5936,(h=i,i=i+8|0,c[h>>2]=3e3,h)|0)|0;i=h}j=Sh(a,e,g,6664,7208)|0;if((j|0)==0){f=1;i=b;return f|0}g=Qh(a,j,d)|0;if((g|0)==2){Id(a,7e3,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=j,h)|0)|0;i=h;f=1;i=b;return f|0}else if((g|0)==0){Gd(a,j)|0;f=2;i=b;return f|0}else{g=wd(a,1,0)|0;d=wd(a,-1,0)|0;e=te(a,6760,(h=i,i=i+24|0,c[h>>2]=g,c[h+8>>2]=j,c[h+16>>2]=d,h)|0)|0;i=h;f=e;i=b;return f|0}return 0}function Qh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=jf(a,d,6664,6504)|0;d=Wa(f|0,45)|0;do{if((d|0)==0){g=f}else{h=Fd(a,f,d-f|0)|0;j=Id(a,6176,(k=i,i=i+8|0,c[k>>2]=h,k)|0)|0;i=k;h=Rh(a,b,j)|0;if((h|0)==2){g=d+1|0;break}else{l=h;i=e;return l|0}}}while(0);d=Id(a,6176,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;l=Rh(a,b,d)|0;i=e;return l|0}function Rh(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;Pd(b,-1001e3,9072);Pd(b,-1,c);c=yd(b,-1)|0;fd(b,-3);if((c|0)==0){Fd(b,6040,58)|0;e=1;return e|0}if((a[d]|0)==42){Kd(b,1);e=0;return e|0}else{Fd(b,6040,58)|0;e=2;return e|0}return 0}function Sh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+1040|0;j=h|0;Te(b,j);if((a[f]|0)==0){k=d}else{k=jf(b,d,f,g)|0}g=e;while(1){e=a[g]|0;if((e<<24>>24|0)==59){g=g+1|0;continue}else if((e<<24>>24|0)==0){l=12;break}e=Wa(g|0,59)|0;if((e|0)==0){m=g+(Um(g|0)|0)|0}else{m=e}Fd(b,g,m-g|0)|0;if((m|0)==0){l=12;break}n=jf(b,wd(b,-1,0)|0,5800,k)|0;gd(b,-2);o=yb(n|0,5456)|0;if((o|0)!=0){l=10;break}Id(b,5640,(e=i,i=i+8|0,c[e>>2]=n,e)|0)|0;i=e;gd(b,-2);Se(j);g=m}if((l|0)==10){ua(o|0)|0;p=n;i=h;return p|0}else if((l|0)==12){Qe(j);p=0;i=h;return p|0}return 0}function Th(a){a=a|0;var b=0,c=0,d=0;b=Ee(a,1,0)|0;c=Rh(a,b,Ee(a,2,0)|0)|0;if((c|0)==0){d=1;return d|0}Bd(a);hd(a,-2);Gd(a,(c|0)==1?4504:4432)|0;d=3;return d|0}function Uh(a){a=a|0;var b=0,c=0,d=0,e=0;b=Ee(a,1,0)|0;c=Ee(a,2,0)|0;d=De(a,3,6664,0)|0;if((Sh(a,b,c,d,De(a,4,7208,0)|0)|0)!=0){e=1;return e|0}Bd(a);hd(a,-2);e=2;return e|0}function Vh(a){a=a|0;Ge(a,1,5);if((Td(a,1)|0)==0){Sd(a,0,1);kd(a,-1);_d(a,1)|0}Rd(a,-1001e3,2);Xd(a,-2,4576);return 0}function Wh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;if(a>>>0<8>>>0){b=a;return b|0}if(a>>>0>15>>>0){c=a;d=1;do{e=c+1|0;c=e>>>1;d=d+1|0;}while(e>>>0>31>>>0);f=c;g=d<<3}else{f=a;g=8}b=g|f-8;return b|0}function Xh(a){a=a|0;var b=0,c=0;b=a>>>3&31;if((b|0)==0){c=a;return c|0}c=(a&7|8)<<b-1;return c|0}function Yh(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0;b=a-1|0;if(b>>>0>255>>>0){a=b;c=0;while(1){e=c+8|0;f=a>>>8;if(a>>>0>65535>>>0){a=f;c=e}else{g=f;h=e;break}}}else{g=b;h=0}return(d[1240+g|0]|0)+h|0}function Zh(a,b,c){a=a|0;b=+b;c=+c;var d=0.0;switch(a|0){case 0:{d=b+c;break};case 4:{d=b- +Q(b/c)*c;break};case 5:{d=+T(+b,+c);break};case 6:{d=-0.0-b;break};case 3:{d=b/c;break};case 1:{d=b-c;break};case 2:{d=b*c;break};default:{d=0.0}}return+d}function _h(b){b=b|0;var c=0;if((a[b+657|0]&2)==0){c=(b|32)-87|0;return c|0}else{c=b-48|0;return c|0}return 0}function $h(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0.0,J=0,K=0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0;g=i;i=i+8|0;j=g|0;if((nc(b|0,7952)|0)!=0){k=0;i=g;return k|0}a:do{if((nc(b|0,11184)|0)==0){l=+Tm(b,j);m=l;n=c[j>>2]|0}else{c[j>>2]=b;o=b;while(1){p=a[o]|0;q=o+1|0;if((a[(p&255)+657|0]&8)==0){break}else{o=q}}if((p<<24>>24|0)==45){r=1;s=q}else if((p<<24>>24|0)==43){r=0;s=q}else{r=0;s=o}do{if((a[s]|0)==48){t=a[s+1|0]|0;if(!((t<<24>>24|0)==120|(t<<24>>24|0)==88)){break}t=s+2|0;u=a[t]|0;v=u&255;w=a[v+657|0]|0;if((w&16)==0){x=0.0;y=0;z=t;A=u}else{l=0.0;u=v;v=w;w=0;B=t;while(1){if((v&2)==0){C=(u|32)-87|0}else{C=u-48|0}D=l*16.0+ +(C|0);t=w+1|0;E=B+1|0;F=a[E]|0;G=F&255;H=a[G+657|0]|0;if((H&16)==0){x=D;y=t;z=E;A=F;break}else{l=D;u=G;v=H;w=t;B=E}}}do{if(A<<24>>24==46){B=z+1|0;w=d[B]|0;v=a[w+657|0]|0;if((v&16)==0){I=x;J=0;K=B;break}else{L=x;M=w;N=v;O=0;P=B}while(1){if((N&2)==0){Q=(M|32)-87|0}else{Q=M-48|0}l=L*16.0+ +(Q|0);B=O+1|0;v=P+1|0;w=d[v]|0;u=a[w+657|0]|0;if((u&16)==0){I=l;J=B;K=v;break}else{L=l;M=w;N=u;O=B;P=v}}}else{I=x;J=0;K=z}}while(0);if((J|y|0)==0){break}v=J*-4|0;c[j>>2]=K;B=a[K]|0;do{if((B<<24>>24|0)==112|(B<<24>>24|0)==80){u=K+1|0;w=a[u]|0;if((w<<24>>24|0)==45){R=1;S=K+2|0}else if((w<<24>>24|0)==43){R=0;S=K+2|0}else{R=0;S=u}u=a[S]|0;if((a[(u&255)+657|0]&2)==0){T=v;U=K;break}else{V=S;W=0;X=u}do{V=V+1|0;W=(X<<24>>24)-48+(W*10|0)|0;X=a[V]|0;}while((a[(X&255)+657|0]&2)!=0);Y=((R|0)==0?W:-W|0)+v|0;Z=V;_=29}else{Y=v;Z=K;_=29}}while(0);if((_|0)==29){c[j>>2]=Z;T=Y;U=Z}if((r|0)==0){$=I}else{$=-0.0-I}m=+Fm($,T);n=U;break a}}while(0);h[f>>3]=0.0;k=0;i=g;return k|0}}while(0);h[f>>3]=m;if((n|0)==(b|0)){k=0;i=g;return k|0}if((a[(d[n]|0)+657|0]&8)==0){aa=n}else{f=n;do{f=f+1|0;}while((a[(d[f]|0)+657|0]&8)!=0);c[j>>2]=f;aa=f}k=(aa|0)==(b+e|0)|0;i=g;return k|0}function ai(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;g=i;i=i+32|0;j=g|0;k=Wa(e|0,37)|0;l=b+24|0;m=b+8|0;n=c[m>>2]|0;o=(c[l>>2]|0)-n|0;a:do{if((k|0)==0){p=0;q=e;r=o;s=n}else{t=g+8|0;u=0;v=e;w=k;y=o;z=n;b:while(1){if((y|0)<48){Hf(b,2);A=c[m>>2]|0}else{A=z}c[m>>2]=A+16;B=Yi(b,v,w-v|0)|0;c[A>>2]=B;c[A+8>>2]=d[B+4|0]|64;C=a[w+1|0]|0;switch(C|0){case 100:{B=c[m>>2]|0;c[m>>2]=B+16;h[B>>3]=+((x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0)|0);c[B+8>>2]=3;break};case 102:{B=c[m>>2]|0;c[m>>2]=B+16;h[B>>3]=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,+h[(c[f>>2]|0)+x>>3]);c[B+8>>2]=3;break};case 112:{B=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);D=cb(t|0,6920,(E=i,i=i+8|0,c[E>>2]=B,E)|0)|0;i=E;B=c[m>>2]|0;c[m>>2]=B+16;F=Yi(b,t,D)|0;c[B>>2]=F;c[B+8>>2]=d[F+4|0]|64;break};case 115:{F=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);B=(F|0)==0?8904:F;F=Um(B|0)|0;D=c[m>>2]|0;c[m>>2]=D+16;G=Yi(b,B,F)|0;c[D>>2]=G;c[D+8>>2]=d[G+4|0]|64;break};case 99:{a[j]=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);G=c[m>>2]|0;c[m>>2]=G+16;D=Yi(b,j,1)|0;c[G>>2]=D;c[G+8>>2]=d[D+4|0]|64;break};case 37:{D=c[m>>2]|0;c[m>>2]=D+16;G=Yi(b,5384,1)|0;c[D>>2]=G;c[D+8>>2]=d[G+4|0]|64;break};default:{break b}}G=u+2|0;D=w+2|0;F=Wa(D|0,37)|0;B=c[m>>2]|0;H=(c[l>>2]|0)-B|0;if((F|0)==0){p=G;q=D;r=H;s=B;break a}else{u=G;v=D;w=F;y=H;z=B}}zf(b,4208,(E=i,i=i+8|0,c[E>>2]=C,E)|0);i=E;return 0}}while(0);if((r|0)<32){Hf(b,1);I=c[m>>2]|0}else{I=s}s=Um(q|0)|0;c[m>>2]=I+16;r=Yi(b,q,s)|0;c[I>>2]=r;c[I+8>>2]=d[r+4|0]|64;if((p|0)<=0){J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}fk(b,p|1);J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}function bi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=f;c[g>>2]=d;c[g+4>>2]=0;g=ai(a,b,f|0)|0;i=e;return g|0}function ci(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=Um(c|0)|0;f=a[c]|0;if((f<<24>>24|0)==61){g=c+1|0;if(e>>>0>d>>>0){h=d-1|0;Vm(b|0,g|0,h)|0;a[b+h|0]=0;return}else{Vm(b|0,g|0,e)|0;return}}else if((f<<24>>24|0)==64){if(e>>>0>d>>>0){a[b]=a[3800]|0;a[b+1|0]=a[3801]|0;a[b+2|0]=a[3802]|0;Vm(b+3|0,c+(4-d+e)|0,d-3|0)|0;return}else{Vm(b|0,c+1|0,e)|0;return}}else{f=Wa(c|0,10)|0;Vm(b|0,3304,9)|0;g=b+9|0;h=d-15|0;d=(f|0)==0;if(e>>>0<h>>>0&d){Vm(g|0,c|0,e)|0;i=e+9|0}else{if(d){j=e}else{j=f-c|0}f=j>>>0>h>>>0?h:j;Vm(g|0,c|0,f)|0;c=b+(f+9)|0;a[c]=a[3800]|0;a[c+1|0]=a[3801]|0;a[c+2|0]=a[3802]|0;i=f+12|0}f=b+i|0;a[f]=a[2992]|0;a[f+1|0]=a[2993]|0;a[f+2|0]=a[2994]|0;return}}function di(a){a=a|0;Sd(a,0,11);ff(a,88,0);return 1}function ei(a){a=a|0;Cd(a,+(Ya()|0)/1.0e6);return 1}function fi(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+1256|0;e=d|0;f=d+8|0;g=d+16|0;h=d+1056|0;j=De(b,1,8368,0)|0;if((ld(b,2)|0)<1){k=yc(0)|0}else{k=~~+Ie(b,2)}c[e>>2]=k;if((a[j]|0)==33){l=j+1|0;m=jb(e|0)|0}else{l=j;m=Ea(e|0)|0}if((m|0)==0){Bd(b);i=d;return 1}if((Ma(l|0,8112)|0)==0){Sd(b,0,9);Dd(b,c[m>>2]|0);Xd(b,-2,11336);Dd(b,c[m+4>>2]|0);Xd(b,-2,11032);Dd(b,c[m+8>>2]|0);Xd(b,-2,10760);Dd(b,c[m+12>>2]|0);Xd(b,-2,10544);Dd(b,(c[m+16>>2]|0)+1|0);Xd(b,-2,10328);Dd(b,(c[m+20>>2]|0)+1900|0);Xd(b,-2,10096);Dd(b,(c[m+24>>2]|0)+1|0);Xd(b,-2,7896);Dd(b,(c[m+28>>2]|0)+1|0);Xd(b,-2,7696);e=c[m+32>>2]|0;if((e|0)<0){i=d;return 1}Kd(b,e);Xd(b,-2,9864);i=d;return 1}e=f|0;a[e]=37;Te(b,g);j=g+8|0;k=g+4|0;n=g|0;o=f+1|0;p=h|0;h=f+2|0;f=l;while(1){l=a[f]|0;if((l<<24>>24|0)==0){break}else if((l<<24>>24|0)!=37){q=c[j>>2]|0;if(q>>>0<(c[k>>2]|0)>>>0){r=l;s=q}else{Ne(g,1)|0;r=a[f]|0;s=c[j>>2]|0}c[j>>2]=s+1;a[(c[n>>2]|0)+s|0]=r;f=f+1|0;continue}q=f+1|0;l=f+2|0;t=a[q]|0;do{if(t<<24>>24==0){u=20}else{if((Na(7528,t<<24>>24|0,23)|0)==0){u=20;break}a[o]=t;a[h]=0;v=l}}while(0);if((u|0)==20){u=0;l=Id(b,7160,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;se(b,1,l)|0;v=q}Oe(g,p,sb(p|0,200,e|0,m|0)|0);f=v}Qe(g);i=d;return 1}function gi(a){a=a|0;var b=0;b=~~+Ie(a,1);Cd(a,+uc(b|0,~~+Je(a,2,0.0)|0));return 1}function hi(a){a=a|0;var b=0,c=0,d=0;b=De(a,1,0,0)|0;c=Eb(b|0)|0;if((b|0)==0){Kd(a,c);d=1;return d|0}else{d=xe(a,c)|0;return d|0}return 0}function ii(a){a=a|0;var b=0;if((ld(a,1)|0)==1){b=(vd(a,1)|0)==0|0}else{b=Me(a,1,0)|0}if((vd(a,2)|0)!=0){Ti(a)}if((a|0)==0){return 0}else{bb(b|0);return 0}return 0}function ji(a){a=a|0;Gd(a,Kb(Ee(a,1,0)|0)|0)|0;return 1}function ki(a){a=a|0;var b=0;b=Ee(a,1,0)|0;return we(a,(Ka(b|0)|0)==0|0,b)|0}function li(a){a=a|0;var b=0;b=Ee(a,1,0)|0;return we(a,(Ub(b|0,Ee(a,2,0)|0)|0)==0|0,0)|0}function mi(a){a=a|0;var b=0;b=De(a,1,0,0)|0;Gd(a,vb(c[400+((Ce(a,2,9400,368)|0)<<2)>>2]|0,b|0)|0)|0;return 1}function ni(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+96|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;if((ld(a,1)|0)<1){l=yc(0)|0}else{Ge(a,1,5);fd(a,1);Pd(a,-1,11336);m=td(a,-1,j)|0;n=(c[j>>2]|0)==0?0:m;fd(a,-2);c[k>>2]=n;Pd(a,-1,11032);n=td(a,-1,h)|0;m=(c[h>>2]|0)==0?0:n;fd(a,-2);c[k+4>>2]=m;Pd(a,-1,10760);m=td(a,-1,g)|0;n=(c[g>>2]|0)==0?12:m;fd(a,-2);c[k+8>>2]=n;Pd(a,-1,10544);n=td(a,-1,f)|0;if((c[f>>2]|0)==0){f=te(a,9632,(o=i,i=i+8|0,c[o>>2]=10544,o)|0)|0;i=o;p=f}else{fd(a,-2);p=n}c[k+12>>2]=p;Pd(a,-1,10328);p=td(a,-1,e)|0;if((c[e>>2]|0)==0){e=te(a,9632,(o=i,i=i+8|0,c[o>>2]=10328,o)|0)|0;i=o;q=e}else{fd(a,-2);q=p}c[k+16>>2]=q-1;Pd(a,-1,10096);q=td(a,-1,d)|0;if((c[d>>2]|0)==0){d=te(a,9632,(o=i,i=i+8|0,c[o>>2]=10096,o)|0)|0;i=o;r=d}else{fd(a,-2);r=q}c[k+20>>2]=r-1900;Pd(a,-1,9864);if((ld(a,-1)|0)==0){s=-1}else{s=vd(a,-1)|0}fd(a,-2);c[k+32>>2]=s;l=Ba(k|0)|0}if((l|0)==-1){Bd(a);i=b;return 1}else{Cd(a,+(l|0));i=b;return 1}return 0}function oi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+24|0;d=b|0;if((Ca(d|0)|0)==0){e=te(a,11576,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;g=e;i=b;return g|0}else{Gd(a,d)|0;g=1;i=b;return g|0}return 0}function pi(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+176|0;l=k|0;m=k+16|0;n=k+40|0;o=k+120|0;p=Yf(d,1)|0;q=d+8|0;r=c[q>>2]|0;c[r>>2]=p;c[r+8>>2]=70;r=(c[q>>2]|0)+16|0;c[q>>2]=r;if(((c[d+24>>2]|0)-r|0)<16){Hf(d,0)}r=bg(d)|0;c[p+12>>2]=r;q=o|0;c[q>>2]=r;c[r+36>>2]=Zi(d,h)|0;c[n+60>>2]=f;f=n+64|0;c[f>>2]=g;c[g+28>>2]=0;c[g+16>>2]=0;c[g+4>>2]=0;g=c[q>>2]|0;h=g+36|0;wm(d,n,e,c[h>>2]|0,j);j=c[n+52>>2]|0;e=n+48|0;c[o+8>>2]=c[e>>2];d=o+12|0;c[d>>2]=n;c[e>>2]=o;c[o+20>>2]=0;c[o+24>>2]=0;c[o+28>>2]=-1;c[o+32>>2]=0;c[o+36>>2]=0;Ym(o+44|0,0,5)|0;c[o+40>>2]=c[(c[f>>2]|0)+4>>2];f=o+16|0;c[f>>2]=0;c[h>>2]=c[n+68>>2];a[g+78|0]=2;g=Aj(j)|0;c[o+4>>2]=g;h=j+8|0;e=c[h>>2]|0;c[e>>2]=g;c[e+8>>2]=69;e=(c[h>>2]|0)+16|0;c[h>>2]=e;if(((c[j+24>>2]|0)-e|0)<16){Hf(j,0)}a[l+10|0]=0;a[l+8|0]=a[o+46|0]|0;j=(c[d>>2]|0)+64|0;b[l+4>>1]=c[(c[j>>2]|0)+28>>2];b[l+6>>1]=c[(c[j>>2]|0)+16>>2];a[l+9|0]=0;c[l>>2]=c[f>>2];c[f>>2]=l;a[(c[q>>2]|0)+77|0]=1;c[m+16>>2]=-1;c[m+20>>2]=-1;c[m>>2]=7;c[m+8>>2]=0;qi(o,c[n+72>>2]|0,m)|0;xm(n);m=n+16|0;a:while(1){o=c[m>>2]|0;switch(o|0){case 260:case 261:case 262:case 286:case 277:{s=o;break a;break};default:{}}xi(n);if((o|0)==274){t=8;break}}if((t|0)==8){s=c[m>>2]|0}if((s|0)==286){ri(n);i=k;return p|0}else{wi(n,286);return 0}return 0}function qi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=c[b>>2]|0;j=h+40|0;k=c[j>>2]|0;l=b+47|0;m=(d[l]|0)+1|0;if(m>>>0>255>>>0){n=b+12|0;o=c[(c[n>>2]|0)+52>>2]|0;p=c[h+64>>2]|0;if((p|0)==0){q=10744;r=bi(o,10296,(s=i,i=i+24|0,c[s>>2]=7680,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;tm(t,r);return 0}u=bi(o,10504,(s=i,i=i+8|0,c[s>>2]=p,s)|0)|0;i=s;q=u;r=bi(o,10296,(s=i,i=i+24|0,c[s>>2]=7680,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;tm(t,r);return 0}if((m|0)>(k|0)){m=h+28|0;c[m>>2]=Eh(c[(c[b+12>>2]|0)+52>>2]|0,c[m>>2]|0,j,8,255,7680)|0;v=c[j>>2]|0}else{v=k}m=h+28|0;if((k|0)<(v|0)){v=k;while(1){k=v+1|0;c[(c[m>>2]|0)+(v<<3)>>2]=0;if((k|0)<(c[j>>2]|0)){v=k}else{break}}}a[(c[m>>2]|0)+((d[l]|0)<<3)+4|0]=(c[f>>2]|0)==7|0;a[(c[m>>2]|0)+((d[l]|0)<<3)+5|0]=c[f+8>>2];c[(c[m>>2]|0)+((d[l]|0)<<3)>>2]=e;if((a[e+5|0]&3)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}if((a[h+5|0]&4)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}eg(c[(c[b+12>>2]|0)+52>>2]|0,h,e);w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}function ri(a){a=a|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+52>>2]|0;f=a+48|0;g=c[f>>2]|0;h=c[g>>2]|0;kl(g,0,0);si(g);i=g+20|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823>>>0){Fh(e)}k=h+12|0;l=h+48|0;c[k>>2]=Gh(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];l=c[i>>2]|0;if((l+1|0)>>>0>1073741823>>>0){Fh(e)}j=h+20|0;k=h+52|0;c[j>>2]=Gh(e,c[j>>2]|0,c[k>>2]<<2,l<<2)|0;c[k>>2]=c[i>>2];i=g+32|0;k=c[i>>2]|0;if((k+1|0)>>>0>268435455>>>0){Fh(e)}l=h+8|0;j=h+44|0;c[l>>2]=Gh(e,c[l>>2]|0,c[j>>2]<<4,k<<4)|0;c[j>>2]=c[i>>2];i=g+36|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823>>>0){Fh(e)}k=h+16|0;l=h+56|0;c[k>>2]=Gh(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];i=g+44|0;l=b[i>>1]|0;if((l+1|0)>>>0>357913941>>>0){Fh(e)}j=h+24|0;k=h+60|0;c[j>>2]=Gh(e,c[j>>2]|0,(c[k>>2]|0)*12|0,l*12|0)|0;c[k>>2]=b[i>>1]|0;i=g+47|0;k=h+28|0;l=h+40|0;c[k>>2]=Gh(e,c[k>>2]|0,c[l>>2]<<3,d[i]<<3)|0;c[l>>2]=d[i]|0;c[f>>2]=c[g+8>>2];if(((c[a+16>>2]|0)-288|0)>>>0<2>>>0){g=c[a+24>>2]|0;vm(a,g+16|0,c[g+12>>2]|0)|0}g=e+8|0;c[g>>2]=(c[g>>2]|0)-16;if((c[(c[e+12>>2]|0)+12>>2]|0)<=0){return}sg(e);return}function si(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;g=e+16|0;h=c[g>>2]|0;j=e+12|0;k=c[j>>2]|0;l=h|0;do{if((c[l>>2]|0)!=0){if((a[h+9|0]|0)==0){break}m=hl(e)|0;ol(e,m,d[h+8|0]|0);nl(e,m)}}while(0);a:do{if((a[h+10|0]|0)!=0){m=k+52|0;n=Zi(c[m>>2]|0,6720)|0;o=k+64|0;p=c[o>>2]|0;q=p+24|0;r=k+48|0;s=c[(c[r>>2]|0)+20>>2]|0;t=p+28|0;u=c[t>>2]|0;v=p+32|0;if((u+1|0)>(c[v>>2]|0)){p=q|0;w=Eh(c[m>>2]|0,c[p>>2]|0,v,16,32767,5176)|0;c[p>>2]=w;x=w}else{x=c[q>>2]|0}w=q|0;c[x+(u<<4)>>2]=n;c[(c[w>>2]|0)+(u<<4)+8>>2]=0;a[(c[w>>2]|0)+(u<<4)+12|0]=a[(c[r>>2]|0)+46|0]|0;c[(c[w>>2]|0)+(u<<4)+4>>2]=s;c[t>>2]=(c[t>>2]|0)+1;t=c[o>>2]|0;o=(c[t+24>>2]|0)+(u<<4)|0;u=b[(c[(c[r>>2]|0)+16>>2]|0)+6>>1]|0;r=t+16|0;if((u|0)>=(c[r>>2]|0)){break}s=t+12|0;t=o|0;w=u;do{while(1){if((Vi(c[(c[s>>2]|0)+(w<<4)>>2]|0,c[t>>2]|0)|0)==0){break}vi(k,w,o);if((w|0)>=(c[r>>2]|0)){break a}}w=w+1|0;}while((w|0)<(c[r>>2]|0))}}while(0);c[g>>2]=c[l>>2];g=h+8|0;x=a[g]|0;r=e+46|0;w=(c[(c[j>>2]|0)+64>>2]|0)+4|0;c[w>>2]=(x&255)-(d[r]|0)+(c[w>>2]|0);w=a[r]|0;if((w&255)>>>0>(x&255)>>>0){o=e+20|0;t=e|0;s=e+40|0;u=w;while(1){n=c[o>>2]|0;q=u-1&255;a[r]=q;c[(c[(c[t>>2]|0)+24>>2]|0)+((b[(c[c[(c[j>>2]|0)+64>>2]>>2]|0)+((c[s>>2]|0)+(q&255)<<1)>>1]|0)*12|0)+8>>2]=n;n=a[r]|0;if((n&255)>>>0>(x&255)>>>0){u=n}else{y=n;break}}}else{y=w}a[e+48|0]=y;y=k+64|0;c[(c[y>>2]|0)+28>>2]=b[h+4>>1]|0;w=b[h+6>>1]|0;if((c[l>>2]|0)==0){l=c[y>>2]|0;if((w|0)>=(c[l+16>>2]|0)){i=f;return}y=c[l+12>>2]|0;l=c[y+(w<<4)>>2]|0;u=l;if((a[u+4|0]|0)!=4){z=10872;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(w<<4)+8|0;E=c[D>>2]|0;F=bi(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;ti(k,F)}z=(a[u+6|0]|0)!=0?6256:10872;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(w<<4)+8|0;E=c[D>>2]|0;F=bi(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;ti(k,F)}F=c[(c[j>>2]|0)+64>>2]|0;k=F+16|0;if((w|0)>=(c[k>>2]|0)){i=f;return}G=F+12|0;F=h+9|0;h=w;do{w=c[G>>2]|0;E=w+(h<<4)+12|0;C=a[g]|0;z=C&255;if((d[E]|0)>>>0>(C&255)>>>0){if((a[F]|0)==0){H=C}else{ol(e,c[w+(h<<4)+4>>2]|0,z);H=a[g]|0}a[E]=H}h=((ui(c[j>>2]|0,h)|0)==0)+h|0;}while((h|0)<(c[k>>2]|0));i=f;return}function ti(a,b){a=a|0;b=b|0;c[a+16>>2]=0;tm(a,b)}function ui(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=e+48|0;h=c[(c[g>>2]|0)+16>>2]|0;i=c[e+64>>2]|0;j=c[i+12>>2]|0;k=h+4|0;l=i+28|0;m=i+24|0;i=j+(f<<4)|0;n=b[k>>1]|0;while(1){if((n|0)>=(c[l>>2]|0)){o=0;p=9;break}q=c[m>>2]|0;r=q+(n<<4)|0;if((Vi(c[r>>2]|0,c[i>>2]|0)|0)==0){n=n+1|0}else{break}}if((p|0)==9){return o|0}p=a[q+(n<<4)+12|0]|0;do{if((d[j+(f<<4)+12|0]|0)>>>0>(p&255)>>>0){if((a[h+9|0]|0)==0){if((c[l>>2]|0)<=(b[k>>1]|0)){break}}ol(c[g>>2]|0,c[j+(f<<4)+4>>2]|0,p&255)}}while(0);vi(e,f,r);o=1;return o|0}function vi(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;j=c[e+48>>2]|0;k=c[e+64>>2]|0;l=k+12|0;m=c[l>>2]|0;n=a[m+(f<<4)+12|0]|0;if((n&255)>>>0<(d[g+12|0]|0)>>>0){o=c[m+(f<<4)+8>>2]|0;p=(c[(c[(c[j>>2]|0)+24>>2]|0)+((b[(c[c[(c[j+12>>2]|0)+64>>2]>>2]|0)+((c[j+40>>2]|0)+(n&255)<<1)>>1]|0)*12|0)>>2]|0)+16|0;n=bi(c[e+52>>2]|0,8640,(q=i,i=i+24|0,c[q>>2]=(c[m+(f<<4)>>2]|0)+16,c[q+8>>2]=o,c[q+16>>2]=p,q)|0)|0;i=q;ti(e,n)}ml(j,c[m+(f<<4)+4>>2]|0,c[g+4>>2]|0);g=k+16|0;k=(c[g>>2]|0)-1|0;if((k|0)>(f|0)){r=f}else{s=k;c[g>>2]=s;i=h;return}while(1){k=c[l>>2]|0;f=r+1|0;m=k+(r<<4)|0;j=k+(f<<4)|0;c[m>>2]=c[j>>2];c[m+4>>2]=c[j+4>>2];c[m+8>>2]=c[j+8>>2];c[m+12>>2]=c[j+12>>2];j=(c[g>>2]|0)-1|0;if((f|0)<(j|0)){r=f}else{s=j;break}}c[g>>2]=s;i=h;return}function wi(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+52>>2]|0;e=sm(a,b)|0;b=bi(d,4104,(d=i,i=i+8|0,c[d>>2]=e,d)|0)|0;i=d;tm(a,b)}



function xi(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;f=i;i=i+440|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+104|0;m=f+128|0;n=f+152|0;o=f+176|0;p=f+200|0;q=f+224|0;r=f+248|0;s=f+272|0;t=f+288|0;u=f+304|0;v=f+328|0;w=f+344|0;x=f+360|0;y=f+384|0;z=f+400|0;A=f+416|0;B=f+432|0;C=e+4|0;D=c[C>>2]|0;E=e+52|0;F=(c[E>>2]|0)+38|0;G=(b[F>>1]|0)+1&65535;b[F>>1]=G;F=e+48|0;H=c[F>>2]|0;if((G&65535)>>>0>200>>>0){G=H+12|0;I=c[(c[G>>2]|0)+52>>2]|0;J=c[(c[H>>2]|0)+64>>2]|0;if((J|0)==0){K=10744;L=bi(I,10296,(M=i,i=i+24|0,c[M>>2]=3264,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;tm(N,L)}O=bi(I,10504,(M=i,i=i+8|0,c[M>>2]=J,M)|0)|0;i=M;K=O;L=bi(I,10296,(M=i,i=i+24|0,c[M>>2]=3264,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;tm(N,L)}L=e+16|0;switch(c[L>>2]|0){case 267:{c[B>>2]=-1;Ki(e,B);while(1){N=c[L>>2]|0;if((N|0)==260){P=10;break}else if((N|0)!=261){break}Ki(e,B)}if((P|0)==10){xm(e);N=c[F>>2]|0;a[A+10|0]=0;a[A+8|0]=a[N+46|0]|0;G=N+12|0;b[A+4>>1]=c[(c[(c[G>>2]|0)+64>>2]|0)+28>>2];b[A+6>>1]=c[(c[(c[G>>2]|0)+64>>2]|0)+16>>2];a[A+9|0]=0;G=N+16|0;c[A>>2]=c[G>>2];c[G>>2]=A;a:do{A=c[L>>2]|0;switch(A|0){case 260:case 261:case 262:case 286:case 277:{break a;break};default:{}}xi(e)}while((A|0)!=274);si(N)}yi(e,262,267,D);nl(H,c[B>>2]|0);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 59:{xm(e);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 269:{xm(e);B=c[L>>2]|0;if((B|0)==265){xm(e);N=c[F>>2]|0;if((c[L>>2]|0)!=288){wi(e,288)}A=c[e+24>>2]|0;xm(e);Ei(e,A);A=c[F>>2]|0;G=A+46|0;K=(a[G]|0)+1&255;a[G]=K;c[(c[(c[A>>2]|0)+24>>2]|0)+((b[(c[c[(c[A+12>>2]|0)+64>>2]>>2]|0)+((K&255)-1+(c[A+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[A+20>>2];Di(e,n,0,c[C>>2]|0);c[(c[(c[N>>2]|0)+24>>2]|0)+((b[(c[c[(c[N+12>>2]|0)+64>>2]>>2]|0)+((c[N+40>>2]|0)+(c[n+8>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[N+20>>2];Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}if((B|0)!=288){wi(e,288)}B=e+24|0;N=1;while(1){n=c[B>>2]|0;xm(e);Ei(e,n);n=c[L>>2]|0;if((n|0)==61){P=81;break}else if((n|0)!=44){P=83;break}xm(e);if((c[L>>2]|0)==288){N=N+1|0}else{P=78;break}}do{if((P|0)==78){wi(e,288)}else if((P|0)==81){xm(e);Bi(e,m,0)|0;if((c[L>>2]|0)==44){B=1;while(1){xm(e);zl(c[F>>2]|0,m);Bi(e,m,0)|0;n=B+1|0;if((c[L>>2]|0)==44){B=n}else{Y=n;break}}}else{Y=1}B=c[m>>2]|0;n=c[F>>2]|0;A=N-Y|0;if((B|0)==0){Z=n;_=A;P=88;break}else if(!((B|0)==12|(B|0)==13)){zl(n,m);Z=n;_=A;P=88;break}B=A+1|0;A=(B|0)<0?0:B;wl(n,m,A);if((A|0)<=1){break}sl(n,A-1|0)}else if((P|0)==83){c[m>>2]=0;Z=c[F>>2]|0;_=N;P=88}}while(0);do{if((P|0)==88){if((_|0)<=0){break}m=d[Z+48|0]|0;sl(Z,_);fl(Z,m,_)}}while(0);_=c[F>>2]|0;Z=_+46|0;m=(d[Z]|0)+N&255;a[Z]=m;if((N|0)==0){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}Y=_+20|0;A=_|0;n=_+12|0;B=_+40|0;_=N;N=m;while(1){c[(c[(c[A>>2]|0)+24>>2]|0)+((b[(c[c[(c[n>>2]|0)+64>>2]>>2]|0)+((N&255)-_+(c[B>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[Y>>2];m=_-1|0;if((m|0)==0){break}_=m;N=a[Z]|0}Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 259:{xm(e);Z=c[F>>2]|0;a[w+10|0]=0;a[w+8|0]=a[Z+46|0]|0;N=Z+12|0;b[w+4>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+28>>2];b[w+6>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+16>>2];a[w+9|0]=0;N=Z+16|0;c[w>>2]=c[N>>2];c[N>>2]=w;b:do{w=c[L>>2]|0;switch(w|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}xi(e)}while((w|0)!=274);si(Z);yi(e,262,259,D);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 285:{xm(e);if((c[L>>2]|0)!=288){wi(e,288)}Z=c[e+24>>2]|0;xm(e);w=c[F>>2]|0;N=e+64|0;_=c[N>>2]|0;Y=w+16|0;B=_+28|0;n=_+24|0;A=b[(c[Y>>2]|0)+4>>1]|0;while(1){if((A|0)>=(c[B>>2]|0)){break}if((Vi(Z,c[(c[n>>2]|0)+(A<<4)>>2]|0)|0)==0){A=A+1|0}else{P=99;break}}if((P|0)==99){m=w+12|0;K=c[(c[n>>2]|0)+(A<<4)+8>>2]|0;A=bi(c[(c[m>>2]|0)+52>>2]|0,9592,(M=i,i=i+16|0,c[M>>2]=Z+16,c[M+8>>2]=K,M)|0)|0;i=M;ti(c[m>>2]|0,A)}if((c[L>>2]|0)!=285){wi(e,285)}xm(e);A=c[w+20>>2]|0;w=c[B>>2]|0;m=_+32|0;if((w+1|0)>(c[m>>2]|0)){_=Eh(c[E>>2]|0,c[n>>2]|0,m,16,32767,5176)|0;c[n>>2]=_;$=_}else{$=c[n>>2]|0}c[$+(w<<4)>>2]=Z;c[(c[n>>2]|0)+(w<<4)+8>>2]=D;a[(c[n>>2]|0)+(w<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[n>>2]|0)+(w<<4)+4>>2]=A;c[B>>2]=(c[B>>2]|0)+1;c:while(1){switch(c[L>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{P=108;break c;break};default:{break c}}xi(e)}if((P|0)==108){a[(c[n>>2]|0)+(w<<4)+12|0]=a[(c[Y>>2]|0)+8|0]|0}Y=(c[n>>2]|0)+(w<<4)|0;w=c[N>>2]|0;N=b[(c[(c[F>>2]|0)+16>>2]|0)+6>>1]|0;n=w+16|0;if((N|0)>=(c[n>>2]|0)){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}B=w+12|0;w=Y|0;A=N;d:while(1){while(1){if((Vi(c[(c[B>>2]|0)+(A<<4)>>2]|0,c[w>>2]|0)|0)==0){break}vi(e,A,Y);if((A|0)>=(c[n>>2]|0)){P=141;break d}}N=A+1|0;if((N|0)<(c[n>>2]|0)){A=N}else{P=141;break}}if((P|0)==141){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}break};case 278:{xm(e);A=ll(H)|0;Bi(e,x,0)|0;n=x|0;if((c[n>>2]|0)==1){c[n>>2]=3}Hl(c[F>>2]|0,x);n=c[x+20>>2]|0;a[z+10|0]=1;a[z+8|0]=a[H+46|0]|0;x=H+12|0;b[z+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2];b[z+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2];a[z+9|0]=0;x=H+16|0;c[z>>2]=c[x>>2];c[x>>2]=z;if((c[L>>2]|0)!=259){wi(e,259)}xm(e);z=c[F>>2]|0;a[y+10|0]=0;a[y+8|0]=a[z+46|0]|0;x=z+12|0;b[y+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2];b[y+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2];a[y+9|0]=0;x=z+16|0;c[y>>2]=c[x>>2];c[x>>2]=y;e:do{y=c[L>>2]|0;switch(y|0){case 260:case 261:case 262:case 286:case 277:{break e;break};default:{}}xi(e)}while((y|0)!=274);si(z);ml(H,hl(H)|0,A);yi(e,262,278,D);si(H);nl(H,n);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 265:{xm(e);if((c[L>>2]|0)!=288){wi(e,288)}n=c[e+24>>2]|0;xm(e);A=c[F>>2]|0;if((Ii(A,n,p,1)|0)==0){Ii(A,c[e+72>>2]|0,p,1)|0;z=tl(c[F>>2]|0,n)|0;c[o+16>>2]=-1;c[o+20>>2]=-1;c[o>>2]=4;c[o+8>>2]=z;Jl(A,p,o)}while(1){o=c[L>>2]|0;if((o|0)==58){P=70;break}else if((o|0)!=46){aa=0;break}Gi(e,p)}if((P|0)==70){Gi(e,p);aa=1}Di(e,q,aa,D);Fl(c[F>>2]|0,p,q);Ol(c[F>>2]|0,D);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 264:{a[v+10|0]=1;a[v+8|0]=a[H+46|0]|0;q=H+12|0;b[v+4>>1]=c[(c[(c[q>>2]|0)+64>>2]|0)+28>>2];b[v+6>>1]=c[(c[(c[q>>2]|0)+64>>2]|0)+16>>2];a[v+9|0]=0;q=H+16|0;c[v>>2]=c[q>>2];c[q>>2]=v;xm(e);if((c[L>>2]|0)!=288){wi(e,288)}v=e+24|0;q=c[v>>2]|0;xm(e);p=c[L>>2]|0;if((p|0)==61){aa=c[F>>2]|0;o=aa+48|0;A=d[o]|0;Ei(e,vm(e,8520,11)|0);Ei(e,vm(e,8352,11)|0);Ei(e,vm(e,8096,10)|0);Ei(e,q);if((c[L>>2]|0)!=61){wi(e,61)}xm(e);Bi(e,j,0)|0;zl(c[F>>2]|0,j);if((c[L>>2]|0)!=44){wi(e,44)}xm(e);Bi(e,h,0)|0;zl(c[F>>2]|0,h);if((c[L>>2]|0)==44){xm(e);Bi(e,g,0)|0;zl(c[F>>2]|0,g)}else{g=d[o]|0;ql(aa,g,vl(aa,1.0)|0)|0;sl(aa,1)}Ji(e,A,D,1,1)}else if((p|0)==44|(p|0)==268){p=c[F>>2]|0;A=d[p+48|0]|0;Ei(e,vm(e,9152,15)|0);Ei(e,vm(e,8976,11)|0);Ei(e,vm(e,8776,13)|0);Ei(e,q);q=c[L>>2]|0;do{if((q|0)==44){aa=4;while(1){xm(e);if((c[L>>2]|0)!=288){P=40;break}g=c[v>>2]|0;xm(e);Ei(e,g);ba=c[L>>2]|0;if((ba|0)==44){aa=aa+1|0}else{P=42;break}}if((P|0)==40){wi(e,288)}else if((P|0)==42){ca=aa-2|0;da=ba;break}}else{ca=1;da=q}}while(0);if((da|0)!=268){wi(e,268)}xm(e);da=c[C>>2]|0;Bi(e,u,0)|0;if((c[L>>2]|0)==44){q=1;while(1){xm(e);zl(c[F>>2]|0,u);Bi(e,u,0)|0;ba=q+1|0;if((c[L>>2]|0)==44){q=ba}else{ea=ba;break}}}else{ea=1}q=c[F>>2]|0;ba=3-ea|0;ea=c[u>>2]|0;do{if((ea|0)==12|(ea|0)==13){v=ba+1|0;g=(v|0)<0?0:v;wl(q,u,g);if((g|0)<=1){break}sl(q,g-1|0)}else if((ea|0)==0){P=51}else{zl(q,u);P=51}}while(0);do{if((P|0)==51){if((ba|0)<=0){break}u=d[q+48|0]|0;sl(q,ba);fl(q,u,ba)}}while(0);rl(p,3);Ji(e,A,da,ca,0)}else{tm(e,9376)}yi(e,262,264,D);si(H);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 273:{ca=ll(H)|0;a[s+10|0]=1;da=H+46|0;a[s+8|0]=a[da]|0;A=H+12|0;b[s+4>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+28>>2];b[s+6>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+16>>2];a[s+9|0]=0;p=H+16|0;c[s>>2]=c[p>>2];c[p>>2]=s;a[t+10|0]=0;s=t+8|0;a[s]=a[da]|0;b[t+4>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+28>>2];b[t+6>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+16>>2];A=t+9|0;a[A]=0;c[t>>2]=c[p>>2];c[p>>2]=t;xm(e);f:do{t=c[L>>2]|0;switch(t|0){case 260:case 261:case 262:case 286:case 277:{break f;break};default:{}}xi(e)}while((t|0)!=274);yi(e,277,273,D);Bi(e,r,0)|0;D=r|0;if((c[D>>2]|0)==1){c[D>>2]=3}Hl(c[F>>2]|0,r);D=c[r+20>>2]|0;if((a[A]|0)!=0){ol(H,D,d[s]|0)}si(H);ml(H,D,ca);si(H);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 274:{xm(e);ca=c[F>>2]|0;g:do{switch(c[L>>2]|0){case 260:case 261:case 262:case 286:case 277:case 59:{fa=0;ga=0;break};default:{Bi(e,l,0)|0;if((c[L>>2]|0)==44){D=1;while(1){xm(e);zl(c[F>>2]|0,l);Bi(e,l,0)|0;s=D+1|0;if((c[L>>2]|0)==44){D=s}else{ha=s;break}}}else{ha=1}D=l|0;if(((c[D>>2]|0)-12|0)>>>0<2>>>0){wl(ca,l,-1);if((c[D>>2]|0)==12&(ha|0)==1){D=(c[(c[ca>>2]|0)+12>>2]|0)+(c[l+8>>2]<<2)|0;c[D>>2]=c[D>>2]&-64|30}fa=-1;ga=d[ca+46|0]|0;break g}else{if((ha|0)==1){fa=1;ga=Bl(ca,l)|0;break g}else{zl(ca,l);fa=ha;ga=d[ca+46|0]|0;break g}}}}}while(0);kl(ca,ga,fa);if((c[L>>2]|0)!=59){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}xm(e);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 258:case 266:{fa=hl(H)|0;ga=c[C>>2]|0;C=(c[L>>2]|0)==266;xm(e);do{if(C){if((c[L>>2]|0)==288){ca=c[e+24>>2]|0;xm(e);ia=ca;break}else{wi(e,288)}}else{ia=Zi(c[E>>2]|0,6720)|0}}while(0);C=c[e+64>>2]|0;ca=C+12|0;ha=C+16|0;l=c[ha>>2]|0;D=C+20|0;if((l+1|0)>(c[D>>2]|0)){C=ca|0;aa=Eh(c[E>>2]|0,c[C>>2]|0,D,16,32767,5176)|0;c[C>>2]=aa;ja=aa}else{ja=c[ca>>2]|0}aa=ca|0;c[ja+(l<<4)>>2]=ia;c[(c[aa>>2]|0)+(l<<4)+8>>2]=ga;a[(c[aa>>2]|0)+(l<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[aa>>2]|0)+(l<<4)+4>>2]=fa;c[ha>>2]=(c[ha>>2]|0)+1;ui(e,l)|0;Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};default:{l=k+8|0;zi(e,l);ha=c[L>>2]|0;if((ha|0)==61|(ha|0)==44){c[k>>2]=0;Ai(e,k,1);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}if((c[l>>2]|0)!=12){tm(e,3760)}e=(c[(c[H>>2]|0)+12>>2]|0)+(c[k+16>>2]<<2)|0;c[e>>2]=c[e>>2]&-8372225|16384;Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}}}function yi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;if((c[a+16>>2]|0)==(b|0)){xm(a);i=f;return}if((c[a+4>>2]|0)==(e|0)){wi(a,b)}else{f=c[a+52>>2]|0;g=sm(a,b)|0;b=sm(a,d)|0;d=bi(f,7848,(f=i,i=i+24|0,c[f>>2]=g,c[f+8>>2]=b,c[f+16>>2]=e,f)|0)|0;i=f;tm(a,d)}}function zi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=i;i=i+72|0;e=d|0;f=d+24|0;g=d+48|0;h=a+48|0;j=c[h>>2]|0;k=c[a+4>>2]|0;l=a+16|0;m=c[l>>2]|0;do{if((m|0)==40){xm(a);Bi(a,b,0)|0;yi(a,41,40,k);yl(c[h>>2]|0,b);n=a+24|0}else if((m|0)==288){o=a+24|0;p=c[o>>2]|0;xm(a);q=c[h>>2]|0;if((Ii(q,p,b,1)|0)!=0){n=o;break}Ii(q,c[a+72>>2]|0,b,1)|0;r=tl(c[h>>2]|0,p)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=r;Jl(q,b,e);n=o}else{tm(a,9840)}}while(0);e=g+16|0;m=g+20|0;o=g|0;q=g+8|0;a:while(1){switch(c[l>>2]|0){case 40:case 289:case 123:{zl(j,b);Hi(a,b,k);continue a;break};case 58:{xm(a);if((c[l>>2]|0)!=288){s=13;break a}r=c[n>>2]|0;xm(a);p=tl(c[h>>2]|0,r)|0;c[e>>2]=-1;c[m>>2]=-1;c[o>>2]=4;c[q>>2]=p;Gl(j,b,g);Hi(a,b,k);continue a;break};case 46:{Gi(a,b);continue a;break};case 91:{Cl(j,b);xm(a);Bi(a,f,0)|0;Dl(c[h>>2]|0,f);if((c[l>>2]|0)!=93){s=10;break a}xm(a);Jl(j,b,f);continue a;break};default:{s=16;break a}}}if((s|0)==10){wi(a,93)}else if((s|0)==13){wi(a,288)}else if((s|0)==16){i=d;return}}function Ai(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;j=i;i=i+56|0;k=j|0;l=j+24|0;m=g+8|0;if(((c[m>>2]|0)-7|0)>>>0>=3>>>0){tm(f,3760)}n=f+16|0;o=c[n>>2]|0;do{if((o|0)==44){xm(f);c[l>>2]=g;p=l+8|0;zi(f,p);q=p|0;p=f+48|0;do{if((c[q>>2]|0)!=9){r=c[p>>2]|0;s=a[r+48|0]|0;t=s&255;if((g|0)==0){break}u=l+16|0;v=s&255;w=0;x=g;while(1){do{if((c[x+8>>2]|0)==9){y=x+16|0;z=y;A=z+3|0;B=d[A]|0;C=c[q>>2]|0;do{if((B|0)==(C|0)){D=z+2|0;if((d[D]|0)!=(c[u>>2]|0)){E=w;F=B;break}a[A]=7;a[D]=s;E=1;F=c[q>>2]|0}else{E=w;F=C}}while(0);if((F|0)!=7){G=E;break}C=y;if((b[C>>1]|0)!=(c[u>>2]|0)){G=E;break}b[C>>1]=v;G=1}else{G=w}}while(0);C=c[x>>2]|0;if((C|0)==0){break}else{w=G;x=C}}if((G|0)==0){break}gl(r,(c[q>>2]|0)==7?0:5,t,c[u>>2]|0,0)|0;sl(r,1)}}while(0);q=c[p>>2]|0;if(((e[(c[f+52>>2]|0)+38>>1]|0)+h|0)<=200){Ai(f,l,h+1|0);H=k|0;break}x=q+12|0;w=c[(c[x>>2]|0)+52>>2]|0;v=c[(c[q>>2]|0)+64>>2]|0;if((v|0)==0){I=10744;J=bi(w,10296,(K=i,i=i+24|0,c[K>>2]=3264,c[K+8>>2]=200,c[K+16>>2]=I,K)|0)|0;i=K;L=c[x>>2]|0;tm(L,J)}q=bi(w,10504,(K=i,i=i+8|0,c[K>>2]=v,K)|0)|0;i=K;I=q;J=bi(w,10296,(K=i,i=i+24|0,c[K>>2]=3264,c[K+8>>2]=200,c[K+16>>2]=I,K)|0)|0;i=K;L=c[x>>2]|0;tm(L,J)}else if((o|0)==61){xm(f);Bi(f,k,0)|0;x=f+48|0;if((c[n>>2]|0)==44){w=1;while(1){xm(f);zl(c[x>>2]|0,k);Bi(f,k,0)|0;q=w+1|0;if((c[n>>2]|0)==44){w=q}else{M=q;break}}}else{M=1}w=c[x>>2]|0;if((M|0)==(h|0)){xl(w,k);Fl(c[x>>2]|0,m,k);i=j;return}p=h-M|0;q=k|0;v=c[q>>2]|0;do{if((v|0)==12|(v|0)==13){s=p+1|0;C=(s|0)<0?0:s;wl(w,k,C);if((C|0)<=1){break}sl(w,C-1|0)}else if((v|0)==0){N=30}else{zl(w,k);N=30}}while(0);do{if((N|0)==30){if((p|0)<=0){break}v=d[w+48|0]|0;sl(w,p);fl(w,v,p)}}while(0);if((M|0)<=(h|0)){H=q;break}w=(c[x>>2]|0)+48|0;a[w]=p+(d[w]|0);H=q}else{wi(f,61)}}while(0);h=c[f+48>>2]|0;f=(d[h+48|0]|0)-1|0;c[k+16>>2]=-1;c[k+20>>2]=-1;c[H>>2]=6;c[k+8>>2]=f;Fl(h,m,k);i=j;return}function Bi(e,f,g){e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;j=i;i=i+24|0;k=j|0;l=e+52|0;m=(c[l>>2]|0)+38|0;n=(b[m>>1]|0)+1&65535;b[m>>1]=n;m=e+48|0;o=c[m>>2]|0;if((n&65535)>>>0>200>>>0){n=o+12|0;p=c[(c[n>>2]|0)+52>>2]|0;q=c[(c[o>>2]|0)+64>>2]|0;if((q|0)==0){r=10744;s=bi(p,10296,(t=i,i=i+24|0,c[t>>2]=3264,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;tm(u,s);return 0}v=bi(p,10504,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;r=v;s=bi(p,10296,(t=i,i=i+24|0,c[t>>2]=3264,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;tm(u,s);return 0}s=e+16|0;a:do{switch(c[s>>2]|0){case 280:{if((a[(c[o>>2]|0)+77|0]|0)==0){tm(e,2920);return 0}else{u=gl(o,38,0,1,0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=13;c[f+8>>2]=u;w=20;break a}break};case 123:{Ci(e,f);break};case 263:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=3;c[f+8>>2]=0;w=20;break};case 271:{x=1;w=8;break};case 35:{x=2;w=8;break};case 289:{u=tl(o,c[e+24>>2]|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=u;w=20;break};case 276:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=2;c[f+8>>2]=0;w=20;break};case 265:{xm(e);Di(e,f,0,c[e+4>>2]|0);break};case 45:{x=0;w=8;break};case 287:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=5;c[f+8>>2]=0;h[f+8>>3]=+h[e+24>>3];w=20;break};case 270:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=1;c[f+8>>2]=0;w=20;break};default:{zi(e,f)}}}while(0);if((w|0)==8){o=c[e+4>>2]|0;xm(e);Bi(e,f,8)|0;Kl(c[m>>2]|0,x,f,o)}else if((w|0)==20){xm(e)}switch(c[s>>2]|0){case 42:{y=2;break};case 281:{y=7;break};case 60:{y=8;break};case 272:{y=14;break};case 43:{y=0;break};case 94:{y=5;break};case 282:{y=12;break};case 257:{y=13;break};case 47:{y=3;break};case 45:{y=1;break};case 283:{y=9;break};case 62:{y=11;break};case 37:{y=4;break};case 279:{y=6;break};case 284:{y=10;break};default:{z=15;A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}}s=e+4|0;o=y;while(1){if((d[304+(o<<1)|0]|0)<=(g|0)){z=o;w=39;break}y=c[s>>2]|0;xm(e);Ml(c[m>>2]|0,o,f);x=Bi(e,k,d[305+(o<<1)|0]|0)|0;Nl(c[m>>2]|0,o,f,k,y);if((x|0)==15){z=15;w=39;break}else{o=x}}if((w|0)==39){A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}return 0}function Ci(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+40|0;e=d|0;f=a+48|0;g=c[f>>2]|0;h=c[a+4>>2]|0;j=gl(g,11,0,0,0)|0;k=e+36|0;c[k>>2]=0;l=e+28|0;c[l>>2]=0;m=e+32|0;c[m>>2]=0;n=e+24|0;c[n>>2]=b;c[b+16>>2]=-1;c[b+20>>2]=-1;c[b>>2]=11;c[b+8>>2]=j;o=e|0;c[e+16>>2]=-1;c[e+20>>2]=-1;p=e|0;c[p>>2]=0;c[e+8>>2]=0;zl(c[f>>2]|0,b);b=a+16|0;if((c[b>>2]|0)!=123){wi(a,123)}xm(a);a:do{if((c[b>>2]|0)!=125){b:while(1){q=c[b>>2]|0;do{if((q|0)==91){Fi(a,e)}else if((q|0)==288){if((zm(a)|0)==61){Fi(a,e);break}Bi(a,o,0)|0;r=c[f>>2]|0;s=c[m>>2]|0;if((s|0)>2147483645){t=9;break b}c[m>>2]=s+1;c[k>>2]=(c[k>>2]|0)+1}else{Bi(a,o,0)|0;u=c[f>>2]|0;s=c[m>>2]|0;if((s|0)>2147483645){t=16;break b}c[m>>2]=s+1;c[k>>2]=(c[k>>2]|0)+1}}while(0);q=c[b>>2]|0;if((q|0)==44){xm(a)}else if((q|0)==59){xm(a)}else{break a}if((c[b>>2]|0)==125){break a}if((c[p>>2]|0)==0){continue}zl(g,o);c[p>>2]=0;if((c[k>>2]|0)!=50){continue}Pl(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,50);c[k>>2]=0}if((t|0)==9){q=r+12|0;s=c[(c[q>>2]|0)+52>>2]|0;v=c[(c[r>>2]|0)+64>>2]|0;if((v|0)==0){w=10744;x=bi(s,10296,(y=i,i=i+24|0,c[y>>2]=11008,c[y+8>>2]=2147483645,c[y+16>>2]=w,y)|0)|0;i=y;z=c[q>>2]|0;tm(z,x)}A=bi(s,10504,(y=i,i=i+8|0,c[y>>2]=v,y)|0)|0;i=y;w=A;x=bi(s,10296,(y=i,i=i+24|0,c[y>>2]=11008,c[y+8>>2]=2147483645,c[y+16>>2]=w,y)|0)|0;i=y;z=c[q>>2]|0;tm(z,x)}else if((t|0)==16){q=u+12|0;s=c[(c[q>>2]|0)+52>>2]|0;A=c[(c[u>>2]|0)+64>>2]|0;if((A|0)==0){B=10744;C=bi(s,10296,(y=i,i=i+24|0,c[y>>2]=11008,c[y+8>>2]=2147483645,c[y+16>>2]=B,y)|0)|0;i=y;D=c[q>>2]|0;tm(D,C)}v=bi(s,10504,(y=i,i=i+8|0,c[y>>2]=A,y)|0)|0;i=y;B=v;C=bi(s,10296,(y=i,i=i+24|0,c[y>>2]=11008,c[y+8>>2]=2147483645,c[y+16>>2]=B,y)|0)|0;i=y;D=c[q>>2]|0;tm(D,C)}}}while(0);yi(a,125,123,h);h=c[k>>2]|0;do{if((h|0)!=0){a=c[p>>2]|0;if((a|0)==0){E=h}else if((a|0)==12|(a|0)==13){wl(g,o,-1);Pl(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,-1);c[m>>2]=(c[m>>2]|0)-1;break}else{zl(g,o);E=c[k>>2]|0}Pl(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,E)}}while(0);E=g|0;g=c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]&8388607;n=(Wh(c[m>>2]|0)|0)<<23|g;c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]=n;n=c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]&-8372225;g=(Wh(c[l>>2]|0)|0)<<14&8372224|n;c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]=g;i=d;return}function Di(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;j=i;i=i+72|0;k=j|0;l=j+56|0;m=e+48|0;n=c[m>>2]|0;o=e+52|0;p=c[o>>2]|0;q=c[n>>2]|0;r=n+36|0;n=c[r>>2]|0;s=q+56|0;t=c[s>>2]|0;do{if((n|0)>=(t|0)){if((n+1|0)>(t|0)){u=q+16|0;c[u>>2]=Eh(p,c[u>>2]|0,s,4,262143,11320)|0;v=c[s>>2]|0}else{v=t}if((t|0)>=(v|0)){break}u=q+16|0;w=t;while(1){x=w+1|0;c[(c[u>>2]|0)+(w<<2)>>2]=0;if((x|0)<(c[s>>2]|0)){w=x}else{break}}}}while(0);s=bg(p)|0;t=c[r>>2]|0;c[r>>2]=t+1;c[(c[q+16>>2]|0)+(t<<2)>>2]=s;t=s;do{if((a[s+5|0]&3)!=0){if((a[q+5|0]&4)==0){break}eg(p,q,t)}}while(0);t=k|0;c[t>>2]=s;c[s+64>>2]=h;s=c[o>>2]|0;c[k+8>>2]=c[m>>2];o=k+12|0;c[o>>2]=e;c[m>>2]=k;c[k+20>>2]=0;c[k+24>>2]=0;c[k+28>>2]=-1;c[k+32>>2]=0;c[k+36>>2]=0;Ym(k+44|0,0,5)|0;c[k+40>>2]=c[(c[e+64>>2]|0)+4>>2];q=k+16|0;c[q>>2]=0;p=c[t>>2]|0;c[p+36>>2]=c[e+68>>2];a[p+78|0]=2;p=Aj(s)|0;c[k+4>>2]=p;r=s+8|0;v=c[r>>2]|0;c[v>>2]=p;c[v+8>>2]=69;v=(c[r>>2]|0)+16|0;c[r>>2]=v;if(((c[s+24>>2]|0)-v|0)<16){Hf(s,0)}a[l+10|0]=0;a[l+8|0]=a[k+46|0]|0;k=(c[o>>2]|0)+64|0;b[l+4>>1]=c[(c[k>>2]|0)+28>>2];b[l+6>>1]=c[(c[k>>2]|0)+16>>2];a[l+9|0]=0;c[l>>2]=c[q>>2];c[q>>2]=l;l=e+16|0;if((c[l>>2]|0)!=40){wi(e,40)}xm(e);if((g|0)!=0){Ei(e,vm(e,2640,4)|0);g=c[m>>2]|0;q=g+46|0;k=(a[q]|0)+1&255;a[q]=k;c[(c[(c[g>>2]|0)+24>>2]|0)+((b[(c[c[(c[g+12>>2]|0)+64>>2]>>2]|0)+((k&255)-1+(c[g+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[g+20>>2]}g=c[m>>2]|0;k=c[g>>2]|0;q=k+77|0;a[q]=0;o=c[l>>2]|0;a:do{if((o|0)==41){y=0}else{s=e+24|0;v=0;r=o;while(1){if((r|0)==280){z=20;break}else if((r|0)!=288){z=21;break}p=c[s>>2]|0;xm(e);Ei(e,p);p=v+1|0;if((a[q]|0)!=0){y=p;break a}if((c[l>>2]|0)!=44){y=p;break a}xm(e);v=p;r=c[l>>2]|0}if((z|0)==20){xm(e);a[q]=1;y=v;break}else if((z|0)==21){tm(e,11976)}}}while(0);q=c[m>>2]|0;o=q+46|0;r=(d[o]|0)+y&255;a[o]=r;b:do{if((y|0)!=0){s=q+20|0;p=q|0;n=q+12|0;w=q+40|0;u=y;x=r;while(1){c[(c[(c[p>>2]|0)+24>>2]|0)+((b[(c[c[(c[n>>2]|0)+64>>2]>>2]|0)+((x&255)-u+(c[w>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[s>>2];A=u-1|0;if((A|0)==0){break b}u=A;x=a[o]|0}}}while(0);o=g+46|0;a[k+76|0]=a[o]|0;sl(g,d[o]|0);if((c[l>>2]|0)!=41){wi(e,41)}xm(e);c:while(1){o=c[l>>2]|0;switch(o|0){case 260:case 261:case 262:case 286:case 277:{z=33;break c;break};default:{}}xi(e);if((o|0)==274){z=33;break}}if((z|0)==33){c[(c[t>>2]|0)+68>>2]=c[e+4>>2];yi(e,262,265,h);h=c[(c[m>>2]|0)+8>>2]|0;m=il(h,37,0,(c[h+36>>2]|0)-1|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=11;c[f+8>>2]=m;zl(h,f);ri(e);i=j;return}}function Ei(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;g=c[d+48>>2]|0;h=c[d+64>>2]|0;j=g|0;k=c[j>>2]|0;l=k+60|0;m=c[l>>2]|0;n=g+44|0;if(((b[n>>1]|0)+1|0)>(m|0)){o=k+24|0;c[o>>2]=Eh(c[d+52>>2]|0,c[o>>2]|0,l,12,32767,11560)|0;p=c[l>>2]|0;q=o}else{p=m;q=k+24|0}if((m|0)<(p|0)){p=m;while(1){m=p+1|0;c[(c[q>>2]|0)+(p*12|0)>>2]=0;if((m|0)<(c[l>>2]|0)){p=m}else{break}}}c[(c[q>>2]|0)+((b[n>>1]|0)*12|0)>>2]=e;q=e;do{if((a[e+5|0]&3)!=0){if((a[k+5|0]&4)==0){break}eg(c[d+52>>2]|0,k,q)}}while(0);q=b[n>>1]|0;b[n>>1]=q+1;n=h+4|0;k=c[n>>2]|0;if((k+1-(c[g+40>>2]|0)|0)>200){e=g+12|0;g=c[(c[e>>2]|0)+52>>2]|0;p=c[(c[j>>2]|0)+64>>2]|0;if((p|0)==0){r=10744;s=bi(g,10296,(t=i,i=i+24|0,c[t>>2]=11560,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;tm(u,s)}j=bi(g,10504,(t=i,i=i+8|0,c[t>>2]=p,t)|0)|0;i=t;r=j;s=bi(g,10296,(t=i,i=i+24|0,c[t>>2]=11560,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;tm(u,s)}s=h+8|0;if((k+2|0)>(c[s>>2]|0)){u=h|0;e=Eh(c[d+52>>2]|0,c[u>>2]|0,s,2,2147483645,11560)|0;c[u>>2]=e;v=c[n>>2]|0;w=e;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=q;i=f;return}else{v=k;w=c[h>>2]|0;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=q;i=f;return}}function Fi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+48|0;f=e|0;g=e+24|0;h=b+48|0;j=c[h>>2]|0;k=j+48|0;l=a[k]|0;m=b+16|0;do{if((c[m>>2]|0)==288){n=d+28|0;if((c[n>>2]|0)<=2147483645){o=c[b+24>>2]|0;xm(b);p=tl(c[h>>2]|0,o)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=p;q=n;break}n=j+12|0;p=c[(c[n>>2]|0)+52>>2]|0;o=c[(c[j>>2]|0)+64>>2]|0;if((o|0)==0){r=10744;s=bi(p,10296,(t=i,i=i+24|0,c[t>>2]=11008,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;tm(u,s)}v=bi(p,10504,(t=i,i=i+8|0,c[t>>2]=o,t)|0)|0;i=t;r=v;s=bi(p,10296,(t=i,i=i+24|0,c[t>>2]=11008,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;tm(u,s)}else{xm(b);Bi(b,f,0)|0;Dl(c[h>>2]|0,f);if((c[m>>2]|0)==93){xm(b);q=d+28|0;break}else{wi(b,93)}}}while(0);c[q>>2]=(c[q>>2]|0)+1;if((c[m>>2]|0)==61){xm(b);m=El(j,f)|0;Bi(b,g,0)|0;f=c[(c[d+24>>2]|0)+8>>2]|0;gl(j,10,f,m,El(j,g)|0)|0;a[k]=l;i=e;return}else{wi(b,61)}}function Gi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+24|0;e=d|0;f=a+48|0;g=c[f>>2]|0;Cl(g,b);xm(a);if((c[a+16>>2]|0)==288){h=c[a+24>>2]|0;xm(a);j=tl(c[f>>2]|0,h)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=j;Jl(g,b,e);i=d;return}else{wi(a,288)}}function Hi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+24|0;h=g|0;j=b+48|0;k=c[j>>2]|0;l=b+16|0;m=c[l>>2]|0;if((m|0)==40){xm(b);if((c[l>>2]|0)==41){c[h>>2]=0}else{Bi(b,h,0)|0;if((c[l>>2]|0)==44){do{xm(b);zl(c[j>>2]|0,h);Bi(b,h,0)|0;}while((c[l>>2]|0)==44)}wl(k,h,-1)}yi(b,41,40,f)}else if((m|0)==123){Ci(b,h)}else if((m|0)==289){m=tl(k,c[b+24>>2]|0)|0;c[h+16>>2]=-1;c[h+20>>2]=-1;c[h>>2]=4;c[h+8>>2]=m;xm(b)}else{tm(b,10056)}b=e+8|0;m=c[b>>2]|0;l=c[h>>2]|0;if((l|0)==0){n=13}else if((l|0)==12|(l|0)==13){o=0}else{zl(k,h);n=13}if((n|0)==13){o=(d[k+48|0]|0)-m|0}n=gl(k,29,m,o,2)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=12;c[b>>2]=n;Ol(k,f);a[k+48|0]=m+1;i=g;return}function Ii(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((e|0)==0){i=0;return i|0}j=e|0;k=e+12|0;l=e+40|0;m=d[e+46|0]|0;while(1){n=m-1|0;o=c[j>>2]|0;if((m|0)<=0){break}if((Vi(f,c[(c[o+24>>2]|0)+((b[(c[c[(c[k>>2]|0)+64>>2]>>2]|0)+((c[l>>2]|0)+n<<1)>>1]|0)*12|0)>>2]|0)|0)==0){m=n}else{p=5;break}}if((p|0)==5){c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=7;c[g+8>>2]=n;if((h|0)!=0){i=7;return i|0}h=e+16|0;while(1){q=c[h>>2]|0;if((d[q+8|0]|0)>(n|0)){h=q|0}else{break}}a[q+9|0]=1;i=7;return i|0}q=c[o+28>>2]|0;o=e+47|0;h=0;while(1){if((h|0)>=(d[o]|0)){p=13;break}if((Vi(c[q+(h<<3)>>2]|0,f)|0)==0){h=h+1|0}else{p=12;break}}if((p|0)==12){if((h|0)<0){p=13}else{r=h}}do{if((p|0)==13){if((Ii(c[e+8>>2]|0,f,g,0)|0)==0){i=0;return i|0}else{r=qi(e,f,g)|0;break}}}while(0);c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=8;c[g+8>>2]=r;i=8;return i|0}function Ji(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;k=i;i=i+32|0;l=k|0;m=k+16|0;n=e+48|0;o=c[n>>2]|0;p=o+46|0;q=(a[p]|0)+3&255;a[p]=q;r=o+20|0;s=o|0;t=o+12|0;u=o+40|0;v=3;w=q;while(1){c[(c[(c[s>>2]|0)+24>>2]|0)+((b[(c[c[(c[t>>2]|0)+64>>2]>>2]|0)+((w&255)-v+(c[u>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];q=v-1|0;if((q|0)==0){break}v=q;w=a[p]|0}w=e+16|0;if((c[w>>2]|0)!=259){wi(e,259)}xm(e);v=(j|0)!=0;if(v){x=il(o,33,f,131070)|0}else{x=hl(o)|0}a[m+10|0]=0;a[m+8|0]=a[p]|0;b[m+4>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+28>>2];b[m+6>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+16>>2];a[m+9|0]=0;t=o+16|0;c[m>>2]=c[t>>2];c[t>>2]=m;m=c[n>>2]|0;t=m+46|0;p=(d[t]|0)+h&255;a[t]=p;a:do{if((h|0)!=0){j=m+20|0;r=m|0;u=m+12|0;s=m+40|0;q=h;y=p;while(1){c[(c[(c[r>>2]|0)+24>>2]|0)+((b[(c[c[(c[u>>2]|0)+64>>2]>>2]|0)+((y&255)-q+(c[s>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[j>>2];z=q-1|0;if((z|0)==0){break a}q=z;y=a[t]|0}}}while(0);sl(o,h);t=c[n>>2]|0;a[l+10|0]=0;a[l+8|0]=a[t+46|0]|0;n=t+12|0;b[l+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[l+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[l+9|0]=0;n=t+16|0;c[l>>2]=c[n>>2];c[n>>2]=l;b:do{l=c[w>>2]|0;switch(l|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}xi(e)}while((l|0)!=274);si(t);si(o);nl(o,x);if(v){A=il(o,32,f,131070)|0;B=x+1|0;ml(o,A,B);Ol(o,g);i=k;return}else{gl(o,34,f,0,h)|0;Ol(o,g);A=il(o,35,f+2|0,131070)|0;B=x+1|0;ml(o,A,B);Ol(o,g);i=k;return}}function Ki(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=d+48|0;k=c[j>>2]|0;xm(d);Bi(d,h,0)|0;l=d+16|0;if((c[l>>2]|0)!=275){wi(d,275)}xm(d);m=c[l>>2]|0;do{if((m|0)==266|(m|0)==258){Il(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;n=c[h+16>>2]|0;o=c[d+4>>2]|0;p=(c[l>>2]|0)==266;xm(d);do{if(p){if((c[l>>2]|0)==288){q=c[d+24>>2]|0;xm(d);r=q;break}else{wi(d,288)}}else{r=Zi(c[d+52>>2]|0,6720)|0}}while(0);p=c[d+64>>2]|0;q=p+12|0;s=p+16|0;t=c[s>>2]|0;u=p+20|0;if((t+1|0)>(c[u>>2]|0)){p=q|0;v=Eh(c[d+52>>2]|0,c[p>>2]|0,u,16,32767,5176)|0;c[p>>2]=v;w=v}else{w=c[q>>2]|0}v=q|0;c[w+(t<<4)>>2]=r;c[(c[v>>2]|0)+(t<<4)+8>>2]=o;a[(c[v>>2]|0)+(t<<4)+12|0]=a[(c[j>>2]|0)+46|0]|0;c[(c[v>>2]|0)+(t<<4)+4>>2]=n;c[s>>2]=(c[s>>2]|0)+1;ui(d,t)|0;a:while(1){switch(c[l>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{break a;break};default:{x=16;break a}}xi(d)}if((x|0)==16){y=hl(k)|0;break}si(k);i=f;return}else{Hl(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;y=c[h+20>>2]|0}}while(0);b:do{h=c[l>>2]|0;switch(h|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}xi(d)}while((h|0)!=274);si(k);if(((c[l>>2]|0)-260|0)>>>0<2>>>0){jl(k,e,hl(k)|0)}nl(k,y);i=f;return}function Li(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+12|0;e=a+8|0;c[e>>2]=(c[d>>2]|0)-b+(c[e>>2]|0);c[d>>2]=b;return}function Mi(a){a=a|0;var b=0,d=0,e=0;b=Gh(a,0,0,40)|0;d=b;e=a+16|0;c[(c[e>>2]|0)+12>>2]=d;c[b+8>>2]=c[e>>2];c[b+12>>2]=0;return d|0}function Ni(a){a=a|0;var b=0,d=0,e=0;b=(c[a+16>>2]|0)+12|0;d=c[b>>2]|0;c[b>>2]=0;if((d|0)==0){return}else{e=d}while(1){d=c[e+12>>2]|0;Gh(a,e,40,0)|0;if((d|0)==0){break}else{e=d}}return}function Oi(d){d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+12|0;if((c[(c[e>>2]|0)+12>>2]|0)>0){sg(d)}f=jg(d,8,112,0,0)|0;g=f;h=d+8|0;i=c[h>>2]|0;c[i>>2]=f;c[i+8>>2]=72;c[h>>2]=(c[h>>2]|0)+16;c[f+12>>2]=c[e>>2];e=g+28|0;c[e>>2]=0;h=f+16|0;c[h>>2]=0;i=f+32|0;c[i>>2]=0;c[f+64>>2]=0;b[f+38>>1]=0;j=f+52|0;c[j>>2]=0;k=f+40|0;a[k]=0;l=f+44|0;c[l>>2]=0;a[f+41|0]=1;m=f+48|0;c[m>>2]=0;c[f+56>>2]=0;b[f+36>>1]=1;a[f+6|0]=0;c[f+68>>2]=0;a[k]=a[d+40|0]|0;k=c[d+44>>2]|0;c[l>>2]=k;c[j>>2]=c[d+52>>2];c[m>>2]=k;k=Gh(d,0,0,640)|0;c[e>>2]=k;c[i>>2]=40;d=0;m=k;do{c[m+(d<<4)+8>>2]=0;d=d+1|0;m=c[e>>2]|0}while((d|0)<40);d=f+8|0;c[f+24>>2]=m+((c[i>>2]|0)-5<<4);i=f+72|0;c[f+80>>2]=0;c[f+84>>2]=0;a[f+90|0]=0;c[i>>2]=m;c[d>>2]=m+16;c[m+8>>2]=0;c[f+76>>2]=(c[d>>2]|0)+320;c[h>>2]=i;return g|0}function Pi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=b+28|0;ag(b,c[d>>2]|0);e=c[d>>2]|0;if((e|0)==0){f=b;g=Gh(a,f,112,0)|0;return}c[b+16>>2]=b+72;h=b+84|0;i=c[h>>2]|0;c[h>>2]=0;if((i|0)==0){j=e}else{e=i;while(1){i=c[e+12>>2]|0;Gh(b,e,40,0)|0;if((i|0)==0){break}else{e=i}}j=c[d>>2]|0}Gh(b,j,c[b+32>>2]<<4,0)|0;f=b;g=Gh(a,f,112,0)|0;return}function Qi(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+24|0;g=f|0;h=f+16|0;j=Ec[d&15](e,0,8,400)|0;if((j|0)==0){k=0;i=f;return k|0}l=j;m=j+112|0;c[j>>2]=0;a[j+4|0]=8;a[j+172|0]=33;a[j+5|0]=1;a[j+174|0]=0;c[j+12>>2]=m;c[j+28>>2]=0;c[j+16>>2]=0;c[j+32>>2]=0;c[j+64>>2]=0;b[j+38>>1]=0;c[j+52>>2]=0;a[j+40|0]=0;c[j+44>>2]=0;a[j+41|0]=1;c[j+48>>2]=0;c[j+56>>2]=0;b[j+36>>1]=1;a[j+6|0]=0;c[j+68>>2]=0;c[m>>2]=d;c[j+116>>2]=e;c[j+284>>2]=l;e=yc(0)|0;c[h>>2]=e;c[g>>2]=j;c[g+4>>2]=h;c[g+8>>2]=1224;c[g+12>>2]=6;c[j+168>>2]=Wi(g,16,e)|0;e=j+224|0;c[j+240>>2]=e;c[j+244>>2]=e;a[j+175|0]=0;c[j+160>>2]=0;c[j+256>>2]=0;c[j+264>>2]=0;c[j+280>>2]=0;Ym(j+132|0,0,16)|0;c[j+288>>2]=cd(0)|0;a[j+173|0]=5;Ym(j+180|0,0,40)|0;c[j+120>>2]=400;c[j+124>>2]=0;c[j+268>>2]=200;c[j+272>>2]=200;c[j+276>>2]=200;Ym(j+364|0,0,36)|0;if((Ff(l,10,0)|0)==0){k=l;i=f;return k|0}Si(l);k=0;i=f;return k|0}function Ri(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;e=d|0;f=c[b+12>>2]|0;g=Gh(b,0,0,640)|0;h=b+28|0;c[h>>2]=g;j=b+32|0;c[j>>2]=40;k=0;l=g;do{c[l+(k<<4)+8>>2]=0;k=k+1|0;l=c[h>>2]|0}while((k|0)<40);k=b+8|0;c[b+24>>2]=l+((c[j>>2]|0)-5<<4);j=b+72|0;c[b+80>>2]=0;c[b+84>>2]=0;a[b+90|0]=0;c[j>>2]=l;c[k>>2]=l+16;c[l+8>>2]=0;c[b+76>>2]=(c[k>>2]|0)+320;c[b+16>>2]=j;j=Aj(b)|0;c[f+40>>2]=j;c[f+48>>2]=69;vj(b,j,2,0);k=e;c[k>>2]=b;l=e+8|0;c[l>>2]=72;xj(b,j,1,e);c[k>>2]=Aj(b)|0;c[l>>2]=69;xj(b,j,2,e);Xi(b,32);Sj(b);rm(b);e=Yi(b,5912,17)|0;c[f+180>>2]=e;b=e+5|0;a[b]=a[b]|32;a[f+63|0]=1;i=d;return}function Si(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+12|0;d=c[b>>2]|0;e=a+28|0;ag(a,c[e>>2]|0);ng(a);f=c[b>>2]|0;Gh(a,c[f+24>>2]|0,c[f+32>>2]<<2,0)|0;f=d+144|0;b=d+152|0;c[f>>2]=Gh(a,c[f>>2]|0,c[b>>2]|0,0)|0;c[b>>2]=0;b=c[e>>2]|0;if((b|0)==0){g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=Ec[h&15](j,k,400,0)|0;return}c[a+16>>2]=a+72;f=a+84|0;m=c[f>>2]|0;c[f>>2]=0;if((m|0)==0){n=b}else{b=m;while(1){m=c[b+12>>2]|0;Gh(a,b,40,0)|0;if((m|0)==0){break}else{b=m}}n=c[e>>2]|0}Gh(a,n,c[a+32>>2]<<4,0)|0;g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=Ec[h&15](j,k,400,0)|0;return}function Ti(a){a=a|0;Si(c[(c[a+12>>2]|0)+172>>2]|0);return}function Ui(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+12>>2]|0;if((a|0)==(b|0)){e=1;return e|0}if((d|0)!=(c[b+12>>2]|0)){e=0;return e|0}e=(Zm(a+16|0,b+16|0,d|0)|0)==0|0;return e|0}function Vi(b,d){b=b|0;d=d|0;var e=0,f=0;e=a[b+4|0]|0;if(e<<24>>24!=(a[d+4|0]|0)){f=0;return f|0}if(e<<24>>24==4){f=(b|0)==(d|0)|0;return f|0}e=c[b+12>>2]|0;if((b|0)==(d|0)){f=1;return f|0}if((e|0)!=(c[d+12>>2]|0)){f=0;return f|0}f=(Zm(b+16|0,d+16|0,e|0)|0)==0|0;return f|0}function Wi(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0;e=c^b;c=(b>>>5)+1|0;if(c>>>0>b>>>0){f=e;return f|0}else{g=b;h=e}while(1){e=(h<<5)+(h>>>2)+(d[a+(g-1)|0]|0)^h;b=g-c|0;if(b>>>0<c>>>0){f=e;break}else{g=b;h=e}}return f|0}function Xi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+12>>2]|0;f=e+24|0;mg(b,-5);g=e+32|0;e=c[g>>2]|0;do{if((e|0)<(d|0)){if((d+1|0)>>>0>1073741823>>>0){Fh(b)}h=f|0;i=Gh(b,c[h>>2]|0,e<<2,d<<2)|0;c[h>>2]=i;j=c[g>>2]|0;if((j|0)<(d|0)){k=j;l=i}else{m=j;break}while(1){c[l+(k<<2)>>2]=0;j=k+1|0;if((j|0)>=(d|0)){break}k=j;l=c[h>>2]|0}m=c[g>>2]|0}else{m=e}}while(0);if((m|0)>0){e=f|0;l=d-1|0;k=0;while(1){h=(c[e>>2]|0)+(k<<2)|0;j=c[h>>2]|0;c[h>>2]=0;if((j|0)!=0){h=j;while(1){j=h|0;i=c[j>>2]|0;n=c[h+8>>2]&l;c[j>>2]=c[(c[e>>2]|0)+(n<<2)>>2];c[(c[e>>2]|0)+(n<<2)>>2]=h;n=h+5|0;a[n]=a[n]&-65;if((i|0)==0){break}else{h=i}}}h=k+1|0;i=c[g>>2]|0;if((h|0)<(i|0)){k=h}else{o=i;break}}}else{o=m}if((o|0)<=(d|0)){c[g>>2]=d;return}if((d+1|0)>>>0>1073741823>>>0){Fh(b)}m=f|0;c[m>>2]=Gh(b,c[m>>2]|0,o<<2,d<<2)|0;c[g>>2]=d;return}function Yi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if(f>>>0>=41>>>0){if((f+1|0)>>>0>4294967277>>>0){Fh(b);return 0}g=c[(c[b+12>>2]|0)+56>>2]|0;h=jg(b,20,f+17|0,0,0)|0;c[h+12>>2]=f;c[h+8>>2]=g;a[h+6|0]=0;g=h+16|0;Vm(g|0,e|0,f)|0;a[g+f|0]=0;i=h;return i|0}h=c[b+12>>2]|0;g=c[h+56>>2]^f;j=(f>>>5)+1|0;if(j>>>0>f>>>0){k=g}else{l=f;m=g;while(1){g=(m<<5)+(m>>>2)+(d[e+(l-1)|0]|0)^m;n=l-j|0;if(n>>>0<j>>>0){k=g;break}else{l=n;m=g}}}m=h+32|0;l=c[m>>2]|0;j=h+24|0;g=c[j>>2]|0;n=c[g+((l-1&k)<<2)>>2]|0;a:do{if((n|0)!=0){o=n;b:while(1){p=o;do{if((k|0)==(c[o+8>>2]|0)){if((c[o+12>>2]|0)!=(f|0)){break}if((Zm(e|0,o+16|0,f|0)|0)==0){break b}}}while(0);q=c[o>>2]|0;if((q|0)==0){break a}else{o=q}}q=o+5|0;r=(d[q]|0)^3;if((((d[h+60|0]|0)^3)&r|0)!=0){i=p;return i|0}a[q]=r;i=p;return i|0}}while(0);p=h+28|0;if((c[p>>2]|0)>>>0>=l>>>0&(l|0)<1073741823){Xi(b,l<<1);s=c[m>>2]|0;t=c[j>>2]|0}else{s=l;t=g}g=jg(b,4,f+17|0,t+((s-1&k)<<2)|0,0)|0;c[g+12>>2]=f;c[g+8>>2]=k;a[g+6|0]=0;k=g+16|0;Vm(k|0,e|0,f)|0;a[k+f|0]=0;c[p>>2]=(c[p>>2]|0)+1;i=g;return i|0}function Zi(a,b){a=a|0;b=b|0;return Yi(a,b,Um(b|0)|0)|0}function _i(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if(b>>>0>4294967269>>>0){Fh(a);return 0}else{e=jg(a,7,b+24|0,0,0)|0;c[e+16>>2]=b;c[e+8>>2]=0;c[e+12>>2]=d;return e|0}return 0}function $i(a){a=a|0;Sd(a,0,14);ff(a,184,0);Sd(a,0,1);Fd(a,12104,0)|0;kd(a,-2);_d(a,-2)|0;fd(a,-2);kd(a,-2);Xd(a,-2,10776);fd(a,-2);return 1}function aj(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+8|0;e=b|0;f=Ee(a,1,e)|0;g=Me(a,2,1)|0;h=c[e>>2]|0;do{if((g|0)>-1){j=g}else{if(h>>>0<(-g|0)>>>0){j=0;break}j=g+1+h|0}}while(0);h=Me(a,3,j)|0;g=c[e>>2]|0;do{if((h|0)>-1){k=h}else{if(g>>>0<(-h|0)>>>0){k=0;break}k=h+1+g|0}}while(0);h=(j|0)==0?1:j;j=k>>>0>g>>>0?g:k;if(h>>>0>j>>>0){l=0;i=b;return l|0}k=j-h+1|0;if((j|0)==-1){j=te(a,5208,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;l=j;i=b;return l|0}Fe(a,k,5208);if((k|0)<=0){l=k;i=b;return l|0}j=h-1|0;h=0;while(1){Dd(a,d[f+(j+h)|0]|0);g=h+1|0;if((g|0)<(k|0)){h=g}else{l=k;break}}i=b;return l|0}function bj(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=i;i=i+1040|0;d=c|0;e=ed(b)|0;f=Ue(b,d,e)|0;if((e|0)<1){Re(d,e);i=c;return 1}else{g=1}do{h=Ke(b,g)|0;if((h&255|0)!=(h|0)){se(b,g,5432)|0}a[f+(g-1)|0]=h;g=g+1|0;}while((g|0)<=(e|0));Re(d,e);i=c;return 1}function cj(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+1040|0;d=b|0;Ge(a,1,6);fd(a,1);Te(a,d);if((fe(a,6,d)|0)==0){Qe(d);e=1;i=b;return e|0}else{d=te(a,5600,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function dj(a){a=a|0;return oj(a,1)|0}function ej(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0.0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+1104|0;f=e|0;g=e+24|0;j=e+32|0;k=e+1072|0;l=e+1096|0;m=ed(b)|0;n=Ee(b,1,g)|0;o=c[g>>2]|0;g=n+o|0;Te(b,j);a:do{if((o|0)>0){p=j+8|0;q=j+4|0;r=j|0;s=k|0;t=k+1|0;u=e+8|0;v=n;w=1;b:while(1){x=v;while(1){z=a[x]|0;if(z<<24>>24==37){A=x+1|0;if((a[A]|0)!=37){break}B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){C=37;D=B}else{Ne(j,1)|0;C=a[A]|0;D=c[p>>2]|0}c[p>>2]=D+1;a[(c[r>>2]|0)+D|0]=C;E=x+2|0}else{B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){F=z;G=B}else{Ne(j,1)|0;F=a[x]|0;G=c[p>>2]|0}c[p>>2]=G+1;a[(c[r>>2]|0)+G|0]=F;E=x+1|0}if(E>>>0<g>>>0){x=E}else{break a}}x=Ne(j,512)|0;w=w+1|0;if((w|0)>(m|0)){se(b,w,7144)|0;H=A}else{H=A}while(1){B=a[H]|0;if(B<<24>>24==0){I=0;break}if((Na(6032,B<<24>>24|0,6)|0)==0){I=B;break}else{H=H+1|0}}B=A;if((H-B|0)>>>0>5>>>0){te(b,5880,(J=i,i=i+1|0,i=i+7&-8,c[J>>2]=0,J)|0)|0;i=J;K=a[H]|0}else{K=I}z=((K&255)-48|0)>>>0<10>>>0?H+1|0:H;L=((d[z]|0)-48|0)>>>0<10>>>0?z+1|0:z;z=a[L]|0;do{if(z<<24>>24==46){M=L+1|0;N=((d[M]|0)-48|0)>>>0<10>>>0?L+2|0:M;M=a[N]|0;if(((M&255)-48|0)>>>0>=10>>>0){O=N;P=M;break}M=N+1|0;O=M;P=a[M]|0}else{O=L;P=z}}while(0);if(((P&255)-48|0)>>>0<10>>>0){te(b,5752,(J=i,i=i+1|0,i=i+7&-8,c[J>>2]=0,J)|0)|0;i=J}a[s]=37;z=O-B|0;Vm(t|0,A|0,z+1|0)|0;a[k+(z+2)|0]=0;v=O+1|0;Q=a[O]|0;c:do{switch(Q|0){case 99:{z=Ke(b,w)|0;L=cb(x|0,s|0,(J=i,i=i+8|0,c[J>>2]=z,J)|0)|0;i=J;R=L;break};case 100:case 105:{S=+Ie(b,w);L=~~S;T=S- +(L|0);if(!(T>-1.0&T<1.0)){se(b,w,6968)|0}z=Um(s|0)|0;M=k+(z-1)|0;N=a[M]|0;U=M;y=108;a[U]=y;y=y>>8;a[U+1|0]=y;a[k+z|0]=N;a[k+(z+1)|0]=0;z=cb(x|0,s|0,(J=i,i=i+8|0,c[J>>2]=L,J)|0)|0;i=J;R=z;break};case 101:case 69:case 102:case 103:case 71:{a[k+(Um(s|0)|0)|0]=0;T=+Ie(b,w);z=cb(x|0,s|0,(J=i,i=i+8|0,h[J>>3]=T,J)|0)|0;i=J;R=z;break};case 113:{z=Ee(b,w,f)|0;L=c[p>>2]|0;if(L>>>0<(c[q>>2]|0)>>>0){V=L}else{Ne(j,1)|0;V=c[p>>2]|0}c[p>>2]=V+1;a[(c[r>>2]|0)+V|0]=34;L=c[f>>2]|0;c[f>>2]=L-1;if((L|0)!=0){L=z;while(1){z=a[L]|0;do{if((z<<24>>24|0)==34|(z<<24>>24|0)==92|(z<<24>>24|0)==10){N=c[p>>2]|0;if(N>>>0<(c[q>>2]|0)>>>0){W=N}else{Ne(j,1)|0;W=c[p>>2]|0}c[p>>2]=W+1;a[(c[r>>2]|0)+W|0]=92;N=c[p>>2]|0;if(N>>>0<(c[q>>2]|0)>>>0){X=N}else{Ne(j,1)|0;X=c[p>>2]|0}N=a[L]|0;c[p>>2]=X+1;a[(c[r>>2]|0)+X|0]=N}else if((z<<24>>24|0)==0){Y=0;Z=44}else{if((vc(z&255|0)|0)!=0){Y=d[L]|0;Z=44;break}N=c[p>>2]|0;if(N>>>0<(c[q>>2]|0)>>>0){_=N}else{Ne(j,1)|0;_=c[p>>2]|0}N=a[L]|0;c[p>>2]=_+1;a[(c[r>>2]|0)+_|0]=N}}while(0);if((Z|0)==44){Z=0;if(((d[L+1|0]|0)-48|0)>>>0<10>>>0){cb(u|0,6160,(J=i,i=i+8|0,c[J>>2]=Y,J)|0)|0;i=J}else{cb(u|0,6248,(J=i,i=i+8|0,c[J>>2]=Y,J)|0)|0;i=J}Pe(j,u)}z=c[f>>2]|0;c[f>>2]=z-1;if((z|0)==0){break}else{L=L+1|0}}}L=c[p>>2]|0;if(L>>>0<(c[q>>2]|0)>>>0){$=L}else{Ne(j,1)|0;$=c[p>>2]|0}c[p>>2]=$+1;a[(c[r>>2]|0)+$|0]=34;R=0;break};case 111:case 117:case 120:case 88:{T=+Ie(b,w);L=~~T;S=T- +(L>>>0>>>0);if(!(S>-1.0&S<1.0)){se(b,w,6616)|0}z=Um(s|0)|0;N=k+(z-1)|0;U=a[N]|0;M=N;y=108;a[M]=y;y=y>>8;a[M+1|0]=y;a[k+z|0]=U;a[k+(z+1)|0]=0;z=cb(x|0,s|0,(J=i,i=i+8|0,c[J>>2]=L,J)|0)|0;i=J;R=z;break};case 115:{z=bf(b,w,l)|0;do{if((Wa(s|0,46)|0)==0){if((c[l>>2]|0)>>>0<=99>>>0){break}Se(j);R=0;break c}}while(0);L=cb(x|0,s|0,(J=i,i=i+8|0,c[J>>2]=z,J)|0)|0;i=J;fd(b,-2);R=L;break};default:{break b}}}while(0);c[p>>2]=(c[p>>2]|0)+R;if(v>>>0>=g>>>0){break a}}v=te(b,6464,(J=i,i=i+8|0,c[J>>2]=Q,J)|0)|0;i=J;aa=v;i=e;return aa|0}}while(0);Qe(j);aa=1;i=e;return aa|0}function fj(a){a=a|0;Ee(a,1,0)|0;Ee(a,2,0)|0;fd(a,2);Dd(a,0);Jd(a,176,3);return 1}function gj(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;d=i;i=i+1344|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+304|0;k=Ee(b,1,f)|0;l=Ee(b,2,g)|0;m=ld(b,3)|0;n=Me(b,4,(c[f>>2]|0)+1|0)|0;o=(a[l]|0)==94;if(!((m-3|0)>>>0<2>>>0|(m|0)==6|(m|0)==5)){se(b,3,7648)|0}Te(b,j);if(o){p=(c[g>>2]|0)-1|0;c[g>>2]=p;q=l+1|0;r=p}else{q=l;r=c[g>>2]|0}g=h+16|0;c[g>>2]=b;c[h>>2]=200;l=h+4|0;c[l>>2]=k;p=h+8|0;c[p>>2]=k+(c[f>>2]|0);c[h+12>>2]=q+r;r=h+20|0;f=j+8|0;s=j+4|0;t=j|0;u=h+28|0;v=h+24|0;w=k;k=0;while(1){if(k>>>0>=n>>>0){x=w;y=k;z=48;break}c[r>>2]=0;A=pj(h,w,q)|0;if((A|0)==0){B=k;z=43}else{C=k+1|0;D=c[g>>2]|0;do{if((m|0)==6){kd(D,3);E=c[r>>2]|0;F=(E|0)!=0|(w|0)==0?E:1;Fe(c[g>>2]|0,F,10032);if((F|0)>0){E=0;do{qj(h,E,w,A);E=E+1|0;}while((E|0)<(F|0))}be(D,F,1,0,0);z=37}else if((m|0)==5){a:do{if((c[r>>2]|0)>0){E=c[u>>2]|0;do{if((E|0)==-1){te(D,9568,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0)|0;i=G;H=c[g>>2]|0;I=c[v>>2]|0}else{J=c[v>>2]|0;if((E|0)!=-2){H=D;I=J;break}Dd(D,J+1-(c[l>>2]|0)|0);break a}}while(0);Fd(H,I,E)|0}else{Fd(D,w,A-w|0)|0}}while(0);Od(D,3);z=37}else{F=wd(D,3,e)|0;if((c[e>>2]|0)==0){break}J=A-w|0;K=0;do{L=F+K|0;M=a[L]|0;do{if(M<<24>>24==37){N=K+1|0;O=F+N|0;P=a[O]|0;Q=P<<24>>24;if(((P&255)-48|0)>>>0<10>>>0){if(P<<24>>24==48){Oe(j,w,J);R=N;break}else{qj(h,Q-49|0,w,A);Se(j);R=N;break}}if(P<<24>>24!=37){te(c[g>>2]|0,7320,(G=i,i=i+8|0,c[G>>2]=37,G)|0)|0;i=G}P=c[f>>2]|0;if(P>>>0<(c[s>>2]|0)>>>0){S=P}else{Ne(j,1)|0;S=c[f>>2]|0}P=a[O]|0;c[f>>2]=S+1;a[(c[t>>2]|0)+S|0]=P;R=N}else{N=c[f>>2]|0;if(N>>>0<(c[s>>2]|0)>>>0){T=M;U=N}else{Ne(j,1)|0;T=a[L]|0;U=c[f>>2]|0}c[f>>2]=U+1;a[(c[t>>2]|0)+U|0]=T;R=K}}while(0);K=R+1|0;}while(K>>>0<(c[e>>2]|0)>>>0)}}while(0);if((z|0)==37){z=0;do{if((vd(D,-1)|0)==0){fd(D,-2);Fd(D,w,A-w|0)|0}else{if((pd(D,-1)|0)!=0){break}K=md(D,ld(D,-1)|0)|0;te(D,7488,(G=i,i=i+8|0,c[G>>2]=K,G)|0)|0;i=G}}while(0);Se(j)}if(A>>>0>w>>>0){V=A;W=C}else{B=C;z=43}}if((z|0)==43){z=0;if(w>>>0>=(c[p>>2]|0)>>>0){x=w;y=B;z=48;break}D=c[f>>2]|0;if(D>>>0<(c[s>>2]|0)>>>0){X=D}else{Ne(j,1)|0;X=c[f>>2]|0}D=a[w]|0;c[f>>2]=X+1;a[(c[t>>2]|0)+X|0]=D;V=w+1|0;W=B}if(o){x=V;y=W;z=48;break}else{w=V;k=W}}if((z|0)==48){Oe(j,x,(c[p>>2]|0)-x|0);Qe(j);Dd(b,y);i=d;return 2}return 0}function hj(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;Ee(a,1,d)|0;Dd(a,c[d>>2]|0);i=b;return 1}function ij(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=Ee(b,1,f)|0;j=Ue(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;Re(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=_m(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}Re(g,k);i=e;return 1}function jj(a){a=a|0;return oj(a,0)|0}function kj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;i=i+1056|0;d=b|0;e=b+8|0;f=b+16|0;g=Ee(a,1,d)|0;h=Ke(a,2)|0;j=De(a,3,12104,e)|0;if((h|0)<1){Fd(a,12104,0)|0;k=1;i=b;return k|0}l=c[d>>2]|0;m=c[e>>2]|0;n=ib(l|0,m|0)|0;do{if(!G){if(n>>>0>=(2147483647/(h>>>0)|0)>>>0){break}o=(ca(m,h-1|0)|0)+(ca(l,h)|0)|0;p=Ue(a,f,o)|0;Vm(p|0,g|0,c[d>>2]|0)|0;if((h|0)>1){q=p;p=h;while(1){r=p-1|0;s=c[d>>2]|0;t=q+s|0;u=c[e>>2]|0;if((u|0)==0){v=t;w=s}else{Vm(t|0,j|0,u)|0;v=q+((c[e>>2]|0)+s)|0;w=c[d>>2]|0}Vm(v|0,g|0,w)|0;if((r|0)>1){q=v;p=r}else{break}}}Re(f,o);k=1;i=b;return k|0}}while(0);f=te(a,10264,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;k=f;i=b;return k|0}function lj(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+1048|0;e=d|0;f=d+8|0;g=Ee(b,1,e)|0;h=Ue(b,f,c[e>>2]|0)|0;b=c[e>>2]|0;if((b|0)==0){j=0;Re(f,j);i=d;return 1}else{k=0;l=b}while(1){a[h+k|0]=a[g+(l+~k)|0]|0;b=k+1|0;m=c[e>>2]|0;if(b>>>0<m>>>0){k=b;l=m}else{j=m;break}}Re(f,j);i=d;return 1}function mj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=Ee(a,1,d)|0;f=Ke(a,2)|0;g=c[d>>2]|0;do{if((f|0)>-1){h=f}else{if(g>>>0<(-f|0)>>>0){h=0;break}h=f+1+g|0}}while(0);g=Me(a,3,-1)|0;f=c[d>>2]|0;do{if((g|0)>-1){j=g}else{if(f>>>0<(-g|0)>>>0){j=0;break}j=g+1+f|0}}while(0);g=(h|0)==0?1:h;h=j>>>0>f>>>0?f:j;if(g>>>0>h>>>0){Fd(a,12104,0)|0;i=b;return 1}else{Fd(a,e+(g-1)|0,1-g+h|0)|0;i=b;return 1}return 0}function nj(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=Ee(b,1,f)|0;j=Ue(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;Re(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=wb(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}Re(g,k);i=e;return 1}function oj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+296|0;f=e|0;g=e+8|0;h=e+16|0;j=Ee(b,1,f)|0;k=Ee(b,2,g)|0;l=Me(b,3,1)|0;m=c[f>>2]|0;do{if((l|0)>-1){n=l;o=4}else{if(m>>>0<(-l|0)>>>0){p=1;break}n=l+1+m|0;o=4}}while(0);do{if((o|0)==4){if((n|0)==0){p=1;break}if(n>>>0<=(m+1|0)>>>0){p=n;break}Bd(b);q=1;i=e;return q|0}}while(0);n=(d|0)!=0;a:do{if(n){d=(vd(b,4)|0)==0;m=c[g>>2]|0;if(d){d=0;do{l=k+d|0;if((nc(l|0,7832)|0)!=0){o=20;break a}d=d+1+(Um(l|0)|0)|0;}while(d>>>0<=m>>>0)}d=j+(p-1)|0;l=(c[f>>2]|0)-p+1|0;b:do{if((m|0)==0){if((d|0)==0){break a}else{r=d}}else{if(m>>>0>l>>>0){break a}s=m-1|0;if((s|0)==(l|0)){break a}t=a[k]|0;u=k+1|0;v=d;w=l-s|0;while(1){x=Na(v|0,t|0,w|0)|0;if((x|0)==0){break a}y=x+1|0;if((Zm(y|0,u|0,s|0)|0)==0){r=x;break b}x=y;z=v+w|0;if((z|0)==(x|0)){break a}else{v=y;w=z-x|0}}}}while(0);l=r-j|0;Dd(b,l+1|0);Dd(b,l+(c[g>>2]|0)|0);q=2;i=e;return q|0}else{o=20}}while(0);c:do{if((o|0)==20){r=j+(p-1)|0;l=(a[k]|0)==94;if(l){d=(c[g>>2]|0)-1|0;c[g>>2]=d;A=k+1|0;B=d}else{A=k;B=c[g>>2]|0}d=h+16|0;c[d>>2]=b;c[h>>2]=200;c[h+4>>2]=j;m=h+8|0;c[m>>2]=j+(c[f>>2]|0);c[h+12>>2]=A+B;w=h+20|0;d:do{if(l){c[w>>2]=0;v=pj(h,r,A)|0;if((v|0)==0){break c}else{C=r;D=v}}else{v=r;while(1){c[w>>2]=0;s=pj(h,v,A)|0;if((s|0)!=0){C=v;D=s;break d}if(v>>>0>=(c[m>>2]|0)>>>0){break c}v=v+1|0}}}while(0);if(n){m=j;Dd(b,1-m+C|0);Dd(b,D-m|0);m=c[w>>2]|0;Fe(c[d>>2]|0,m,10032);if((m|0)>0){r=0;do{qj(h,r,0,0);r=r+1|0;}while((r|0)<(m|0))}q=m+2|0;i=e;return q|0}else{r=c[w>>2]|0;l=(r|0)!=0|(C|0)==0?r:1;Fe(c[d>>2]|0,l,10032);if((l|0)>0){E=0}else{q=l;i=e;return q|0}while(1){qj(h,E,C,D);r=E+1|0;if((r|0)<(l|0)){E=r}else{q=l;break}}i=e;return q|0}}}while(0);Bd(b);q=1;i=e;return q|0}function pj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0;g=i;h=b|0;j=c[h>>2]|0;c[h>>2]=j-1;if((j|0)==0){te(c[b+16>>2]|0,9352,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}j=b+12|0;l=c[j>>2]|0;a:do{if((l|0)==(f|0)){m=e}else{n=b+8|0;o=b+16|0;p=b+4|0;q=b+20|0;r=f;s=e;t=l;b:while(1){u=s+1|0;v=s-1|0;w=r;x=t;c:while(1){y=a[w]|0;z=y<<24>>24;d:do{if((z|0)==40){A=7;break b}else if((z|0)==41){A=16;break b}else if((z|0)==36){B=w+1|0;if((B|0)==(x|0)){A=23;break b}else{C=B;D=B;A=90}}else if((z|0)==37){B=w+1|0;E=a[B]|0;switch(E<<24>>24|0){case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{A=70;break c;break};case 98:{A=25;break c;break};case 102:{break};default:{if((B|0)==(x|0)){te(c[o>>2]|0,8736,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}C=w+2|0;D=B;A=90;break d}}B=w+2|0;do{if((a[B]|0)==91){F=w+3|0;A=41}else{te(c[o>>2]|0,9112,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;G=a[B]|0;H=w+3|0;if((G|0)==91){F=H;A=41;break}else if((G|0)!=37){I=H;J=H;break}if((H|0)==(c[j>>2]|0)){te(c[o>>2]|0,8736,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}I=w+4|0;J=H}}while(0);if((A|0)==41){A=0;H=(a[F]|0)==94?w+4|0:F;while(1){if((H|0)==(c[j>>2]|0)){te(c[o>>2]|0,8488,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}G=H+1|0;if((a[H]|0)==37){K=G>>>0<(c[j>>2]|0)>>>0?H+2|0:G}else{K=G}if((a[K]|0)==93){break}else{H=K}}I=K+1|0;J=F}if((s|0)==(c[p>>2]|0)){L=0}else{L=d[v]|0}H=I-1|0;G=(a[J]|0)==94;M=G?J:B;N=G&1;G=N^1;O=M+1|0;e:do{if(O>>>0<H>>>0){P=M;Q=O;while(1){R=a[Q]|0;S=P+2|0;T=a[S]|0;f:do{if(R<<24>>24==37){if((rj(L,T&255)|0)==0){U=S}else{V=G;break e}}else{do{if(T<<24>>24==45){W=P+3|0;if(W>>>0>=H>>>0){break}if((R&255)>>>0>L>>>0){U=W;break f}if((d[W]|0)>>>0<L>>>0){U=W;break f}else{V=G;break e}}}while(0);if((R&255|0)==(L|0)){V=G;break e}else{U=Q}}}while(0);R=U+1|0;if(R>>>0<H>>>0){P=U;Q=R}else{V=N;break}}}else{V=N}}while(0);if((V|0)!=0){m=0;break a}N=a[s]|0;G=N&255;O=(a[J]|0)==94;M=O?J:B;Q=O&1;O=Q^1;P=M+1|0;g:do{if(P>>>0<H>>>0){R=M;T=P;while(1){S=a[T]|0;W=R+2|0;X=a[W]|0;h:do{if(S<<24>>24==37){if((rj(G,X&255)|0)==0){Y=W}else{Z=O;break g}}else{do{if(X<<24>>24==45){_=R+3|0;if(_>>>0>=H>>>0){break}if((S&255)>>>0>(N&255)>>>0){Y=_;break h}if((d[_]|0)>>>0<(N&255)>>>0){Y=_;break h}else{Z=O;break g}}}while(0);if(S<<24>>24==N<<24>>24){Z=O;break g}else{Y=T}}}while(0);S=Y+1|0;if(S>>>0<H>>>0){R=Y;T=S}else{Z=Q;break}}}else{Z=Q}}while(0);if((Z|0)==0){m=0;break a}else{$=I}}else{Q=w+1|0;if(y<<24>>24!=91){C=Q;D=Q;A=90;break}H=(a[Q]|0)==94?w+2|0:Q;O=x;while(1){if((H|0)==(O|0)){te(c[o>>2]|0,8488,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}N=H+1|0;if((a[H]|0)==37){aa=N>>>0<(c[j>>2]|0)>>>0?H+2|0:N}else{aa=N}if((a[aa]|0)==93){break}H=aa;O=c[j>>2]|0}C=aa+1|0;D=Q;A=90}}while(0);i:do{if((A|0)==90){A=0;do{if((c[n>>2]|0)>>>0>s>>>0){y=a[s]|0;z=y&255;O=a[w]|0;H=O<<24>>24;j:do{if((H|0)==46){ba=a[C]|0}else if((H|0)==37){ca=rj(z,d[D]|0)|0;A=105}else if((H|0)==91){N=C-1|0;G=(a[D]|0)==94;P=G?D:w;M=G&1;G=M^1;B=P+1|0;if(B>>>0<N>>>0){da=P;ea=B}else{ca=M;A=105;break}while(1){B=a[ea]|0;P=da+2|0;T=a[P]|0;k:do{if(B<<24>>24==37){if((rj(z,T&255)|0)==0){fa=P}else{ca=G;A=105;break j}}else{do{if(T<<24>>24==45){R=da+3|0;if(R>>>0>=N>>>0){break}if((B&255)>>>0>(y&255)>>>0){fa=R;break k}if((d[R]|0)>>>0<(y&255)>>>0){fa=R;break k}else{ca=G;A=105;break j}}}while(0);if(B<<24>>24==y<<24>>24){ca=G;A=105;break j}else{fa=ea}}}while(0);B=fa+1|0;if(B>>>0<N>>>0){da=fa;ea=B}else{ca=M;A=105;break}}}else{ca=O<<24>>24==y<<24>>24|0;A=105}}while(0);if((A|0)==105){A=0;y=a[C]|0;if((ca|0)==0){ga=y;break}else{ba=y}}y=ba<<24>>24;if((y|0)==45){A=110;break b}else if((y|0)==42){A=113;break b}else if((y|0)==43){ha=u;break b}else if((y|0)!=63){ia=u;ja=C;break c}y=C+1|0;O=pj(b,u,y)|0;if((O|0)==0){$=y;break i}else{m=O;break a}}else{ga=a[C]|0}}while(0);if(!((ga<<24>>24|0)==42|(ga<<24>>24|0)==63|(ga<<24>>24|0)==45)){m=0;break a}$=C+1|0}}while(0);Q=c[j>>2]|0;if(($|0)==(Q|0)){m=s;break a}else{w=$;x=Q}}if((A|0)==25){A=0;v=w+2|0;if((x-1|0)>>>0<=v>>>0){te(c[o>>2]|0,8304,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}Q=a[s]|0;if(Q<<24>>24!=(a[v]|0)){m=0;break a}v=a[w+3|0]|0;O=c[n>>2]|0;if(u>>>0<O>>>0){ka=s;la=1;ma=u}else{m=0;break a}while(1){y=a[ma]|0;if(y<<24>>24==v<<24>>24){z=la-1|0;if((z|0)==0){break}else{na=z}}else{na=(y<<24>>24==Q<<24>>24)+la|0}y=ma+1|0;if(y>>>0<O>>>0){ka=ma;la=na;ma=y}else{m=0;break a}}O=ka+2|0;if((O|0)==0){m=0;break a}ia=O;ja=w+4|0}else if((A|0)==70){A=0;O=E&255;Q=O-49|0;do{if((Q|0)<0){A=73}else{if((Q|0)>=(c[q>>2]|0)){A=73;break}v=c[b+24+(Q<<3)+4>>2]|0;if((v|0)==-1){A=73}else{oa=Q;pa=v}}}while(0);if((A|0)==73){A=0;Q=te(c[o>>2]|0,8944,(k=i,i=i+8|0,c[k>>2]=O-48,k)|0)|0;i=k;oa=Q;pa=c[b+24+(Q<<3)+4>>2]|0}if(((c[n>>2]|0)-s|0)>>>0<pa>>>0){m=0;break a}if((Zm(c[b+24+(oa<<3)>>2]|0,s|0,pa|0)|0)!=0){m=0;break a}Q=s+pa|0;if((Q|0)==0){m=0;break a}ia=Q;ja=w+2|0}Q=c[j>>2]|0;if((ja|0)==(Q|0)){m=ia;break a}else{r=ja;s=ia;t=Q}}if((A|0)==7){t=w+1|0;if((a[t]|0)==41){r=c[q>>2]|0;if((r|0)>31){te(c[o>>2]|0,10032,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-2;c[q>>2]=r+1;r=pj(b,s,w+2|0)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}else{r=c[q>>2]|0;if((r|0)>31){te(c[o>>2]|0,10032,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-1;c[q>>2]=r+1;r=pj(b,s,t)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}}else if((A|0)==16){r=w+1|0;t=c[q>>2]|0;while(1){p=t-1|0;if((t|0)<=0){A=19;break}if((c[b+24+(p<<3)+4>>2]|0)==-1){qa=p;break}else{t=p}}if((A|0)==19){t=te(c[o>>2]|0,8072,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;qa=t}t=b+24+(qa<<3)+4|0;c[t>>2]=s-(c[b+24+(qa<<3)>>2]|0);q=pj(b,s,r)|0;if((q|0)!=0){m=q;break}c[t>>2]=-1;m=0;break}else if((A|0)==23){m=(s|0)==(c[n>>2]|0)?s:0;break}else if((A|0)==110){t=C+1|0;q=pj(b,s,t)|0;if((q|0)!=0){m=q;break}q=C-1|0;p=s;while(1){if((c[n>>2]|0)>>>0<=p>>>0){m=0;break a}Q=a[p]|0;v=Q&255;u=a[w]|0;x=u<<24>>24;l:do{if((x|0)==37){ra=rj(v,d[D]|0)|0;A=147}else if((x|0)==91){y=(a[D]|0)==94;z=y?D:w;H=y&1;y=H^1;M=z+1|0;if(M>>>0<q>>>0){sa=z;ta=M}else{ra=H;A=147;break}while(1){M=a[ta]|0;z=sa+2|0;N=a[z]|0;m:do{if(M<<24>>24==37){if((rj(v,N&255)|0)==0){ua=z}else{ra=y;A=147;break l}}else{do{if(N<<24>>24==45){G=sa+3|0;if(G>>>0>=q>>>0){break}if((M&255)>>>0>(Q&255)>>>0){ua=G;break m}if((d[G]|0)>>>0<(Q&255)>>>0){ua=G;break m}else{ra=y;A=147;break l}}}while(0);if(M<<24>>24==Q<<24>>24){ra=y;A=147;break l}else{ua=ta}}}while(0);M=ua+1|0;if(M>>>0<q>>>0){sa=ua;ta=M}else{ra=H;A=147;break}}}else if((x|0)!=46){ra=u<<24>>24==Q<<24>>24|0;A=147}}while(0);if((A|0)==147){A=0;if((ra|0)==0){m=0;break a}}Q=p+1|0;u=pj(b,Q,t)|0;if((u|0)==0){p=Q}else{m=u;break a}}}else if((A|0)==113){ha=s}p=c[n>>2]|0;n:do{if(p>>>0>ha>>>0){t=C-1|0;q=0;r=ha;o=p;while(1){u=a[r]|0;Q=u&255;x=a[w]|0;v=x<<24>>24;o:do{if((v|0)==37){va=rj(Q,d[D]|0)|0;A=129}else if((v|0)==91){O=(a[D]|0)==94;H=O?D:w;y=O&1;O=y^1;M=H+1|0;if(M>>>0<t>>>0){wa=H;xa=M}else{va=y;A=129;break}while(1){M=a[xa]|0;H=wa+2|0;N=a[H]|0;p:do{if(M<<24>>24==37){if((rj(Q,N&255)|0)==0){ya=H}else{va=O;A=129;break o}}else{do{if(N<<24>>24==45){z=wa+3|0;if(z>>>0>=t>>>0){break}if((M&255)>>>0>(u&255)>>>0){ya=z;break p}if((d[z]|0)>>>0<(u&255)>>>0){ya=z;break p}else{va=O;A=129;break o}}}while(0);if(M<<24>>24==u<<24>>24){va=O;A=129;break o}else{ya=xa}}}while(0);M=ya+1|0;if(M>>>0<t>>>0){wa=ya;xa=M}else{va=y;A=129;break}}}else if((v|0)==46){za=o}else{va=x<<24>>24==u<<24>>24|0;A=129}}while(0);if((A|0)==129){A=0;if((va|0)==0){Aa=q;break n}za=c[n>>2]|0}u=q+1|0;x=ha+u|0;if(za>>>0>x>>>0){q=u;r=x;o=za}else{Aa=u;break}}}else{Aa=0}}while(0);n=C+1|0;p=Aa;while(1){if((p|0)<=-1){m=0;break a}s=pj(b,ha+p|0,n)|0;if((s|0)==0){p=p-1|0}else{m=s;break}}}}while(0);c[h>>2]=(c[h>>2]|0)+1;i=g;return m|0}function qj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;if((c[a+20>>2]|0)<=(b|0)){g=c[a+16>>2]|0;if((b|0)==0){Fd(g,d,e-d|0)|0;i=f;return}else{te(g,9816,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;i=f;return}}g=c[a+24+(b<<3)+4>>2]|0;do{if((g|0)==-1){d=a+16|0;te(c[d>>2]|0,9568,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=c[d>>2]|0;k=c[a+24+(b<<3)>>2]|0}else{d=c[a+16>>2]|0;e=c[a+24+(b<<3)>>2]|0;if((g|0)!=-2){j=d;k=e;break}Dd(d,e+1-(c[a+4>>2]|0)|0);i=f;return}}while(0);Fd(j,k,g)|0;i=f;return}function rj(a,b){a=a|0;b=b|0;var c=0,d=0;switch(_m(b|0)|0){case 99:{c=vc(a|0)|0;break};case 117:{c=rb(a|0)|0;break};case 115:{c=Da(a|0)|0;break};case 120:{c=$a(a|0)|0;break};case 97:{c=Fb(a|0)|0;break};case 122:{c=(a|0)==0|0;break};case 119:{c=Db(a|0)|0;break};case 112:{c=cc(a|0)|0;break};case 103:{c=oc(a|0)|0;break};case 100:{c=(a-48|0)>>>0<10>>>0|0;break};case 108:{c=pb(a|0)|0;break};default:{d=(b|0)==(a|0)|0;return d|0}}if((pb(b|0)|0)!=0){d=c;return d|0}d=(c|0)==0|0;return d|0}function sj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+296|0;d=b|0;e=b+280|0;f=b+288|0;g=wd(a,-1001001,e)|0;h=wd(a,-1001002,f)|0;j=d+16|0;c[j>>2]=a;c[d>>2]=200;c[d+4>>2]=g;k=g+(c[e>>2]|0)|0;e=d+8|0;c[e>>2]=k;c[d+12>>2]=h+(c[f>>2]|0);f=d+20|0;l=g+(td(a,-1001003,0)|0)|0;m=k;while(1){if(l>>>0>m>>>0){n=0;o=7;break}c[f>>2]=0;p=pj(d,l,h)|0;if((p|0)!=0){break}l=l+1|0;m=c[e>>2]|0}if((o|0)==7){i=b;return n|0}Dd(a,p-g+((p|0)==(l|0))|0);id(a,-1001003);a=c[f>>2]|0;f=(a|0)!=0|(l|0)==0?a:1;Fe(c[j>>2]|0,f,10032);if((f|0)>0){q=0}else{n=f;i=b;return n|0}while(1){qj(d,q,l,p);j=q+1|0;if((j|0)<(f|0)){q=j}else{n=f;break}}i=b;return n|0}function tj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Oe(d,b,c);return 0}function uj(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+8|0;g=f|0;j=e+8|0;k=c[j>>2]|0;a:do{if((k|0)==0){l=-1;m=c[b+28>>2]|0}else{do{if((k|0)==3){n=+h[e>>3];h[g>>3]=n+6755399441055744.0;o=c[g>>2]|0;if(+(o|0)!=n){break}if((o|0)<=0){break}p=c[b+28>>2]|0;if((o|0)>(p|0)){break}l=o-1|0;m=p;break a}}while(0);p=e;o=Dj(b,e)|0;b:while(1){q=o+16|0;r=o+24|0;s=c[r>>2]|0;if((s|0)==(c[j>>2]|0)){if((dk(0,q,e)|0)!=0){t=15;break}u=c[r>>2]|0}else{u=s}do{if((u|0)==11){if((c[j>>2]&64|0)==0){break}if((c[q>>2]|0)==(c[p>>2]|0)){t=15;break b}}}while(0);q=c[o+28>>2]|0;if((q|0)==0){t=18;break}else{o=q}}if((t|0)==15){p=c[b+28>>2]|0;l=(o-(c[b+16>>2]|0)>>5)+p|0;m=p;break}else if((t|0)==18){zf(a,6560,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}}}while(0);a=b+12|0;u=l;while(1){v=u+1|0;if((v|0)>=(m|0)){break}if((c[(c[a>>2]|0)+(v<<4)+8>>2]|0)==0){u=v}else{t=21;break}}if((t|0)==21){h[e>>3]=+(u+2|0);c[j>>2]=3;u=c[a>>2]|0;a=u+(v<<4)|0;l=e+16|0;g=c[a+4>>2]|0;c[l>>2]=c[a>>2];c[l+4>>2]=g;c[e+24>>2]=c[u+(v<<4)+8>>2];w=1;i=f;return w|0}u=1<<(d[b+7|0]|0);g=b+16|0;b=v-m|0;while(1){if((b|0)>=(u|0)){w=0;t=26;break}x=c[g>>2]|0;if((c[x+(b<<5)+8>>2]|0)==0){b=b+1|0}else{break}}if((t|0)==26){i=f;return w|0}t=x+(b<<5)+16|0;u=e;m=c[t+4>>2]|0;c[u>>2]=c[t>>2];c[u+4>>2]=m;c[j>>2]=c[x+(b<<5)+24>>2];x=c[g>>2]|0;g=x+(b<<5)|0;j=e+16|0;m=c[g+4>>2]|0;c[j>>2]=c[g>>2];c[j+4>>2]=m;c[e+24>>2]=c[x+(b<<5)+8>>2];w=1;i=f;return w|0}function vj(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=b+28|0;h=c[g>>2]|0;i=d[b+7|0]|0;j=c[b+16>>2]|0;if((h|0)<(e|0)){if((e+1|0)>>>0>268435455>>>0){Fh(a)}k=b+12|0;l=Gh(a,c[k>>2]|0,h<<4,e<<4)|0;c[k>>2]=l;m=c[g>>2]|0;do{if((m|0)<(e|0)){c[l+(m<<4)+8>>2]=0;n=m+1|0;if((n|0)<(e|0)){o=n}else{break}do{c[(c[k>>2]|0)+(o<<4)+8>>2]=0;o=o+1|0;}while((o|0)<(e|0))}}while(0);c[g>>2]=e}wj(a,b,f);do{if((h|0)>(e|0)){c[g>>2]=e;f=b+12|0;o=e;while(1){k=c[f>>2]|0;if((c[k+(o<<4)+8>>2]|0)==0){p=o+1|0}else{m=o+1|0;xj(a,b,m,k+(o<<4)|0);p=m}if((p|0)<(h|0)){o=p}else{break}}if((e+1|0)>>>0>268435455>>>0){Fh(a)}else{o=b+12|0;c[o>>2]=Gh(a,c[o>>2]|0,h<<4,e<<4)|0;break}}}while(0);e=1<<i;if((e|0)>0){i=e;do{i=i-1|0;h=j+(i<<5)+8|0;if((c[h>>2]|0)!=0){p=j+(i<<5)+16|0;g=Gj(b,p)|0;if((g|0)==1224){q=Cj(a,b,p)|0}else{q=g}g=j+(i<<5)|0;p=q;o=c[g+4>>2]|0;c[p>>2]=c[g>>2];c[p+4>>2]=o;c[q+8>>2]=c[h>>2]}}while((i|0)>0)}if((j|0)==1904){return}Gh(a,j,e<<5,0)|0;return}function wj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;do{if((e|0)==0){c[d+16>>2]=1904;g=0;h=0;j=1904}else{k=Yh(e)|0;if((k|0)>30){zf(b,8440,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0);i=l}l=1<<k;if((l+1|0)>>>0>134217727>>>0){Fh(b)}m=Gh(b,0,0,l<<5)|0;n=d+16|0;c[n>>2]=m;o=k&255;if((l|0)>0){p=0;q=m}else{g=l;h=o;j=m;break}while(1){c[q+(p<<5)+28>>2]=0;c[q+(p<<5)+24>>2]=0;c[q+(p<<5)+8>>2]=0;m=p+1|0;k=c[n>>2]|0;if((m|0)<(l|0)){p=m;q=k}else{g=l;h=o;j=k;break}}}}while(0);a[d+7|0]=h;c[d+20>>2]=j+(g<<5);i=f;return}function xj(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0,r=0,s=0.0,t=0;g=i;i=i+24|0;j=g|0;k=g+8|0;l=e-1|0;a:do{if(l>>>0<(c[b+28>>2]|0)>>>0){m=(c[b+12>>2]|0)+(l<<4)|0;n=10}else{o=+(e|0);h[j>>3]=o+1.0;p=(c[j+4>>2]|0)+(c[j>>2]|0)|0;if((p|0)<0){q=-p|0;r=(p|0)==(q|0)?0:q}else{r=p}p=(c[b+16>>2]|0)+(((r|0)%((1<<(d[b+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[p+24>>2]|0)==3){if(+h[p+16>>3]==o){break}}q=c[p+28>>2]|0;if((q|0)==0){s=o;n=12;break a}else{p=q}}m=p|0;n=10}}while(0);do{if((n|0)==10){if((m|0)!=1224){t=m;break}s=+(e|0);n=12}}while(0);if((n|0)==12){h[k>>3]=s;c[k+8>>2]=3;t=Cj(a,b,k)|0}k=f;b=t;a=c[k+4>>2]|0;c[b>>2]=c[k>>2];c[b+4>>2]=a;c[t+8>>2]=c[f+8>>2];i=g;return}function yj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=Gj(b,c)|0;if((d|0)!=1224){e=d;return e|0}e=Cj(a,b,c)|0;return e|0}function zj(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[b+16>>2]|0)==1904){f=0}else{f=1<<(d[b+7|0]|0)}vj(a,b,e,f);return}function Aj(b){b=b|0;var d=0;d=jg(b,5,32,0,0)|0;b=d;c[d+8>>2]=0;a[d+6|0]=-1;c[d+12>>2]=0;c[b+28>>2]=0;c[d+16>>2]=1904;a[b+7|0]=0;c[b+20>>2]=1904;return b|0}function Bj(a,b){a=a|0;b=b|0;var e=0;e=c[b+16>>2]|0;if((e|0)!=1904){Gh(a,e,32<<(d[b+7|0]|0),0)|0}Gh(a,c[b+12>>2]|0,c[b+28>>2]<<4,0)|0;Gh(a,b,32,0)|0;return}function Cj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;g=i;i=i+144|0;j=g|0;k=g+8|0;l=g+16|0;m=l;n=f+8|0;o=c[n>>2]|0;if((o|0)==0){zf(b,4816,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}else if((o|0)==3){q=3}do{if((q|0)==3){r=+h[f>>3];if(r==r&!(F=0.0,F!=F)){break}zf(b,10688,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}}while(0);p=Dj(e,f)|0;o=p+8|0;a:do{if((c[o>>2]|0)!=0|(p|0)==1904){s=e+20|0;t=e+16|0;u=c[t>>2]|0;v=c[s>>2]|0;while(1){if(v>>>0<=u>>>0){break}w=v-32|0;c[s>>2]=w;if((c[v-32+24>>2]|0)==0){q=9;break}else{v=w}}do{if((q|0)==9){if((w|0)==0){break}s=Dj(e,p+16|0)|0;if((s|0)==(p|0)){u=p+28|0;c[v-32+28>>2]=c[u>>2];c[u>>2]=w;x=w;break a}else{y=s}do{z=y+28|0;y=c[z>>2]|0;}while((y|0)!=(p|0));c[z>>2]=w;s=w;u=p;c[s>>2]=c[u>>2];c[s+4>>2]=c[u+4>>2];c[s+8>>2]=c[u+8>>2];c[s+12>>2]=c[u+12>>2];c[s+16>>2]=c[u+16>>2];c[s+20>>2]=c[u+20>>2];c[s+24>>2]=c[u+24>>2];c[s+28>>2]=c[u+28>>2];c[p+28>>2]=0;c[o>>2]=0;x=p;break a}}while(0);Ym(m|0,0,124)|0;v=e+12|0;u=c[e+28>>2]|0;s=0;A=1;B=0;C=1;while(1){if((A|0)>(u|0)){if((C|0)>(u|0)){D=B;break}else{E=u}}else{E=A}if((C|0)>(E|0)){G=C;H=0}else{I=c[v>>2]|0;J=C;K=0;while(1){L=((c[I+(J-1<<4)+8>>2]|0)!=0)+K|0;M=J+1|0;if((M|0)>(E|0)){G=M;H=L;break}else{J=M;K=L}}}K=l+(s<<2)|0;c[K>>2]=(c[K>>2]|0)+H;K=H+B|0;J=s+1|0;if((J|0)<31){s=J;A=A<<1;B=K;C=G}else{D=K;break}}C=k;B=0;A=1<<(d[e+7|0]|0);s=0;b:while(1){v=A;while(1){N=v-1|0;if((v|0)==0){break b}O=c[t>>2]|0;if((c[O+(N<<5)+8>>2]|0)==0){v=N}else{break}}do{if((c[O+(N<<5)+24>>2]|0)==3){r=+h[O+(N<<5)+16>>3];h[k>>3]=r+6755399441055744.0;v=c[C>>2]|0;if(+(v|0)!=r){P=0;break}if((v-1|0)>>>0>=1073741824>>>0){P=0;break}u=l+((Yh(v)|0)<<2)|0;c[u>>2]=(c[u>>2]|0)+1;P=1}else{P=0}}while(0);B=B+1|0;A=N;s=P+s|0}A=s+D|0;do{if((c[n>>2]|0)==3){r=+h[f>>3];h[j>>3]=r+6755399441055744.0;C=c[j>>2]|0;if(+(C|0)!=r){Q=0;break}if((C-1|0)>>>0>=1073741824>>>0){Q=0;break}t=l+((Yh(C)|0)<<2)|0;c[t>>2]=(c[t>>2]|0)+1;Q=1}else{Q=0}}while(0);s=A+Q|0;c:do{if((s|0)>0){t=0;C=1;u=0;v=0;K=0;J=0;while(1){I=c[l+(t<<2)>>2]|0;if((I|0)>0){L=I+u|0;I=(L|0)>(J|0);R=I?C:K;S=I?L:v;T=L}else{R=K;S=v;T=u}if((T|0)==(s|0)){U=R;V=S;break c}L=C<<1;I=(L|0)/2|0;if((I|0)<(s|0)){t=t+1|0;C=L;u=T;v=S;K=R;J=I}else{U=R;V=S;break}}}else{U=0;V=0}}while(0);vj(b,e,U,D+1+B-V|0);s=Gj(e,f)|0;if((s|0)!=1224){W=s;i=g;return W|0}W=Cj(b,e,f)|0;i=g;return W|0}else{x=p}}while(0);p=f;V=x+16|0;D=c[p+4>>2]|0;c[V>>2]=c[p>>2];c[V+4>>2]=D;c[x+24>>2]=c[n>>2];do{if((c[n>>2]&64|0)!=0){if((a[(c[f>>2]|0)+5|0]&3)==0){break}if((a[e+5|0]&4)==0){break}gg(b,e)}}while(0);W=x|0;i=g;return W|0}function Dj(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;switch(c[e+8>>2]&63|0){case 20:{j=e;k=c[j>>2]|0;l=k+6|0;if((a[l]|0)==0){m=k+8|0;c[m>>2]=Wi(k+16|0,c[k+12>>2]|0,c[m>>2]|0)|0;a[l]=1;n=c[j>>2]|0}else{n=k}o=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[n+8>>2])<<5)|0;i=f;return o|0};case 4:{o=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[(c[e>>2]|0)+8>>2])<<5)|0;i=f;return o|0};case 22:{o=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return o|0};case 1:{o=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[e>>2])<<5)|0;i=f;return o|0};case 2:{o=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return o|0};case 3:{h[g>>3]=+h[e>>3]+1.0;n=(c[g+4>>2]|0)+(c[g>>2]|0)|0;if((n|0)<0){g=-n|0;p=(n|0)==(g|0)?0:g}else{p=n}o=(c[b+16>>2]|0)+(((p|0)%((1<<d[b+7|0])-1|1|0)|0)<<5)|0;i=f;return o|0};default:{o=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return o|0}}return 0}function Ej(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0.0,l=0,m=0;e=i;i=i+8|0;f=e|0;g=b-1|0;if(g>>>0<(c[a+28>>2]|0)>>>0){j=(c[a+12>>2]|0)+(g<<4)|0;i=e;return j|0}k=+(b|0);h[f>>3]=k+1.0;b=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((b|0)<0){f=-b|0;l=(b|0)==(f|0)?0:f}else{l=b}b=(c[a+16>>2]|0)+(((l|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[b+24>>2]|0)==3){if(+h[b+16>>3]==k){break}}a=c[b+28>>2]|0;if((a|0)==0){j=1224;m=10;break}else{b=a}}if((m|0)==10){i=e;return j|0}j=b|0;i=e;return j|0}function Fj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[b+8>>2])<<5)|0;while(1){if((c[e+24>>2]|0)==68){if((c[e+16>>2]|0)==(b|0)){break}}a=c[e+28>>2]|0;if((a|0)==0){f=1224;g=6;break}else{e=a}}if((g|0)==6){return f|0}f=e|0;return f|0}function Gj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+16|0;f=e|0;g=e+8|0;j=b+8|0;k=c[j>>2]&63;do{if((k|0)==3){l=+h[b>>3];h[g>>3]=l+6755399441055744.0;m=c[g>>2]|0;n=+(m|0);if(n!=l){break}o=m-1|0;if(o>>>0<(c[a+28>>2]|0)>>>0){p=(c[a+12>>2]|0)+(o<<4)|0;i=e;return p|0}h[f>>3]=n+1.0;o=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((o|0)<0){m=-o|0;q=(o|0)==(m|0)?0:m}else{q=o}o=(c[a+16>>2]|0)+(((q|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[o+24>>2]|0)==3){if(+h[o+16>>3]==n){break}}m=c[o+28>>2]|0;if((m|0)==0){p=1224;r=22;break}else{o=m}}if((r|0)==22){i=e;return p|0}p=o|0;i=e;return p|0}else if((k|0)==4){m=c[b>>2]|0;s=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[m+8>>2])<<5)|0;while(1){if((c[s+24>>2]|0)==68){if((c[s+16>>2]|0)==(m|0)){break}}t=c[s+28>>2]|0;if((t|0)==0){p=1224;r=22;break}else{s=t}}if((r|0)==22){i=e;return p|0}p=s|0;i=e;return p|0}else if((k|0)==0){p=1224;i=e;return p|0}}while(0);k=Dj(a,b)|0;while(1){if((c[k+24>>2]|0)==(c[j>>2]|0)){if((dk(0,k+16|0,b)|0)!=0){break}}a=c[k+28>>2]|0;if((a|0)==0){p=1224;r=22;break}else{k=a}}if((r|0)==22){i=e;return p|0}p=k|0;i=e;return p|0}function Hj(a){a=a|0;var b=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=i;i=i+24|0;e=b|0;f=b+8|0;g=b+16|0;j=a+28|0;k=c[j>>2]|0;do{if((k|0)!=0){l=c[a+12>>2]|0;if((c[l+(k-1<<4)+8>>2]|0)!=0){break}if(k>>>0>1>>>0){m=k;n=0}else{o=0;i=b;return o|0}while(1){p=(n+m|0)>>>1;q=(c[l+(p-1<<4)+8>>2]|0)==0;r=q?p:m;s=q?n:p;if((r-s|0)>>>0>1>>>0){m=r;n=s}else{o=s;break}}i=b;return o|0}}while(0);n=a+16|0;if((c[n>>2]|0)==1904){o=k;i=b;return o|0}m=a+12|0;l=a+7|0;a=g;s=g+4|0;r=k;p=k+1|0;q=k;while(1){k=p-1|0;a:do{if(k>>>0<q>>>0){t=(c[m>>2]|0)+(k<<4)|0}else{u=+(p|0);h[g>>3]=u+1.0;v=(c[s>>2]|0)+(c[a>>2]|0)|0;if((v|0)<0){w=-v|0;x=(v|0)==(w|0)?0:w}else{x=v}v=(c[n>>2]|0)+(((x|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[v+24>>2]|0)==3){if(+h[v+16>>3]==u){break}}w=c[v+28>>2]|0;if((w|0)==0){t=1224;break a}else{v=w}}t=v|0}}while(0);if((c[t+8>>2]|0)==0){break}k=p<<1;if(k>>>0>2147483645>>>0){y=21;break}r=p;p=k;q=c[j>>2]|0}if((y|0)==21){y=e;q=e+4|0;t=1;while(1){x=t-1|0;b:do{if(x>>>0<(c[j>>2]|0)>>>0){z=(c[m>>2]|0)+(x<<4)|0}else{u=+(t|0);h[e>>3]=u+1.0;a=(c[q>>2]|0)+(c[y>>2]|0)|0;if((a|0)<0){s=-a|0;A=(a|0)==(s|0)?0:s}else{A=a}a=(c[n>>2]|0)+(((A|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[a+24>>2]|0)==3){if(+h[a+16>>3]==u){break}}s=c[a+28>>2]|0;if((s|0)==0){z=1224;break b}else{a=s}}z=a|0}}while(0);if((c[z+8>>2]|0)==0){o=x;break}t=t+1|0}i=b;return o|0}if((p-r|0)>>>0<=1>>>0){o=r;i=b;return o|0}t=f;z=f+4|0;A=p;p=r;while(1){r=(A+p|0)>>>1;y=r-1|0;c:do{if(y>>>0<(c[j>>2]|0)>>>0){B=(c[m>>2]|0)+(y<<4)|0}else{u=+(r|0);h[f>>3]=u+1.0;q=(c[z>>2]|0)+(c[t>>2]|0)|0;if((q|0)<0){e=-q|0;C=(q|0)==(e|0)?0:e}else{C=q}q=(c[n>>2]|0)+(((C|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[q+24>>2]|0)==3){if(+h[q+16>>3]==u){break}}e=c[q+28>>2]|0;if((e|0)==0){B=1224;break c}else{q=e}}B=q|0}}while(0);y=(c[B+8>>2]|0)==0;x=y?r:A;a=y?p:r;if((x-a|0)>>>0>1>>>0){A=x;p=a}else{o=a;break}}i=b;return o|0}function Ij(a){a=a|0;Sd(a,0,7);ff(a,24,0);Pd(a,-1,4568);Vd(a,4568);return 1}function Jj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+1048|0;d=b|0;e=b+1040|0;f=De(a,2,12096,e)|0;Ge(a,1,5);g=Me(a,3,1)|0;if((ld(a,4)|0)<1){h=af(a,1)|0}else{h=Ke(a,4)|0}Te(a,d);do{if((g|0)<(h|0)){j=g;do{Rd(a,1,j);if((pd(a,-1)|0)==0){k=md(a,ld(a,-1)|0)|0;te(a,10936,(l=i,i=i+16|0,c[l>>2]=k,c[l+8>>2]=j,l)|0)|0;i=l}Se(d);Oe(d,f,c[e>>2]|0);j=j+1|0;}while((j|0)<(h|0))}else{if((g|0)==(h|0)){break}Qe(d);i=b;return 1}}while(0);Rd(a,1,h);if((pd(a,-1)|0)==0){g=md(a,ld(a,-1)|0)|0;te(a,10936,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=h,l)|0)|0;i=l}Se(d);Qe(d);i=b;return 1}function Kj(a){a=a|0;var b=0.0,c=0.0,d=0.0;Ge(a,1,5);Bd(a);a:do{if((je(a,1)|0)==0){b=0.0}else{c=0.0;while(1){while(1){fd(a,-2);if((ld(a,-1)|0)==3){d=+sd(a,-1,0);if(d>c){break}}if((je(a,1)|0)==0){b=c;break a}}if((je(a,1)|0)==0){b=d;break}else{c=d}}}}while(0);Cd(a,b);return 1}function Lj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;Ge(a,1,5);d=(af(a,1)|0)+1|0;e=ed(a)|0;if((e|0)==2){f=d}else if((e|0)==3){g=2}else{e=te(a,11256,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=e;i=b;return j|0}do{if((g|0)==2){e=Ke(a,2)|0;if((e|0)<1|(e|0)>(d|0)){se(a,2,2608)|0}if((d|0)>(e|0)){k=d}else{f=e;break}while(1){h=k-1|0;Rd(a,1,h);Zd(a,1,k);if((h|0)>(e|0)){k=h}else{f=e;break}}}}while(0);Zd(a,1,f);j=0;i=b;return j|0}function Mj(a){a=a|0;var b=0,c=0;b=ed(a)|0;Sd(a,b,1);Dd(a,b);Xd(a,-2,11536);if((b|0)<=0){return 1}kd(a,1);Zd(a,-2,1);id(a,1);if((b|0)>1){c=b}else{return 1}do{Zd(a,1,c);c=c-1|0;}while((c|0)>1);return 1}function Nj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;Ge(a,1,5);d=Me(a,2,1)|0;if((ld(a,3)|0)<1){e=af(a,1)|0}else{e=Ke(a,3)|0}if((d|0)>(e|0)){f=0;i=b;return f|0}g=e-d|0;h=g+1|0;do{if((g|0)>=0){if((_c(a,h)|0)==0){break}Rd(a,1,d);if((d|0)<(e|0)){j=d}else{f=h;i=b;return f|0}while(1){k=j+1|0;Rd(a,1,k);if((k|0)<(e|0)){j=k}else{f=h;break}}i=b;return f|0}}while(0);h=te(a,11928,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;f=h;i=b;return f|0}function Oj(a){a=a|0;var b=0,c=0,d=0,e=0;Ge(a,1,5);b=af(a,1)|0;c=Me(a,2,b)|0;do{if((c|0)!=(b|0)){if(!((c|0)<1|(c|0)>(b+1|0))){break}se(a,1,2608)|0}}while(0);Rd(a,1,c);if((c|0)<(b|0)){d=c}else{e=c;Bd(a);Zd(a,1,e);return 1}while(1){c=d+1|0;Rd(a,1,c);Zd(a,1,d);if((c|0)<(b|0)){d=c}else{e=b;break}}Bd(a);Zd(a,1,e);return 1}function Pj(a){a=a|0;var b=0;Ge(a,1,5);b=af(a,1)|0;Fe(a,40,12096);if((ld(a,2)|0)>=1){Ge(a,2,6)}fd(a,2);Qj(a,1,b);return 0}function Qj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;if((b|0)<(d|0)){f=b;g=d}else{i=e;return}while(1){Rd(a,1,f);Rd(a,1,g);if((Rj(a,-1,-2)|0)==0){fd(a,-3)}else{Zd(a,1,f);Zd(a,1,g)}d=g-f|0;if((d|0)==1){h=24;break}b=(g+f|0)/2|0;Rd(a,1,b);Rd(a,1,f);do{if((Rj(a,-2,-1)|0)==0){fd(a,-2);Rd(a,1,g);if((Rj(a,-1,-2)|0)==0){fd(a,-3);break}else{Zd(a,1,b);Zd(a,1,g);break}}else{Zd(a,1,b);Zd(a,1,f)}}while(0);if((d|0)==2){h=24;break}Rd(a,1,b);kd(a,-1);j=g-1|0;Rd(a,1,j);Zd(a,1,b);Zd(a,1,j);k=j;l=f;while(1){m=l+1|0;Rd(a,1,m);if((Rj(a,-1,-2)|0)==0){n=l;o=m}else{p=m;while(1){if((p|0)>=(g|0)){te(a,2872,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}fd(a,-2);m=p+1|0;Rd(a,1,m);if((Rj(a,-1,-2)|0)==0){n=p;o=m;break}else{p=m}}}p=k-1|0;Rd(a,1,p);if((Rj(a,-3,-1)|0)==0){r=p}else{m=p;while(1){if((m|0)<=(f|0)){te(a,2872,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}fd(a,-2);p=m-1|0;Rd(a,1,p);if((Rj(a,-3,-1)|0)==0){r=p;break}else{m=p}}}if((r|0)<(o|0)){break}Zd(a,1,o);Zd(a,1,r);k=r;l=o}fd(a,-4);Rd(a,1,j);Rd(a,1,o);Zd(a,1,j);Zd(a,1,o);l=(o-f|0)<(g-o|0);k=n+2|0;b=l?k:f;d=l?g:n;Qj(a,l?f:k,l?n:g);if((b|0)<(d|0)){f=b;g=d}else{h=24;break}}if((h|0)==24){i=e;return}}function Rj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((ld(a,2)|0)==0){d=rd(a,b,c,1)|0;return d|0}else{kd(a,2);kd(a,b-1|0);kd(a,c-2|0);be(a,2,1,0,0);c=vd(a,-1)|0;fd(a,-2);d=c;return d|0}return 0}function Sj(b){b=b|0;var d=0,e=0,f=0;d=b+12|0;e=0;do{f=Zi(b,c[1112+(e<<2)>>2]|0)|0;c[(c[d>>2]|0)+184+(e<<2)>>2]=f;f=(c[(c[d>>2]|0)+184+(e<<2)>>2]|0)+5|0;a[f]=a[f]|32;e=e+1|0;}while((e|0)<17);return}function Tj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=Fj(b,f)|0;if((c[g+8>>2]|0)!=0){h=g;return h|0}g=b+6|0;a[g]=d[g]|0|1<<e;h=0;return h|0}function Uj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=c[b+8>>2]&15;if((e|0)==5){f=c[(c[b>>2]|0)+8>>2]|0}else if((e|0)==7){f=c[(c[b>>2]|0)+8>>2]|0}else{f=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((f|0)==0){g=1224;return g|0}g=Fj(f,c[(c[a+12>>2]|0)+184+(d<<2)>>2]|0)|0;return g|0}function Vj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;h=g|0;j=g+24|0;k=g+48|0;l=a[f]|0;if((l<<24>>24|0)==64|(l<<24>>24|0)==61){c[k+12>>2]=f+1}else if((l<<24>>24|0)==27){c[k+12>>2]=10528}else{c[k+12>>2]=f}c[k>>2]=b;c[k+4>>2]=d;c[k+8>>2]=e;e=h|0;f=j|0;c[h>>2]=1635077147;a[h+4|0]=82;a[h+5|0]=0;a[h+6|0]=1;a[h+7|0]=4;a[h+8|0]=4;a[h+9|0]=4;a[h+10|0]=8;l=h+12|0;a[h+11|0]=0;a[l]=a[4960]|0;a[l+1|0]=a[4961]|0;a[l+2|0]=a[4962]|0;a[l+3|0]=a[4963]|0;a[l+4|0]=a[4964]|0;a[l+5|0]=a[4965]|0;a[f]=27;if((mk(d,j+1|0,17)|0)!=0){Yj(k,4008);return 0}if((Zm(e|0,f|0,18)|0)==0){j=Yf(b,1)|0;d=b+8|0;l=c[d>>2]|0;c[l>>2]=j;c[l+8>>2]=70;l=(c[d>>2]|0)+16|0;c[d>>2]=l;if(((c[b+24>>2]|0)-l|0)<16){Hf(b,0)}l=bg(b)|0;h=j+12|0;c[h>>2]=l;Wj(k,l);l=c[h>>2]|0;h=c[l+40>>2]|0;if((h|0)==1){m=j;i=g;return m|0}j=Yf(b,h)|0;c[j+12>>2]=l;l=c[d>>2]|0;c[l-16>>2]=j;c[l-16+8>>2]=70;m=j;i=g;return m|0}if((Zm(e|0,f|0,4)|0)!=0){Yj(k,2856);return 0}if((Zm(e|0,f|0,6)|0)!=0){Yj(k,2576);return 0}if((Zm(e|0,f|0,12)|0)==0){Yj(k,3224);return 0}else{Yj(k,11904);return 0}return 0}function Wj(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=i;i=i+184|0;g=f|0;j=f+8|0;k=f+16|0;l=f+24|0;m=f+32|0;n=f+40|0;o=f+48|0;p=f+56|0;q=f+64|0;r=f+72|0;s=f+80|0;t=f+88|0;u=f+96|0;v=f+104|0;w=f+112|0;x=f+120|0;y=f+128|0;z=f+136|0;A=f+144|0;B=f+152|0;C=f+160|0;D=f+168|0;E=f+176|0;F=b+4|0;if((mk(c[F>>2]|0,w,4)|0)!=0){Yj(b,4008)}G=c[w>>2]|0;if((G|0)<0){Yj(b,3224)}c[e+64>>2]=G;if((mk(c[F>>2]|0,v,4)|0)!=0){Yj(b,4008)}G=c[v>>2]|0;if((G|0)<0){Yj(b,3224)}c[e+68>>2]=G;if((mk(c[F>>2]|0,u,1)|0)!=0){Yj(b,4008)}a[e+76|0]=a[u]|0;if((mk(c[F>>2]|0,t,1)|0)!=0){Yj(b,4008)}a[e+77|0]=a[t]|0;if((mk(c[F>>2]|0,s,1)|0)!=0){Yj(b,4008)}a[e+78|0]=a[s]|0;if((mk(c[F>>2]|0,r,4)|0)!=0){Yj(b,4008)}s=c[r>>2]|0;if((s|0)<0){Yj(b,3224)}r=b|0;t=c[r>>2]|0;if((s+1|0)>>>0>1073741823>>>0){Fh(t)}u=s<<2;G=Gh(t,0,0,u)|0;c[e+12>>2]=G;c[e+48>>2]=s;if((mk(c[F>>2]|0,G,u)|0)!=0){Yj(b,4008)}if((mk(c[F>>2]|0,n,4)|0)!=0){Yj(b,4008)}u=c[n>>2]|0;if((u|0)<0){Yj(b,3224)}n=c[r>>2]|0;if((u+1|0)>>>0>268435455>>>0){Fh(n)}G=Gh(n,0,0,u<<4)|0;n=e+8|0;c[n>>2]=G;c[e+44>>2]=u;s=(u|0)>0;a:do{if(s){t=0;v=G;while(1){c[v+(t<<4)+8>>2]=0;w=t+1|0;if((w|0)>=(u|0)){break}t=w;v=c[n>>2]|0}if(!s){break}v=k;t=j;w=b+8|0;H=0;while(1){I=c[n>>2]|0;J=I+(H<<4)|0;if((mk(c[F>>2]|0,m,1)|0)!=0){K=35;break}L=a[m]|0;if((L|0)==0){c[I+(H<<4)+8>>2]=0}else if((L|0)==3){if((mk(c[F>>2]|0,v,8)|0)!=0){K=42;break}h[J>>3]=+h[k>>3];c[I+(H<<4)+8>>2]=3}else if((L|0)==1){if((mk(c[F>>2]|0,l,1)|0)!=0){K=39;break}c[J>>2]=a[l]|0;c[I+(H<<4)+8>>2]=1}else if((L|0)==4){if((mk(c[F>>2]|0,t,4)|0)!=0){K=45;break}L=c[j>>2]|0;if((L|0)==0){M=0}else{N=nk(c[r>>2]|0,c[w>>2]|0,L)|0;if((mk(c[F>>2]|0,N,c[j>>2]|0)|0)!=0){K=48;break}M=Yi(c[r>>2]|0,N,(c[j>>2]|0)-1|0)|0}c[J>>2]=M;c[I+(H<<4)+8>>2]=d[M+4|0]|64}H=H+1|0;if((H|0)>=(u|0)){break a}}if((K|0)==35){Yj(b,4008)}else if((K|0)==39){Yj(b,4008)}else if((K|0)==42){Yj(b,4008)}else if((K|0)==45){Yj(b,4008)}else if((K|0)==48){Yj(b,4008)}}}while(0);if((mk(c[F>>2]|0,g,4)|0)!=0){Yj(b,4008)}u=c[g>>2]|0;if((u|0)<0){Yj(b,3224)}g=c[r>>2]|0;if((u+1|0)>>>0>1073741823>>>0){Fh(g)}M=Gh(g,0,0,u<<2)|0;g=e+16|0;c[g>>2]=M;c[e+56>>2]=u;j=(u|0)>0;do{if(j){l=0;k=M;while(1){c[k+(l<<2)>>2]=0;m=l+1|0;if((m|0)>=(u|0)){break}l=m;k=c[g>>2]|0}if(j){O=0}else{break}do{k=bg(c[r>>2]|0)|0;c[(c[g>>2]|0)+(O<<2)>>2]=k;Wj(b,c[(c[g>>2]|0)+(O<<2)>>2]|0);O=O+1|0;}while((O|0)<(u|0))}}while(0);if((mk(c[F>>2]|0,q,4)|0)!=0){Yj(b,4008)}u=c[q>>2]|0;if((u|0)<0){Yj(b,3224)}q=c[r>>2]|0;if((u+1|0)>>>0>536870911>>>0){Fh(q)}O=Gh(q,0,0,u<<3)|0;q=e+28|0;c[q>>2]=O;c[e+40>>2]=u;b:do{if((u|0)>0){c[O>>2]=0;if((u|0)>1){g=1;while(1){c[(c[q>>2]|0)+(g<<3)>>2]=0;j=g+1|0;if((j|0)<(u|0)){g=j}else{P=0;break}}}else{P=0}while(1){if((mk(c[F>>2]|0,p,1)|0)!=0){K=73;break}a[(c[q>>2]|0)+(P<<3)+4|0]=a[p]|0;if((mk(c[F>>2]|0,o,1)|0)!=0){K=75;break}a[(c[q>>2]|0)+(P<<3)+5|0]=a[o]|0;P=P+1|0;if((P|0)>=(u|0)){break b}}if((K|0)==73){Yj(b,4008)}else if((K|0)==75){Yj(b,4008)}}}while(0);if((mk(c[F>>2]|0,E,4)|0)!=0){Yj(b,4008)}u=c[E>>2]|0;do{if((u|0)==0){Q=0}else{P=nk(c[r>>2]|0,c[b+8>>2]|0,u)|0;if((mk(c[F>>2]|0,P,c[E>>2]|0)|0)==0){Q=Yi(c[r>>2]|0,P,(c[E>>2]|0)-1|0)|0;break}else{Yj(b,4008)}}}while(0);c[e+36>>2]=Q;if((mk(c[F>>2]|0,D,4)|0)!=0){Yj(b,4008)}Q=c[D>>2]|0;if((Q|0)<0){Yj(b,3224)}D=c[r>>2]|0;if((Q+1|0)>>>0>1073741823>>>0){Fh(D)}E=Q<<2;u=Gh(D,0,0,E)|0;c[e+20>>2]=u;c[e+52>>2]=Q;if((mk(c[F>>2]|0,u,E)|0)!=0){Yj(b,4008)}if((mk(c[F>>2]|0,C,4)|0)!=0){Yj(b,4008)}E=c[C>>2]|0;if((E|0)<0){Yj(b,3224)}C=c[r>>2]|0;if((E+1|0)>>>0>357913941>>>0){Fh(C)}u=Gh(C,0,0,E*12|0)|0;C=e+24|0;c[C>>2]=u;c[e+60>>2]=E;c:do{if((E|0)>0){c[u>>2]=0;if((E|0)>1){e=1;do{c[(c[C>>2]|0)+(e*12|0)>>2]=0;e=e+1|0;}while((e|0)<(E|0))}e=B;Q=A;D=z;P=b+8|0;o=0;while(1){if((mk(c[F>>2]|0,e,4)|0)!=0){K=102;break}p=c[B>>2]|0;if((p|0)==0){R=0}else{O=nk(c[r>>2]|0,c[P>>2]|0,p)|0;if((mk(c[F>>2]|0,O,c[B>>2]|0)|0)!=0){K=105;break}R=Yi(c[r>>2]|0,O,(c[B>>2]|0)-1|0)|0}c[(c[C>>2]|0)+(o*12|0)>>2]=R;if((mk(c[F>>2]|0,Q,4)|0)!=0){K=108;break}O=c[A>>2]|0;if((O|0)<0){K=110;break}c[(c[C>>2]|0)+(o*12|0)+4>>2]=O;if((mk(c[F>>2]|0,D,4)|0)!=0){K=112;break}O=c[z>>2]|0;if((O|0)<0){K=114;break}c[(c[C>>2]|0)+(o*12|0)+8>>2]=O;o=o+1|0;if((o|0)>=(E|0)){break c}}if((K|0)==102){Yj(b,4008)}else if((K|0)==105){Yj(b,4008)}else if((K|0)==108){Yj(b,4008)}else if((K|0)==110){Yj(b,3224)}else if((K|0)==112){Yj(b,4008)}else if((K|0)==114){Yj(b,3224)}}}while(0);if((mk(c[F>>2]|0,y,4)|0)!=0){Yj(b,4008)}E=c[y>>2]|0;if((E|0)<0){Yj(b,3224)}if((E|0)<=0){i=f;return}y=x;C=b+8|0;z=0;while(1){if((mk(c[F>>2]|0,y,4)|0)!=0){K=123;break}A=c[x>>2]|0;if((A|0)==0){S=0}else{R=nk(c[r>>2]|0,c[C>>2]|0,A)|0;if((mk(c[F>>2]|0,R,c[x>>2]|0)|0)!=0){K=126;break}S=Yi(c[r>>2]|0,R,(c[x>>2]|0)-1|0)|0}c[(c[q>>2]|0)+(z<<3)>>2]=S;R=z+1|0;if((R|0)<(E|0)){z=R}else{K=129;break}}if((K|0)==123){Yj(b,4008)}else if((K|0)==126){Yj(b,4008)}else if((K|0)==129){i=f;return}}function Xj(b){b=b|0;var c=0;c=b;y=1635077147;a[c]=y;y=y>>8;a[c+1|0]=y;y=y>>8;a[c+2|0]=y;y=y>>8;a[c+3|0]=y;a[b+4|0]=82;a[b+5|0]=0;a[b+6|0]=1;a[b+7|0]=4;a[b+8|0]=4;a[b+9|0]=4;a[b+10|0]=8;c=b+12|0;a[b+11|0]=0;a[c]=a[4960]|0;a[c+1|0]=a[4961]|0;a[c+2|0]=a[4962]|0;a[c+3|0]=a[4963]|0;a[c+4|0]=a[4964]|0;a[c+5|0]=a[4965]|0;return}function Yj(a,b){a=a|0;b=b|0;var d=0,e=0;d=a|0;bi(c[d>>2]|0,3688,(e=i,i=i+16|0,c[e>>2]=c[a+12>>2],c[e+8>>2]=b,e)|0)|0;i=e;Ef(c[d>>2]|0,3)}function Zj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0;d=i;i=i+8|0;e=d|0;f=c[a+8>>2]|0;do{if((f|0)==3){g=a}else{if((f&15|0)!=4){g=0;break}j=c[a>>2]|0;if(($h(j+16|0,c[j+12>>2]|0,e)|0)==0){g=0;break}h[b>>3]=+h[e>>3];c[b+8>>2]=3;g=b}}while(0);i=d;return g|0}function _j(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0;e=i;i=i+32|0;f=b+8|0;if((c[f>>2]|0)!=3){g=0;i=e;return g|0}j=e|0;k=cb(j|0,4048,(l=i,i=i+8|0,h[l>>3]=+h[b>>3],l)|0)|0;i=l;l=Yi(a,j,k)|0;c[b>>2]=l;c[f>>2]=d[l+4|0]|0|64;g=1;i=e;return g|0}function $j(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;h=b+12|0;j=d;d=0;while(1){if((d|0)>=100){k=14;break}l=j+8|0;if((c[l>>2]|0)==69){m=c[j>>2]|0;n=Gj(m,e)|0;o=n+8|0;if((c[o>>2]|0)!=0){k=9;break}p=c[m+8>>2]|0;if((p|0)==0){k=9;break}if((a[p+6|0]&1)!=0){k=9;break}m=Tj(p,0,c[(c[h>>2]|0)+184>>2]|0)|0;if((m|0)==0){k=9;break}q=m;r=c[m+8>>2]|0}else{m=Uj(b,j,0)|0;p=c[m+8>>2]|0;if((p|0)==0){k=11;break}else{q=m;r=p}}if((r&15|0)==6){k=13;break}else{j=q;d=d+1|0}}if((k|0)==9){d=n;n=f;r=c[d+4>>2]|0;c[n>>2]=c[d>>2];c[n+4>>2]=r;c[f+8>>2]=c[o>>2];i=g;return}else if((k|0)==11){xf(b,j,10488)}else if((k|0)==13){o=b+28|0;r=f-(c[o>>2]|0)|0;f=b+8|0;n=c[f>>2]|0;c[f>>2]=n+16;d=q;h=n;p=c[d+4>>2]|0;c[h>>2]=c[d>>2];c[h+4>>2]=p;c[n+8>>2]=c[q+8>>2];q=c[f>>2]|0;c[f>>2]=q+16;n=j;j=q;p=c[n+4>>2]|0;c[j>>2]=c[n>>2];c[j+4>>2]=p;c[q+8>>2]=c[l>>2];l=c[f>>2]|0;c[f>>2]=l+16;q=e;p=l;j=c[q+4>>2]|0;c[p>>2]=c[q>>2];c[p+4>>2]=j;c[l+8>>2]=c[e+8>>2];Mf(b,(c[f>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);e=c[o>>2]|0;o=c[f>>2]|0;l=o-16|0;c[f>>2]=l;f=l;l=e+r|0;j=c[f+4>>2]|0;c[l>>2]=c[f>>2];c[l+4>>2]=j;c[e+(r+8)>>2]=c[o-16+8>>2];i=g;return}else if((k|0)==14){zf(b,8280,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b}}function ak(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;h=b+12|0;j=d;d=0;while(1){if((d|0)>=100){k=19;break}l=j+8|0;if((c[l>>2]|0)==69){m=c[j>>2]|0;n=m;o=Gj(n,e)|0;if((c[o+8>>2]|0)!=0){p=o;break}q=c[m+8>>2]|0;if((q|0)==0){k=9;break}if((a[q+6|0]&2)!=0){k=9;break}r=Tj(q,1,c[(c[h>>2]|0)+188>>2]|0)|0;if((r|0)==0){k=9;break}s=r;t=c[r+8>>2]|0}else{r=Uj(b,j,1)|0;q=c[r+8>>2]|0;if((q|0)==0){k=16;break}else{s=r;t=q}}if((t&15|0)==6){k=18;break}else{j=s;d=d+1|0}}do{if((k|0)==9){if((o|0)!=1224){p=o;break}p=Cj(b,n,e)|0}else if((k|0)==16){xf(b,j,10488)}else if((k|0)==18){d=b+8|0;t=c[d>>2]|0;c[d>>2]=t+16;h=s;q=t;r=c[h+4>>2]|0;c[q>>2]=c[h>>2];c[q+4>>2]=r;c[t+8>>2]=c[s+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;r=j;q=t;h=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=h;c[t+8>>2]=c[l>>2];t=c[d>>2]|0;c[d>>2]=t+16;h=e;q=t;r=c[h+4>>2]|0;c[q>>2]=c[h>>2];c[q+4>>2]=r;c[t+8>>2]=c[e+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;r=f;q=t;h=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=h;c[t+8>>2]=c[f+8>>2];Mf(b,(c[d>>2]|0)-64|0,0,a[(c[b+16>>2]|0)+18|0]&1);i=g;return}else if((k|0)==19){zf(b,6440,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0);i=d}}while(0);k=f;e=p;l=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=l;l=f+8|0;c[p+8>>2]=c[l>>2];a[m+6|0]=0;if((c[l>>2]&64|0)==0){i=g;return}if((a[(c[f>>2]|0)+5|0]&3)==0){i=g;return}if((a[m+5|0]&4)==0){i=g;return}gg(b,m);i=g;return}function bk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=Ma(l|0,m|0)|0;a:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=Um(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break a}v=s+1|0;s=o+v|0;w=q+v|0;x=Ma(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break a}}u=t&1^1}else{u=n}}while(0);i=u>>>31;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=Uj(b,d,13)|0;do{if((c[g+8>>2]|0)==0){n=Uj(b,e,13)|0;if((c[n+8>>2]|0)!=0){y=n;break}Cf(b,d,e);return 0}else{y=g}}while(0);g=b+28|0;n=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];Mf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+n|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(n+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function ck(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<=+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=Ma(l|0,m|0)|0;a:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=Um(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break a}v=s+1|0;s=o+v|0;w=q+v|0;x=Ma(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break a}}u=t&1^1}else{u=n}}while(0);i=(u|0)<1|0;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=Uj(b,d,14)|0;do{if((c[g+8>>2]|0)==0){n=Uj(b,e,14)|0;if((c[n+8>>2]|0)!=0){y=n;break}n=c[u>>2]|0;k=Uj(b,e,13)|0;do{if((c[k+8>>2]|0)==0){m=Uj(b,d,13)|0;if((c[m+8>>2]|0)!=0){z=m;break}Cf(b,d,e);return 0}else{z=k}}while(0);k=b+28|0;m=n-(c[k>>2]|0)|0;j=c[u>>2]|0;c[u>>2]=j+16;l=z;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[z+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;q=e;r=j;l=c[q+4>>2]|0;c[r>>2]=c[q>>2];c[r+4>>2]=l;c[j+8>>2]=c[e+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;l=d;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[f>>2];Mf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);j=c[k>>2]|0;k=c[u>>2]|0;q=k-16|0;c[u>>2]=q;r=q;q=j+m|0;l=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=l;c[j+(m+8)>>2]=c[k-16+8>>2];k=c[u>>2]|0;m=c[k+8>>2]|0;if((m|0)==0){i=1;return i|0}if((m|0)!=1){i=0;return i|0}i=(c[k>>2]|0)==0|0;return i|0}else{y=g}}while(0);g=b+28|0;z=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];Mf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+z|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(z+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function dk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d+8|0;a:do{switch(c[f>>2]&63|0){case 1:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 7:{i=c[d>>2]|0;j=c[e>>2]|0;if((i|0)==(j|0)){g=1;return g|0}if((b|0)==0){g=0;return g|0}else{k=ek(b,c[i+8>>2]|0,c[j+8>>2]|0)|0;break a}break};case 20:{g=Ui(c[d>>2]|0,c[e>>2]|0)|0;return g|0};case 2:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 5:{j=c[d>>2]|0;i=c[e>>2]|0;if((j|0)==(i|0)){g=1;return g|0}if((b|0)==0){g=0;return g|0}else{k=ek(b,c[j+8>>2]|0,c[i+8>>2]|0)|0;break a}break};case 3:{g=+h[d>>3]==+h[e>>3]|0;return g|0};case 22:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 4:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 0:{g=1;return g|0};default:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0}}}while(0);if((k|0)==0){g=0;return g|0}i=b+8|0;j=c[i>>2]|0;l=b+28|0;m=j-(c[l>>2]|0)|0;c[i>>2]=j+16;n=k;o=j;p=c[n+4>>2]|0;c[o>>2]=c[n>>2];c[o+4>>2]=p;c[j+8>>2]=c[k+8>>2];k=c[i>>2]|0;c[i>>2]=k+16;j=d;d=k;p=c[j+4>>2]|0;c[d>>2]=c[j>>2];c[d+4>>2]=p;c[k+8>>2]=c[f>>2];f=c[i>>2]|0;c[i>>2]=f+16;k=e;p=f;d=c[k+4>>2]|0;c[p>>2]=c[k>>2];c[p+4>>2]=d;c[f+8>>2]=c[e+8>>2];Mf(b,(c[i>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[l>>2]|0;l=c[i>>2]|0;e=l-16|0;c[i>>2]=e;f=e;e=b+m|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(m+8)>>2]=c[l-16+8>>2];l=c[i>>2]|0;i=c[l+8>>2]|0;if((i|0)==0){g=0;return g|0}if((i|0)!=1){g=1;return g|0}g=(c[l>>2]|0)!=0|0;return g|0}function ek(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0;if((d|0)==0){f=0;return f|0}if((a[d+6|0]&32)!=0){f=0;return f|0}g=b+12|0;b=Tj(d,5,c[(c[g>>2]|0)+204>>2]|0)|0;if((b|0)==0){f=0;return f|0}if((d|0)==(e|0)){f=b;return f|0}if((e|0)==0){f=0;return f|0}if((a[e+6|0]&32)!=0){f=0;return f|0}d=Tj(e,5,c[(c[g>>2]|0)+204>>2]|0)|0;if((d|0)==0){f=0;return f|0}g=c[b+8>>2]|0;a:do{if((g|0)==(c[d+8>>2]|0)){switch(g&63|0){case 22:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 2:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 7:{if((c[b>>2]|0)==(c[d>>2]|0)){f=b}else{break a}return f|0};case 4:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 5:{if((c[b>>2]|0)==(c[d>>2]|0)){f=b}else{break a}return f|0};case 20:{i=Ui(c[b>>2]|0,c[d>>2]|0)|0;break};case 1:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 3:{i=+h[b>>3]==+h[d>>3]|0;break};case 0:{f=b;return f|0};default:{i=(c[b>>2]|0)==(c[d>>2]|0)|0}}if((i|0)==0){break}else{f=b}return f|0}}while(0);f=0;return f|0}function fk(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+32|0;g=b+8|0;j=f|0;k=b+12|0;l=b+28|0;m=b+16|0;n=e;e=c[g>>2]|0;a:while(1){o=e-32|0;p=e-32+8|0;q=c[p>>2]|0;r=e-16|0;b:do{if((q&15|0)==4|(q|0)==3){s=e-16+8|0;t=c[s>>2]|0;if((t&15|0)==4){u=q;v=r}else{if((t|0)!=3){w=7;break}t=cb(j|0,4048,(x=i,i=i+8|0,h[x>>3]=+h[r>>3],x)|0)|0;i=x;y=Yi(b,j,t)|0;t=r;c[t>>2]=y;c[s>>2]=d[y+4|0]|0|64;u=c[p>>2]|0;v=t}t=c[(c[v>>2]|0)+12>>2]|0;y=(u&15|0)==4;if((t|0)==0){if(y){z=2;break}if((u|0)!=3){z=2;break}A=cb(j|0,4048,(x=i,i=i+8|0,h[x>>3]=+h[o>>3],x)|0)|0;i=x;B=Yi(b,j,A)|0;c[o>>2]=B;c[p>>2]=d[B+4|0]|0|64;z=2;break}do{if(y){if((c[(c[o>>2]|0)+12>>2]|0)!=0){break}B=r;A=o;C=c[B+4>>2]|0;c[A>>2]=c[B>>2];c[A+4>>2]=C;c[p>>2]=c[s>>2];z=2;break b}}while(0);c:do{if((n|0)>1){s=1;y=t;while(1){C=~s;A=e+(C<<4)|0;B=e+(C<<4)+8|0;C=c[B>>2]|0;if((C&15|0)==4){D=A}else{if((C|0)!=3){E=s;F=y;break c}C=cb(j|0,4048,(x=i,i=i+8|0,h[x>>3]=+h[A>>3],x)|0)|0;i=x;G=Yi(b,j,C)|0;C=A;c[C>>2]=G;c[B>>2]=d[G+4|0]|0|64;D=C}C=c[(c[D>>2]|0)+12>>2]|0;if(C>>>0>=(-3-y|0)>>>0){w=24;break a}G=C+y|0;C=s+1|0;if((C|0)<(n|0)){s=C;y=G}else{E=C;F=G;break}}}else{E=1;F=t}}while(0);t=nk(b,(c[k>>2]|0)+144|0,F)|0;y=0;s=E;do{G=c[e+(-s<<4)>>2]|0;C=c[G+12>>2]|0;Vm(t+y|0,G+16|0,C)|0;y=C+y|0;s=s-1|0;}while((s|0)>0);s=-E|0;C=Yi(b,t,y)|0;c[e+(s<<4)>>2]=C;c[e+(s<<4)+8>>2]=d[C+4|0]|0|64;z=E}else{w=7}}while(0);if((w|0)==7){w=0;q=Uj(b,o,15)|0;if((c[q+8>>2]|0)==0){C=Uj(b,r,15)|0;if((c[C+8>>2]|0)==0){w=10;break}else{H=C}}else{H=q}q=o-(c[l>>2]|0)|0;C=c[g>>2]|0;c[g>>2]=C+16;s=H;G=C;B=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=B;c[C+8>>2]=c[H+8>>2];C=c[g>>2]|0;c[g>>2]=C+16;B=o;G=C;s=c[B+4>>2]|0;c[G>>2]=c[B>>2];c[G+4>>2]=s;c[C+8>>2]=c[p>>2];C=c[g>>2]|0;c[g>>2]=C+16;s=r;G=C;B=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=B;c[C+8>>2]=c[e-16+8>>2];Mf(b,(c[g>>2]|0)-48|0,1,a[(c[m>>2]|0)+18|0]&1);C=c[l>>2]|0;B=c[g>>2]|0;G=B-16|0;c[g>>2]=G;s=G;G=C+q|0;A=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=A;c[C+(q+8)>>2]=c[B-16+8>>2];z=2}B=n+1-z|0;q=(c[g>>2]|0)+(1-z<<4)|0;c[g>>2]=q;if((B|0)>1){n=B;e=q}else{w=30;break}}if((w|0)==10){Af(b,o,r)}else if((w|0)==24){zf(b,4936,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0);i=x}else if((w|0)==30){i=f;return}}function gk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=e+8|0;g=c[f>>2]&15;a:do{if((g|0)==4){h[d>>3]=+((c[(c[e>>2]|0)+12>>2]|0)>>>0>>>0);c[d+8>>2]=3;return}else if((g|0)==5){i=c[e>>2]|0;j=i;k=c[i+8>>2]|0;i=k;do{if((k|0)!=0){if((a[k+6|0]&16)!=0){break}l=Tj(i,4,c[(c[b+12>>2]|0)+200>>2]|0)|0;if((l|0)!=0){m=l;break a}}}while(0);h[d>>3]=+(Hj(j)|0);c[d+8>>2]=3;return}else{i=Uj(b,e,4)|0;if((c[i+8>>2]|0)!=0){m=i;break}xf(b,e,3992)}}while(0);g=b+28|0;i=d-(c[g>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;l=m;n=k;o=c[l+4>>2]|0;c[n>>2]=c[l>>2];c[n+4>>2]=o;c[k+8>>2]=c[m+8>>2];m=c[d>>2]|0;c[d>>2]=m+16;k=e;e=m;o=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=o;c[m+8>>2]=c[f>>2];m=c[d>>2]|0;c[d>>2]=m+16;o=m;e=c[k+4>>2]|0;c[o>>2]=c[k>>2];c[o+4>>2]=e;c[m+8>>2]=c[f>>2];Mf(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[d>>2]|0;f=g-16|0;c[d>>2]=f;d=f;f=b+i|0;m=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=m;c[b+(i+8)>>2]=c[g-16+8>>2];return}function hk(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0;j=i;i=i+32|0;k=j|0;l=j+8|0;m=j+16|0;n=e+8|0;o=c[n>>2]|0;do{if((o|0)==3){p=e;q=5}else{if((o&15|0)!=4){break}r=c[e>>2]|0;if(($h(r+16|0,c[r+12>>2]|0,l)|0)==0){break}h[m>>3]=+h[l>>3];c[m+8>>2]=3;p=m;q=5}}while(0);do{if((q|0)==5){m=c[f+8>>2]|0;if((m|0)==3){if((f|0)==0){break}s=+h[f>>3]}else{if((m&15|0)!=4){break}m=c[f>>2]|0;if(($h(m+16|0,c[m+12>>2]|0,k)|0)==0){break}s=+h[k>>3]}h[d>>3]=+Zh(g-6|0,+h[p>>3],s);c[d+8>>2]=3;i=j;return}}while(0);p=Uj(b,e,g)|0;do{if((c[p+8>>2]|0)==0){k=Uj(b,f,g)|0;if((c[k+8>>2]|0)!=0){t=k;break}Bf(b,e,f)}else{t=p}}while(0);p=b+28|0;g=d-(c[p>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;q=t;m=k;l=c[q+4>>2]|0;c[m>>2]=c[q>>2];c[m+4>>2]=l;c[k+8>>2]=c[t+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;k=e;e=t;l=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=l;c[t+8>>2]=c[n>>2];n=c[d>>2]|0;c[d>>2]=n+16;t=f;l=n;e=c[t+4>>2]|0;c[l>>2]=c[t>>2];c[l+4>>2]=e;c[n+8>>2]=c[f+8>>2];Mf(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[p>>2]|0;p=c[d>>2]|0;f=p-16|0;c[d>>2]=f;d=f;f=b+g|0;n=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=n;c[b+(g+8)>>2]=c[p-16+8>>2];i=j;return}function ik(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=c[a+16>>2]|0;d=b+24|0;e=c[d>>2]|0;f=b+28|0;g=c[(c[f>>2]|0)-4>>2]|0;h=g&63;switch(h|0){case 22:{i=a+8|0;j=c[i>>2]|0;k=j-32|0;l=k-(e+(g>>>23<<4))|0;m=j-16|0;n=j-48|0;o=c[m+4>>2]|0;c[n>>2]=c[m>>2];c[n+4>>2]=o;c[j-48+8>>2]=c[j-16+8>>2];if((l|0)>16){c[i>>2]=k;fk(a,l>>4)}l=c[i>>2]|0;k=c[d>>2]|0;d=g>>>6&255;j=l-16|0;o=k+(d<<4)|0;n=c[j+4>>2]|0;c[o>>2]=c[j>>2];c[o+4>>2]=n;c[k+(d<<4)+8>>2]=c[l-16+8>>2];c[i>>2]=c[b+4>>2];return};case 29:{if((g&8372224|0)==0){return}c[a+8>>2]=c[b+4>>2];return};case 13:case 14:case 15:case 16:case 17:case 18:case 19:case 21:case 6:case 7:case 12:{i=a+8|0;l=c[i>>2]|0;d=l-16|0;c[i>>2]=d;i=g>>>6&255;k=d;d=e+(i<<4)|0;n=c[k+4>>2]|0;c[d>>2]=c[k>>2];c[d+4>>2]=n;c[e+(i<<4)+8>>2]=c[l-16+8>>2];return};case 34:{c[a+8>>2]=c[b+4>>2];return};case 26:case 25:case 24:{b=a+8|0;l=c[b>>2]|0;i=c[l-16+8>>2]|0;do{if((i|0)==0){p=1}else{if((i|0)!=1){p=0;break}p=(c[l-16>>2]|0)==0|0}}while(0);i=p^1;c[b>>2]=l-16;if((h|0)==26){h=(c[(Uj(a,e+(g>>>23<<4)|0,14)|0)+8>>2]|0)==0;q=h?p:i}else{q=i}if((q|0)==(g>>>6&255|0)){return}c[f>>2]=(c[f>>2]|0)+4;return};default:{return}}}function jk(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,R=0,S=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0.0,za=0.0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0.0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0;e=i;i=i+24|0;f=e|0;g=e+8|0;j=e+16|0;k=b+16|0;l=b+40|0;m=b+12|0;n=b+8|0;o=b+24|0;p=b+48|0;q=b+20|0;r=b+6|0;s=b+44|0;t=c[k>>2]|0;a:while(1){u=t|0;v=c[c[u>>2]>>2]|0;w=v+12|0;x=c[(c[w>>2]|0)+8>>2]|0;y=t+24|0;z=t+28|0;A=v+16|0;v=A;B=t+4|0;C=A;A=c[y>>2]|0;b:while(1){D=c[z>>2]|0;c[z>>2]=D+4;E=c[D>>2]|0;D=a[l]|0;do{if((D&12)==0){F=A}else{G=(c[p>>2]|0)-1|0;c[p>>2]=G;H=(G|0)==0;if(!H){if((D&4)==0){F=A;break}}I=c[k>>2]|0;G=D&255;if((G&8|0)==0|H^1){J=0}else{c[p>>2]=c[s>>2];J=1}K=I+18|0;H=a[K]|0;if(H<<24>>24>-1){if(J){Jf(b,3,-1)}c:do{if((G&4|0)==0){L=I+28|0}else{M=c[(c[c[I>>2]>>2]|0)+12>>2]|0;N=I+28|0;O=c[N>>2]|0;P=c[M+12>>2]|0;R=(O-P>>2)-1|0;S=c[M+20>>2]|0;M=(S|0)==0;if(M){U=0}else{U=c[S+(R<<2)>>2]|0}do{if((R|0)!=0){V=c[q>>2]|0;if(O>>>0<=V>>>0){break}if(M){W=0}else{W=c[S+((V-P>>2)-1<<2)>>2]|0}if((U|0)==(W|0)){L=N;break c}}}while(0);Jf(b,2,U);L=N}}while(0);c[q>>2]=c[L>>2];if((a[r]|0)==1){X=23;break a}}else{a[K]=H&127}F=c[y>>2]|0}}while(0);Y=E>>>6&255;Z=F+(Y<<4)|0;switch(E&63|0){case 19:{D=E>>>23;G=F+(D<<4)|0;if((c[F+(D<<4)+8>>2]|0)==3){h[Z>>3]=-0.0- +h[G>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}else{hk(b,Z,G,G,12);A=c[y>>2]|0;continue b}break};case 20:{G=E>>>23;D=c[F+(G<<4)+8>>2]|0;do{if((D|0)==0){_=1}else{if((D|0)!=1){_=0;break}_=(c[F+(G<<4)>>2]|0)==0|0}}while(0);c[Z>>2]=_;c[F+(Y<<4)+8>>2]=1;A=F;continue b;break};case 18:{G=E>>>23;if((G&256|0)==0){$=F+(G<<4)|0}else{$=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){aa=F+((G&511)<<4)|0}else{aa=x+((G&255)<<4)|0}do{if((c[$+8>>2]|0)==3){if((c[aa+8>>2]|0)!=3){break}h[Z>>3]=+T(+(+h[$>>3]),+(+h[aa>>3]));c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,$,aa,11);A=c[y>>2]|0;continue b;break};case 24:{G=E>>>23;if((G&256|0)==0){ba=F+(G<<4)|0}else{ba=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){ca=F+((G&511)<<4)|0}else{ca=x+((G&255)<<4)|0}if((c[ba+8>>2]|0)==(c[ca+8>>2]|0)){da=(dk(b,ba,ca)|0)!=0|0}else{da=0}G=c[z>>2]|0;D=G;if((da|0)==(Y|0)){P=c[D>>2]|0;S=P>>>6&255;if((S|0)==0){ea=G}else{ag(b,(c[y>>2]|0)+(S-1<<4)|0);ea=c[z>>2]|0}fa=ea+((P>>>14)-131070<<2)|0}else{fa=D+4|0}c[z>>2]=fa;A=c[y>>2]|0;continue b;break};case 21:{gk(b,Z,F+(E>>>23<<4)|0);A=c[y>>2]|0;continue b;break};case 22:{D=E>>>23;P=E>>>14&511;c[n>>2]=F+(P+1<<4);fk(b,1-D+P|0);P=c[y>>2]|0;S=P+(D<<4)|0;G=S;M=P+(Y<<4)|0;O=c[G+4>>2]|0;c[M>>2]=c[G>>2];c[M+4>>2]=O;c[P+(Y<<4)+8>>2]=c[P+(D<<4)+8>>2];if((c[(c[m>>2]|0)+12>>2]|0)>0){if(Y>>>0<D>>>0){ga=S}else{ga=P+(Y+1<<4)|0}c[n>>2]=ga;sg(b);c[n>>2]=c[B>>2]}P=c[y>>2]|0;c[n>>2]=c[B>>2];A=P;continue b;break};case 23:{if((Y|0)!=0){ag(b,(c[y>>2]|0)+(Y-1<<4)|0)}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue b;break};case 0:{P=E>>>23;S=F+(P<<4)|0;D=Z;O=c[S+4>>2]|0;c[D>>2]=c[S>>2];c[D+4>>2]=O;c[F+(Y<<4)+8>>2]=c[F+(P<<4)+8>>2];A=F;continue b;break};case 1:{P=E>>>14;O=x+(P<<4)|0;D=Z;S=c[O+4>>2]|0;c[D>>2]=c[O>>2];c[D+4>>2]=S;c[F+(Y<<4)+8>>2]=c[x+(P<<4)+8>>2];A=F;continue b;break};case 2:{P=c[z>>2]|0;c[z>>2]=P+4;S=(c[P>>2]|0)>>>6;P=x+(S<<4)|0;D=Z;O=c[P+4>>2]|0;c[D>>2]=c[P>>2];c[D+4>>2]=O;c[F+(Y<<4)+8>>2]=c[x+(S<<4)+8>>2];A=F;continue b;break};case 3:{c[Z>>2]=E>>>23;c[F+(Y<<4)+8>>2]=1;if((E&8372224|0)==0){A=F;continue b}c[z>>2]=(c[z>>2]|0)+4;A=F;continue b;break};case 4:{S=Z;O=E>>>23;while(1){c[S+8>>2]=0;if((O|0)==0){A=F;continue b}else{S=S+16|0;O=O-1|0}}break};case 5:{O=c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0;S=O;D=Z;P=c[S+4>>2]|0;c[D>>2]=c[S>>2];c[D+4>>2]=P;c[F+(Y<<4)+8>>2]=c[O+8>>2];A=F;continue b;break};case 6:{O=E>>>14;if((O&256|0)==0){ha=F+((O&511)<<4)|0}else{ha=x+((O&255)<<4)|0}$j(b,c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0,ha,Z);A=c[y>>2]|0;continue b;break};case 7:{O=E>>>14;if((O&256|0)==0){ia=F+((O&511)<<4)|0}else{ia=x+((O&255)<<4)|0}$j(b,F+(E>>>23<<4)|0,ia,Z);A=c[y>>2]|0;continue b;break};case 8:{O=E>>>23;if((O&256|0)==0){ja=F+(O<<4)|0}else{ja=x+((O&255)<<4)|0}O=E>>>14;if((O&256|0)==0){ka=F+((O&511)<<4)|0}else{ka=x+((O&255)<<4)|0}ak(b,c[(c[v+(Y<<2)>>2]|0)+8>>2]|0,ja,ka);A=c[y>>2]|0;continue b;break};case 9:{O=c[v+(E>>>23<<2)>>2]|0;P=c[O+8>>2]|0;D=Z;S=P;M=c[D+4>>2]|0;c[S>>2]=c[D>>2];c[S+4>>2]=M;M=F+(Y<<4)+8|0;c[P+8>>2]=c[M>>2];if((c[M>>2]&64|0)==0){A=F;continue b}M=c[Z>>2]|0;if((a[M+5|0]&3)==0){A=F;continue b}if((a[O+5|0]&4)==0){A=F;continue b}eg(b,O,M);A=F;continue b;break};case 10:{M=E>>>23;if((M&256|0)==0){la=F+(M<<4)|0}else{la=x+((M&255)<<4)|0}M=E>>>14;if((M&256|0)==0){ma=F+((M&511)<<4)|0}else{ma=x+((M&255)<<4)|0}ak(b,Z,la,ma);A=c[y>>2]|0;continue b;break};case 11:{M=E>>>23;O=E>>>14&511;P=Aj(b)|0;c[Z>>2]=P;c[F+(Y<<4)+8>>2]=69;if((O|M|0)!=0){S=Xh(M)|0;vj(b,P,S,Xh(O)|0)}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);sg(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 12:{O=E>>>23;S=F+(O<<4)|0;P=Y+1|0;M=S;D=F+(P<<4)|0;G=c[M+4>>2]|0;c[D>>2]=c[M>>2];c[D+4>>2]=G;c[F+(P<<4)+8>>2]=c[F+(O<<4)+8>>2];O=E>>>14;if((O&256|0)==0){na=F+((O&511)<<4)|0}else{na=x+((O&255)<<4)|0}$j(b,S,na,Z);A=c[y>>2]|0;continue b;break};case 13:{S=E>>>23;if((S&256|0)==0){oa=F+(S<<4)|0}else{oa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){pa=F+((S&511)<<4)|0}else{pa=x+((S&255)<<4)|0}do{if((c[oa+8>>2]|0)==3){if((c[pa+8>>2]|0)!=3){break}h[Z>>3]=+h[oa>>3]+ +h[pa>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,oa,pa,6);A=c[y>>2]|0;continue b;break};case 14:{S=E>>>23;if((S&256|0)==0){qa=F+(S<<4)|0}else{qa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){ra=F+((S&511)<<4)|0}else{ra=x+((S&255)<<4)|0}do{if((c[qa+8>>2]|0)==3){if((c[ra+8>>2]|0)!=3){break}h[Z>>3]=+h[qa>>3]- +h[ra>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,qa,ra,7);A=c[y>>2]|0;continue b;break};case 15:{S=E>>>23;if((S&256|0)==0){sa=F+(S<<4)|0}else{sa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){ta=F+((S&511)<<4)|0}else{ta=x+((S&255)<<4)|0}do{if((c[sa+8>>2]|0)==3){if((c[ta+8>>2]|0)!=3){break}h[Z>>3]=+h[sa>>3]*+h[ta>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,sa,ta,8);A=c[y>>2]|0;continue b;break};case 16:{S=E>>>23;if((S&256|0)==0){ua=F+(S<<4)|0}else{ua=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){va=F+((S&511)<<4)|0}else{va=x+((S&255)<<4)|0}do{if((c[ua+8>>2]|0)==3){if((c[va+8>>2]|0)!=3){break}h[Z>>3]=+h[ua>>3]/+h[va>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,ua,va,9);A=c[y>>2]|0;continue b;break};case 17:{S=E>>>23;if((S&256|0)==0){wa=F+(S<<4)|0}else{wa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){xa=F+((S&511)<<4)|0}else{xa=x+((S&255)<<4)|0}do{if((c[wa+8>>2]|0)==3){if((c[xa+8>>2]|0)!=3){break}ya=+h[wa>>3];za=+h[xa>>3];h[Z>>3]=ya-za*+Q(ya/za);c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);hk(b,Z,wa,xa,10);A=c[y>>2]|0;continue b;break};case 25:{S=E>>>23;if((S&256|0)==0){Aa=F+(S<<4)|0}else{Aa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){Ba=F+((S&511)<<4)|0}else{Ba=x+((S&255)<<4)|0}S=(bk(b,Aa,Ba)|0)==(Y|0);O=c[z>>2]|0;P=O;if(S){S=c[P>>2]|0;G=S>>>6&255;if((G|0)==0){Ca=O}else{ag(b,(c[y>>2]|0)+(G-1<<4)|0);Ca=c[z>>2]|0}Da=Ca+((S>>>14)-131070<<2)|0}else{Da=P+4|0}c[z>>2]=Da;A=c[y>>2]|0;continue b;break};case 26:{P=E>>>23;if((P&256|0)==0){Ea=F+(P<<4)|0}else{Ea=x+((P&255)<<4)|0}P=E>>>14;if((P&256|0)==0){Fa=F+((P&511)<<4)|0}else{Fa=x+((P&255)<<4)|0}P=(ck(b,Ea,Fa)|0)==(Y|0);S=c[z>>2]|0;G=S;if(P){P=c[G>>2]|0;O=P>>>6&255;if((O|0)==0){Ga=S}else{ag(b,(c[y>>2]|0)+(O-1<<4)|0);Ga=c[z>>2]|0}Ha=Ga+((P>>>14)-131070<<2)|0}else{Ha=G+4|0}c[z>>2]=Ha;A=c[y>>2]|0;continue b;break};case 27:{G=c[F+(Y<<4)+8>>2]|0;P=(G|0)==0;do{if((E&8372224|0)==0){if(P){break}if((G|0)!=1){X=192;break}if((c[Z>>2]|0)!=0){X=192}}else{if(P){X=192;break}if((G|0)!=1){break}if((c[Z>>2]|0)==0){X=192}}}while(0);if((X|0)==192){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue b}G=c[z>>2]|0;P=c[G>>2]|0;O=P>>>6&255;if((O|0)==0){Ia=G}else{ag(b,(c[y>>2]|0)+(O-1<<4)|0);Ia=c[z>>2]|0}c[z>>2]=Ia+((P>>>14)-131070<<2);A=F;continue b;break};case 28:{P=E>>>23;O=F+(P<<4)|0;G=c[F+(P<<4)+8>>2]|0;P=(G|0)==0;do{if((E&8372224|0)==0){if(P){break}if((G|0)!=1){X=203;break}if((c[O>>2]|0)!=0){X=203}}else{if(P){X=203;break}if((G|0)!=1){break}if((c[O>>2]|0)==0){X=203}}}while(0);if((X|0)==203){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue b}P=O;S=Z;D=c[P+4>>2]|0;c[S>>2]=c[P>>2];c[S+4>>2]=D;c[F+(Y<<4)+8>>2]=G;D=c[z>>2]|0;S=c[D>>2]|0;P=S>>>6&255;if((P|0)==0){Ja=D}else{ag(b,(c[y>>2]|0)+(P-1<<4)|0);Ja=c[z>>2]|0}c[z>>2]=Ja+((S>>>14)-131070<<2);A=F;continue b;break};case 29:{S=E>>>23;P=E>>>14&511;if((S|0)!=0){c[n>>2]=F+(Y+S<<4)}if((Kf(b,Z,P-1|0)|0)==0){X=213;break b}if((P|0)!=0){c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 30:{P=E>>>23;if((P|0)!=0){c[n>>2]=F+(Y+P<<4)}if((Kf(b,Z,-1)|0)==0){X=218;break b}A=c[y>>2]|0;continue b;break};case 31:{X=223;break b;break};case 32:{za=+h[F+(Y+2<<4)>>3];P=Z|0;ya=za+ +h[P>>3];Ka=+h[F+(Y+1<<4)>>3];if(za>0.0){if(ya>Ka){A=F;continue b}}else{if(Ka>ya){A=F;continue b}}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);h[P>>3]=ya;c[F+(Y<<4)+8>>2]=3;P=Y+3|0;h[F+(P<<4)>>3]=ya;c[F+(P<<4)+8>>2]=3;A=F;continue b;break};case 33:{P=Y+1|0;S=F+(P<<4)|0;D=Y+2|0;M=F+(D<<4)|0;R=F+(Y<<4)+8|0;V=c[R>>2]|0;if((V|0)!=3){if((V&15|0)!=4){X=239;break a}V=c[Z>>2]|0;if(($h(V+16|0,c[V+12>>2]|0,j)|0)==0){X=239;break a}h[Z>>3]=+h[j>>3];c[R>>2]=3;if((Z|0)==0){X=239;break a}}V=F+(P<<4)+8|0;P=c[V>>2]|0;if((P|0)!=3){if((P&15|0)!=4){X=244;break a}P=c[S>>2]|0;if(($h(P+16|0,c[P+12>>2]|0,g)|0)==0){X=244;break a}h[S>>3]=+h[g>>3];c[V>>2]=3;if((S|0)==0){X=244;break a}}S=F+(D<<4)+8|0;D=c[S>>2]|0;if((D|0)!=3){if((D&15|0)!=4){X=249;break a}D=c[M>>2]|0;if(($h(D+16|0,c[D+12>>2]|0,f)|0)==0){X=249;break a}h[M>>3]=+h[f>>3];c[S>>2]=3;if((M|0)==0){X=249;break a}}S=Z|0;h[S>>3]=+h[S>>3]- +h[M>>3];c[R>>2]=3;c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue b;break};case 34:{R=Y+3|0;M=F+(R<<4)|0;S=Y+2|0;D=Y+5|0;V=F+(S<<4)|0;P=F+(D<<4)|0;La=c[V+4>>2]|0;c[P>>2]=c[V>>2];c[P+4>>2]=La;c[F+(D<<4)+8>>2]=c[F+(S<<4)+8>>2];S=Y+1|0;D=Y+4|0;La=F+(S<<4)|0;P=F+(D<<4)|0;V=c[La+4>>2]|0;c[P>>2]=c[La>>2];c[P+4>>2]=V;c[F+(D<<4)+8>>2]=c[F+(S<<4)+8>>2];S=Z;D=M;V=c[S+4>>2]|0;c[D>>2]=c[S>>2];c[D+4>>2]=V;c[F+(R<<4)+8>>2]=c[F+(Y<<4)+8>>2];c[n>>2]=F+(Y+6<<4);Mf(b,M,E>>>14&511,1);M=c[y>>2]|0;c[n>>2]=c[B>>2];R=c[z>>2]|0;c[z>>2]=R+4;V=c[R>>2]|0;Ma=M;Na=V;Oa=M+((V>>>6&255)<<4)|0;break};case 35:{Ma=F;Na=E;Oa=Z;break};case 36:{V=E>>>23;M=E>>>14&511;if((V|0)==0){Pa=((c[n>>2]|0)-Z>>4)-1|0}else{Pa=V}if((M|0)==0){V=c[z>>2]|0;c[z>>2]=V+4;Qa=(c[V>>2]|0)>>>6}else{Qa=M}M=c[Z>>2]|0;V=M;R=Pa-50+(Qa*50|0)|0;if((R|0)>(c[V+28>>2]|0)){zj(b,V,R)}if((Pa|0)>0){D=M+5|0;S=Pa;P=R;while(1){R=S+Y|0;La=F+(R<<4)|0;Ra=P-1|0;xj(b,V,P,La);do{if((c[F+(R<<4)+8>>2]&64|0)!=0){if((a[(c[La>>2]|0)+5|0]&3)==0){break}if((a[D]&4)==0){break}gg(b,M)}}while(0);La=S-1|0;if((La|0)>0){S=La;P=Ra}else{break}}}c[n>>2]=c[B>>2];A=F;continue b;break};case 37:{P=c[(c[(c[w>>2]|0)+16>>2]|0)+(E>>>14<<2)>>2]|0;S=P+32|0;M=c[S>>2]|0;D=c[P+40>>2]|0;V=c[P+28>>2]|0;d:do{if((M|0)==0){X=275}else{G=M+16|0;O=0;while(1){if((O|0)>=(D|0)){break}La=d[V+(O<<3)+5|0]|0;if((a[V+(O<<3)+4|0]|0)==0){Sa=c[(c[C+(La<<2)>>2]|0)+8>>2]|0}else{Sa=F+(La<<4)|0}if((c[(c[G+(O<<2)>>2]|0)+8>>2]|0)==(Sa|0)){O=O+1|0}else{X=275;break d}}c[Z>>2]=M;c[F+(Y<<4)+8>>2]=70}}while(0);if((X|0)==275){X=0;M=Yf(b,D)|0;c[M+12>>2]=P;c[Z>>2]=M;c[F+(Y<<4)+8>>2]=70;if((D|0)>0){O=M+16|0;G=0;do{Ra=d[V+(G<<3)+5|0]|0;if((a[V+(G<<3)+4|0]|0)==0){c[O+(G<<2)>>2]=c[C+(Ra<<2)>>2]}else{c[O+(G<<2)>>2]=_f(b,F+(Ra<<4)|0)|0}G=G+1|0;}while((G|0)<(D|0))}if((a[P+5|0]&4)!=0){hg(b,P,M)}c[S>>2]=M}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);sg(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 38:{D=(E>>>23)-1|0;G=(F-(c[u>>2]|0)>>4)-(d[(c[w>>2]|0)+76|0]|0)|0;O=G-1|0;if((D|0)<0){if(((c[o>>2]|0)-(c[n>>2]|0)>>4|0)<=(O|0)){Hf(b,O)}V=c[y>>2]|0;c[n>>2]=V+(O+Y<<4);Ta=V;Ua=O;Va=V+(Y<<4)|0}else{Ta=F;Ua=D;Va=Z}if((Ua|0)<=0){A=Ta;continue b}D=1-G|0;G=0;while(1){if((G|0)<(O|0)){V=G+D|0;Ra=Ta+(V<<4)|0;La=Va+(G<<4)|0;R=c[Ra+4>>2]|0;c[La>>2]=c[Ra>>2];c[La+4>>2]=R;c[Va+(G<<4)+8>>2]=c[Ta+(V<<4)+8>>2]}else{c[Va+(G<<4)+8>>2]=0}V=G+1|0;if((V|0)<(Ua|0)){G=V}else{A=Ta;continue b}}break};default:{A=F;continue b}}G=c[Oa+24>>2]|0;if((G|0)==0){A=Ma;continue}D=Oa+16|0;O=Oa;M=c[D+4>>2]|0;c[O>>2]=c[D>>2];c[O+4>>2]=M;c[Oa+8>>2]=G;c[z>>2]=(c[z>>2]|0)+((Na>>>14)-131071<<2);A=Ma}if((X|0)==213){X=0;A=c[k>>2]|0;z=A+18|0;a[z]=a[z]|4;t=A;continue}else if((X|0)==218){X=0;A=c[k>>2]|0;z=c[A+8>>2]|0;y=c[A>>2]|0;u=c[z>>2]|0;B=A+24|0;C=(c[B>>2]|0)+(d[(c[(c[y>>2]|0)+12>>2]|0)+76|0]<<4)|0;if((c[(c[w>>2]|0)+56>>2]|0)>0){ag(b,c[z+24>>2]|0)}if(y>>>0<C>>>0){x=0;v=y;do{G=v;M=u+(x<<4)|0;O=c[G+4>>2]|0;c[M>>2]=c[G>>2];c[M+4>>2]=O;c[u+(x<<4)+8>>2]=c[y+(x<<4)+8>>2];x=x+1|0;v=y+(x<<4)|0;}while(v>>>0<C>>>0)}C=y;c[z+24>>2]=u+((c[B>>2]|0)-C>>4<<4);v=u+((c[n>>2]|0)-C>>4<<4)|0;c[n>>2]=v;c[z+4>>2]=v;c[z+28>>2]=c[A+28>>2];v=z+18|0;a[v]=a[v]|64;c[k>>2]=z;t=z;continue}else if((X|0)==223){X=0;v=E>>>23;if((v|0)!=0){c[n>>2]=F+(v-1+Y<<4)}if((c[(c[w>>2]|0)+56>>2]|0)>0){ag(b,F)}v=Lf(b,Z)|0;if((a[t+18|0]&4)==0){X=228;break}C=c[k>>2]|0;if((v|0)==0){t=C;continue}c[n>>2]=c[C+4>>2];t=C;continue}}if((X|0)==23){if(!J){Wa=c[L>>2]|0;Xa=Wa;Ya=Xa-4|0;Za=Ya;c[L>>2]=Za;_a=a[K]|0;$a=_a|-128;a[K]=$a;ab=c[n>>2]|0;bb=ab-16|0;cb=I|0;c[cb>>2]=bb;Ef(b,1)}c[p>>2]=1;Wa=c[L>>2]|0;Xa=Wa;Ya=Xa-4|0;Za=Ya;c[L>>2]=Za;_a=a[K]|0;$a=_a|-128;a[K]=$a;ab=c[n>>2]|0;bb=ab-16|0;cb=I|0;c[cb>>2]=bb;Ef(b,1)}else if((X|0)==228){i=e;return}else if((X|0)==239){zf(b,3648,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}else if((X|0)==244){zf(b,3192,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}else if((X|0)==249){zf(b,2824,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}}function kk(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;e=b|0;f=Fc[c[a+8>>2]&15](c[a+16>>2]|0,c[a+12>>2]|0,e)|0;if((f|0)==0){g=-1;i=b;return g|0}h=c[e>>2]|0;if((h|0)==0){g=-1;i=b;return g|0}c[a>>2]=h-1;c[a+4>>2]=f+1;g=d[f]|0;i=b;return g|0}function lk(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[b+16>>2]=a;c[b+8>>2]=d;c[b+12>>2]=e;c[b>>2]=0;c[b+4>>2]=0;return}function mk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+8|0;f=e|0;if((d|0)==0){g=0;i=e;return g|0}h=a|0;j=a+16|0;k=a+8|0;l=a+12|0;m=a+4|0;a=b;b=d;d=c[h>>2]|0;while(1){if((d|0)==0){n=Fc[c[k>>2]&15](c[j>>2]|0,c[l>>2]|0,f)|0;if((n|0)==0){g=b;o=9;break}p=c[f>>2]|0;if((p|0)==0){g=b;o=9;break}c[h>>2]=p;c[m>>2]=n;q=p;r=n}else{q=d;r=c[m>>2]|0}n=b>>>0>q>>>0?q:b;Vm(a|0,r|0,n)|0;p=(c[h>>2]|0)-n|0;c[h>>2]=p;c[m>>2]=(c[m>>2]|0)+n;if((b|0)==(n|0)){g=0;o=9;break}else{a=a+n|0;b=b-n|0;d=p}}if((o|0)==9){i=e;return g|0}return 0}function nk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b+8|0;f=c[e>>2]|0;if(f>>>0>=d>>>0){g=c[b>>2]|0;return g|0}h=d>>>0<32>>>0?32:d;if((h+1|0)>>>0>4294967293>>>0){Fh(a);return 0}d=b|0;b=Gh(a,c[d>>2]|0,f,h)|0;c[d>>2]=b;c[e>>2]=h;g=b;return g|0}function ok(a){a=a|0;Sd(a,0,2);ff(a,1616,0);return 1}function pk(a){a=a|0;Cd(a,+(tc(De(a,1,8224,0)|0)|0));return 1}function qk(a){a=a|0;Gd(a,wa(De(a,1,8224,0)|0)|0)|0;return 1}function rk(a){a=a|0;Rd(a,-1001e3,2);Rd(a,-1001e3,2);Xd(a,-2,3880);ff(a,2272,0);Fd(a,10400,7)|0;Xd(a,-2,8208);return 1}function sk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((vd(a,1)|0)==0){d=De(a,2,3968,0)|0;e=te(a,4032,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;g=e;i=b;return g|0}else{g=ed(a)|0;i=b;return g|0}return 0}function tk(a){a=a|0;var b=0,d=0,e=0;b=c[1496+((Ce(a,1,4800,1544)|0)<<2)>>2]|0;d=he(a,b,Me(a,2,0)|0)|0;if((b|0)==5|(b|0)==9){Kd(a,d);e=1;return e|0}else if((b|0)==3){b=he(a,4,0)|0;Cd(a,+(d|0)+ +(b|0)*.0009765625);Dd(a,b);e=2;return e|0}else{Dd(a,d);e=1;return e|0}return 0}function uk(a){a=a|0;var b=0,c=0;b=De(a,1,0,0)|0;fd(a,1);if((Ve(a,b,0)|0)==0){be(a,0,-1,0,188);c=(ed(a)|0)-1|0;return c|0}else{c=ie(a)|0;return c|0}return 0}function vk(a){a=a|0;var b=0,c=0;b=Me(a,2,1)|0;fd(a,1);if(!((pd(a,1)|0)!=0&(b|0)>0)){c=ie(a)|0;return c|0}ve(a,b);kd(a,1);ke(a,2);c=ie(a)|0;return c|0}function wk(a){a=a|0;He(a,1);if((Td(a,1)|0)==0){Bd(a);return 1}else{_e(a,1,7128)|0;return 1}return 0}function xk(a){a=a|0;Qk(a,5192,1,172);return 3}function yk(a){a=a|0;var b=0,c=0,d=0,e=0;b=De(a,1,0,0)|0;c=De(a,2,0,0)|0;d=(ld(a,3)|0)!=-1;if((Ve(a,b,c)|0)!=0){Bd(a);hd(a,-2);e=2;return e|0}if(!d){e=1;return e|0}kd(a,d?3:0);if((oe(a,-2,1)|0)!=0){e=1;return e|0}fd(a,-2);e=1;return e|0}function zk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+8|0;d=b|0;e=wd(a,1,d)|0;f=De(a,3,5872,0)|0;g=(ld(a,4)|0)!=-1;if((e|0)==0){h=De(a,2,5744,0)|0;Ge(a,1,6);fd(a,5);j=ee(a,10,0,h,f)|0}else{h=De(a,2,e,0)|0;j=Ye(a,e,c[d>>2]|0,h,f)|0}if((j|0)!=0){Bd(a);hd(a,-2);k=2;i=b;return k|0}if(!g){k=1;i=b;return k|0}kd(a,g?4:0);if((oe(a,-2,1)|0)!=0){k=1;i=b;return k|0}fd(a,-2);k=1;i=b;return k|0}function Ak(a){a=a|0;var b=0;Ge(a,1,5);fd(a,2);if((je(a,1)|0)!=0){b=2;return b|0}Bd(a);b=1;return b|0}function Bk(a){a=a|0;Qk(a,6024,0,28);return 3}function Ck(a){a=a|0;He(a,1);Bd(a);hd(a,1);return Pk(a,(ce(a,(ed(a)|0)-2|0,-1,0,0,26)|0)==0|0)|0}function Dk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=ed(a)|0;Nd(a,8696);f=c[q>>2]|0;a:do{if((e|0)>=1){g=1;while(1){kd(a,-1);kd(a,g);be(a,1,1,0,0);h=wd(a,-1,d)|0;if((h|0)==0){break}if((g|0)>1){ya(9,f|0)|0}za(h|0,1,c[d>>2]|0,f|0)|0;fd(a,-2);g=g+1|0;if((g|0)>(e|0)){break a}}g=te(a,6392,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=g;i=b;return j|0}}while(0);ya(10,f|0)|0;xa(f|0)|0;j=0;i=b;return j|0}function Ek(a){a=a|0;He(a,1);He(a,2);Kd(a,qd(a,1,2)|0);return 1}function Fk(a){a=a|0;if(((ld(a,1)|0)-4|0)>>>0>=2>>>0){se(a,1,6584)|0}Dd(a,xd(a,1)|0);return 1}function Gk(a){a=a|0;Ge(a,1,5);He(a,2);fd(a,2);Qd(a,1);return 1}function Hk(a){a=a|0;Ge(a,1,5);He(a,2);He(a,3);fd(a,3);Yd(a,1);return 1}function Ik(b){b=b|0;var c=0,d=0,e=0,f=0;c=ed(b)|0;do{if((ld(b,1)|0)==4){if((a[wd(b,1,0)|0]|0)!=35){break}Dd(b,c-1|0);d=1;return d|0}}while(0);e=Ke(b,1)|0;if((e|0)<0){f=e+c|0}else{f=(e|0)>(c|0)?c:e}if((f|0)<=0){se(b,1,6728)|0}d=c-f|0;return d|0}function Jk(a){a=a|0;var b=0,d=0,e=0;b=i;d=ld(a,2)|0;Ge(a,1,5);if(!((d|0)==5|(d|0)==0)){se(a,2,7296)|0}if((_e(a,1,7128)|0)==0){fd(a,2);_d(a,1)|0;e=1;i=b;return e|0}else{d=te(a,6928,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function Kk(b){b=b|0;var e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0.0,u=0,v=0.0,w=0.0;e=i;i=i+16|0;f=e|0;g=e+8|0;do{if((ld(b,2)|0)<1){h=+sd(b,1,f);if((c[f>>2]|0)==0){He(b,1);break}Cd(b,h);i=e;return 1}else{j=Ee(b,1,g)|0;k=j+(c[g>>2]|0)|0;l=Ke(b,2)|0;if((l-2|0)>>>0>=35>>>0){se(b,2,7624)|0}m=Sb(j|0,7480)|0;n=j+m|0;o=a[n]|0;if((o<<24>>24|0)==45){p=1;q=j+(m+1)|0}else if((o<<24>>24|0)==43){p=0;q=j+(m+1)|0}else{p=0;q=n}if((Db(d[q]|0|0)|0)==0){break}h=+(l|0);r=0.0;n=q;while(1){m=a[n]|0;j=m&255;if((j-48|0)>>>0<10>>>0){s=(m<<24>>24)-48|0}else{s=(wb(j|0)|0)-55|0}if((s|0)>=(l|0)){t=r;u=n;break}v=h*r+ +(s|0);j=n+1|0;if((Db(d[j]|0|0)|0)==0){t=v;u=j;break}else{r=v;n=j}}if((u+(Sb(u|0,7480)|0)|0)!=(k|0)){break}if((p|0)==0){w=t}else{w=-0.0-t}Cd(b,w);i=e;return 1}}while(0);Bd(b);i=e;return 1}function Lk(a){a=a|0;He(a,1);bf(a,1,0)|0;return 1}function Mk(a){a=a|0;He(a,1);Gd(a,md(a,ld(a,1)|0)|0)|0;return 1}function Nk(a){a=a|0;var b=0;b=ed(a)|0;if((b|0)<=1){se(a,2,8040)|0}kd(a,1);jd(a,2,1);id(a,2);return Pk(a,(ce(a,b-2|0,-1,1,0,26)|0)==0|0)|0}function Ok(a){a=a|0;return Pk(a,(ae(a,0)|0)==1|0)|0}function Pk(a,b){a=a|0;b=b|0;var c=0;if((_c(a,1)|0)==0){fd(a,0);Kd(a,0);Gd(a,7808)|0;c=2;return c|0}else{Kd(a,b);id(a,1);c=ed(a)|0;return c|0}return 0}function Qk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((_e(a,1,b)|0)!=0){kd(a,1);be(a,1,3,0,0);return}Ge(a,1,5);Jd(a,d,0);kd(a,1);if((c|0)==0){Bd(a);return}else{Dd(a,0);return}}function Rk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;Fe(a,2,5568);kd(a,1);be(a,0,1,0,0);if((ld(a,-1)|0)==0){fd(a,-2);c[d>>2]=0;e=0;i=b;return e|0}if((pd(a,-1)|0)==0){te(a,5392,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f}id(a,5);e=wd(a,5,d)|0;i=b;return e|0}function Sk(a){a=a|0;var b=0,c=0;b=Ke(a,2)|0;Ge(a,1,5);c=b+1|0;Dd(a,c);Rd(a,1,c);c=(ld(a,-1)|0)==0;return(c?1:2)|0}function Tk(a){a=a|0;return(ed(a)|0)-1|0}function Uk(a){a=a|0;Sd(a,0,12);ff(a,2168,0);return 1}function Vk(a){a=a|0;var b=0,c=0,d=0,e=0;b=Le(a,1)|0;c=Ke(a,2)|0;if((c|0)>-1&(b|0)<0){if((c|0)>31){d=-1}else{d=b>>>(c>>>0)|~(-1>>>(c>>>0))}Ed(a,d);return 1}d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0)}else{e=(d|0)>31?0:b<<d}Ed(a,e);return 1}function Wk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=ed(a)|0;if((b|0)<1){c=-1}else{d=1;e=-1;while(1){f=(Le(a,d)|0)&e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}Ed(a,c);return 1}function Xk(a){a=a|0;Ed(a,~(Le(a,1)|0));return 1}function Yk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=ed(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=Le(a,d)|0|e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}Ed(a,c);return 1}function Zk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=ed(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=(Le(a,d)|0)^e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}Ed(a,c);return 1}function _k(a){a=a|0;var b=0,c=0,d=0,e=0;b=ed(a)|0;if((b|0)<1){c=1}else{d=1;e=-1;do{e=(Le(a,d)|0)&e;d=d+1|0;}while((d|0)<=(b|0));c=(e|0)!=0|0}Kd(a,c);return 1}function $k(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Le(a,1)|0;e=Ke(a,2)|0;f=Me(a,3,1)|0;if((e|0)<=-1){se(a,2,11192)|0}if((f|0)<=0){se(a,3,10848)|0}if((f+e|0)>32){te(a,10648,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}Ed(a,d>>>(e>>>0)&~(-2<<f-1));i=b;return 1}function al(a){a=a|0;var b=0,c=0,d=0;b=Ke(a,2)|0;c=Le(a,1)|0;d=b&31;Ed(a,c>>>((32-d|0)>>>0)|c<<d);return 1}function bl(a){a=a|0;var b=0,c=0,d=0,e=0;b=Le(a,1)|0;c=Ke(a,2)|0;if((c|0)<0){d=-c|0;e=(d|0)>31?0:b>>>(d>>>0);Ed(a,e);return 1}else{e=(c|0)>31?0:b<<c;Ed(a,e);return 1}return 0}function cl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=Le(a,1)|0;e=Le(a,2)|0;f=Ke(a,3)|0;g=Me(a,4,1)|0;if((f|0)<=-1){se(a,3,11192)|0}if((g|0)<=0){se(a,4,10848)|0}if((g+f|0)>32){te(a,10648,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}h=~(-2<<g-1);Ed(a,d&~(h<<f)|(e&h)<<f);i=b;return 1}function dl(a){a=a|0;var b=0,c=0,d=0;b=-(Ke(a,2)|0)|0;c=Le(a,1)|0;d=b&31;Ed(a,c>>>((32-d|0)>>>0)|c<<d);return 1}function el(a){a=a|0;var b=0,c=0,d=0,e=0;b=Le(a,1)|0;c=Ke(a,2)|0;d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0);Ed(a,e);return 1}else{e=(d|0)>31?0:b<<d;Ed(a,e);return 1}return 0}function fl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+b|0;f=e-1|0;g=c[a+20>>2]|0;do{if((g|0)>(c[a+24>>2]|0)){h=(c[(c[a>>2]|0)+12>>2]|0)+(g-1<<2)|0;i=c[h>>2]|0;if((i&63|0)!=4){break}j=i>>>6&255;k=j+(i>>>23)|0;if((j|0)>(b|0)){l=5}else{if((k+1|0)<(b|0)){l=5}}if((l|0)==5){if((j|0)<(b|0)|(j|0)>(e|0)){break}}m=(j|0)<(b|0)?j:b;c[h>>2]=((k|0)>(f|0)?k:f)-m<<23|m<<6&16320|i&8372287;return}}while(0);pl(a,b<<6|(d<<23)-8388608|4)|0;return}function gl(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return pl(a,c<<6|b|d<<23|e<<14)|0}function hl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=a+28|0;d=c[b>>2]|0;c[b>>2]=-1;b=pl(a,2147450903)|0;if((d|0)==-1){e=b;return e|0}if((b|0)==-1){e=d;return e|0}f=c[(c[a>>2]|0)+12>>2]|0;g=b;while(1){h=f+(g<<2)|0;i=c[h>>2]|0;j=(i>>>14)-131071|0;if((j|0)==-1){break}k=g+1+j|0;if((k|0)==-1){break}else{g=k}}f=d+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){tm(c[a+12>>2]|0,4768);return 0}c[h>>2]=(f<<14)+2147467264|i&16383;e=b;return e|0}function il(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return pl(a,c<<6|b|d<<14)|0}function jl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((d|0)==-1){return}e=c[b>>2]|0;if((e|0)==-1){c[b>>2]=d;return}b=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=b+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}b=~f+d|0;if((((b|0)>-1?b:-b|0)|0)>131071){tm(c[a+12>>2]|0,4768)}c[g>>2]=h&16383|(b<<14)+2147467264;return}function kl(a,b,c){a=a|0;b=b|0;c=c|0;pl(a,b<<6|(c<<23)+8388608|31)|0;return}function ll(a){a=a|0;var b=0;b=c[a+20>>2]|0;c[a+24>>2]=b;return b|0}function ml(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((c[b+20>>2]|0)==(e|0)){c[b+24>>2]=e;f=b+28|0;if((d|0)==-1){return}g=c[f>>2]|0;if((g|0)==-1){c[f>>2]=d;return}f=c[(c[b>>2]|0)+12>>2]|0;h=g;while(1){i=f+(h<<2)|0;j=c[i>>2]|0;g=(j>>>14)-131071|0;if((g|0)==-1){break}k=h+1+g|0;if((k|0)==-1){break}else{h=k}}f=~h+d|0;if((((f|0)>-1?f:-f|0)|0)>131071){tm(c[b+12>>2]|0,4768)}c[i>>2]=(f<<14)+2147467264|j&16383;return}if((d|0)==-1){return}j=b|0;f=d;while(1){d=c[(c[j>>2]|0)+12>>2]|0;i=d+(f<<2)|0;h=c[i>>2]|0;k=(h>>>14)-131071|0;if((k|0)==-1){l=-1}else{l=f+1+k|0}if((f|0)>0){k=d+(f-1<<2)|0;d=c[k>>2]|0;if((a[1184+(d&63)|0]|0)<0){m=k;n=d}else{o=17}}else{o=17}if((o|0)==17){o=0;m=i;n=h}if((n&63|0)==28){c[m>>2]=n&8372224|n>>>23<<6|27;d=(c[(c[j>>2]|0)+12>>2]|0)+(f<<2)|0;k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=20;break}c[d>>2]=c[d>>2]&16383|(k<<14)+2147467264}else{k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=23;break}c[i>>2]=h&16383|(k<<14)+2147467264}if((l|0)==-1){o=26;break}else{f=l}}if((o|0)==20){tm(c[b+12>>2]|0,4768)}else if((o|0)==23){tm(c[b+12>>2]|0,4768)}else if((o|0)==26){return}}function nl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;c[a+24>>2]=c[a+20>>2];d=a+28|0;if((b|0)==-1){return}e=c[d>>2]|0;if((e|0)==-1){c[d>>2]=b;return}d=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=d+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}d=~f+b|0;if((((d|0)>-1?d:-d|0)|0)>131071){tm(c[a+12>>2]|0,4768)}c[g>>2]=(d<<14)+2147467264|h&16383;return}function ol(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((b|0)==-1){return}e=a|0;a=(d<<6)+64&16320;d=b;while(1){f=(c[(c[e>>2]|0)+12>>2]|0)+(d<<2)|0;g=c[f>>2]|0;b=(g>>>14)-131071|0;if((b|0)==-1){break}h=d+1+b|0;c[f>>2]=g&-16321|a;if((h|0)==-1){i=6;break}else{d=h}}if((i|0)==6){return}c[f>>2]=g&-16321|a;return}function pl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=b|0;f=c[e>>2]|0;g=b+28|0;h=c[g>>2]|0;i=b+20|0;j=c[i>>2]|0;do{if((h|0)==-1){k=j}else{l=h;m=f;while(1){n=c[m+12>>2]|0;o=n+(l<<2)|0;p=c[o>>2]|0;q=(p>>>14)-131071|0;if((q|0)==-1){r=-1}else{r=l+1+q|0}if((l|0)>0){q=n+(l-1<<2)|0;n=c[q>>2]|0;if((a[1184+(n&63)|0]|0)<0){s=q;t=n}else{u=6}}else{u=6}if((u|0)==6){u=0;s=o;t=p}if((t&63|0)==28){c[s>>2]=t&8372224|t>>>23<<6|27;n=(c[(c[e>>2]|0)+12>>2]|0)+(l<<2)|0;q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=9;break}c[n>>2]=c[n>>2]&16383|(q<<14)+2147467264}else{q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=12;break}c[o>>2]=p&16383|(q<<14)+2147467264}if((r|0)==-1){u=16;break}l=r;m=c[e>>2]|0}if((u|0)==9){tm(c[b+12>>2]|0,4768);return 0}else if((u|0)==12){tm(c[b+12>>2]|0,4768);return 0}else if((u|0)==16){k=c[i>>2]|0;break}}}while(0);c[g>>2]=-1;g=f+48|0;if((k+1|0)>(c[g>>2]|0)){u=f+12|0;e=Eh(c[(c[b+12>>2]|0)+52>>2]|0,c[u>>2]|0,g,4,2147483645,6232)|0;c[u>>2]=e;v=c[i>>2]|0;w=e}else{v=k;w=c[f+12>>2]|0}c[w+(v<<2)>>2]=d;d=c[i>>2]|0;v=f+52|0;if((d+1|0)>(c[v>>2]|0)){w=b+12|0;k=f+20|0;e=Eh(c[(c[w>>2]|0)+52>>2]|0,c[k>>2]|0,v,4,2147483645,6232)|0;c[k>>2]=e;x=c[i>>2]|0;y=e;z=w;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}else{x=d;y=c[f+20>>2]|0;z=b+12|0;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}return 0}function ql(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b<<6;if((c|0)<262144){e=pl(a,d|c<<14|1)|0;return e|0}else{b=pl(a,d|2)|0;pl(a,c<<6|39)|0;e=b;return e|0}return 0}function rl(b,e){b=b|0;e=e|0;var f=0;f=(d[b+48|0]|0)+e|0;e=(c[b>>2]|0)+78|0;if((f|0)<=(d[e]|0|0)){return}if((f|0)>249){tm(c[b+12>>2]|0,3592)}a[e]=f;return}function sl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b+48|0;g=a[f]|0;h=(g&255)+e|0;i=(c[b>>2]|0)+78|0;if((h|0)<=(d[i]|0|0)){j=g;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}if((h|0)>249){tm(c[b+12>>2]|0,3592)}a[i]=h;j=a[f]|0;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}function tl(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;i=i+16|0;f=e|0;c[f>>2]=b;c[f+8>>2]=d[b+4|0]|0|64;b=ul(a,f,f)|0;i=e;return b|0}function ul(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;j=c[(c[b+12>>2]|0)+52>>2]|0;k=yj(j,c[b+4>>2]|0,d)|0;d=c[b>>2]|0;l=k+8|0;m=k|0;do{if((c[l>>2]|0)==3){h[g>>3]=+h[m>>3]+6755399441055744.0;k=c[g>>2]|0;n=c[d+8>>2]|0;if((c[n+(k<<4)+8>>2]|0)!=(c[e+8>>2]|0)){break}if((dk(0,n+(k<<4)|0,e)|0)==0){break}else{o=k}i=f;return o|0}}while(0);g=d+44|0;k=c[g>>2]|0;n=b+32|0;b=c[n>>2]|0;h[m>>3]=+(b|0);c[l>>2]=3;l=c[g>>2]|0;if((b+1|0)>(l|0)){m=d+8|0;c[m>>2]=Eh(j,c[m>>2]|0,g,16,67108863,8024)|0;p=c[g>>2]|0}else{p=l}l=d+8|0;if((k|0)<(p|0)){p=k;while(1){k=p+1|0;c[(c[l>>2]|0)+(p<<4)+8>>2]=0;if((k|0)<(c[g>>2]|0)){p=k}else{break}}}p=c[l>>2]|0;l=e;g=p+(b<<4)|0;k=c[l+4>>2]|0;c[g>>2]=c[l>>2];c[g+4>>2]=k;k=e+8|0;c[p+(b<<4)+8>>2]=c[k>>2];c[n>>2]=(c[n>>2]|0)+1;if((c[k>>2]&64|0)==0){o=b;i=f;return o|0}k=c[e>>2]|0;if((a[k+5|0]&3)==0){o=b;i=f;return o|0}if((a[d+5|0]&4)==0){o=b;i=f;return o|0}eg(j,d,k);o=b;i=f;return o|0}function vl(a,b){a=a|0;b=+b;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h[f>>3]=b;j=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=b;c[g+8>>2]=3;if(b==0.0){k=j+8|0;l=c[k>>2]|0;c[k>>2]=l+16;m=Yi(j,f,8)|0;c[l>>2]=m;c[l+8>>2]=d[m+4|0]|0|64;m=ul(a,(c[k>>2]|0)-16|0,g)|0;c[k>>2]=(c[k>>2]|0)-16;n=m;i=e;return n|0}else{n=ul(a,g,g)|0;i=e;return n|0}return 0}function wl(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=c[e>>2]|0;if((g|0)==12){h=(c[(c[b>>2]|0)+12>>2]|0)+(c[e+8>>2]<<2)|0;c[h>>2]=c[h>>2]&-8372225|(f<<14)+16384&8372224;return}else if((g|0)==13){g=e+8|0;e=b|0;h=(c[(c[e>>2]|0)+12>>2]|0)+(c[g>>2]<<2)|0;c[h>>2]=c[h>>2]&8388607|(f<<23)+8388608;f=(c[(c[e>>2]|0)+12>>2]|0)+(c[g>>2]<<2)|0;g=b+48|0;c[f>>2]=(d[g]|0)<<6|c[f>>2]&-16321;f=a[g]|0;h=(f&255)+1|0;i=(c[e>>2]|0)+78|0;do{if(h>>>0>(d[i]|0)>>>0){if(h>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}else{a[i]=h;j=a[g]|0;break}}else{j=f}}while(0);a[g]=j+1;return}else{return}}function xl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b|0;e=c[d>>2]|0;if((e|0)==12){c[d>>2]=6;f=b+8|0;c[f>>2]=(c[(c[(c[a>>2]|0)+12>>2]|0)+(c[f>>2]<<2)>>2]|0)>>>6&255;return}else if((e|0)==13){e=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[e>>2]=c[e>>2]&8388607|16777216;c[d>>2]=11;return}else{return}}function yl(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=f|0;switch(c[g>>2]|0){case 13:{h=(c[(c[e>>2]|0)+12>>2]|0)+(c[f+8>>2]<<2)|0;c[h>>2]=c[h>>2]&8388607|16777216;c[g>>2]=11;return};case 7:{c[g>>2]=6;return};case 12:{c[g>>2]=6;h=f+8|0;c[h>>2]=(c[(c[(c[e>>2]|0)+12>>2]|0)+(c[h>>2]<<2)>>2]|0)>>>6&255;return};case 8:{h=f+8|0;c[h>>2]=pl(e,c[h>>2]<<23|5)|0;c[g>>2]=11;return};case 9:{h=f+8|0;f=h;i=h;j=b[i>>1]|0;do{if((j&256|0)==0){if((d[e+46|0]|0)>(j|0)){break}k=e+48|0;a[k]=(a[k]|0)-1}}while(0);j=f+2|0;do{if((a[f+3|0]|0)==7){if((d[e+46|0]|0)>>>0>(d[j]|0)>>>0){l=7;break}k=e+48|0;a[k]=(a[k]|0)-1;l=7}else{l=6}}while(0);c[h>>2]=pl(e,d[j]<<23|l|b[i>>1]<<14)|0;c[g>>2]=11;return};default:{return}}}function zl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;yl(b,e);do{if((c[e>>2]|0)==6){f=c[e+8>>2]|0;if((f&256|0)!=0){break}if((d[b+46|0]|0|0)>(f|0)){break}f=b+48|0;a[f]=(a[f]|0)-1}}while(0);f=b+48|0;g=a[f]|0;h=(g&255)+1|0;i=(c[b>>2]|0)+78|0;if(h>>>0<=(d[i]|0)>>>0){j=g;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;Al(b,e,m);return}if(h>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}a[i]=h;j=a[f]|0;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;Al(b,e,m);return}function Al(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;Rl(b,d,e);f=d|0;g=d+16|0;do{if((c[f>>2]|0)==10){h=c[d+8>>2]|0;if((h|0)==-1){break}i=c[g>>2]|0;if((i|0)==-1){c[g>>2]=h;break}j=c[(c[b>>2]|0)+12>>2]|0;k=i;while(1){l=j+(k<<2)|0;m=c[l>>2]|0;i=(m>>>14)-131071|0;if((i|0)==-1){break}n=k+1+i|0;if((n|0)==-1){break}else{k=n}}j=h+~k|0;if((((j|0)>-1?j:-j|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[l>>2]=(j<<14)+2147467264|m&16383;break}}}while(0);m=c[g>>2]|0;l=d+20|0;j=c[l>>2]|0;if((m|0)==(j|0)){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}a:do{if((m|0)==-1){q=20}else{n=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){r=n+(i<<2)|0;if((i|0)>0){s=c[n+(i-1<<2)>>2]|0;if((a[1184+(s&63)|0]|0)<0){t=s}else{q=16}}else{q=16}if((q|0)==16){q=0;t=c[r>>2]|0}if((t&63|0)!=28){q=28;break a}s=((c[r>>2]|0)>>>14)-131071|0;if((s|0)==-1){q=20;break a}r=i+1+s|0;if((r|0)==-1){q=20;break}else{i=r}}}}while(0);b:do{if((q|0)==20){if((j|0)==-1){u=-1;v=-1;break}t=c[(c[b>>2]|0)+12>>2]|0;m=j;while(1){i=t+(m<<2)|0;if((m|0)>0){n=c[t+(m-1<<2)>>2]|0;if((a[1184+(n&63)|0]|0)<0){w=n}else{q=24}}else{q=24}if((q|0)==24){q=0;w=c[i>>2]|0}if((w&63|0)!=28){q=28;break b}n=((c[i>>2]|0)>>>14)-131071|0;if((n|0)==-1){u=-1;v=-1;break b}i=m+1+n|0;if((i|0)==-1){u=-1;v=-1;break}else{m=i}}}}while(0);do{if((q|0)==28){w=b+28|0;do{if((c[f>>2]|0)==10){x=-1}else{j=c[w>>2]|0;c[w>>2]=-1;m=pl(b,2147450903)|0;if((j|0)==-1){x=m;break}if((m|0)==-1){x=j;break}t=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){y=t+(i<<2)|0;z=c[y>>2]|0;n=(z>>>14)-131071|0;if((n|0)==-1){break}k=i+1+n|0;if((k|0)==-1){break}else{i=k}}t=j+~i|0;if((((t|0)>-1?t:-t|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[y>>2]=(t<<14)+2147467264|z&16383;x=m;break}}}while(0);t=b+20|0;k=b+24|0;c[k>>2]=c[t>>2];n=e<<6;h=pl(b,n|16387)|0;c[k>>2]=c[t>>2];r=pl(b,n|8388611)|0;c[k>>2]=c[t>>2];if((x|0)==-1){u=h;v=r;break}t=c[w>>2]|0;if((t|0)==-1){c[w>>2]=x;u=h;v=r;break}k=c[(c[b>>2]|0)+12>>2]|0;n=t;while(1){A=k+(n<<2)|0;B=c[A>>2]|0;t=(B>>>14)-131071|0;if((t|0)==-1){break}s=n+1+t|0;if((s|0)==-1){break}else{n=s}}k=x+~n|0;if((((k|0)>-1?k:-k|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[A>>2]=(k<<14)+2147467264|B&16383;u=h;v=r;break}}}while(0);B=c[b+20>>2]|0;c[b+24>>2]=B;A=c[l>>2]|0;c:do{if((A|0)!=-1){x=b|0;z=(e|0)==255;y=e<<6&16320;k=A;while(1){w=c[(c[x>>2]|0)+12>>2]|0;s=w+(k<<2)|0;t=c[s>>2]|0;C=(t>>>14)-131071|0;if((C|0)==-1){D=-1}else{D=k+1+C|0}if((k|0)>0){C=w+(k-1<<2)|0;w=c[C>>2]|0;if((a[1184+(w&63)|0]|0)<0){E=C;F=w}else{q=52}}else{q=52}if((q|0)==52){q=0;E=s;F=t}if((F&63|0)==28){w=F>>>23;if(z|(w|0)==(e|0)){G=F&8372224|w<<6|27}else{G=F&-16321|y}c[E>>2]=G;w=(c[(c[x>>2]|0)+12>>2]|0)+(k<<2)|0;C=B+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=58;break}c[w>>2]=c[w>>2]&16383|(C<<14)+2147467264}else{C=u+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=61;break}c[s>>2]=t&16383|(C<<14)+2147467264}if((D|0)==-1){break c}else{k=D}}if((q|0)==58){tm(c[b+12>>2]|0,4768)}else if((q|0)==61){tm(c[b+12>>2]|0,4768)}}}while(0);D=c[g>>2]|0;if((D|0)==-1){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}u=b|0;G=e<<6;E=G&16320;if((e|0)==255){F=D;while(1){A=c[(c[u>>2]|0)+12>>2]|0;k=A+(F<<2)|0;x=c[k>>2]|0;y=(x>>>14)-131071|0;if((y|0)==-1){H=-1}else{H=F+1+y|0}if((F|0)>0){y=A+(F-1<<2)|0;A=c[y>>2]|0;if((a[1184+(A&63)|0]|0)<0){I=y;J=A}else{q=70}}else{q=70}if((q|0)==70){q=0;I=k;J=x}if((J&63|0)==28){c[I>>2]=J&8372224|J>>>23<<6|27;A=(c[(c[u>>2]|0)+12>>2]|0)+(F<<2)|0;y=B+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=87;break}c[A>>2]=c[A>>2]&16383|(y<<14)+2147467264}else{y=v+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=90;break}c[k>>2]=x&16383|(y<<14)+2147467264}if((H|0)==-1){q=93;break}else{F=H}}if((q|0)==87){K=b+12|0;L=c[K>>2]|0;tm(L,4768)}else if((q|0)==90){M=b+12|0;N=c[M>>2]|0;tm(N,4768)}else if((q|0)==93){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}else{O=D}while(1){D=c[(c[u>>2]|0)+12>>2]|0;H=D+(O<<2)|0;F=c[H>>2]|0;J=(F>>>14)-131071|0;if((J|0)==-1){P=-1}else{P=O+1+J|0}if((O|0)>0){J=D+(O-1<<2)|0;D=c[J>>2]|0;if((a[1184+(D&63)|0]|0)<0){Q=J;R=D}else{q=81}}else{q=81}if((q|0)==81){q=0;Q=H;R=F}if((R&63|0)==28){if((R>>>23|0)==(e|0)){S=R&8372224|G|27}else{S=R&-16321|E}c[Q>>2]=S;D=(c[(c[u>>2]|0)+12>>2]|0)+(O<<2)|0;J=B+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=87;break}c[D>>2]=c[D>>2]&16383|(J<<14)+2147467264}else{J=v+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=90;break}c[H>>2]=F&16383|(J<<14)+2147467264}if((P|0)==-1){q=93;break}else{O=P}}if((q|0)==87){K=b+12|0;L=c[K>>2]|0;tm(L,4768)}else if((q|0)==90){M=b+12|0;N=c[M>>2]|0;tm(N,4768)}else if((q|0)==93){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}function Bl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;yl(a,b);do{if((c[b>>2]|0)==6){e=b+8|0;f=c[e>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){g=f;return g|0}if((f|0)<(d[a+46|0]|0|0)){h=e;break}Al(a,b,f);g=c[e>>2]|0;return g|0}else{h=b+8|0}}while(0);zl(a,b);g=c[h>>2]|0;return g|0}function Cl(a,b){a=a|0;b=b|0;var e=0,f=0;e=b|0;do{if((c[e>>2]|0)==8){if((c[b+16>>2]|0)!=(c[b+20>>2]|0)){break}return}}while(0);yl(a,b);do{if((c[e>>2]|0)==6){f=c[b+8>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){return}if((f|0)<(d[a+46|0]|0|0)){break}Al(a,b,f);return}}while(0);zl(a,b);return}function Dl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=b+16|0;f=b+20|0;if((c[e>>2]|0)==(c[f>>2]|0)){yl(a,b);return}yl(a,b);do{if((c[b>>2]|0)==6){g=c[b+8>>2]|0;if((c[e>>2]|0)==(c[f>>2]|0)){return}if((g|0)<(d[a+46|0]|0|0)){break}Al(a,b,g);return}}while(0);zl(a,b);return}function El(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0;e=i;i=i+72|0;f=e|0;g=e+8|0;j=e+24|0;k=e+40|0;l=e+56|0;m=b+16|0;n=b+20|0;o=(c[m>>2]|0)==(c[n>>2]|0);yl(a,b);p=b|0;a:do{if(!o){do{if((c[p>>2]|0)==6){q=c[b+8>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){break a}if((q|0)<(d[a+46|0]|0|0)){break}Al(a,b,q);break a}}while(0);zl(a,b)}}while(0);o=c[p>>2]|0;b:do{switch(o|0){case 4:{r=c[b+8>>2]|0;s=18;break};case 2:case 3:case 1:{if((c[a+32>>2]|0)>=256){break b}if((o|0)==1){c[l+8>>2]=0;c[k>>2]=c[a+4>>2];c[k+8>>2]=69;t=ul(a,k,l)|0}else{c[j>>2]=(o|0)==2;c[j+8>>2]=1;t=ul(a,j,j)|0}c[b+8>>2]=t;c[p>>2]=4;u=t|256;i=e;return u|0};case 5:{q=b+8|0;v=+h[q>>3];h[f>>3]=v;w=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=v;c[g+8>>2]=3;if(v==0.0){x=w+8|0;y=c[x>>2]|0;c[x>>2]=y+16;z=Yi(w,f,8)|0;c[y>>2]=z;c[y+8>>2]=d[z+4|0]|0|64;z=ul(a,(c[x>>2]|0)-16|0,g)|0;c[x>>2]=(c[x>>2]|0)-16;A=z}else{A=ul(a,g,g)|0}c[q>>2]=A;c[p>>2]=4;r=A;s=18;break};default:{}}}while(0);do{if((s|0)==18){if((r|0)>=256){break}u=r|256;i=e;return u|0}}while(0);yl(a,b);do{if((c[p>>2]|0)==6){r=b+8|0;s=c[r>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){u=s;i=e;return u|0}if((s|0)<(d[a+46|0]|0|0)){B=r;break}Al(a,b,s);u=c[r>>2]|0;i=e;return u|0}else{B=b+8|0}}while(0);zl(a,b);u=c[B>>2]|0;i=e;return u|0}function Fl(b,f,g){b=b|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=c[f>>2]|0;if((h|0)==7){do{if((c[g>>2]|0)==6){i=c[g+8>>2]|0;if((i&256|0)!=0){break}if((d[b+46|0]|0)>(i|0)){break}i=b+48|0;a[i]=(a[i]|0)-1}}while(0);Al(b,g,c[f+8>>2]|0);return}else if((h|0)==8){yl(b,g);do{if((c[g>>2]|0)==6){i=g+8|0;j=c[i>>2]|0;if((c[g+16>>2]|0)==(c[g+20>>2]|0)){k=j;break}if((j|0)<(d[b+46|0]|0)){l=i;m=12;break}Al(b,g,j);k=c[i>>2]|0}else{l=g+8|0;m=12}}while(0);if((m|0)==12){zl(b,g);k=c[l>>2]|0}pl(b,k<<6|c[f+8>>2]<<23|9)|0}else if((h|0)==9){h=f+8|0;f=h;k=(a[f+3|0]|0)==7?10:8;l=El(b,g)|0;pl(b,l<<14|k|d[f+2|0]<<6|e[h>>1]<<23)|0}if((c[g>>2]|0)!=6){return}h=c[g+8>>2]|0;if((h&256|0)!=0){return}if((d[b+46|0]|0)>(h|0)){return}h=b+48|0;a[h]=(a[h]|0)-1;return}function Gl(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;yl(b,e);g=e|0;do{if((c[g>>2]|0)==6){h=e+8|0;i=c[h>>2]|0;if((c[e+16>>2]|0)==(c[e+20>>2]|0)){j=h;break}if((i|0)<(d[b+46|0]|0|0)){k=h;l=6;break}Al(b,e,i);j=h}else{k=e+8|0;l=6}}while(0);if((l|0)==6){zl(b,e);j=k}k=c[j>>2]|0;do{if((c[g>>2]|0)==6){if((k&256|0)!=0){break}if((d[b+46|0]|0|0)>(k|0)){break}e=b+48|0;a[e]=(a[e]|0)-1}}while(0);e=b+48|0;c[j>>2]=d[e]|0;c[g>>2]=6;g=a[e]|0;l=(g&255)+2|0;h=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[h]|0)>>>0){if(l>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}else{a[h]=l;m=a[e]|0;break}}else{m=g}}while(0);a[e]=m+2;m=c[j>>2]|0;pl(b,k<<23|m<<6|(El(b,f)|0)<<14|12)|0;if((c[f>>2]|0)!=6){return}m=c[f+8>>2]|0;if((m&256|0)!=0){return}if((d[b+46|0]|0|0)>(m|0)){return}a[e]=(a[e]|0)-1;return}function Hl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;yl(b,e);f=e|0;g=c[f>>2]|0;a:do{if((g|0)==10){h=c[(c[b>>2]|0)+12>>2]|0;i=e+8|0;j=c[i>>2]|0;k=h+(j<<2)|0;if((j|0)>0){l=h+(j-1<<2)|0;j=c[l>>2]|0;if((a[1184+(j&63)|0]|0)<0){m=l;n=j}else{o=4}}else{o=4}if((o|0)==4){m=k;n=c[k>>2]|0}c[m>>2]=((n&16320|0)==0)<<6|n&-16321;p=c[i>>2]|0;o=18}else if(!((g|0)==4|(g|0)==5|(g|0)==2)){i=e+8|0;do{if((g|0)==11){k=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[i>>2]<<2)>>2]|0;if((k&63|0)!=20){o=9;break}j=b+20|0;c[j>>2]=(c[j>>2]|0)-1;p=Ql(b,27,k>>>23,0,1)|0;o=18;break a}else if((g|0)==6){o=14}else{o=9}}while(0);if((o|0)==9){k=b+48|0;j=a[k]|0;l=(j&255)+1|0;h=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[h]|0)>>>0){if(l>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}else{a[h]=l;q=a[k]|0;break}}else{q=j}}while(0);j=q+1&255;a[k]=j;Rl(b,e,(j&255)-1|0);if((c[f>>2]|0)==6){o=14}}do{if((o|0)==14){j=c[i>>2]|0;if((j&256|0)!=0){break}if((d[b+46|0]|0)>(j|0)){break}j=b+48|0;a[j]=(a[j]|0)-1}}while(0);p=Ql(b,28,255,c[i>>2]|0,0)|0;o=18}}while(0);do{if((o|0)==18){f=e+20|0;if((p|0)==-1){break}q=c[f>>2]|0;if((q|0)==-1){c[f>>2]=p;break}f=c[(c[b>>2]|0)+12>>2]|0;g=q;while(1){r=f+(g<<2)|0;s=c[r>>2]|0;q=(s>>>14)-131071|0;if((q|0)==-1){break}n=g+1+q|0;if((n|0)==-1){break}else{g=n}}f=p+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[r>>2]=(f<<14)+2147467264|s&16383;break}}}while(0);s=e+16|0;e=c[s>>2]|0;c[b+24>>2]=c[b+20>>2];r=b+28|0;if((e|0)==-1){c[s>>2]=-1;return}p=c[r>>2]|0;if((p|0)==-1){c[r>>2]=e;c[s>>2]=-1;return}r=c[(c[b>>2]|0)+12>>2]|0;o=p;while(1){t=r+(o<<2)|0;u=c[t>>2]|0;p=(u>>>14)-131071|0;if((p|0)==-1){break}f=o+1+p|0;if((f|0)==-1){break}else{o=f}}r=e+~o|0;if((((r|0)>-1?r:-r|0)|0)>131071){tm(c[b+12>>2]|0,4768)}c[t>>2]=(r<<14)+2147467264|u&16383;c[s>>2]=-1;return}function Il(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;yl(b,e);f=e|0;g=c[f>>2]|0;a:do{if((g|0)==10){h=c[e+8>>2]|0;i=15}else if(!((g|0)==1|(g|0)==3)){j=e+8|0;do{if((g|0)==11){k=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[j>>2]<<2)>>2]|0;if((k&63|0)!=20){i=6;break}l=b+20|0;c[l>>2]=(c[l>>2]|0)-1;h=Ql(b,27,k>>>23,0,0)|0;i=15;break a}else if((g|0)==6){i=11}else{i=6}}while(0);if((i|0)==6){k=b+48|0;l=a[k]|0;m=(l&255)+1|0;n=(c[b>>2]|0)+78|0;do{if(m>>>0>(d[n]|0)>>>0){if(m>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}else{a[n]=m;o=a[k]|0;break}}else{o=l}}while(0);l=o+1&255;a[k]=l;Rl(b,e,(l&255)-1|0);if((c[f>>2]|0)==6){i=11}}do{if((i|0)==11){l=c[j>>2]|0;if((l&256|0)!=0){break}if((d[b+46|0]|0|0)>(l|0)){break}l=b+48|0;a[l]=(a[l]|0)-1}}while(0);h=Ql(b,28,255,c[j>>2]|0,1)|0;i=15}}while(0);do{if((i|0)==15){f=e+16|0;if((h|0)==-1){break}o=c[f>>2]|0;if((o|0)==-1){c[f>>2]=h;break}f=c[(c[b>>2]|0)+12>>2]|0;g=o;while(1){p=f+(g<<2)|0;q=c[p>>2]|0;o=(q>>>14)-131071|0;if((o|0)==-1){break}k=g+1+o|0;if((k|0)==-1){break}else{g=k}}f=h+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[p>>2]=(f<<14)+2147467264|q&16383;break}}}while(0);q=e+20|0;e=c[q>>2]|0;c[b+24>>2]=c[b+20>>2];p=b+28|0;if((e|0)==-1){c[q>>2]=-1;return}h=c[p>>2]|0;if((h|0)==-1){c[p>>2]=e;c[q>>2]=-1;return}p=c[(c[b>>2]|0)+12>>2]|0;i=h;while(1){r=p+(i<<2)|0;s=c[r>>2]|0;h=(s>>>14)-131071|0;if((h|0)==-1){break}f=i+1+h|0;if((f|0)==-1){break}else{i=f}}p=e+~i|0;if((((p|0)>-1?p:-p|0)|0)>131071){tm(c[b+12>>2]|0,4768)}c[r>>2]=(p<<14)+2147467264|s&16383;c[q>>2]=-1;return}function Jl(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=e+8|0;h=g;a[h+2|0]=c[g>>2];b[g>>1]=El(d,f)|0;f=e|0;a[h+3|0]=(c[f>>2]|0)==8?8:7;c[f>>2]=9;return}



function Kl(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+24|0;k=j|0;c[k+20>>2]=-1;c[k+16>>2]=-1;c[k>>2]=5;h[k+8>>3]=0.0;if((e|0)==0){l=f|0;do{if((c[l>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}m=f+8|0;h[m>>3]=-0.0- +h[m>>3];i=j;return}}while(0);yl(b,f);do{if((c[l>>2]|0)==6){m=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((m|0)<(d[b+46|0]|0)){n=10;break}Al(b,f,m)}else{n=10}}while(0);if((n|0)==10){zl(b,f)}Ll(b,19,f,k,g);i=j;return}else if((e|0)==2){yl(b,f);do{if((c[f>>2]|0)==6){l=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((l|0)<(d[b+46|0]|0)){n=52;break}Al(b,f,l)}else{n=52}}while(0);if((n|0)==52){zl(b,f)}Ll(b,21,f,k,g);i=j;return}else if((e|0)==1){yl(b,f);e=f|0;a:do{switch(c[e>>2]|0){case 11:{g=b+48|0;k=a[g]|0;l=(k&255)+1|0;m=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[m]|0)>>>0){if(l>>>0>249>>>0){tm(c[b+12>>2]|0,3592)}else{a[m]=l;o=a[g]|0;break}}else{o=k}}while(0);k=o+1&255;a[g]=k;Rl(b,f,(k&255)-1|0);if((c[e>>2]|0)==6){n=25;break a}p=f+8|0;n=28;break};case 6:{n=25;break};case 1:case 3:{c[e>>2]=2;break};case 4:case 5:case 2:{c[e>>2]=3;break};case 10:{k=c[(c[b>>2]|0)+12>>2]|0;l=c[f+8>>2]|0;m=k+(l<<2)|0;if((l|0)>0){q=k+(l-1<<2)|0;l=c[q>>2]|0;if((a[1184+(l&63)|0]|0)<0){r=q;s=l}else{n=17}}else{n=17}if((n|0)==17){r=m;s=c[m>>2]|0}c[r>>2]=((s&16320|0)==0)<<6|s&-16321;break};default:{}}}while(0);do{if((n|0)==25){s=f+8|0;r=c[s>>2]|0;if((r&256|0)!=0){p=s;n=28;break}if((d[b+46|0]|0)>(r|0)){p=s;n=28;break}r=b+48|0;a[r]=(a[r]|0)-1;p=s;n=28}}while(0);if((n|0)==28){c[p>>2]=pl(b,c[p>>2]<<23|20)|0;c[e>>2]=11}e=f+20|0;p=c[e>>2]|0;s=f+16|0;f=c[s>>2]|0;c[e>>2]=f;c[s>>2]=p;if((f|0)==-1){t=p}else{p=b|0;e=f;f=c[(c[p>>2]|0)+12>>2]|0;while(1){r=f+(e<<2)|0;if((e|0)>0){o=f+(e-1<<2)|0;m=c[o>>2]|0;if((a[1184+(m&63)|0]|0)<0){u=o;v=m}else{n=33}}else{n=33}if((n|0)==33){n=0;u=r;v=c[r>>2]|0}if((v&63|0)==28){c[u>>2]=v&8372224|v>>>23<<6|27;w=c[(c[p>>2]|0)+12>>2]|0}else{w=f}r=((c[w+(e<<2)>>2]|0)>>>14)-131071|0;if((r|0)==-1){break}m=e+1+r|0;if((m|0)==-1){break}else{e=m;f=w}}t=c[s>>2]|0}if((t|0)==-1){i=j;return}s=b|0;b=t;t=c[(c[s>>2]|0)+12>>2]|0;while(1){w=t+(b<<2)|0;if((b|0)>0){f=t+(b-1<<2)|0;e=c[f>>2]|0;if((a[1184+(e&63)|0]|0)<0){x=f;y=e}else{n=43}}else{n=43}if((n|0)==43){n=0;x=w;y=c[w>>2]|0}if((y&63|0)==28){c[x>>2]=y&8372224|y>>>23<<6|27;z=c[(c[s>>2]|0)+12>>2]|0}else{z=t}w=((c[z+(b<<2)>>2]|0)>>>14)-131071|0;if((w|0)==-1){n=54;break}e=b+1+w|0;if((e|0)==-1){n=54;break}else{b=e;t=z}}if((n|0)==54){i=j;return}}else{i=j;return}}function Ll(b,e,f,g,i){b=b|0;e=e|0;f=f|0;g=g|0;i=i|0;var j=0,k=0.0,l=0,m=0,n=0;j=f|0;do{if((c[j>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}if((c[g>>2]|0)!=5){break}if((c[g+16>>2]|0)!=-1){break}if((c[g+20>>2]|0)!=-1){break}k=+h[g+8>>3];if((e-16|0)>>>0<2>>>0&k==0.0){break}l=f+8|0;h[l>>3]=+Zh(e-13|0,+h[l>>3],k);return}}while(0);if((e|0)==21|(e|0)==19){m=0}else{m=El(b,g)|0}l=El(b,f)|0;do{if((l|0)>(m|0)){do{if((c[j>>2]|0)==6){n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);if((c[g>>2]|0)!=6){break}n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}else{do{if((c[g>>2]|0)==6){n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);if((c[j>>2]|0)!=6){break}n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);c[f+8>>2]=pl(b,m<<14|e|l<<23)|0;c[j>>2]=11;c[(c[(c[b>>2]|0)+20>>2]|0)+((c[b+20>>2]|0)-1<<2)>>2]=i;return}function Ml(a,b,d){a=a|0;b=b|0;d=d|0;switch(b|0){case 14:{Il(a,d);return};case 13:{Hl(a,d);return};case 6:{zl(a,d);return};case 0:case 1:case 2:case 3:case 4:case 5:{do{if((c[d>>2]|0)==5){if((c[d+16>>2]|0)!=-1){break}if((c[d+20>>2]|0)!=-1){break}return}}while(0);El(a,d)|0;return};default:{El(a,d)|0;return}}}function Nl(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;switch(e|0){case 13:{yl(b,g);i=g+20|0;j=c[f+20>>2]|0;do{if((j|0)!=-1){k=c[i>>2]|0;if((k|0)==-1){c[i>>2]=j;break}l=c[(c[b>>2]|0)+12>>2]|0;m=k;while(1){n=l+(m<<2)|0;o=c[n>>2]|0;k=(o>>>14)-131071|0;if((k|0)==-1){break}p=m+1+k|0;if((p|0)==-1){break}else{m=p}}l=j+~m|0;if((((l|0)>-1?l:-l|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[n>>2]=(l<<14)+2147467264|o&16383;break}}}while(0);o=f;n=g;c[o>>2]=c[n>>2];c[o+4>>2]=c[n+4>>2];c[o+8>>2]=c[n+8>>2];c[o+12>>2]=c[n+12>>2];c[o+16>>2]=c[n+16>>2];c[o+20>>2]=c[n+20>>2];return};case 0:case 1:case 2:case 3:case 4:case 5:{Ll(b,e+13|0,f,g,h);return};case 6:{n=g+16|0;o=g+20|0;j=(c[n>>2]|0)==(c[o>>2]|0);yl(b,g);i=g|0;a:do{if(!j){do{if((c[i>>2]|0)==6){l=c[g+8>>2]|0;if((c[n>>2]|0)==(c[o>>2]|0)){break a}if((l|0)<(d[b+46|0]|0|0)){break}Al(b,g,l);break a}}while(0);zl(b,g)}}while(0);do{if((c[i>>2]|0)==11){o=g+8|0;n=c[o>>2]|0;j=(c[b>>2]|0)+12|0;m=c[j>>2]|0;l=c[m+(n<<2)>>2]|0;if((l&63|0)!=22){break}p=f|0;k=f+8|0;do{if((c[p>>2]|0)==6){q=c[k>>2]|0;if((q&256|0)!=0){r=n;s=m;t=l;break}if((d[b+46|0]|0|0)>(q|0)){r=n;s=m;t=l;break}q=b+48|0;a[q]=(a[q]|0)-1;q=c[o>>2]|0;u=c[j>>2]|0;r=q;s=u;t=c[u+(q<<2)>>2]|0}else{r=n;s=m;t=l}}while(0);c[s+(r<<2)>>2]=c[k>>2]<<23|t&8388607;c[p>>2]=11;c[k>>2]=c[o>>2];return}}while(0);zl(b,g);Ll(b,22,f,g,h);return};case 14:{yl(b,g);h=g+16|0;t=c[f+16>>2]|0;do{if((t|0)!=-1){r=c[h>>2]|0;if((r|0)==-1){c[h>>2]=t;break}s=c[(c[b>>2]|0)+12>>2]|0;i=r;while(1){v=s+(i<<2)|0;w=c[v>>2]|0;r=(w>>>14)-131071|0;if((r|0)==-1){break}l=i+1+r|0;if((l|0)==-1){break}else{i=l}}s=t+~i|0;if((((s|0)>-1?s:-s|0)|0)>131071){tm(c[b+12>>2]|0,4768)}else{c[v>>2]=(s<<14)+2147467264|w&16383;break}}}while(0);w=f;v=g;c[w>>2]=c[v>>2];c[w+4>>2]=c[v+4>>2];c[w+8>>2]=c[v+8>>2];c[w+12>>2]=c[v+12>>2];c[w+16>>2]=c[v+16>>2];c[w+20>>2]=c[v+20>>2];return};case 10:case 11:case 12:{v=e+14|0;w=El(b,f)|0;t=El(b,g)|0;do{if((c[g>>2]|0)==6){h=c[g+8>>2]|0;if((h&256|0)!=0){break}if((d[b+46|0]|0|0)>(h|0)){break}h=b+48|0;a[h]=(a[h]|0)-1}}while(0);h=f|0;s=f+8|0;do{if((c[h>>2]|0)==6){o=c[s>>2]|0;if((o&256|0)!=0){break}if((d[b+46|0]|0|0)>(o|0)){break}o=b+48|0;a[o]=(a[o]|0)-1}}while(0);o=(v|0)==24;c[s>>2]=Ql(b,v,o&1^1,o?w:t,o?t:w)|0;c[h>>2]=10;return};case 7:case 8:case 9:{h=e+17|0;e=El(b,f)|0;w=El(b,g)|0;do{if((c[g>>2]|0)==6){t=c[g+8>>2]|0;if((t&256|0)!=0){break}if((d[b+46|0]|0|0)>(t|0)){break}t=b+48|0;a[t]=(a[t]|0)-1}}while(0);g=f|0;t=f+8|0;do{if((c[g>>2]|0)==6){f=c[t>>2]|0;if((f&256|0)!=0){break}if((d[b+46|0]|0|0)>(f|0)){break}f=b+48|0;a[f]=(a[f]|0)-1}}while(0);c[t>>2]=Ql(b,h,1,e,w)|0;c[g>>2]=10;return};default:{return}}}function Ol(a,b){a=a|0;b=b|0;c[(c[(c[a>>2]|0)+20>>2]|0)+((c[a+20>>2]|0)-1<<2)>>2]=b;return}function Pl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=((e-1|0)/50|0)+1|0;e=(f|0)==-1?0:f;if((g|0)<512){pl(b,d<<6|e<<23|g<<14|36)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}if((g|0)>=67108864){tm(c[b+12>>2]|0,10192)}pl(b,d<<6|e<<23|36)|0;pl(b,g<<6|39)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}function Ql(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;pl(a,d<<6|b|e<<23|f<<14)|0;f=a+28|0;e=c[f>>2]|0;c[f>>2]=-1;f=pl(a,2147450903)|0;if((e|0)==-1){g=f;return g|0}if((f|0)==-1){g=e;return g|0}b=c[(c[a>>2]|0)+12>>2]|0;d=f;while(1){h=b+(d<<2)|0;i=c[h>>2]|0;j=(i>>>14)-131071|0;if((j|0)==-1){break}k=d+1+j|0;if((k|0)==-1){break}else{d=k}}b=e+~d|0;if((((b|0)>-1?b:-b|0)|0)>131071){tm(c[a+12>>2]|0,4768);return 0}c[h>>2]=(b<<14)+2147467264|i&16383;g=f;return g|0}function Rl(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0;f=i;i=i+24|0;g=f|0;j=f+8|0;yl(a,b);k=b|0;l=c[k>>2]|0;a:do{switch(l|0){case 4:{m=c[b+8>>2]|0;n=e<<6;if((m|0)<262144){pl(a,n|m<<14|1)|0;break a}else{pl(a,n|2)|0;pl(a,m<<6|39)|0;break a}break};case 3:case 2:{pl(a,e<<6|((l|0)==2)<<23|3)|0;break};case 1:{m=e+1|0;n=c[a+20>>2]|0;do{if((n|0)>(c[a+24>>2]|0)){o=(c[(c[a>>2]|0)+12>>2]|0)+(n-1<<2)|0;p=c[o>>2]|0;if((p&63|0)!=4){break}q=p>>>6&255;r=q+(p>>>23)|0;if((q|0)>(e|0)){s=6}else{if((r+1|0)<(e|0)){s=6}}if((s|0)==6){if((q|0)<(e|0)|(q|0)>(m|0)){break}}t=(q|0)<(e|0)?q:e;c[o>>2]=t<<6&16320|p&8372287|((r|0)>(e|0)?r:e)-t<<23;break a}}while(0);pl(a,e<<6|4)|0;break};case 5:{u=+h[b+8>>3];h[g>>3]=u;m=c[(c[a+12>>2]|0)+52>>2]|0;h[j>>3]=u;c[j+8>>2]=3;if(u==0.0){n=m+8|0;t=c[n>>2]|0;c[n>>2]=t+16;r=Yi(m,g,8)|0;c[t>>2]=r;c[t+8>>2]=d[r+4|0]|0|64;r=ul(a,(c[n>>2]|0)-16|0,j)|0;c[n>>2]=(c[n>>2]|0)-16;v=r}else{v=ul(a,j,j)|0}r=e<<6;if((v|0)<262144){pl(a,r|v<<14|1)|0;break a}else{pl(a,r|2)|0;pl(a,v<<6|39)|0;break a}break};case 6:{r=c[b+8>>2]|0;if((r|0)==(e|0)){break a}pl(a,r<<23|e<<6)|0;break};case 11:{r=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[r>>2]=c[r>>2]&-16321|e<<6&16320;break};default:{i=f;return}}}while(0);c[b+8>>2]=e;c[k>>2]=6;i=f;return}function Sl(a){a=a|0;Sd(a,0,6);ff(a,2112,0);return 1}function Tl(a){a=a|0;var b=0;Ge(a,1,6);b=Oi(a)|0;kd(a,1);ad(a,b,1);return 1}function Ul(a){a=a|0;var b=0,c=0,d=0;b=zd(a,1)|0;if((b|0)==0){se(a,1,2488)|0}c=_l(a,b,(ed(a)|0)-1|0)|0;if((c|0)<0){Kd(a,0);hd(a,-2);d=2;return d|0}else{Kd(a,1);hd(a,~c);d=c+1|0;return d|0}return 0}function Vl(a){a=a|0;Kd(a,Md(a)|0);return 2}function Wl(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;i=i+104|0;c=b|0;d=zd(a,1)|0;if((d|0)==0){se(a,1,2488)|0}do{if((d|0)==(a|0)){Fd(a,7888,7)|0}else{e=ge(d)|0;if((e|0)==0){if((sf(d,0,c)|0)>0){Fd(a,11480,6)|0;break}if((ed(d)|0)==0){Fd(a,11176,4)|0;break}else{Fd(a,11840,9)|0;break}}else if((e|0)==1){Fd(a,11840,9)|0;break}else{Fd(a,11176,4)|0;break}}}while(0);i=b;return 1}function Xl(a){a=a|0;var b=0;Ge(a,1,6);b=Oi(a)|0;kd(a,1);ad(a,b,1);Jd(a,76,1);return 1}function Yl(a){a=a|0;return Qf(a,ed(a)|0,0,0)|0}function Zl(a){a=a|0;var b=0,c=0,d=0;b=zd(a,-1001001)|0;c=_l(a,b,ed(a)|0)|0;if((c|0)>=0){d=c;return d|0}if((pd(a,-1)|0)!=0){ve(a,1);hd(a,-2);ke(a,2)}d=ie(a)|0;return d|0}function _l(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((_c(b,c)|0)==0){Fd(a,3552,28)|0;d=-1;return d|0}do{if((ge(b)|0)==0){if((ed(b)|0)!=0){break}Fd(a,3088,28)|0;d=-1;return d|0}}while(0);ad(a,b,c);if((Nf(b,a,c)|0)>>>0>=2>>>0){ad(b,a,1);d=-1;return d|0}c=ed(b)|0;if((_c(a,c+1|0)|0)==0){fd(b,~c);Fd(a,2752,26)|0;d=-1;return d|0}else{ad(b,a,c);d=c;return d|0}return 0}function $l(a){a=a|0;Sd(a,0,16);ff(a,1976,0);return 1}function am(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+256|0;d=c[p>>2]|0;za(4400,11,1,d|0)|0;xa(d|0)|0;e=b|0;f=c[o>>2]|0;if((Ua(e|0,250,f|0)|0)==0){i=b;return 0}while(1){if((Ma(e|0,4336)|0)==0){g=3;break}if((Ye(a,e,Um(e|0)|0,4184,0)|0)==0){if((ce(a,0,0,0,0,0)|0)!=0){g=6}}else{g=6}if((g|0)==6){g=0;h=wd(a,-1,0)|0;Yb(d|0,4096,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j;xa(d|0)|0}fd(a,0);za(4400,11,1,d|0)|0;xa(d|0)|0;if((Ua(e|0,250,f|0)|0)==0){g=3;break}}if((g|0)==3){i=b;return 0}return 0}function bm(a){a=a|0;if((ld(a,1)|0)==7){Ud(a,1);return 1}else{Bd(a);return 1}return 0}function cm(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;c=i;i=i+8|0;d=c|0;if((ld(b,1)|0)==8){e=zd(b,1)|0}else{e=b}f=qf(e)|0;g=pf(e)|0;if((g|0)!=0&(g|0)!=16){Fd(b,4544,13)|0}else{gf(b,-1001e3,9784)|0;Md(e)|0;ad(e,b,1);Qd(b,-2);gd(b,-2)}g=d|0;if((f&1|0)==0){h=0}else{a[g]=99;h=1}if((f&2|0)==0){j=h}else{a[d+h|0]=114;j=h+1|0}if((f&4|0)==0){k=j}else{a[d+j|0]=108;k=j+1|0}a[d+k|0]=0;Gd(b,g)|0;Dd(b,rf(e)|0);i=c;return 3}function dm(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+104|0;f=e|0;if((ld(b,1)|0)==8){g=zd(b,1)|0;h=1}else{g=b;h=0}j=h|2;k=De(b,j,7288,0)|0;l=h+1|0;do{if((od(b,l)|0)==0){if((ld(b,l)|0)==6){Id(b,7120,(h=i,i=i+8|0,c[h>>2]=k,h)|0)|0;i=h;h=wd(b,-1,0)|0;kd(b,l);ad(b,g,1);m=h;break}n=se(b,l,6888)|0;i=e;return n|0}else{if((sf(g,td(b,l,0)|0,f)|0)!=0){m=k;break}Bd(b);n=1;i=e;return n|0}}while(0);if((wf(g,m,f)|0)==0){n=se(b,j,6704)|0;i=e;return n|0}Sd(b,0,2);if((Wa(m|0,83)|0)!=0){Gd(b,c[f+16>>2]|0)|0;Xd(b,-2,6552);Gd(b,f+36|0)|0;Xd(b,-2,6376);Dd(b,c[f+24>>2]|0);Xd(b,-2,6216);Dd(b,c[f+28>>2]|0);Xd(b,-2,6136);Gd(b,c[f+12>>2]|0)|0;Xd(b,-2,6016)}if((Wa(m|0,108)|0)!=0){Dd(b,c[f+20>>2]|0);Xd(b,-2,5856)}if((Wa(m|0,117)|0)!=0){Dd(b,d[f+32|0]|0);Xd(b,-2,5736);Dd(b,d[f+33|0]|0);Xd(b,-2,5560);Kd(b,a[f+34|0]|0);Xd(b,-2,5368)}if((Wa(m|0,110)|0)!=0){Gd(b,c[f+4>>2]|0)|0;Xd(b,-2,5168);Gd(b,c[f+8>>2]|0)|0;Xd(b,-2,5024)}if((Wa(m|0,116)|0)!=0){Kd(b,a[f+35|0]|0);Xd(b,-2,4912)}if((Wa(m|0,76)|0)!=0){if((g|0)==(b|0)){kd(b,-2);gd(b,-3)}else{ad(g,b,1)}Xd(b,-2,4752)}if((Wa(m|0,102)|0)==0){n=1;i=e;return n|0}if((g|0)==(b|0)){kd(b,-2);gd(b,-3)}else{ad(g,b,1)}Xd(b,-2,4640);n=1;i=e;return n|0}function em(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+104|0;c=b|0;if((ld(a,1)|0)==8){d=zd(a,1)|0;e=1}else{d=a;e=0}f=Ke(a,e|2)|0;g=e+1|0;if((ld(a,g)|0)==6){kd(a,g);Gd(a,tf(a,0,f)|0)|0;h=1;i=b;return h|0}if((sf(d,Ke(a,g)|0,c)|0)==0){h=se(a,g,9952)|0;i=b;return h|0}g=tf(d,c,f)|0;if((g|0)==0){Bd(a);h=1;i=b;return h|0}else{ad(d,a,1);Gd(a,g)|0;kd(a,-2);h=2;i=b;return h|0}return 0}function fm(a){a=a|0;kd(a,-1001e3);return 1}function gm(a){a=a|0;He(a,1);if((Td(a,1)|0)!=0){return 1}Bd(a);return 1}function hm(a){a=a|0;var b=0,c=0,d=0;b=Ke(a,2)|0;Ge(a,1,6);c=ne(a,1,b)|0;if((c|0)==0){d=0;return d|0}Gd(a,c)|0;hd(a,-2);d=2;return d|0}function im(a){a=a|0;var b=0,c=0,e=0,f=0,g=0;b=i;i=i+208|0;c=b|0;e=b+104|0;f=Ke(a,2)|0;Ge(a,1,6);kd(a,1);wf(a,7800,e)|0;if((f|0)>0){if((f|0)>(d[e+32|0]|0|0)){g=3}}else{g=3}if((g|0)==3){se(a,2,7600)|0}e=Ke(a,4)|0;Ge(a,3,6);kd(a,3);wf(a,7800,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){g=6}}else{g=6}if((g|0)==6){se(a,4,7600)|0}if((nd(a,1)|0)!=0){se(a,1,7456)|0}if((nd(a,3)|0)==0){qe(a,1,f,3,e);i=b;return 0}se(a,3,7456)|0;qe(a,1,f,3,e);i=b;return 0}function jm(a){a=a|0;var b=0,c=0,e=0,f=0;b=i;i=i+104|0;c=b|0;e=Ke(a,2)|0;Ge(a,1,6);kd(a,1);wf(a,7800,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){f=3}}else{f=3}if((f|0)==3){se(a,2,7600)|0}Ld(a,pe(a,1,e)|0);i=b;return 1}function km(a){a=a|0;if((ld(a,1)|0)==2){se(a,1,7976)|0}Ge(a,1,7);if((ld(a,2)|0)>=1){Ge(a,2,5)}fd(a,2);$d(a,1);return 1}function lm(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((ld(a,1)|0)==8){b=zd(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;if((ld(a,d)|0)<1){fd(a,d);e=0;f=0;g=0}else{h=Ee(a,c|2,0)|0;Ge(a,d,6);i=Me(a,c+3|0,0)|0;c=(Wa(h|0,99)|0)!=0|0;j=(Wa(h|0,114)|0)==0;k=j?c:c|2;c=(Wa(h|0,108)|0)==0;h=c?k:k|4;e=(i|0)>0?h|8:h;f=i;g=16}if((gf(a,-1001e3,9784)|0)!=0){l=Md(b)|0;ad(b,a,1);kd(a,d);Yd(a,-3);m=of(b,g,e,f)|0;return 0}Gd(a,9536)|0;Xd(a,-2,9320);kd(a,-1);_d(a,-2)|0;l=Md(b)|0;ad(b,a,1);kd(a,d);Yd(a,-3);m=of(b,g,e,f)|0;return 0}function mm(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;i=i+104|0;c=b|0;if((ld(a,1)|0)==8){d=zd(a,1)|0;e=1}else{d=a;e=0}f=e+1|0;if((sf(d,Ke(a,f)|0,c)|0)==0){g=se(a,f,9952)|0;i=b;return g|0}else{f=e+3|0;He(a,f);fd(a,f);ad(a,d,1);Gd(a,vf(d,c,Ke(a,e|2)|0)|0)|0;g=1;i=b;return g|0}return 0}function nm(a){a=a|0;var b=0;b=ld(a,2)|0;if(!((b|0)==5|(b|0)==0)){se(a,2,10168)|0}fd(a,2);_d(a,1)|0;return 1}function om(a){a=a|0;var b=0,c=0,d=0;He(a,3);b=Ke(a,2)|0;Ge(a,1,6);c=oe(a,1,b)|0;if((c|0)==0){d=0;return d|0}Gd(a,c)|0;hd(a,-1);d=1;return d|0}function pm(a){a=a|0;var b=0,c=0,d=0,e=0;if((ld(a,1)|0)==8){b=zd(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;e=wd(a,d,0)|0;do{if((e|0)==0){if((ld(a,d)|0)<1){break}kd(a,d);return 1}}while(0);re(a,b,e,Me(a,c|2,(b|0)==(a|0)|0)|0);return 1}function qm(a,b){a=a|0;b=b|0;var d=0;gf(a,-1001e3,9784)|0;Md(a)|0;Qd(a,-2);if((ld(a,-1)|0)!=6){return}Gd(a,c[1736+(c[b>>2]<<2)>>2]|0)|0;d=c[b+20>>2]|0;if((d|0)>-1){Dd(a,d)}else{Bd(a)}be(a,2,0,0,0);return}function rm(b){b=b|0;var d=0,e=0,f=0;d=0;do{e=Zi(b,c[928+(d<<2)>>2]|0)|0;f=e+5|0;a[f]=a[f]|32;d=d+1|0;a[e+6|0]=d;}while((d|0)<22);return}function sm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((d|0)>=257){f=c[928+(d-257<<2)>>2]|0;if((d|0)>=286){g=f;i=e;return g|0}h=bi(c[b+52>>2]|0,7744,(j=i,i=i+8|0,c[j>>2]=f,j)|0)|0;i=j;g=h;i=e;return g|0}h=c[b+52>>2]|0;if((a[d+657|0]&4)==0){b=bi(h,9904,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}else{b=bi(h,3032,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}return 0}function tm(a,b){a=a|0;b=b|0;um(a,b,c[a+16>>2]|0)}function um(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+64|0;g=f|0;ci(g,(c[b+68>>2]|0)+16|0,60);f=b+52|0;h=c[b+4>>2]|0;j=bi(c[f>>2]|0,9520,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=d,k)|0)|0;i=k;if((e|0)==0){l=c[f>>2]|0;Ef(l,3)}d=c[f>>2]|0;do{if((e-287|0)>>>0<3>>>0){h=b+60|0;g=c[h>>2]|0;m=g+4|0;n=c[m>>2]|0;o=g+8|0;p=c[o>>2]|0;do{if((n+1|0)>>>0>p>>>0){if(p>>>0>2147483645>>>0){um(b,11432,0)}q=p<<1;if((q|0)==-2){Fh(d)}else{r=g|0;s=Gh(d,c[r>>2]|0,p,q)|0;c[r>>2]=s;c[o>>2]=q;t=c[m>>2]|0;u=s;break}}else{t=n;u=c[g>>2]|0}}while(0);c[m>>2]=t+1;a[u+t|0]=0;g=bi(c[f>>2]|0,7744,(k=i,i=i+8|0,c[k>>2]=c[c[h>>2]>>2],k)|0)|0;i=k;v=g}else{if((e|0)>=257){g=c[928+(e-257<<2)>>2]|0;if((e|0)>=286){v=g;break}n=bi(d,7744,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;v=n;break}if((a[e+657|0]&4)==0){n=bi(d,9904,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}else{n=bi(d,3032,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}}}while(0);bi(d,9304,(k=i,i=i+16|0,c[k>>2]=j,c[k+8>>2]=v,k)|0)|0;i=k;l=c[f>>2]|0;Ef(l,3)}function vm(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=c[a+52>>2]|0;g=Yi(f,b,e)|0;e=f+8|0;b=c[e>>2]|0;c[e>>2]=b+16;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;b=yj(f,c[(c[a+48>>2]|0)+4>>2]|0,(c[e>>2]|0)-16|0)|0;a=b+8|0;do{if((c[a>>2]|0)==0){c[b>>2]=1;c[a>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){break}sg(f)}}while(0);c[e>>2]=(c[e>>2]|0)-16;return g|0}function wm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;a[d+76|0]=46;h=d+52|0;c[h>>2]=b;c[d>>2]=g;c[d+32>>2]=286;c[d+56>>2]=e;c[d+48>>2]=0;c[d+4>>2]=1;c[d+8>>2]=1;c[d+68>>2]=f;f=Zi(b,6112)|0;c[d+72>>2]=f;b=f+5|0;a[b]=a[b]|32;b=d+60|0;d=c[b>>2]|0;f=Gh(c[h>>2]|0,c[d>>2]|0,c[d+8>>2]|0,32)|0;c[c[b>>2]>>2]=f;c[(c[b>>2]|0)+8>>2]=32;return}function xm(a){a=a|0;var b=0,d=0,e=0;c[a+8>>2]=c[a+4>>2];b=a+32|0;d=b|0;if((c[d>>2]|0)==286){c[a+16>>2]=ym(a,a+24|0)|0;return}else{e=a+16|0;a=b;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[d>>2]=286;return}}function ym(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0;f=i;i=i+16|0;g=f|0;h=b+60|0;c[(c[h>>2]|0)+4>>2]=0;j=b|0;k=b+56|0;a:while(1){l=c[j>>2]|0;b:while(1){switch(l|0){case 32:case 12:case 9:case 11:{break};case 45:{break b;break};case 126:{m=53;break a;break};case 46:{m=171;break a;break};case 91:{m=25;break a;break};case 61:{m=29;break a;break};case 34:case 39:{m=69;break a;break};case 60:{m=37;break a;break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{n=l;break a;break};case 10:case 13:{m=4;break b;break};case 62:{m=45;break a;break};case 58:{m=61;break a;break};case-1:{o=286;m=316;break a;break};default:{m=293;break a}}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){r=kk(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;r=d[p]|0}c[j>>2]=r;l=r}if((m|0)==4){m=0;Am(b);continue}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){s=kk(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;s=d[p]|0}c[j>>2]=s;if((s|0)!=45){o=45;m=316;break}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){t=kk(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;t=d[p]|0}c[j>>2]=t;do{if((t|0)==91){p=Bm(b)|0;c[(c[h>>2]|0)+4>>2]=0;if((p|0)>-1){Cm(b,0,p);c[(c[h>>2]|0)+4>>2]=0;continue a}else{u=c[j>>2]|0;break}}else{u=t}}while(0);while(1){if((u|0)==10|(u|0)==13|(u|0)==(-1|0)){continue a}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){v=kk(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;v=d[p]|0}c[j>>2]=v;u=v}}do{if((m|0)==25){v=Bm(b)|0;if((v|0)>-1){Cm(b,e,v);o=289;i=f;return o|0}if((v|0)==-1){o=91;i=f;return o|0}else{um(b,4592,289);return 0}}else if((m|0)==29){v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){w=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;w=d[v]|0}c[j>>2]=w;if((w|0)!=61){o=61;i=f;return o|0}v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){x=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;x=d[v]|0}c[j>>2]=x;o=281;i=f;return o|0}else if((m|0)==37){v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){y=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;y=d[v]|0}c[j>>2]=y;if((y|0)!=61){o=60;i=f;return o|0}v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){z=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;z=d[v]|0}c[j>>2]=z;o=283;i=f;return o|0}else if((m|0)==45){v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){A=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;A=d[v]|0}c[j>>2]=A;if((A|0)!=61){o=62;i=f;return o|0}v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){B=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;B=d[v]|0}c[j>>2]=B;o=282;i=f;return o|0}else if((m|0)==53){v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){C=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;C=d[v]|0}c[j>>2]=C;if((C|0)!=61){o=126;i=f;return o|0}v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){D=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;D=d[v]|0}c[j>>2]=D;o=284;i=f;return o|0}else if((m|0)==61){v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){E=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;E=d[v]|0}c[j>>2]=E;if((E|0)!=58){o=58;i=f;return o|0}v=c[k>>2]|0;u=c[v>>2]|0;c[v>>2]=u-1;v=c[k>>2]|0;if((u|0)==0){F=kk(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;F=d[v]|0}c[j>>2]=F;o=285;i=f;return o|0}else if((m|0)==69){v=c[h>>2]|0;u=v+4|0;t=c[u>>2]|0;s=v+8|0;r=c[s>>2]|0;do{if((t+1|0)>>>0>r>>>0){if(r>>>0>2147483645>>>0){um(b,11432,0);return 0}p=r<<1;q=c[b+52>>2]|0;if((p|0)==-2){Fh(q);return 0}else{G=v|0;H=Gh(q,c[G>>2]|0,r,p)|0;c[G>>2]=H;c[s>>2]=p;I=c[u>>2]|0;J=H;break}}else{I=t;J=c[v>>2]|0}}while(0);v=l&255;c[u>>2]=I+1;a[J+I|0]=v;t=c[k>>2]|0;s=c[t>>2]|0;c[t>>2]=s-1;t=c[k>>2]|0;if((s|0)==0){K=kk(t)|0}else{s=t+4|0;t=c[s>>2]|0;c[s>>2]=t+1;K=d[t]|0}c[j>>2]=K;c:do{if((K|0)==(l|0)){L=K&255}else{t=b+52|0;s=g|0;r=g+4|0;H=g+8|0;p=K;d:while(1){e:do{if((p|0)==(-1|0)){m=82;break d}else if((p|0)==10|(p|0)==13){m=83;break d}else if((p|0)==92){G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){M=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;M=d[G]|0}c[j>>2]=M;switch(M|0){case 10:case 13:{Am(b);N=10;break};case-1:{O=-1;break e;break};case 98:{P=8;m=134;break};case 102:{P=12;m=134;break};case 110:{P=10;m=134;break};case 114:{P=13;m=134;break};case 116:{P=9;m=134;break};case 118:{P=11;m=134;break};case 120:{c[s>>2]=120;G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){Q=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;Q=d[G]|0}c[j>>2]=Q;c[r>>2]=Q;if((a[Q+657|0]&16)==0){R=2;m=99;break d}G=_h(Q)|0;q=c[k>>2]|0;S=c[q>>2]|0;c[q>>2]=S-1;q=c[k>>2]|0;if((S|0)==0){T=kk(q)|0}else{S=q+4|0;q=c[S>>2]|0;c[S>>2]=q+1;T=d[q]|0}c[j>>2]=T;c[H>>2]=T;if((a[T+657|0]&16)==0){R=3;m=99;break d}P=(_h(T)|0)+(G<<4)&255;m=134;break};case 97:{P=7;m=134;break};case 92:case 34:case 39:{P=M&255;m=134;break};case 122:{G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){U=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;U=d[G]|0}c[j>>2]=U;if((a[U+657|0]&8)==0){O=U;break e}else{V=U}while(1){if((V|0)==10|(V|0)==13){Am(b);W=c[j>>2]|0}else{G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){X=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;X=d[G]|0}c[j>>2]=X;W=X}if((a[W+657|0]&8)==0){O=W;break e}else{V=W}}break};default:{if((a[M+657|0]&2)==0){m=119;break d}c[s>>2]=M;G=M-48|0;q=c[k>>2]|0;S=c[q>>2]|0;c[q>>2]=S-1;q=c[k>>2]|0;if((S|0)==0){Y=kk(q)|0}else{S=q+4|0;q=c[S>>2]|0;c[S>>2]=q+1;Y=d[q]|0}c[j>>2]=Y;do{if((a[Y+657|0]&2)==0){Z=1;_=G}else{c[r>>2]=Y;q=(G*10|0)-48+Y|0;S=c[k>>2]|0;$=c[S>>2]|0;c[S>>2]=$-1;S=c[k>>2]|0;if(($|0)==0){aa=kk(S)|0}else{$=S+4|0;S=c[$>>2]|0;c[$>>2]=S+1;aa=d[S]|0}c[j>>2]=aa;if((a[aa+657|0]&2)==0){Z=2;_=q;break}c[H>>2]=aa;S=c[k>>2]|0;$=c[S>>2]|0;c[S>>2]=$-1;S=c[k>>2]|0;if(($|0)==0){ba=kk(S)|0}else{$=S+4|0;S=c[$>>2]|0;c[$>>2]=S+1;ba=d[S]|0}c[j>>2]=ba;Z=3;_=(q*10|0)-48+aa|0}}while(0);if((_|0)>255){m=125;break d}else{N=_&255}}}if((m|0)==134){m=0;G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){ca=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;ca=d[G]|0}c[j>>2]=ca;N=P}G=c[h>>2]|0;q=G+4|0;S=c[q>>2]|0;$=G+8|0;da=c[$>>2]|0;if((S+1|0)>>>0>da>>>0){if(da>>>0>2147483645>>>0){m=141;break d}ea=da<<1;fa=c[t>>2]|0;if((ea|0)==-2){m=143;break d}ga=G|0;ha=Gh(fa,c[ga>>2]|0,da,ea)|0;c[ga>>2]=ha;c[$>>2]=ea;ia=c[q>>2]|0;ja=ha}else{ia=S;ja=c[G>>2]|0}c[q>>2]=ia+1;a[ja+ia|0]=N;O=c[j>>2]|0}else{q=c[h>>2]|0;G=q+4|0;S=c[G>>2]|0;ha=q+8|0;ea=c[ha>>2]|0;if((S+1|0)>>>0>ea>>>0){if(ea>>>0>2147483645>>>0){m=149;break d}$=ea<<1;ka=c[t>>2]|0;if(($|0)==-2){m=151;break d}ga=q|0;da=Gh(ka,c[ga>>2]|0,ea,$)|0;c[ga>>2]=da;c[ha>>2]=$;la=c[G>>2]|0;ma=da}else{la=S;ma=c[q>>2]|0}c[G>>2]=la+1;a[ma+la|0]=p;G=c[k>>2]|0;q=c[G>>2]|0;c[G>>2]=q-1;G=c[k>>2]|0;if((q|0)==0){na=kk(G)|0}else{q=G+4|0;G=c[q>>2]|0;c[q>>2]=G+1;na=d[G]|0}c[j>>2]=na;O=na}}while(0);if((O|0)==(l|0)){L=v;break c}else{p=O}}if((m|0)==82){um(b,11136,286);return 0}else if((m|0)==83){um(b,11136,289);return 0}else if((m|0)==99){Em(b,s,R,10424);return 0}else if((m|0)==119){Em(b,j,1,10808);return 0}else if((m|0)==125){Em(b,s,Z,10600);return 0}else if((m|0)==141){um(b,11432,0);return 0}else if((m|0)==143){Fh(fa);return 0}else if((m|0)==149){um(b,11432,0);return 0}else if((m|0)==151){Fh(ka);return 0}}}while(0);v=c[h>>2]|0;u=v+4|0;p=c[u>>2]|0;t=v+8|0;H=c[t>>2]|0;do{if((p+1|0)>>>0>H>>>0){if(H>>>0>2147483645>>>0){um(b,11432,0);return 0}r=H<<1;G=c[b+52>>2]|0;if((r|0)==-2){Fh(G);return 0}else{q=v|0;S=Gh(G,c[q>>2]|0,H,r)|0;c[q>>2]=S;c[t>>2]=r;oa=c[u>>2]|0;pa=S;break}}else{oa=p;pa=c[v>>2]|0}}while(0);c[u>>2]=oa+1;a[pa+oa|0]=L;v=c[k>>2]|0;p=c[v>>2]|0;c[v>>2]=p-1;v=c[k>>2]|0;if((p|0)==0){qa=kk(v)|0}else{p=v+4|0;v=c[p>>2]|0;c[p>>2]=v+1;qa=d[v]|0}c[j>>2]=qa;v=c[h>>2]|0;p=c[b+52>>2]|0;t=Yi(p,(c[v>>2]|0)+1|0,(c[v+4>>2]|0)-2|0)|0;v=p+8|0;H=c[v>>2]|0;c[v>>2]=H+16;c[H>>2]=t;c[H+8>>2]=d[t+4|0]|64;H=yj(p,c[(c[b+48>>2]|0)+4>>2]|0,(c[v>>2]|0)-16|0)|0;S=H+8|0;do{if((c[S>>2]|0)==0){c[H>>2]=1;c[S>>2]=1;if((c[(c[p+12>>2]|0)+12>>2]|0)<=0){break}sg(p)}}while(0);c[v>>2]=(c[v>>2]|0)-16;c[e>>2]=t;o=289;i=f;return o|0}else if((m|0)==171){p=c[h>>2]|0;S=p+4|0;H=c[S>>2]|0;u=p+8|0;r=c[u>>2]|0;do{if((H+1|0)>>>0>r>>>0){if(r>>>0>2147483645>>>0){um(b,11432,0);return 0}q=r<<1;G=c[b+52>>2]|0;if((q|0)==-2){Fh(G);return 0}else{da=p|0;$=Gh(G,c[da>>2]|0,r,q)|0;c[da>>2]=$;c[u>>2]=q;ra=c[S>>2]|0;sa=$;break}}else{ra=H;sa=c[p>>2]|0}}while(0);c[S>>2]=ra+1;a[sa+ra|0]=46;p=c[k>>2]|0;H=c[p>>2]|0;c[p>>2]=H-1;p=c[k>>2]|0;if((H|0)==0){ta=kk(p)|0}else{H=p+4|0;p=c[H>>2]|0;c[H>>2]=p+1;ta=d[p]|0}c[j>>2]=ta;do{if((ta|0)!=0){if((Na(3912,ta|0,2)|0)==0){break}p=c[h>>2]|0;H=p+4|0;u=c[H>>2]|0;r=p+8|0;t=c[r>>2]|0;do{if((u+1|0)>>>0>t>>>0){if(t>>>0>2147483645>>>0){um(b,11432,0);return 0}v=t<<1;$=c[b+52>>2]|0;if((v|0)==-2){Fh($);return 0}else{q=p|0;da=Gh($,c[q>>2]|0,t,v)|0;c[q>>2]=da;c[r>>2]=v;ua=c[H>>2]|0;va=da;break}}else{ua=u;va=c[p>>2]|0}}while(0);c[H>>2]=ua+1;a[va+ua|0]=ta;p=c[k>>2]|0;u=c[p>>2]|0;c[p>>2]=u-1;p=c[k>>2]|0;if((u|0)==0){wa=kk(p)|0}else{u=p+4|0;p=c[u>>2]|0;c[u>>2]=p+1;wa=d[p]|0}c[j>>2]=wa;if((wa|0)==0){o=279;i=f;return o|0}if((Na(3912,wa|0,2)|0)==0){o=279;i=f;return o|0}p=c[h>>2]|0;u=p+4|0;r=c[u>>2]|0;t=p+8|0;s=c[t>>2]|0;do{if((r+1|0)>>>0>s>>>0){if(s>>>0>2147483645>>>0){um(b,11432,0);return 0}da=s<<1;v=c[b+52>>2]|0;if((da|0)==-2){Fh(v);return 0}else{q=p|0;$=Gh(v,c[q>>2]|0,s,da)|0;c[q>>2]=$;c[t>>2]=da;xa=c[u>>2]|0;ya=$;break}}else{xa=r;ya=c[p>>2]|0}}while(0);c[u>>2]=xa+1;a[ya+xa|0]=wa;p=c[k>>2]|0;r=c[p>>2]|0;c[p>>2]=r-1;p=c[k>>2]|0;if((r|0)==0){za=kk(p)|0}else{r=p+4|0;p=c[r>>2]|0;c[r>>2]=p+1;za=d[p]|0}c[j>>2]=za;o=280;i=f;return o|0}}while(0);if((a[ta+657|0]&2)==0){o=46}else{n=ta;break}i=f;return o|0}else if((m|0)==293){if((a[l+657|0]&1)==0){S=c[k>>2]|0;p=c[S>>2]|0;c[S>>2]=p-1;S=c[k>>2]|0;if((p|0)==0){Aa=kk(S)|0}else{p=S+4|0;S=c[p>>2]|0;c[p>>2]=S+1;Aa=d[S]|0}c[j>>2]=Aa;o=l;i=f;return o|0}S=b+52|0;p=l&255;while(1){r=c[h>>2]|0;t=r+4|0;s=c[t>>2]|0;H=r+8|0;$=c[H>>2]|0;if((s+1|0)>>>0>$>>>0){if($>>>0>2147483645>>>0){m=298;break}da=$<<1;Ba=c[S>>2]|0;if((da|0)==-2){m=300;break}q=r|0;v=Gh(Ba,c[q>>2]|0,$,da)|0;c[q>>2]=v;c[H>>2]=da;Ca=c[t>>2]|0;Da=v}else{Ca=s;Da=c[r>>2]|0}c[t>>2]=Ca+1;a[Da+Ca|0]=p;t=c[k>>2]|0;r=c[t>>2]|0;c[t>>2]=r-1;t=c[k>>2]|0;if((r|0)==0){Ea=kk(t)|0}else{r=t+4|0;t=c[r>>2]|0;c[r>>2]=t+1;Ea=d[t]|0}c[j>>2]=Ea;if((a[Ea+657|0]&3)==0){m=306;break}else{p=Ea&255}}if((m|0)==298){um(b,11432,0);return 0}else if((m|0)==300){Fh(Ba);return 0}else if((m|0)==306){p=c[h>>2]|0;t=c[S>>2]|0;r=Yi(t,c[p>>2]|0,c[p+4>>2]|0)|0;p=t+8|0;s=c[p>>2]|0;c[p>>2]=s+16;c[s>>2]=r;v=r;da=v+4|0;c[s+8>>2]=d[da]|64;s=yj(t,c[(c[b+48>>2]|0)+4>>2]|0,(c[p>>2]|0)-16|0)|0;H=s+8|0;do{if((c[H>>2]|0)==0){c[s>>2]=1;c[H>>2]=1;if((c[(c[t+12>>2]|0)+12>>2]|0)<=0){break}sg(t)}}while(0);c[p>>2]=(c[p>>2]|0)-16;c[e>>2]=r;if((a[da]|0)!=4){o=288;i=f;return o|0}t=a[v+6|0]|0;if(t<<24>>24==0){o=288;i=f;return o|0}o=t&255|256;i=f;return o|0}}else if((m|0)==316){i=f;return o|0}}while(0);Ba=c[h>>2]|0;Ea=Ba+4|0;Ca=c[Ea>>2]|0;Da=Ba+8|0;l=c[Da>>2]|0;do{if((Ca+1|0)>>>0>l>>>0){if(l>>>0>2147483645>>>0){um(b,11432,0);return 0}Aa=l<<1;ta=c[b+52>>2]|0;if((Aa|0)==-2){Fh(ta);return 0}else{za=Ba|0;wa=Gh(ta,c[za>>2]|0,l,Aa)|0;c[za>>2]=wa;c[Da>>2]=Aa;Fa=c[Ea>>2]|0;Ga=wa;break}}else{Fa=Ca;Ga=c[Ba>>2]|0}}while(0);c[Ea>>2]=Fa+1;a[Ga+Fa|0]=n;Fa=c[k>>2]|0;Ga=c[Fa>>2]|0;c[Fa>>2]=Ga-1;Fa=c[k>>2]|0;if((Ga|0)==0){Ha=kk(Fa)|0}else{Ga=Fa+4|0;Fa=c[Ga>>2]|0;c[Ga>>2]=Fa+1;Ha=d[Fa]|0}c[j>>2]=Ha;do{if((n|0)==48){if((Ha|0)==0){Ia=3528;Ja=0;break}if((Na(3064,Ha|0,3)|0)==0){Ia=3528;Ja=Ha;break}Fa=c[h>>2]|0;Ga=Fa+4|0;Ea=c[Ga>>2]|0;Ba=Fa+8|0;Ca=c[Ba>>2]|0;do{if((Ea+1|0)>>>0>Ca>>>0){if(Ca>>>0>2147483645>>>0){um(b,11432,0);return 0}Da=Ca<<1;l=c[b+52>>2]|0;if((Da|0)==-2){Fh(l);return 0}else{wa=Fa|0;Aa=Gh(l,c[wa>>2]|0,Ca,Da)|0;c[wa>>2]=Aa;c[Ba>>2]=Da;Ka=c[Ga>>2]|0;La=Aa;break}}else{Ka=Ea;La=c[Fa>>2]|0}}while(0);c[Ga>>2]=Ka+1;a[La+Ka|0]=Ha;Fa=c[k>>2]|0;Ea=c[Fa>>2]|0;c[Fa>>2]=Ea-1;Fa=c[k>>2]|0;if((Ea|0)==0){Ma=kk(Fa)|0}else{Ea=Fa+4|0;Fa=c[Ea>>2]|0;c[Ea>>2]=Fa+1;Ma=d[Fa]|0}c[j>>2]=Ma;Ia=2728;Ja=Ma}else{Ia=3528;Ja=Ha}}while(0);Ha=b+52|0;Ma=Ja;f:while(1){do{if((Ma|0)==0){Oa=0}else{if((Na(Ia|0,Ma|0,3)|0)==0){Oa=Ma;break}Ja=c[h>>2]|0;Ka=Ja+4|0;La=c[Ka>>2]|0;n=Ja+8|0;Fa=c[n>>2]|0;if((La+1|0)>>>0>Fa>>>0){if(Fa>>>0>2147483645>>>0){m=237;break f}Ea=Fa<<1;Pa=c[Ha>>2]|0;if((Ea|0)==-2){m=239;break f}Ba=Ja|0;Ca=Gh(Pa,c[Ba>>2]|0,Fa,Ea)|0;c[Ba>>2]=Ca;c[n>>2]=Ea;Qa=c[Ka>>2]|0;Ra=Ca}else{Qa=La;Ra=c[Ja>>2]|0}c[Ka>>2]=Qa+1;a[Ra+Qa|0]=Ma;Ka=c[k>>2]|0;Ja=c[Ka>>2]|0;c[Ka>>2]=Ja-1;Ka=c[k>>2]|0;if((Ja|0)==0){Sa=kk(Ka)|0}else{Ja=Ka+4|0;Ka=c[Ja>>2]|0;c[Ja>>2]=Ka+1;Sa=d[Ka]|0}c[j>>2]=Sa;if((Sa|0)==0){Oa=0;break}if((Na(2464,Sa|0,3)|0)==0){Oa=Sa;break}Ka=c[h>>2]|0;Ja=Ka+4|0;La=c[Ja>>2]|0;Ca=Ka+8|0;Ea=c[Ca>>2]|0;if((La+1|0)>>>0>Ea>>>0){if(Ea>>>0>2147483645>>>0){m=249;break f}n=Ea<<1;Ta=c[Ha>>2]|0;if((n|0)==-2){m=251;break f}Ba=Ka|0;Fa=Gh(Ta,c[Ba>>2]|0,Ea,n)|0;c[Ba>>2]=Fa;c[Ca>>2]=n;Ua=c[Ja>>2]|0;Va=Fa}else{Ua=La;Va=c[Ka>>2]|0}c[Ja>>2]=Ua+1;a[Va+Ua|0]=Sa;Ja=c[k>>2]|0;Ka=c[Ja>>2]|0;c[Ja>>2]=Ka-1;Ja=c[k>>2]|0;if((Ka|0)==0){Wa=kk(Ja)|0}else{Ka=Ja+4|0;Ja=c[Ka>>2]|0;c[Ka>>2]=Ja+1;Wa=d[Ja]|0}c[j>>2]=Wa;Oa=Wa}}while(0);Xa=c[h>>2]|0;Ya=Xa+4|0;Za=c[Ya>>2]|0;_a=Xa+8|0;$a=c[_a>>2]|0;ab=(Za+1|0)>>>0>$a>>>0;if(!((a[Oa+657|0]&16)!=0|(Oa|0)==46)){m=269;break}if(ab){if($a>>>0>2147483645>>>0){m=261;break}Ga=$a<<1;bb=c[Ha>>2]|0;if((Ga|0)==-2){m=263;break}Ja=Xa|0;Ka=Gh(bb,c[Ja>>2]|0,$a,Ga)|0;c[Ja>>2]=Ka;c[_a>>2]=Ga;cb=c[Ya>>2]|0;db=Ka}else{cb=Za;db=c[Xa>>2]|0}c[Ya>>2]=cb+1;a[db+cb|0]=Oa;Ka=c[k>>2]|0;Ga=c[Ka>>2]|0;c[Ka>>2]=Ga-1;Ka=c[k>>2]|0;if((Ga|0)==0){eb=kk(Ka)|0}else{Ga=Ka+4|0;Ka=c[Ga>>2]|0;c[Ga>>2]=Ka+1;eb=d[Ka]|0}c[j>>2]=eb;Ma=eb}if((m|0)==237){um(b,11432,0);return 0}else if((m|0)==239){Fh(Pa);return 0}else if((m|0)==249){um(b,11432,0);return 0}else if((m|0)==251){Fh(Ta);return 0}else if((m|0)==261){um(b,11432,0);return 0}else if((m|0)==263){Fh(bb);return 0}else if((m|0)==269){do{if(ab){if($a>>>0>2147483645>>>0){um(b,11432,0);return 0}m=$a<<1;bb=c[Ha>>2]|0;if((m|0)==-2){Fh(bb);return 0}else{Ta=Xa|0;Pa=Gh(bb,c[Ta>>2]|0,$a,m)|0;c[Ta>>2]=Pa;c[_a>>2]=m;fb=c[Ya>>2]|0;gb=Pa;break}}else{fb=Za;gb=c[Xa>>2]|0}}while(0);c[Ya>>2]=fb+1;a[gb+fb|0]=0;fb=b+76|0;gb=a[fb]|0;Ya=c[h>>2]|0;Xa=c[Ya>>2]|0;Za=c[Ya+4>>2]|0;if((Za|0)==0){hb=Xa;ib=-1}else{Ya=Za;do{Ya=Ya-1|0;Za=Xa+Ya|0;if((a[Za]|0)==46){a[Za]=gb}}while((Ya|0)!=0);Ya=c[h>>2]|0;hb=c[Ya>>2]|0;ib=(c[Ya+4>>2]|0)-1|0}Ya=e|0;if(($h(hb,ib,Ya)|0)!=0){o=287;i=f;return o|0}ib=a[fb]|0;hb=a[c[(Ob()|0)>>2]|0]|0;a[fb]=hb;e=c[h>>2]|0;gb=c[e>>2]|0;Xa=c[e+4>>2]|0;if((Xa|0)==0){jb=gb;kb=-1}else{e=Xa;do{e=e-1|0;Xa=gb+e|0;if((a[Xa]|0)==ib<<24>>24){a[Xa]=hb}}while((e|0)!=0);e=c[h>>2]|0;jb=c[e>>2]|0;kb=(c[e+4>>2]|0)-1|0}if(($h(jb,kb,Ya)|0)!=0){o=287;i=f;return o|0}o=a[fb]|0;fb=c[h>>2]|0;h=c[fb>>2]|0;f=c[fb+4>>2]|0;if((f|0)==0){um(b,11800,287);return 0}else{lb=f}do{lb=lb-1|0;f=h+lb|0;if((a[f]|0)==o<<24>>24){a[f]=46}}while((lb|0)!=0);um(b,11800,287);return 0}return 0}function zm(a){a=a|0;var b=0;b=ym(a,a+40|0)|0;c[a+32>>2]=b;return b|0}function Am(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a|0;e=c[b>>2]|0;f=a+56|0;g=c[f>>2]|0;h=c[g>>2]|0;c[g>>2]=h-1;g=c[f>>2]|0;if((h|0)==0){i=kk(g)|0}else{h=g+4|0;g=c[h>>2]|0;c[h>>2]=g+1;i=d[g]|0}c[b>>2]=i;do{if((i|0)==10|(i|0)==13){if((i|0)==(e|0)){break}g=c[f>>2]|0;h=c[g>>2]|0;c[g>>2]=h-1;g=c[f>>2]|0;if((h|0)==0){j=kk(g)|0}else{h=g+4|0;g=c[h>>2]|0;c[h>>2]=g+1;j=d[g]|0}c[b>>2]=j}}while(0);j=a+4|0;b=(c[j>>2]|0)+1|0;c[j>>2]=b;if((b|0)>2147483644){tm(a,9752)}else{return}}function Bm(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=b|0;f=c[e>>2]|0;g=b+60|0;h=c[g>>2]|0;i=h+4|0;j=c[i>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((j+1|0)>>>0>l>>>0){if(l>>>0>2147483645>>>0){um(b,11432,0);return 0}m=l<<1;n=c[b+52>>2]|0;if((m|0)==-2){Fh(n);return 0}else{o=h|0;p=Gh(n,c[o>>2]|0,l,m)|0;c[o>>2]=p;c[k>>2]=m;q=c[i>>2]|0;r=p;break}}else{q=j;r=c[h>>2]|0}}while(0);c[i>>2]=q+1;a[r+q|0]=f;q=b+56|0;r=c[q>>2]|0;i=c[r>>2]|0;c[r>>2]=i-1;r=c[q>>2]|0;if((i|0)==0){s=kk(r)|0}else{i=r+4|0;r=c[i>>2]|0;c[i>>2]=r+1;s=d[r]|0}c[e>>2]=s;if((s|0)!=61){t=s;u=0;v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}s=b+52|0;r=61;i=0;while(1){h=c[g>>2]|0;j=h+4|0;k=c[j>>2]|0;l=h+8|0;p=c[l>>2]|0;if((k+1|0)>>>0>p>>>0){if(p>>>0>2147483645>>>0){y=16;break}m=p<<1;z=c[s>>2]|0;if((m|0)==-2){y=18;break}o=h|0;n=Gh(z,c[o>>2]|0,p,m)|0;c[o>>2]=n;c[l>>2]=m;A=c[j>>2]|0;B=n}else{A=k;B=c[h>>2]|0}c[j>>2]=A+1;a[B+A|0]=r;j=c[q>>2]|0;h=c[j>>2]|0;c[j>>2]=h-1;j=c[q>>2]|0;if((h|0)==0){C=kk(j)|0}else{h=j+4|0;j=c[h>>2]|0;c[h>>2]=j+1;C=d[j]|0}c[e>>2]=C;j=i+1|0;if((C|0)==61){r=C&255;i=j}else{t=C;u=j;y=24;break}}if((y|0)==16){um(b,11432,0);return 0}else if((y|0)==18){Fh(z);return 0}else if((y|0)==24){v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}return 0}function Cm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=b|0;h=c[g>>2]|0;i=b+60|0;j=c[i>>2]|0;k=j+4|0;l=c[k>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((l+1|0)>>>0>n>>>0){if(n>>>0>2147483645>>>0){um(b,11432,0)}o=n<<1;p=c[b+52>>2]|0;if((o|0)==-2){Fh(p)}else{q=j|0;r=Gh(p,c[q>>2]|0,n,o)|0;c[q>>2]=r;c[m>>2]=o;s=c[k>>2]|0;t=r;break}}else{s=l;t=c[j>>2]|0}}while(0);c[k>>2]=s+1;a[t+s|0]=h;h=b+56|0;s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){u=kk(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;u=d[s]|0}c[g>>2]=u;if((u|0)==10|(u|0)==13){Am(b);v=13}else{w=u}a:while(1){if((v|0)==13){v=0;w=c[g>>2]|0}x=(e|0)==0;y=b+52|0;b:do{if(x){u=w;while(1){if((u|0)==(-1|0)){v=21;break a}else if((u|0)==93){v=22;break b}else if((u|0)==10|(u|0)==13){break b}s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){z=kk(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;z=d[s]|0}c[g>>2]=z;u=z}}else{u=w;while(1){if((u|0)==(-1|0)){v=21;break a}else if((u|0)==93){v=22;break b}else if((u|0)==10|(u|0)==13){break b}s=c[i>>2]|0;t=s+4|0;k=c[t>>2]|0;j=s+8|0;l=c[j>>2]|0;if((k+1|0)>>>0>l>>>0){if(l>>>0>2147483645>>>0){v=46;break a}m=l<<1;A=c[y>>2]|0;if((m|0)==-2){v=48;break a}n=s|0;r=Gh(A,c[n>>2]|0,l,m)|0;c[n>>2]=r;c[j>>2]=m;B=c[t>>2]|0;C=r}else{B=k;C=c[s>>2]|0}c[t>>2]=B+1;a[C+B|0]=u;t=c[h>>2]|0;s=c[t>>2]|0;c[t>>2]=s-1;t=c[h>>2]|0;if((s|0)==0){D=kk(t)|0}else{s=t+4|0;t=c[s>>2]|0;c[s>>2]=t+1;D=d[t]|0}c[g>>2]=D;u=D}}}while(0);if((v|0)==22){v=0;if((Bm(b)|0)==(f|0)){v=23;break}else{v=13;continue}}u=c[i>>2]|0;t=u+4|0;s=c[t>>2]|0;k=u+8|0;r=c[k>>2]|0;if((s+1|0)>>>0>r>>>0){if(r>>>0>2147483645>>>0){v=37;break}m=r<<1;E=c[y>>2]|0;if((m|0)==-2){v=39;break}j=u|0;n=Gh(E,c[j>>2]|0,r,m)|0;c[j>>2]=n;c[k>>2]=m;F=c[t>>2]|0;G=n}else{F=s;G=c[u>>2]|0}c[t>>2]=F+1;a[G+F|0]=10;Am(b);if(!x){v=13;continue}c[(c[i>>2]|0)+4>>2]=0;v=13}if((v|0)==21){um(b,(e|0)!=0?10144:9928,286)}else if((v|0)==23){F=c[g>>2]|0;G=c[i>>2]|0;D=G+4|0;B=c[D>>2]|0;C=G+8|0;w=c[C>>2]|0;do{if((B+1|0)>>>0>w>>>0){if(w>>>0>2147483645>>>0){um(b,11432,0)}z=w<<1;t=c[y>>2]|0;if((z|0)==-2){Fh(t)}else{u=G|0;s=Gh(t,c[u>>2]|0,w,z)|0;c[u>>2]=s;c[C>>2]=z;H=c[D>>2]|0;I=s;break}}else{H=B;I=c[G>>2]|0}}while(0);c[D>>2]=H+1;a[I+H|0]=F;F=c[h>>2]|0;H=c[F>>2]|0;c[F>>2]=H-1;F=c[h>>2]|0;if((H|0)==0){J=kk(F)|0}else{H=F+4|0;F=c[H>>2]|0;c[H>>2]=F+1;J=d[F]|0}c[g>>2]=J;if(x){return}x=c[i>>2]|0;i=f+2|0;f=c[y>>2]|0;y=Yi(f,(c[x>>2]|0)+i|0,(c[x+4>>2]|0)-(i<<1)|0)|0;i=f+8|0;x=c[i>>2]|0;c[i>>2]=x+16;c[x>>2]=y;c[x+8>>2]=d[y+4|0]|0|64;x=yj(f,c[(c[b+48>>2]|0)+4>>2]|0,(c[i>>2]|0)-16|0)|0;J=x+8|0;do{if((c[J>>2]|0)==0){c[x>>2]=1;c[J>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){break}sg(f)}}while(0);c[i>>2]=(c[i>>2]|0)-16;c[e>>2]=y;return}else if((v|0)==37){um(b,11432,0)}else if((v|0)==39){Fh(E)}else if((v|0)==46){um(b,11432,0)}else if((v|0)==48){Fh(A)}}function Dm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+60>>2]|0;f=e+4|0;g=c[f>>2]|0;h=e+8|0;i=c[h>>2]|0;if((g+1|0)>>>0<=i>>>0){j=g;k=c[e>>2]|0;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}if(i>>>0>2147483645>>>0){um(b,11432,0)}g=i<<1;o=c[b+52>>2]|0;if((g|0)==-2){Fh(o)}b=e|0;e=Gh(o,c[b>>2]|0,i,g)|0;c[b>>2]=e;c[h>>2]=g;j=c[f>>2]|0;k=e;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}function Em(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;c[(c[a+60>>2]|0)+4>>2]=0;Dm(a,92);if((d|0)>0){f=0}else{um(a,e,289)}while(1){g=c[b+(f<<2)>>2]|0;if((g|0)==-1){h=4;break}Dm(a,g);g=f+1|0;if((g|0)<(d|0)){f=g}else{h=4;break}}if((h|0)==4){um(a,e,289)}}function Fm(a,b){a=+a;b=b|0;return+(+Pm(a,b))}function Gm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[3034]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=12176+(h<<2)|0;j=12176+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3034]=e&~(1<<g)}else{if(l>>>0<(c[3038]|0)>>>0){Xb();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{Xb();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3036]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=12176+(p<<2)|0;m=12176+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3034]=e&~(1<<r)}else{if(l>>>0<(c[3038]|0)>>>0){Xb();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{Xb();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3036]|0;if((l|0)!=0){q=c[3039]|0;d=l>>>3;l=d<<1;f=12176+(l<<2)|0;k=c[3034]|0;h=1<<d;do{if((k&h|0)==0){c[3034]=k|h;s=f;t=12176+(l+2<<2)|0}else{d=12176+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3038]|0)>>>0){s=g;t=d;break}Xb();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3036]=m;c[3039]=e;n=i;return n|0}l=c[3035]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[12440+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3038]|0;if(r>>>0<i>>>0){Xb();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){Xb();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){Xb();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){Xb();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){Xb();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{Xb();return 0}}}while(0);a:do{if((e|0)!=0){f=d+28|0;i=12440+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3035]=c[3035]&~(1<<c[f>>2]);break a}else{if(e>>>0<(c[3038]|0)>>>0){Xb();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break a}}}while(0);if(v>>>0<(c[3038]|0)>>>0){Xb();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3036]|0;if((f|0)!=0){e=c[3039]|0;i=f>>>3;f=i<<1;q=12176+(f<<2)|0;k=c[3034]|0;g=1<<i;do{if((k&g|0)==0){c[3034]=k|g;y=q;z=12176+(f+2<<2)|0}else{i=12176+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3038]|0)>>>0){y=l;z=i;break}Xb();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3036]=p;c[3039]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[3035]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[12440+(A<<2)>>2]|0;b:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break b}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[12440+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3036]|0)-g|0)>>>0){o=g;break}q=K;m=c[3038]|0;if(q>>>0<m>>>0){Xb();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){Xb();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){Xb();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){Xb();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){Xb();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{Xb();return 0}}}while(0);c:do{if((e|0)!=0){i=K+28|0;m=12440+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3035]=c[3035]&~(1<<c[i>>2]);break c}else{if(e>>>0<(c[3038]|0)>>>0){Xb();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break c}}}while(0);if(L>>>0<(c[3038]|0)>>>0){Xb();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=12176+(e<<2)|0;r=c[3034]|0;j=1<<i;do{if((r&j|0)==0){c[3034]=r|j;O=m;P=12176+(e+2<<2)|0}else{i=12176+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3038]|0)>>>0){O=d;P=i;break}Xb();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=12440+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3035]|0;l=1<<Q;if((m&l|0)==0){c[3035]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;m=j}}if((T|0)==151){if(S>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3038]|0;if(m>>>0<i>>>0){Xb();return 0}if(j>>>0<i>>>0){Xb();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3036]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3039]|0;if(S>>>0>15>>>0){R=J;c[3039]=R+o;c[3036]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3036]=0;c[3039]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3037]|0;if(o>>>0<J>>>0){S=J-o|0;c[3037]=S;J=c[3040]|0;K=J;c[3040]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3018]|0)==0){J=Vb(30)|0;if((J-1&J|0)==0){c[3020]=J;c[3019]=J;c[3021]=-1;c[3022]=-1;c[3023]=0;c[3145]=0;c[3018]=(yc(0)|0)&-16^1431655768;break}else{Xb();return 0}}}while(0);J=o+48|0;S=c[3020]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3144]|0;do{if((O|0)!=0){P=c[3142]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);d:do{if((c[3145]&4|0)==0){O=c[3040]|0;e:do{if((O|0)==0){T=181}else{L=O;P=12584;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break e}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[3037]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=Mb(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=190}}while(0);do{if((T|0)==181){O=Mb(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3019]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3142]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[3144]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=Mb($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=190}}while(0);f:do{if((T|0)==190){m=-_|0;if((X|0)!=-1){aa=Y;ba=X;T=201;break d}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[3020]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ca=_;break}if((Mb(O|0)|0)==-1){Mb(m|0)|0;W=Y;break f}else{ca=O+_|0;break}}else{ca=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ca;ba=Z;T=201;break d}}}while(0);c[3145]=c[3145]|4;da=W;T=198}else{da=0;T=198}}while(0);do{if((T|0)==198){if(S>>>0>=2147483647>>>0){break}W=Mb(S|0)|0;Z=Mb(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ca=Z-W|0;Z=ca>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ca:da;ba=Y;T=201}}}while(0);do{if((T|0)==201){da=(c[3142]|0)+aa|0;c[3142]=da;if(da>>>0>(c[3143]|0)>>>0){c[3143]=da}da=c[3040]|0;g:do{if((da|0)==0){S=c[3038]|0;if((S|0)==0|ba>>>0<S>>>0){c[3038]=ba}c[3146]=ba;c[3147]=aa;c[3149]=0;c[3043]=c[3018];c[3042]=-1;S=0;do{Y=S<<1;ca=12176+(Y<<2)|0;c[12176+(Y+3<<2)>>2]=ca;c[12176+(Y+2<<2)>>2]=ca;S=S+1|0;}while(S>>>0<32>>>0);S=ba+8|0;if((S&7|0)==0){ea=0}else{ea=-S&7}S=aa-40-ea|0;c[3040]=ba+ea;c[3037]=S;c[ba+(ea+4)>>2]=S|1;c[ba+(aa-36)>>2]=40;c[3041]=c[3022]}else{S=12584;while(1){fa=c[S>>2]|0;ga=S+4|0;ha=c[ga>>2]|0;if((ba|0)==(fa+ha|0)){T=213;break}ca=c[S+8>>2]|0;if((ca|0)==0){break}else{S=ca}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ca=da;if(!(ca>>>0>=fa>>>0&ca>>>0<ba>>>0)){break}c[ga>>2]=ha+aa;ca=c[3040]|0;Y=(c[3037]|0)+aa|0;Z=ca;W=ca+8|0;if((W&7|0)==0){ia=0}else{ia=-W&7}W=Y-ia|0;c[3040]=Z+ia;c[3037]=W;c[Z+(ia+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3041]=c[3022];break g}}while(0);if(ba>>>0<(c[3038]|0)>>>0){c[3038]=ba}S=ba+aa|0;Y=12584;while(1){ja=Y|0;if((c[ja>>2]|0)==(S|0)){T=223;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[ja>>2]=ba;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ba+8|0;if((S&7|0)==0){ka=0}else{ka=-S&7}S=ba+(aa+8)|0;if((S&7|0)==0){la=0}else{la=-S&7}S=ba+(la+aa)|0;Z=S;W=ka+o|0;ca=ba+W|0;_=ca;K=S-(ba+ka)-o|0;c[ba+(ka+4)>>2]=o|3;do{if((Z|0)==(c[3040]|0)){J=(c[3037]|0)+K|0;c[3037]=J;c[3040]=_;c[ba+(W+4)>>2]=J|1}else{if((Z|0)==(c[3039]|0)){J=(c[3036]|0)+K|0;c[3036]=J;c[3039]=_;c[ba+(W+4)>>2]=J|1;c[ba+(J+W)>>2]=J;break}J=aa+4|0;X=c[ba+(J+la)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;h:do{if(X>>>0<256>>>0){U=c[ba+((la|8)+aa)>>2]|0;Q=c[ba+(aa+12+la)>>2]|0;R=12176+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3038]|0)>>>0){Xb();return 0}if((c[U+12>>2]|0)==(Z|0)){break}Xb();return 0}}while(0);if((Q|0)==(U|0)){c[3034]=c[3034]&~(1<<V);break}do{if((Q|0)==(R|0)){ma=Q+8|0}else{if(Q>>>0<(c[3038]|0)>>>0){Xb();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){ma=m;break}Xb();return 0}}while(0);c[U+12>>2]=Q;c[ma>>2]=U}else{R=S;m=c[ba+((la|24)+aa)>>2]|0;P=c[ba+(aa+12+la)>>2]|0;do{if((P|0)==(R|0)){O=la|16;g=ba+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ba+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){na=0;break}else{oa=O;pa=e}}else{oa=L;pa=g}while(1){g=oa+20|0;L=c[g>>2]|0;if((L|0)!=0){oa=L;pa=g;continue}g=oa+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{oa=L;pa=g}}if(pa>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[pa>>2]=0;na=oa;break}}else{g=c[ba+((la|8)+aa)>>2]|0;if(g>>>0<(c[3038]|0)>>>0){Xb();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){Xb();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;na=P;break}else{Xb();return 0}}}while(0);if((m|0)==0){break}P=ba+(aa+28+la)|0;U=12440+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=na;if((na|0)!=0){break}c[3035]=c[3035]&~(1<<c[P>>2]);break h}else{if(m>>>0<(c[3038]|0)>>>0){Xb();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=na}else{c[m+20>>2]=na}if((na|0)==0){break h}}}while(0);if(na>>>0<(c[3038]|0)>>>0){Xb();return 0}c[na+24>>2]=m;R=la|16;P=c[ba+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[na+16>>2]=P;c[P+24>>2]=na;break}}}while(0);P=c[ba+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[na+20>>2]=P;c[P+24>>2]=na;break}}}while(0);qa=ba+(($|la)+aa)|0;ra=$+K|0}else{qa=Z;ra=K}J=qa+4|0;c[J>>2]=c[J>>2]&-2;c[ba+(W+4)>>2]=ra|1;c[ba+(ra+W)>>2]=ra;J=ra>>>3;if(ra>>>0<256>>>0){V=J<<1;X=12176+(V<<2)|0;P=c[3034]|0;m=1<<J;do{if((P&m|0)==0){c[3034]=P|m;sa=X;ta=12176+(V+2<<2)|0}else{J=12176+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3038]|0)>>>0){sa=U;ta=J;break}Xb();return 0}}while(0);c[ta>>2]=_;c[sa+12>>2]=_;c[ba+(W+8)>>2]=sa;c[ba+(W+12)>>2]=X;break}V=ca;m=ra>>>8;do{if((m|0)==0){ua=0}else{if(ra>>>0>16777215>>>0){ua=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;ua=ra>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12440+(ua<<2)|0;c[ba+(W+28)>>2]=ua;c[ba+(W+20)>>2]=0;c[ba+(W+16)>>2]=0;X=c[3035]|0;Q=1<<ua;if((X&Q|0)==0){c[3035]=X|Q;c[m>>2]=V;c[ba+(W+24)>>2]=m;c[ba+(W+12)>>2]=V;c[ba+(W+8)>>2]=V;break}if((ua|0)==31){va=0}else{va=25-(ua>>>1)|0}Q=ra<<va;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ra|0)){break}wa=X+16+(Q>>>31<<2)|0;m=c[wa>>2]|0;if((m|0)==0){T=296;break}else{Q=Q<<1;X=m}}if((T|0)==296){if(wa>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[wa>>2]=V;c[ba+(W+24)>>2]=X;c[ba+(W+12)>>2]=V;c[ba+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3038]|0;if(X>>>0<$>>>0){Xb();return 0}if(m>>>0<$>>>0){Xb();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ba+(W+8)>>2]=m;c[ba+(W+12)>>2]=X;c[ba+(W+24)>>2]=0;break}}}while(0);n=ba+(ka|8)|0;return n|0}}while(0);Y=da;W=12584;while(1){xa=c[W>>2]|0;if(xa>>>0<=Y>>>0){ya=c[W+4>>2]|0;za=xa+ya|0;if(za>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=xa+(ya-39)|0;if((W&7|0)==0){Aa=0}else{Aa=-W&7}W=xa+(ya-47+Aa)|0;ca=W>>>0<(da+16|0)>>>0?Y:W;W=ca+8|0;_=ba+8|0;if((_&7|0)==0){Ba=0}else{Ba=-_&7}_=aa-40-Ba|0;c[3040]=ba+Ba;c[3037]=_;c[ba+(Ba+4)>>2]=_|1;c[ba+(aa-36)>>2]=40;c[3041]=c[3022];c[ca+4>>2]=27;c[W>>2]=c[3146];c[W+4>>2]=c[3147];c[W+8>>2]=c[3148];c[W+12>>2]=c[3149];c[3146]=ba;c[3147]=aa;c[3149]=0;c[3148]=W;W=ca+28|0;c[W>>2]=7;if((ca+32|0)>>>0<za>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<za>>>0){_=W}else{break}}}if((ca|0)==(Y|0)){break}_=ca-da|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[da+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=12176+(K<<2)|0;S=c[3034]|0;m=1<<W;do{if((S&m|0)==0){c[3034]=S|m;Ca=Z;Da=12176+(K+2<<2)|0}else{W=12176+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3038]|0)>>>0){Ca=Q;Da=W;break}Xb();return 0}}while(0);c[Da>>2]=da;c[Ca+12>>2]=da;c[da+8>>2]=Ca;c[da+12>>2]=Z;break}K=da;m=_>>>8;do{if((m|0)==0){Ea=0}else{if(_>>>0>16777215>>>0){Ea=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ca=(Y+520192|0)>>>16&4;W=Y<<ca;Y=(W+245760|0)>>>16&2;Q=14-(ca|S|Y)+(W<<Y>>>15)|0;Ea=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12440+(Ea<<2)|0;c[da+28>>2]=Ea;c[da+20>>2]=0;c[da+16>>2]=0;Z=c[3035]|0;Q=1<<Ea;if((Z&Q|0)==0){c[3035]=Z|Q;c[m>>2]=K;c[da+24>>2]=m;c[da+12>>2]=da;c[da+8>>2]=da;break}if((Ea|0)==31){Fa=0}else{Fa=25-(Ea>>>1)|0}Q=_<<Fa;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}Ga=Z+16+(Q>>>31<<2)|0;m=c[Ga>>2]|0;if((m|0)==0){T=331;break}else{Q=Q<<1;Z=m}}if((T|0)==331){if(Ga>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[Ga>>2]=K;c[da+24>>2]=Z;c[da+12>>2]=da;c[da+8>>2]=da;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3038]|0;if(Z>>>0<m>>>0){Xb();return 0}if(_>>>0<m>>>0){Xb();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[da+8>>2]=_;c[da+12>>2]=Z;c[da+24>>2]=0;break}}}while(0);da=c[3037]|0;if(da>>>0<=o>>>0){break}_=da-o|0;c[3037]=_;da=c[3040]|0;Q=da;c[3040]=Q+o;c[Q+(o+4)>>2]=_|1;c[da+4>>2]=o|3;n=da+8|0;return n|0}}while(0);c[(Pb()|0)>>2]=12;n=0;return n|0}function Hm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3038]|0;if(b>>>0<e>>>0){Xb()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){Xb()}h=f&-8;i=a+(h-8)|0;j=i;a:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){Xb()}if((n|0)==(c[3039]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3036]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=12176+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){Xb()}if((c[k+12>>2]|0)==(n|0)){break}Xb()}}while(0);if((s|0)==(k|0)){c[3034]=c[3034]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){Xb()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}Xb()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){Xb()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){Xb()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){Xb()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{Xb()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=12440+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3035]=c[3035]&~(1<<c[v>>2]);q=n;r=o;break a}else{if(p>>>0<(c[3038]|0)>>>0){Xb()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break a}}}while(0);if(A>>>0<(c[3038]|0)>>>0){Xb()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3038]|0)>>>0){Xb()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3038]|0)>>>0){Xb()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){Xb()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){Xb()}do{if((e&2|0)==0){if((j|0)==(c[3040]|0)){B=(c[3037]|0)+r|0;c[3037]=B;c[3040]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3039]|0)){return}c[3039]=0;c[3036]=0;return}if((j|0)==(c[3039]|0)){B=(c[3036]|0)+r|0;c[3036]=B;c[3039]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;b:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=12176+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3038]|0)>>>0){Xb()}if((c[u+12>>2]|0)==(j|0)){break}Xb()}}while(0);if((g|0)==(u|0)){c[3034]=c[3034]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3038]|0)>>>0){Xb()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}Xb()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3038]|0)>>>0){Xb()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3038]|0)>>>0){Xb()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){Xb()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{Xb()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=12440+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3035]=c[3035]&~(1<<c[t>>2]);break b}else{if(f>>>0<(c[3038]|0)>>>0){Xb()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break b}}}while(0);if(E>>>0<(c[3038]|0)>>>0){Xb()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3038]|0)>>>0){Xb()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3038]|0)>>>0){Xb()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3039]|0)){H=B;break}c[3036]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=12176+(d<<2)|0;A=c[3034]|0;E=1<<r;do{if((A&E|0)==0){c[3034]=A|E;I=e;J=12176+(d+2<<2)|0}else{r=12176+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3038]|0)>>>0){I=h;J=r;break}Xb()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=12440+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3035]|0;d=1<<K;do{if((r&d|0)==0){c[3035]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=129;break}else{A=A<<1;J=E}}if((N|0)==129){if(M>>>0<(c[3038]|0)>>>0){Xb()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3038]|0;if(J>>>0<E>>>0){Xb()}if(B>>>0<E>>>0){Xb()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3042]|0)-1|0;c[3042]=q;if((q|0)==0){O=12592}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3042]=-1;return}function Im(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=Gm(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(Pb()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=Jm(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=Gm(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;Vm(f|0,a|0,g>>>0<b>>>0?g:b)|0;Hm(a);d=f;return d|0}function Jm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3038]|0;if(g>>>0<j>>>0){Xb();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){Xb();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){Xb();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3020]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;Km(g+b|0,k);n=a;return n|0}if((i|0)==(c[3040]|0)){k=(c[3037]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3040]=g+b;c[3037]=l;n=a;return n|0}if((i|0)==(c[3039]|0)){l=(c[3036]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3036]=q;c[3039]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;a:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=12176+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){Xb();return 0}if((c[l+12>>2]|0)==(i|0)){break}Xb();return 0}}while(0);if((k|0)==(l|0)){c[3034]=c[3034]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){Xb();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}Xb();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){Xb();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){Xb();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){Xb();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{Xb();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=12440+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3035]=c[3035]&~(1<<c[t>>2]);break a}else{if(s>>>0<(c[3038]|0)>>>0){Xb();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break a}}}while(0);if(y>>>0<(c[3038]|0)>>>0){Xb();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3038]|0)>>>0){Xb();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;Km(g+b|0,q);n=a;return n|0}return 0}function Km(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;a:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3038]|0;if(i>>>0<l>>>0){Xb()}if((j|0)==(c[3039]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3036]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=12176+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){Xb()}if((c[p+12>>2]|0)==(j|0)){break}Xb()}}while(0);if((q|0)==(p|0)){c[3034]=c[3034]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){Xb()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}Xb()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){Xb()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){Xb()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){Xb()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{Xb()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=12440+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3035]=c[3035]&~(1<<c[t>>2]);n=j;o=k;break a}else{if(m>>>0<(c[3038]|0)>>>0){Xb()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break a}}}while(0);if(y>>>0<(c[3038]|0)>>>0){Xb()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3038]|0)>>>0){Xb()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3038]|0)>>>0){Xb()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3038]|0;if(e>>>0<a>>>0){Xb()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3040]|0)){A=(c[3037]|0)+o|0;c[3037]=A;c[3040]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3039]|0)){return}c[3039]=0;c[3036]=0;return}if((f|0)==(c[3039]|0)){A=(c[3036]|0)+o|0;c[3036]=A;c[3039]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;b:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=12176+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){Xb()}if((c[g+12>>2]|0)==(f|0)){break}Xb()}}while(0);if((t|0)==(g|0)){c[3034]=c[3034]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){Xb()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}Xb()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){Xb()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){Xb()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){Xb()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{Xb()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=12440+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3035]=c[3035]&~(1<<c[l>>2]);break b}else{if(m>>>0<(c[3038]|0)>>>0){Xb()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break b}}}while(0);if(C>>>0<(c[3038]|0)>>>0){Xb()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3038]|0)>>>0){Xb()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3038]|0)>>>0){Xb()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3039]|0)){F=A;break}c[3036]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=12176+(z<<2)|0;C=c[3034]|0;b=1<<o;do{if((C&b|0)==0){c[3034]=C|b;G=y;H=12176+(z+2<<2)|0}else{o=12176+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3038]|0)>>>0){G=d;H=o;break}Xb()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=12440+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3035]|0;z=1<<I;if((o&z|0)==0){c[3035]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=126;break}else{I=I<<1;J=G}}if((L|0)==126){if(K>>>0<(c[3038]|0)>>>0){Xb()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3038]|0;if(J>>>0<I>>>0){Xb()}if(L>>>0<I>>>0){Xb()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function Lm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,S=0.0,T=0.0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,da=0,ea=0,fa=0,ga=0,ha=0.0,ia=0.0,ja=0,ka=0,la=0.0,ma=0.0,na=0,oa=0.0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0.0,ya=0,za=0.0,Aa=0,Ba=0.0,Ca=0,Ea=0,Fa=0,Ga=0.0,Ha=0,Ia=0.0,Ja=0.0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,fb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0.0,Ac=0,Bc=0,Cc=0.0,Dc=0.0,Ec=0.0,Fc=0.0,Gc=0.0,Hc=0.0,Ic=0.0,Jc=0,Kc=0,Lc=0.0,Mc=0,Nc=0;g=i;i=i+512|0;h=g|0;if((e|0)==1){j=-1074;k=53}else if((e|0)==2){j=-1074;k=53}else if((e|0)==0){j=-149;k=24}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=Om(b)|0}}while((Da(o|0)|0)!=0);do{if((o|0)==45|(o|0)==43){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;t=n;break}else{q=Om(b)|0;t=n;break}}else{q=o;t=1}}while(0);o=0;n=q;while(1){if((n|32|0)!=(a[3512+o|0]|0)){u=o;v=n;break}do{if(o>>>0<7>>>0){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;w=d[q]|0;break}else{w=Om(b)|0;break}}else{w=n}}while(0);q=o+1|0;if(q>>>0<8>>>0){o=q;n=w}else{u=q;v=w;break}}do{if((u|0)==3){x=23}else if((u|0)!=8){w=(f|0)==0;if(!(u>>>0<4>>>0|w)){if((u|0)==8){break}else{x=23;break}}do{if((u|0)==0){if((v|32|0)==110){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;y=d[n]|0}else{y=Om(b)|0}if((y|32|0)!=97){break}n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;z=d[n]|0}else{z=Om(b)|0}if((z|32|0)!=110){break}n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;A=d[n]|0}else{A=Om(b)|0}if((A|0)==40){B=1}else{if((c[m>>2]|0)==0){l=+r;i=g;return+l}c[e>>2]=(c[e>>2]|0)-1;l=+r;i=g;return+l}while(1){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;C=d[n]|0}else{C=Om(b)|0}if(!((C-48|0)>>>0<10>>>0|(C-65|0)>>>0<26>>>0)){if(!((C-97|0)>>>0<26>>>0|(C|0)==95)){break}}B=B+1|0}if((C|0)==41){l=+r;i=g;return+l}n=(c[m>>2]|0)==0;if(!n){c[e>>2]=(c[e>>2]|0)-1}if(w){c[(Pb()|0)>>2]=22;Nm(b,0);l=0.0;i=g;return+l}if((B|0)==0|n){l=+r;i=g;return+l}else{D=B}while(1){n=D-1|0;c[e>>2]=(c[e>>2]|0)-1;if((n|0)==0){l=+r;break}else{D=n}}i=g;return+l}do{if((v|0)==48){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;E=d[n]|0}else{E=Om(b)|0}if((E|32|0)!=120){if((c[m>>2]|0)==0){F=48;break}c[e>>2]=(c[e>>2]|0)-1;F=48;break}n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;H=d[n]|0;I=0}else{H=Om(b)|0;I=0}while(1){if((H|0)==46){x=68;break}else if((H|0)!=48){J=H;K=0;L=0;M=0;N=0;O=I;P=0;Q=0;S=1.0;T=0.0;U=0;break}n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;H=d[n]|0;I=1;continue}else{H=Om(b)|0;I=1;continue}}a:do{if((x|0)==68){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;V=d[n]|0}else{V=Om(b)|0}if((V|0)==48){W=-1;X=-1}else{J=V;K=0;L=0;M=0;N=0;O=I;P=1;Q=0;S=1.0;T=0.0;U=0;break}while(1){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;Y=d[n]|0}else{Y=Om(b)|0}if((Y|0)!=48){J=Y;K=0;L=0;M=W;N=X;O=1;P=1;Q=0;S=1.0;T=0.0;U=0;break a}n=$m(X,W,-1,-1)|0;W=G;X=n}}}while(0);b:while(1){n=J-48|0;do{if(n>>>0<10>>>0){Z=n;x=82}else{o=J|32;q=(J|0)==46;if(!((o-97|0)>>>0<6>>>0|q)){_=J;break b}if(q){if((P|0)==0){$=K;aa=L;ba=K;da=L;ea=O;fa=1;ga=Q;ha=S;ia=T;ja=U;break}else{_=46;break b}}else{Z=(J|0)>57?o-87|0:n;x=82;break}}}while(0);if((x|0)==82){x=0;n=0;do{if((K|0)<(n|0)|(K|0)==(n|0)&L>>>0<8>>>0){ka=Q;la=S;ma=T;na=Z+(U<<4)|0}else{o=0;if((K|0)<(o|0)|(K|0)==(o|0)&L>>>0<14>>>0){oa=S*.0625;ka=Q;la=oa;ma=T+oa*+(Z|0);na=U;break}if(!((Z|0)!=0&(Q|0)==0)){ka=Q;la=S;ma=T;na=U;break}ka=1;la=S;ma=T+S*.5;na=U}}while(0);n=$m(L,K,1,0)|0;$=G;aa=n;ba=M;da=N;ea=1;fa=P;ga=ka;ha=la;ia=ma;ja=na}n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;J=d[n]|0;K=$;L=aa;M=ba;N=da;O=ea;P=fa;Q=ga;S=ha;T=ia;U=ja;continue}else{J=Om(b)|0;K=$;L=aa;M=ba;N=da;O=ea;P=fa;Q=ga;S=ha;T=ia;U=ja;continue}}if((O|0)==0){n=(c[m>>2]|0)==0;if(!n){c[e>>2]=(c[e>>2]|0)-1}do{if(w){Nm(b,0)}else{if(n){break}o=c[e>>2]|0;c[e>>2]=o-1;if((P|0)==0){break}c[e>>2]=o-2}}while(0);l=+(t|0)*0.0;i=g;return+l}n=(P|0)==0;o=n?L:N;q=n?K:M;n=0;if((K|0)<(n|0)|(K|0)==(n|0)&L>>>0<8>>>0){n=U;p=K;pa=L;while(1){qa=n<<4;ra=$m(pa,p,1,0)|0;sa=G;ta=0;if((sa|0)<(ta|0)|(sa|0)==(ta|0)&ra>>>0<8>>>0){n=qa;p=sa;pa=ra}else{ua=qa;break}}}else{ua=U}do{if((_|32|0)==112){pa=Mm(b,f)|0;p=G;if(!((pa|0)==0&(p|0)==(-2147483648|0))){va=p;wa=pa;break}if(w){Nm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){va=0;wa=0;break}c[e>>2]=(c[e>>2]|0)-1;va=0;wa=0;break}}else{if((c[m>>2]|0)==0){va=0;wa=0;break}c[e>>2]=(c[e>>2]|0)-1;va=0;wa=0}}while(0);pa=$m(o<<2|0>>>30,q<<2|o>>>30,-32,-1)|0;p=$m(pa,G,wa,va)|0;pa=G;if((ua|0)==0){l=+(t|0)*0.0;i=g;return+l}n=0;if((pa|0)>(n|0)|(pa|0)==(n|0)&p>>>0>(-j|0)>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}n=j-106|0;qa=(n|0)<0|0?-1:0;if((pa|0)<(qa|0)|(pa|0)==(qa|0)&p>>>0<n>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((ua|0)>-1){n=ua;oa=T;qa=pa;ra=p;while(1){sa=n<<1;if(oa<.5){xa=oa;ya=sa}else{xa=oa+-1.0;ya=sa|1}za=oa+xa;sa=$m(ra,qa,-1,-1)|0;ta=G;if((ya|0)>-1){n=ya;oa=za;qa=ta;ra=sa}else{Aa=ya;Ba=za;Ca=ta;Ea=sa;break}}}else{Aa=ua;Ba=T;Ca=pa;Ea=p}ra=0;qa=an(32,0,j,(j|0)<0|0?-1:0)|0;n=$m(Ea,Ca,qa,G)|0;qa=G;if((ra|0)>(qa|0)|(ra|0)==(qa|0)&k>>>0>n>>>0){qa=n;Fa=(qa|0)<0?0:qa}else{Fa=k}do{if((Fa|0)<53){oa=+(t|0);za=+gb(+(+Pm(1.0,84-Fa|0)),+oa);if(!((Fa|0)<32&Ba!=0.0)){Ga=Ba;Ha=Aa;Ia=za;Ja=oa;break}qa=Aa&1;Ga=(qa|0)==0?0.0:Ba;Ha=(qa^1)+Aa|0;Ia=za;Ja=oa}else{Ga=Ba;Ha=Aa;Ia=0.0;Ja=+(t|0)}}while(0);oa=Ja*Ga+(Ia+Ja*+(Ha>>>0>>>0))-Ia;if(oa==0.0){c[(Pb()|0)>>2]=34}l=+Qm(oa,Ea);i=g;return+l}else{F=v}}while(0);p=j+k|0;pa=3-p|0;qa=F;n=0;while(1){if((qa|0)==46){x=137;break}else if((qa|0)!=48){Ka=qa;La=0;Ma=n;Na=0;Oa=0;break}ra=c[e>>2]|0;if(ra>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ra+1;qa=d[ra]|0;n=1;continue}else{qa=Om(b)|0;n=1;continue}}c:do{if((x|0)==137){qa=c[e>>2]|0;if(qa>>>0<(c[m>>2]|0)>>>0){c[e>>2]=qa+1;Pa=d[qa]|0}else{Pa=Om(b)|0}if((Pa|0)==48){Qa=-1;Ra=-1}else{Ka=Pa;La=1;Ma=n;Na=0;Oa=0;break}while(1){qa=c[e>>2]|0;if(qa>>>0<(c[m>>2]|0)>>>0){c[e>>2]=qa+1;Sa=d[qa]|0}else{Sa=Om(b)|0}if((Sa|0)!=48){Ka=Sa;La=1;Ma=1;Na=Qa;Oa=Ra;break c}qa=$m(Ra,Qa,-1,-1)|0;Qa=G;Ra=qa}}}while(0);n=h|0;c[n>>2]=0;qa=Ka-48|0;ra=(Ka|0)==46;d:do{if(qa>>>0<10>>>0|ra){o=h+496|0;q=Na;sa=Oa;ta=0;Ta=0;Ua=0;Va=Ma;Wa=La;Xa=0;Ya=0;Za=Ka;_a=qa;$a=ra;while(1){do{if($a){if((Wa|0)==0){ab=Ya;bb=Xa;cb=1;db=Va;fb=Ua;hb=ta;ib=Ta;jb=ta;kb=Ta}else{lb=q;mb=sa;nb=ta;ob=Ta;pb=Ua;qb=Va;rb=Xa;sb=Ya;tb=Za;break d}}else{ub=$m(Ta,ta,1,0)|0;vb=G;wb=(Za|0)!=48;if((Xa|0)>=125){if(!wb){ab=Ya;bb=Xa;cb=Wa;db=Va;fb=Ua;hb=vb;ib=ub;jb=q;kb=sa;break}c[o>>2]=c[o>>2]|1;ab=Ya;bb=Xa;cb=Wa;db=Va;fb=Ua;hb=vb;ib=ub;jb=q;kb=sa;break}xb=h+(Xa<<2)|0;if((Ya|0)==0){yb=_a}else{yb=Za-48+((c[xb>>2]|0)*10|0)|0}c[xb>>2]=yb;xb=Ya+1|0;zb=(xb|0)==9;ab=zb?0:xb;bb=(zb&1)+Xa|0;cb=Wa;db=1;fb=wb?ub:Ua;hb=vb;ib=ub;jb=q;kb=sa}}while(0);ub=c[e>>2]|0;if(ub>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ub+1;Ab=d[ub]|0}else{Ab=Om(b)|0}ub=Ab-48|0;vb=(Ab|0)==46;if(ub>>>0<10>>>0|vb){q=jb;sa=kb;ta=hb;Ta=ib;Ua=fb;Va=db;Wa=cb;Xa=bb;Ya=ab;Za=Ab;_a=ub;$a=vb}else{Bb=jb;Cb=kb;Db=hb;Eb=ib;Fb=fb;Gb=db;Hb=cb;Ib=bb;Jb=ab;Kb=Ab;x=160;break}}}else{Bb=Na;Cb=Oa;Db=0;Eb=0;Fb=0;Gb=Ma;Hb=La;Ib=0;Jb=0;Kb=Ka;x=160}}while(0);if((x|0)==160){ra=(Hb|0)==0;lb=ra?Db:Bb;mb=ra?Eb:Cb;nb=Db;ob=Eb;pb=Fb;qb=Gb;rb=Ib;sb=Jb;tb=Kb}ra=(qb|0)!=0;do{if(ra){if((tb|32|0)!=101){x=169;break}qa=Mm(b,f)|0;$a=G;do{if((qa|0)==0&($a|0)==(-2147483648|0)){if(w){Nm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Lb=0;Mb=0;break}c[e>>2]=(c[e>>2]|0)-1;Lb=0;Mb=0;break}}else{Lb=$a;Mb=qa}}while(0);qa=$m(Mb,Lb,mb,lb)|0;Nb=G;Ob=qa}else{x=169}}while(0);do{if((x|0)==169){if((tb|0)<=-1){Nb=lb;Ob=mb;break}if((c[m>>2]|0)==0){Nb=lb;Ob=mb;break}c[e>>2]=(c[e>>2]|0)-1;Nb=lb;Ob=mb}}while(0);if(!ra){c[(Pb()|0)>>2]=22;Nm(b,0);l=0.0;i=g;return+l}qa=c[n>>2]|0;if((qa|0)==0){l=+(t|0)*0.0;i=g;return+l}$a=0;do{if((Ob|0)==(ob|0)&(Nb|0)==(nb|0)&((nb|0)<($a|0)|(nb|0)==($a|0)&ob>>>0<10>>>0)){if(k>>>0<=30>>>0){if((qa>>>(k>>>0)|0)!=0){break}}l=+(t|0)*+(qa>>>0>>>0);i=g;return+l}}while(0);qa=(j|0)/-2|0;$a=(qa|0)<0|0?-1:0;if((Nb|0)>($a|0)|(Nb|0)==($a|0)&Ob>>>0>qa>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}qa=j-106|0;$a=(qa|0)<0|0?-1:0;if((Nb|0)<($a|0)|(Nb|0)==($a|0)&Ob>>>0<qa>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((sb|0)==0){Qb=rb}else{if((sb|0)<9){qa=h+(rb<<2)|0;$a=sb;ra=c[qa>>2]|0;do{ra=ra*10|0;$a=$a+1|0;}while(($a|0)<9);c[qa>>2]=ra}Qb=rb+1|0}$a=Ob;do{if((pb|0)<9){if(!((pb|0)<=($a|0)&($a|0)<18)){break}if(($a|0)==9){l=+(t|0)*+((c[n>>2]|0)>>>0>>>0);i=g;return+l}if(($a|0)<9){l=+(t|0)*+((c[n>>2]|0)>>>0>>>0)/+(c[1944+(8-$a<<2)>>2]|0);i=g;return+l}_a=k+27+($a*-3|0)|0;Za=c[n>>2]|0;if((_a|0)<=30){if((Za>>>(_a>>>0)|0)!=0){break}}l=+(t|0)*+(Za>>>0>>>0)*+(c[1944+($a-10<<2)>>2]|0);i=g;return+l}}while(0);n=($a|0)%9|0;if((n|0)==0){Rb=0;Sb=Qb;Tb=0;Ub=$a}else{ra=($a|0)>-1?n:n+9|0;n=c[1944+(8-ra<<2)>>2]|0;do{if((Qb|0)==0){Vb=0;Wb=0;Xb=$a}else{qa=1e9/(n|0)|0;Za=$a;_a=0;Ya=0;Xa=0;while(1){Wa=h+(Ya<<2)|0;Va=c[Wa>>2]|0;Ua=((Va>>>0)/(n>>>0)|0)+Xa|0;c[Wa>>2]=Ua;Yb=ca((Va>>>0)%(n>>>0)|0,qa)|0;Va=Ya+1|0;if((Ya|0)==(_a|0)&(Ua|0)==0){Zb=Va&127;_b=Za-9|0}else{Zb=_a;_b=Za}if((Va|0)==(Qb|0)){break}else{Za=_b;_a=Zb;Ya=Va;Xa=Yb}}if((Yb|0)==0){Vb=Qb;Wb=Zb;Xb=_b;break}c[h+(Qb<<2)>>2]=Yb;Vb=Qb+1|0;Wb=Zb;Xb=_b}}while(0);Rb=Wb;Sb=Vb;Tb=0;Ub=9-ra+Xb|0}e:while(1){n=h+(Rb<<2)|0;if((Ub|0)<18){$a=Sb;Xa=Tb;while(1){Ya=0;_a=$a+127|0;Za=$a;while(1){qa=_a&127;Va=h+(qa<<2)|0;Ua=c[Va>>2]|0;Wa=$m(Ua<<29|0>>>3,0<<29|Ua>>>3,Ya,0)|0;Ua=G;Ta=0;if(Ua>>>0>Ta>>>0|Ua>>>0==Ta>>>0&Wa>>>0>1e9>>>0){Ta=ln(Wa,Ua,1e9,0)|0;ta=mn(Wa,Ua,1e9,0)|0;$b=Ta;ac=ta}else{$b=0;ac=Wa}c[Va>>2]=ac;Va=(qa|0)==(Rb|0);if((qa|0)!=(Za+127&127|0)|Va){bc=Za}else{bc=(ac|0)==0?qa:Za}if(Va){break}else{Ya=$b;_a=qa-1|0;Za=bc}}Za=Xa-29|0;if(($b|0)==0){$a=bc;Xa=Za}else{cc=Za;dc=bc;ec=$b;break}}}else{if((Ub|0)==18){fc=Sb;gc=Tb}else{hc=Rb;ic=Sb;jc=Tb;kc=Ub;break}while(1){if((c[n>>2]|0)>>>0>=9007199>>>0){hc=Rb;ic=fc;jc=gc;kc=18;break e}Xa=0;$a=fc+127|0;Za=fc;while(1){_a=$a&127;Ya=h+(_a<<2)|0;qa=c[Ya>>2]|0;Va=$m(qa<<29|0>>>3,0<<29|qa>>>3,Xa,0)|0;qa=G;Wa=0;if(qa>>>0>Wa>>>0|qa>>>0==Wa>>>0&Va>>>0>1e9>>>0){Wa=ln(Va,qa,1e9,0)|0;ta=mn(Va,qa,1e9,0)|0;lc=Wa;mc=ta}else{lc=0;mc=Va}c[Ya>>2]=mc;Ya=(_a|0)==(Rb|0);if((_a|0)!=(Za+127&127|0)|Ya){nc=Za}else{nc=(mc|0)==0?_a:Za}if(Ya){break}else{Xa=lc;$a=_a-1|0;Za=nc}}Za=gc-29|0;if((lc|0)==0){fc=nc;gc=Za}else{cc=Za;dc=nc;ec=lc;break}}}n=Rb+127&127;if((n|0)==(dc|0)){Za=dc+127&127;$a=h+((dc+126&127)<<2)|0;c[$a>>2]=c[$a>>2]|c[h+(Za<<2)>>2];oc=Za}else{oc=dc}c[h+(n<<2)>>2]=ec;Rb=n;Sb=oc;Tb=cc;Ub=Ub+9|0}f:while(1){pc=ic+1&127;ra=h+((ic+127&127)<<2)|0;n=hc;Za=jc;$a=kc;while(1){Xa=($a|0)==18;_a=($a|0)>27?9:1;qc=n;rc=Za;while(1){Ya=0;while(1){if((Ya|0)>=2){sc=Ya;break}Va=Ya+qc&127;if((Va|0)==(ic|0)){sc=2;break}ta=c[h+(Va<<2)>>2]|0;Va=c[1936+(Ya<<2)>>2]|0;if(ta>>>0<Va>>>0){sc=2;break}if(ta>>>0>Va>>>0){sc=Ya;break}else{Ya=Ya+1|0}}if((sc|0)==2&Xa){break f}tc=_a+rc|0;if((qc|0)==(ic|0)){qc=ic;rc=tc}else{break}}Xa=(1<<_a)-1|0;Ya=1e9>>>(_a>>>0);uc=$a;vc=qc;Va=qc;wc=0;do{ta=h+(Va<<2)|0;Wa=c[ta>>2]|0;qa=(Wa>>>(_a>>>0))+wc|0;c[ta>>2]=qa;wc=ca(Wa&Xa,Ya)|0;Wa=(Va|0)==(vc|0)&(qa|0)==0;Va=Va+1&127;uc=Wa?uc-9|0:uc;vc=Wa?Va:vc;}while((Va|0)!=(ic|0));if((wc|0)==0){n=vc;Za=tc;$a=uc;continue}if((pc|0)!=(vc|0)){break}c[ra>>2]=c[ra>>2]|1;n=vc;Za=tc;$a=uc}c[h+(ic<<2)>>2]=wc;hc=vc;ic=pc;jc=tc;kc=uc}$a=qc&127;if(($a|0)==(ic|0)){c[h+(pc-1<<2)>>2]=0;xc=pc}else{xc=ic}oa=+((c[h+($a<<2)>>2]|0)>>>0>>>0);$a=qc+1&127;if(($a|0)==(xc|0)){Za=xc+1&127;c[h+(Za-1<<2)>>2]=0;yc=Za}else{yc=xc}za=+(t|0);zc=za*(oa*1.0e9+ +((c[h+($a<<2)>>2]|0)>>>0>>>0));$a=rc+53|0;Za=$a-j|0;if((Za|0)<(k|0)){Ac=(Za|0)<0?0:Za;Bc=1}else{Ac=k;Bc=0}if((Ac|0)<53){oa=+gb(+(+Pm(1.0,105-Ac|0)),+zc);Cc=+eb(+zc,+(+Pm(1.0,53-Ac|0)));Dc=oa;Ec=Cc;Fc=oa+(zc-Cc)}else{Dc=0.0;Ec=0.0;Fc=zc}n=qc+2&127;do{if((n|0)==(yc|0)){Gc=Ec}else{ra=c[h+(n<<2)>>2]|0;do{if(ra>>>0<5e8>>>0){if((ra|0)==0){if((qc+3&127|0)==(yc|0)){Hc=Ec;break}}Hc=za*.25+Ec}else{if(ra>>>0>5e8>>>0){Hc=za*.75+Ec;break}if((qc+3&127|0)==(yc|0)){Hc=za*.5+Ec;break}else{Hc=za*.75+Ec;break}}}while(0);if((53-Ac|0)<=1){Gc=Hc;break}if(+eb(+Hc,+1.0)!=0.0){Gc=Hc;break}Gc=Hc+1.0}}while(0);za=Fc+Gc-Dc;do{if(($a&2147483647|0)>(-2-p|0)){if(+R(+za)<9007199254740992.0){Ic=za;Jc=Bc;Kc=rc}else{Ic=za*.5;Jc=(Bc|0)!=0&(Ac|0)==(Za|0)?0:Bc;Kc=rc+1|0}if((Kc+53|0)<=(pa|0)){if(!((Jc|0)!=0&Gc!=0.0)){Lc=Ic;Mc=Kc;break}}c[(Pb()|0)>>2]=34;Lc=Ic;Mc=Kc}else{Lc=za;Mc=rc}}while(0);l=+Qm(Lc,Mc);i=g;return+l}}while(0);if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}c[(Pb()|0)>>2]=22;Nm(b,0);l=0.0;i=g;return+l}}while(0);do{if((x|0)==23){b=(c[m>>2]|0)==0;if(!b){c[e>>2]=(c[e>>2]|0)-1}if(u>>>0<4>>>0|(f|0)==0|b){break}else{Nc=u}do{c[e>>2]=(c[e>>2]|0)-1;Nc=Nc-1|0;}while(Nc>>>0>3>>>0)}}while(0);l=+(t|0)*s;i=g;return+l}function Mm(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=a+4|0;f=c[e>>2]|0;g=a+100|0;if(f>>>0<(c[g>>2]|0)>>>0){c[e>>2]=f+1;h=d[f]|0}else{h=Om(a)|0}do{if((h|0)==45|(h|0)==43){f=(h|0)==45|0;i=c[e>>2]|0;if(i>>>0<(c[g>>2]|0)>>>0){c[e>>2]=i+1;j=d[i]|0}else{j=Om(a)|0}if((j-48|0)>>>0<10>>>0|(b|0)==0){k=f;l=j;break}if((c[g>>2]|0)==0){k=f;l=j;break}c[e>>2]=(c[e>>2]|0)-1;k=f;l=j}else{k=0;l=h}}while(0);if((l-48|0)>>>0>9>>>0){if((c[g>>2]|0)==0){m=-2147483648;n=0;return(G=m,n)|0}c[e>>2]=(c[e>>2]|0)-1;m=-2147483648;n=0;return(G=m,n)|0}else{o=l;p=0}while(1){q=o-48+p|0;l=c[e>>2]|0;if(l>>>0<(c[g>>2]|0)>>>0){c[e>>2]=l+1;r=d[l]|0}else{r=Om(a)|0}if(!((r-48|0)>>>0<10>>>0&(q|0)<214748364)){break}o=r;p=q*10|0}p=q;o=(q|0)<0|0?-1:0;if((r-48|0)>>>0<10>>>0){q=r;l=o;h=p;while(1){j=kn(h,l,10,0)|0;b=G;f=$m(q,(q|0)<0|0?-1:0,-48,-1)|0;i=$m(f,G,j,b)|0;b=G;j=c[e>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[e>>2]=j+1;s=d[j]|0}else{s=Om(a)|0}j=21474836;if((s-48|0)>>>0<10>>>0&((b|0)<(j|0)|(b|0)==(j|0)&i>>>0<2061584302>>>0)){q=s;l=b;h=i}else{t=s;u=b;v=i;break}}}else{t=r;u=o;v=p}if((t-48|0)>>>0<10>>>0){do{t=c[e>>2]|0;if(t>>>0<(c[g>>2]|0)>>>0){c[e>>2]=t+1;w=d[t]|0}else{w=Om(a)|0}}while((w-48|0)>>>0<10>>>0)}if((c[g>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}e=(k|0)!=0;k=an(0,0,v,u)|0;m=e?G:u;n=e?k:v;return(G=m,n)|0}function Nm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a+104>>2]=b;d=c[a+8>>2]|0;e=c[a+4>>2]|0;f=d-e|0;c[a+108>>2]=f;if((b|0)!=0&(f|0)>(b|0)){c[a+100>>2]=e+b;return}else{c[a+100>>2]=d;return}}function Om(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=b+104|0;f=c[e>>2]|0;if((f|0)==0){g=3}else{if((c[b+108>>2]|0)<(f|0)){g=3}}do{if((g|0)==3){f=Sm(b)|0;if((f|0)<0){break}h=c[e>>2]|0;i=c[b+8>>2]|0;do{if((h|0)==0){g=8}else{j=c[b+4>>2]|0;k=h-(c[b+108>>2]|0)-1|0;if((i-j|0)<=(k|0)){g=8;break}c[b+100>>2]=j+k}}while(0);if((g|0)==8){c[b+100>>2]=i}h=c[b+4>>2]|0;if((i|0)!=0){k=b+108|0;c[k>>2]=i+1-h+(c[k>>2]|0)}k=h-1|0;if((d[k]|0|0)==(f|0)){l=f;return l|0}a[k]=f;l=f;return l|0}}while(0);c[b+100>>2]=0;l=-1;return l|0}function Pm(a,b){a=+a;b=b|0;var d=0.0,e=0,f=0.0,g=0;do{if((b|0)>1023){d=a*8.98846567431158e+307;e=b-1023|0;if((e|0)<=1023){f=d;g=e;break}e=b-2046|0;f=d*8.98846567431158e+307;g=(e|0)>1023?1023:e}else{if((b|0)>=-1022){f=a;g=b;break}d=a*2.2250738585072014e-308;e=b+1022|0;if((e|0)>=-1022){f=d;g=e;break}e=b+2044|0;f=d*2.2250738585072014e-308;g=(e|0)<-1022?-1022:e}}while(0);return+(f*(c[k>>2]=0<<20|0>>>12,c[k+4>>2]=g+1023<<20|0>>>12,+h[k>>3]))}function Qm(a,b){a=+a;b=b|0;return+(+Pm(a,b))}function Rm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b+74|0;e=a[d]|0;a[d]=e-1&255|e;e=b+20|0;d=b+44|0;if((c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){Fc[c[b+36>>2]&15](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[e>>2]=0;e=b|0;f=c[e>>2]|0;if((f&20|0)==0){g=c[d>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;return h|0}if((f&4|0)==0){h=-1;return h|0}c[e>>2]=f|32;h=-1;return h|0}function Sm(a){a=a|0;var b=0,e=0,f=0,g=0;b=i;i=i+8|0;e=b|0;if((c[a+8>>2]|0)==0){if((Rm(a)|0)==0){f=3}else{g=-1}}else{f=3}do{if((f|0)==3){if((Fc[c[a+32>>2]&15](a,e,1)|0)!=1){g=-1;break}g=d[e]|0}}while(0);i=b;return g|0}function Tm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0.0,j=0,k=0;d=i;i=i+112|0;e=d|0;Ym(e|0,0,112)|0;f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;Nm(e,0);h=+Lm(e,1,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+h}if((j|0)==0){k=a}else{k=a+j|0}c[b>>2]=k;i=d;return+h}function Um(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Vm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Wm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;v=v+1|0;c[a>>2]=v;while((e|0)<40){if((c[d+(e<<2)>>2]|0)==0){c[d+(e<<2)>>2]=v;c[d+((e<<2)+4)>>2]=b;c[d+((e<<2)+8)>>2]=0;return 0}e=e+2|0}ob(116);ob(111);ob(111);ob(32);ob(109);ob(97);ob(110);ob(121);ob(32);ob(115);ob(101);ob(116);ob(106);ob(109);ob(112);ob(115);ob(32);ob(105);ob(110);ob(32);ob(97);ob(32);ob(102);ob(117);ob(110);ob(99);ob(116);ob(105);ob(111);ob(110);ob(32);ob(99);ob(97);ob(108);ob(108);ob(44);ob(32);ob(98);ob(117);ob(105);ob(108);ob(100);ob(32);ob(119);ob(105);ob(116);ob(104);ob(32);ob(97);ob(32);ob(104);ob(105);ob(103);ob(104);ob(101);ob(114);ob(32);ob(118);ob(97);ob(108);ob(117);ob(101);ob(32);ob(102);ob(111);ob(114);ob(32);ob(77);ob(65);ob(88);ob(95);ob(83);ob(69);ob(84);ob(74);ob(77);ob(80);ob(83);ob(10);da(0);return 0}function Xm(a,b){a=a|0;b=b|0;var d=0,e=0;while((d|0)<20){e=c[b+(d<<2)>>2]|0;if((e|0)==0)break;if((e|0)==(a|0)){return c[b+((d<<2)+4)>>2]|0}d=d+2|0}return 0}function Ym(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function Zm(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function _m(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function $m(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(G=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function an(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(G=e,a-c>>>0|0)|0}function bn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}G=a<<c-32;return 0}function cn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}G=0;return b>>>c-32|0}function dn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}G=(b|0)<0?-1:0;return b>>c-32|0}function en(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function fn(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function gn(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ca(d,c)|0;f=a>>>16;a=(e>>>16)+(ca(d,f)|0)|0;d=b>>>16;b=ca(d,c)|0;return(G=(a>>>16)+(ca(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function hn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=an(e^a,f^b,e,f)|0;b=G;a=g^e;e=h^f;f=an((nn(i,b,an(g^c,h^d,g,h)|0,G,0)|0)^a,G^e,a,e)|0;return(G=G,f)|0}function jn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=an(h^a,j^b,h,j)|0;b=G;nn(m,b,an(k^d,l^e,k,l)|0,G,g)|0;l=an(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=G;i=f;return(G=j,l)|0}function kn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=gn(e,a)|0;f=G;return(G=(ca(b,a)|0)+(ca(d,e)|0)+f|f&0,c|0|0)|0}function ln(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=nn(a,b,c,d,0)|0;return(G=G,e)|0}function mn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;nn(a,b,d,e,g)|0;i=f;return(G=c[g+4>>2]|0,c[g>>2]|0)|0}function nn(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(G=n,o)|0}else{if(!m){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(G=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(G=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(G=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((fn(l|0)|0)>>>0);return(G=n,o)|0}p=(en(l|0)|0)-(en(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}else{if(!m){r=(en(l|0)|0)-(en(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(en(j|0)|0)+33-(en(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(G=n,o)|0}else{p=fn(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(G=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;H=0}else{g=d|0|0;d=k|e&0;e=$m(g,d,-1,-1)|0;k=G;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;an(e,k,j,a)|0;b=G;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=an(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=G;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;E=L;F=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|F;o=(K<<1|0>>>31)&-2|H;return(G=n,o)|0}function on(a,b){a=a|0;b=b|0;return Bc[a&511](b|0)|0}function pn(a){a=a|0;return ia(0,a|0)|0}function qn(a){a=a|0;return ia(1,a|0)|0}function rn(a,b){a=a|0;b=b|0;Cc[a&7](b|0)}function sn(a){a=a|0;ia(0,a|0)}function tn(a){a=a|0;ia(1,a|0)}function un(a,b,c){a=a|0;b=b|0;c=c|0;Dc[a&31](b|0,c|0)}function vn(a,b){a=a|0;b=b|0;ia(0,a|0,b|0)}function wn(a,b){a=a|0;b=b|0;ia(1,a|0,b|0)}function xn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Ec[a&15](b|0,c|0,d|0,e|0)|0}function yn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(0,a|0,b|0,c|0,d|0)|0}function zn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(1,a|0,b|0,c|0,d|0)|0}function An(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Fc[a&15](b|0,c|0,d|0)|0}function Bn(a,b,c){a=a|0;b=b|0;c=c|0;return ia(0,a|0,b|0,c|0)|0}function Cn(a,b,c){a=a|0;b=b|0;c=c|0;return ia(1,a|0,b|0,c|0)|0}function Dn(a){a=a|0;Gc[a&7]()}function En(){ia(0)}function Fn(){ia(1)}function Gn(a,b,c){a=a|0;b=b|0;c=c|0;return Hc[a&7](b|0,c|0)|0}function Hn(a,b){a=a|0;b=b|0;return ia(0,a|0,b|0)|0}function In(a,b){a=a|0;b=b|0;return ia(1,a|0,b|0)|0}function Jn(a){a=a|0;da(0);return 0}function Kn(a){a=a|0;da(1)}function Ln(a,b){a=a|0;b=b|0;da(2)}function Mn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;da(3);return 0}function Nn(a,b,c){a=a|0;b=b|0;c=c|0;da(4);return 0}function On(){da(5)}function Pn(a,b){a=a|0;b=b|0;da(6);return 0}




// EMSCRIPTEN_END_FUNCS
var Bc=[Jn,Jn,pn,Jn,qn,Jn,Gg,Jn,Bk,Jn,Ph,Jn,Mk,Jn,Kg,Jn,Zg,Jn,Yk,Jn,gm,Jn,gh,Jn,Wk,Jn,Ok,Jn,Ak,Jn,Nh,Jn,qh,Jn,Mj,Jn,zh,Jn,ch,Jn,cm,Jn,dh,Jn,jm,Jn,Ag,Jn,Eg,Jn,ei,Jn,em,Jn,Ig,Jn,bh,Jn,lj,Jn,bj,Jn,ni,Jn,om,Jn,Xg,Jn,ki,Jn,dj,Jn,fi,Jn,kh,Jn,Zl,Jn,jj,Jn,Th,Jn,wh,Jn,Nj,Jn,$i,Jn,sk,Jn,Lk,Jn,mh,Jn,mf,Jn,lh,Jn,Lj,Jn,nj,Jn,Sg,Jn,cj,Jn,pk,Jn,nm,Jn,Zk,Jn,cl,Jn,Mh,Jn,uh,Jn,fj,Jn,di,Jn,qk,Jn,eh,Jn,kj,Jn,oi,Jn,hm,Jn,im,Jn,Kk,Jn,Tl,Jn,ej,Jn,Lh,Jn,Cg,Jn,gj,Jn,Ih,Jn,xh,Jn,Nk,Jn,Fg,Jn,Xl,Jn,Vl,Jn,fh,Jn,Pg,Jn,Hh,Jn,vh,Jn,Bg,Jn,el,Jn,$k,Jn,Sk,Jn,Dh,Jn,sj,Jn,Vg,Jn,$l,Jn,Oj,Jn,oh,Jn,hh,Jn,Tk,Jn,Ck,Jn,jh,Jn,Ch,Jn,Ug,Jn,al,Jn,Fk,Jn,Yl,Jn,lm,Jn,gi,Jn,vk,Jn,Uh,Jn,ij,Jn,th,Jn,uk,Jn,sh,Jn,aj,Jn,mi,Jn,yh,Jn,Ek,Jn,Dg,Jn,wk,Jn,nh,Jn,Wg,Jn,ph,Jn,Kj,Jn,yk,Jn,ji,Jn,Dk,Jn,Tg,Jn,rh,Jn,Wl,Jn,mj,Jn,mm,Jn,Ul,Jn,hj,Jn,am,Jn,Jk,Jn,li,Jn,Jj,Jn,xk,Jn,rk,Jn,_g,Jn,Yg,Jn,Ah,Jn,Uk,Jn,bl,Jn,km,Jn,ii,Jn,Ik,Jn,Rg,Jn,fm,Jn,_k,Jn,Hk,Jn,dl,Jn,tk,Jn,Vh,Jn,Oh,Jn,Ij,Jn,zk,Jn,Sl,Jn,$g,Jn,Xk,Jn,Bh,Jn,ih,Jn,Gk,Jn,hi,Jn,Jg,Jn,Pj,Jn,Vk,Jn,dm,Jn,pm,Jn,ok,Jn,Qg,Jn,bm,Jn,Hg,Jn,Kh,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn,Jn];var Cc=[Kn,Kn,sn,Kn,tn,Kn,Kn,Kn];var Dc=[Ln,Ln,vn,Ln,wn,Ln,ug,Ln,de,Ln,Ri,Ln,Tf,Ln,Of,Ln,qm,Ln,$c,Ln,Pf,Ln,Ln,Ln,Ln,Ln,Ln,Ln,Ln,Ln,Ln,Ln];var Ec=[Mn,Mn,yn,Mn,zn,Mn,tj,Mn,lf,Mn,Mn,Mn,Mn,Mn,Mn,Mn];var Fc=[Nn,Nn,Bn,Nn,Cn,Nn,Xe,Nn,Ze,Nn,Rk,Nn,Nn,Nn,Nn,Nn];var Gc=[On,On,En,On,Fn,On,On,On];var Hc=[Pn,Pn,Hn,Pn,In,Pn,Qi,Pn];return{_lua_setglobal:Vd,_strlen:Um,_tolower:_m,_main:Zc,_lua_topointer:Ad,_realloc:Im,_lua_gettop:ed,_lua_rawlen:xd,_lua_createtable:Sd,_lua_iscfunction:nd,_lua_tonumberx:sd,_lua_rawset:Yd,_lua_toboolean:vd,_lua_setmetatable:_d,_lua_pushvalue:kd,_lua_settop:fd,_memset:Ym,_lua_pushboolean:Kd,_memcpy:Vm,_luaL_openlibs:zg,_lua_next:je,_memcmp:Zm,_lua_typename:md,_lua_pcallk:ce,_lua_getglobal:Nd,_testSetjmp:Xm,_saveSetjmp:Wm,_lua_rawget:Qd,_free:Hm,_lua_pushcclosure:Jd,_lua_pushstring:Gd,_lua_tolstring:wd,_lua_pushnil:Bd,_luaL_newstate:kf,_malloc:Gm,_lua_pushnumber:Cd,_lua_type:ld,_luaL_loadbufferx:Ye,runPostSets:Yc,stackAlloc:Ic,stackSave:Jc,stackRestore:Kc,setThrew:Lc,setTempRet0:Oc,setTempRet1:Pc,setTempRet2:Qc,setTempRet3:Rc,setTempRet4:Sc,setTempRet5:Tc,setTempRet6:Uc,setTempRet7:Vc,setTempRet8:Wc,setTempRet9:Xc,dynCall_ii:on,dynCall_vi:rn,dynCall_vii:un,dynCall_iiiii:xn,dynCall_iiii:An,dynCall_v:Dn,dynCall_iii:Gn}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiii": invoke_iiiii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_rand": _rand, "__scanString": __scanString, "_fclose": _fclose, "_freopen": _freopen, "_emscripten_run_script_string": _emscripten_run_script_string, "_fflush": _fflush, "_fputc": _fputc, "_fwrite": _fwrite, "_send": _send, "_mktime": _mktime, "_tmpnam": _tmpnam, "_isspace": _isspace, "_localtime": _localtime, "_read": _read, "_ceil": _ceil, "_strstr": _strstr, "_fsync": _fsync, "_fscanf": _fscanf, "_remove": _remove, "_modf": _modf, "_strcmp": _strcmp, "_memchr": _memchr, "_llvm_va_end": _llvm_va_end, "_tmpfile": _tmpfile, "_snprintf": _snprintf, "_fgetc": _fgetc, "_cosh": _cosh, "__getFloat": __getFloat, "_fgets": _fgets, "_close": _close, "_strchr": _strchr, "_asin": _asin, "_clock": _clock, "___setErrNo": ___setErrNo, "_emscripten_exit_with_live_runtime": _emscripten_exit_with_live_runtime, "_isxdigit": _isxdigit, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_strrchr": _strrchr, "_fmod": _fmod, "__isLeapYear": __isLeapYear, "_copysign": _copysign, "_ferror": _ferror, "_llvm_uadd_with_overflow_i32": _llvm_uadd_with_overflow_i32, "_gmtime": _gmtime, "_localtime_r": _localtime_r, "_sinh": _sinh, "_recv": _recv, "_cos": _cos, "_putchar": _putchar, "_islower": _islower, "_acos": _acos, "_isupper": _isupper, "_strftime": _strftime, "_strncmp": _strncmp, "_tzset": _tzset, "_setlocale": _setlocale, "_toupper": _toupper, "_pread": _pread, "_fopen": _fopen, "_open": _open, "_frexp": _frexp, "__arraySum": __arraySum, "_log": _log, "_isalnum": _isalnum, "_system": _system, "_isalpha": _isalpha, "_rmdir": _rmdir, "_log10": _log10, "_srand": _srand, "__formatString": __formatString, "_getenv": _getenv, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "_tanh": _tanh, "_localeconv": _localeconv, "___errno_location": ___errno_location, "_strerror": _strerror, "_llvm_lifetime_start": _llvm_lifetime_start, "_strspn": _strspn, "_ungetc": _ungetc, "_rename": _rename, "_sysconf": _sysconf, "_fread": _fread, "_abort": _abort, "_fprintf": _fprintf, "_tan": _tan, "___buildEnvironment": ___buildEnvironment, "_feof": _feof, "__addDays": __addDays, "_gmtime_r": _gmtime_r, "_ispunct": _ispunct, "_clearerr": _clearerr, "_fabs": _fabs, "_floor": _floor, "__reallyNegative": __reallyNegative, "_fseek": _fseek, "_sqrt": _sqrt, "_write": _write, "_sin": _sin, "_longjmp": _longjmp, "_atan": _atan, "_strpbrk": _strpbrk, "_isgraph": _isgraph, "_unlink": _unlink, "__exit": __exit, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_emscripten_run_script_int": _emscripten_run_script_int, "_difftime": _difftime, "_iscntrl": _iscntrl, "_atan2": _atan2, "_exp": _exp, "_time": _time, "_setvbuf": _setvbuf, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "_stderr": _stderr, "_stdout": _stdout }, buffer);
var _lua_setglobal = Module["_lua_setglobal"] = asm["_lua_setglobal"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _main = Module["_main"] = asm["_main"];
var _lua_topointer = Module["_lua_topointer"] = asm["_lua_topointer"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _lua_gettop = Module["_lua_gettop"] = asm["_lua_gettop"];
var _lua_rawlen = Module["_lua_rawlen"] = asm["_lua_rawlen"];
var _lua_createtable = Module["_lua_createtable"] = asm["_lua_createtable"];
var _lua_iscfunction = Module["_lua_iscfunction"] = asm["_lua_iscfunction"];
var _lua_tonumberx = Module["_lua_tonumberx"] = asm["_lua_tonumberx"];
var _lua_rawset = Module["_lua_rawset"] = asm["_lua_rawset"];
var _lua_toboolean = Module["_lua_toboolean"] = asm["_lua_toboolean"];
var _lua_setmetatable = Module["_lua_setmetatable"] = asm["_lua_setmetatable"];
var _lua_pushvalue = Module["_lua_pushvalue"] = asm["_lua_pushvalue"];
var _lua_settop = Module["_lua_settop"] = asm["_lua_settop"];
var _memset = Module["_memset"] = asm["_memset"];
var _lua_pushboolean = Module["_lua_pushboolean"] = asm["_lua_pushboolean"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _luaL_openlibs = Module["_luaL_openlibs"] = asm["_luaL_openlibs"];
var _lua_next = Module["_lua_next"] = asm["_lua_next"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _lua_typename = Module["_lua_typename"] = asm["_lua_typename"];
var _lua_pcallk = Module["_lua_pcallk"] = asm["_lua_pcallk"];
var _lua_getglobal = Module["_lua_getglobal"] = asm["_lua_getglobal"];
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _lua_rawget = Module["_lua_rawget"] = asm["_lua_rawget"];
var _free = Module["_free"] = asm["_free"];
var _lua_pushcclosure = Module["_lua_pushcclosure"] = asm["_lua_pushcclosure"];
var _lua_pushstring = Module["_lua_pushstring"] = asm["_lua_pushstring"];
var _lua_tolstring = Module["_lua_tolstring"] = asm["_lua_tolstring"];
var _lua_pushnil = Module["_lua_pushnil"] = asm["_lua_pushnil"];
var _luaL_newstate = Module["_luaL_newstate"] = asm["_luaL_newstate"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _lua_pushnumber = Module["_lua_pushnumber"] = asm["_lua_pushnumber"];
var _lua_type = Module["_lua_type"] = asm["_lua_type"];
var _luaL_loadbufferx = Module["_luaL_loadbufferx"] = asm["_luaL_loadbufferx"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






