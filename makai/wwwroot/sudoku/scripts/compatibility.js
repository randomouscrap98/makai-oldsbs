//Carlos Sanchez - 2016
//randomouscrap98@aol.com
//A set of functions for the ultra-compatible version of SBS

//A shim for string trim.
if (!String.prototype.trim) 
{
   String.prototype.trim = 
      function () { return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); };
}

function compatlog(message)
{
   if(window.console)
      console.log(message);
}

//Pads time with 0 so it's not stupid
function padTime(value)
{
   return ("00" + value).slice(-2);
}

function indexOf(array, value)
{
   for(var i = 0; i < array.length; i++)
      if(array[i] === value)
         return i;

   return -1;
}

function unescapeHTML(string) 
{
	var elem = document.createElement("textarea");
	elem.innerHTML = string;
	return elem.value;
}

function escapeHtml(html)
{
   var text = document.createTextNode(html);
   var div = document.createElement('div');
   div.appendChild(text);
   return div.innerHTML;
}

function queryContains(string)
{
   var queryLocation = location.href.indexOf("?");

   if(queryLocation < 0)
      return false;

   var query = location.href.substring(queryLocation);
   return query.indexOf(string) >= 0;
}

function nodeListToArray(nodeList)
{
   var tempArray = [];

   for(var i = 0; i < nodeList.length; i++)
      tempArray.push(nodeList[i]);

   return tempArray;
}

function takeOverElement(newElement, oldElement)
{
   var innerElements = nodeListToArray(oldElement.childNodes);

   for(var i = 0; i < innerElements.length; i++)
      newElement.appendChild(innerElements[i]);

   insertBeforeSelf(newElement, oldElement);
   removeSelf(oldElement);
}

function insertBeforeSelf(newElement, element)
{
   element.parentNode.insertBefore(newElement, element);
}

function removeSelf(element)
{
   element.parentNode.removeChild(element);
}

function findParentFromAction(action, element)
{
   var nextElement = element;

   while(!action(nextElement))
   {
      if(nextElement.tagName.toLowerCase() === "body")
         return false;

      nextElement = nextElement.parentNode;
   }

   return nextElement;
}

function findParentWithClass(className, element)
{
   var regex = new RegExp("\\b" + className + "\\b");

   return findParentFromAction(function(nextElement) 
   {
      return regex.test(nextElement.className);
      //return nextElement.className.indexOf(className) >= 0;
   }, element);
}

function findParentWithTag(tagName, element)
{
   return findParentFromAction(function(nextElement)
   {
      return nextElement.tagName.toLowerCase() === tagName.toLowerCase();
   }, element);
}

function findChildrenFromAction(action, element)
{
   var elements = [];

   for(var i = 0; i < element.childNodes.length; i++)
   {
      if(action(element.childNodes[i]))
         elements.push(element.childNodes[i]);

      elements.concat(findChildrenFromAction(action, element.childNodes[i]));
   }

   return elements;
}

function findChildrenWithClass(className, element)
{
   var regex = new RegExp("\\b" + className + "\\b");

   return findChildrenFromAction(function(nextElement)
   {
      return nextElement && regex.test(nextElement.className);
   }, element);
}

function hasLocalStorage()
{
   return typeof(Storage) !== "undefined" && localStorage;
}

function hasJSON()
{
   return typeof(JSON) === "object" && typeof(JSON.parse) === "function";
}

function hasDate()
{
   if(typeof(Date) === "undefined")
      return false;

   var test = new Date();
   return typeof(test.getTime) === 'function' && typeof(test.toUTCString) === 'function';
}

function writeStorage(name, value)
{
   if(hasLocalStorage() && hasJSON())
   {
      localStorage.setItem(name, JSON.stringify(value));
      return true;
   }
   else
   {
      return false;
   }
}

function readStorage(name)
{
   if(hasLocalStorage() && hasJSON())
   {
      try
      {
         return JSON.parse(localStorage.getItem(name));
      }
      catch(error)
      {
         compatlog("Failed to retrieve " + name + " from local storage");
         return false;
      }
   }
   else
   {
      return null;
   }
}

function writeCookie(name, value, expireDays)
{
   if(hasJSON() && hasDate())
   {
      var expire = new Date();
      var storeValue = Base64.encode(JSON.stringify(value));
      expireDays = expireDays || 356;
      expire.setTime(expire.getTime() + (expireDays * 24 * 60 * 60 * 1000));
      document.cookie = name + "=" + storeValue + "; expires=" + expire.toUTCString();
   }
}

function getAllCookies()
{
   var cookies = {};
   var cookieStrings = document.cookie.split(";");

   for(var i = 0; i < cookieStrings.length; i++)
   {
      var matches = /([^=]+)=(.*)/.exec(cookieStrings[i]);

      if(matches && matches.length >= 3)
         cookies[matches[1].trim()] = matches[2].trim();
   }

   return cookies;
}

function readCookieRaw(name)
{
   return getAllCookies()[name];
}

function readCookie(name)
{
   if(hasJSON())
   {
      var raw = readCookieRaw(name);

      if(raw)
         return JSON.parse(Base64.decode(raw));
   }

   return null;
}

function hasCookie(name)
{
   return name in getAllCookies();
}

function AnonymousSettings()
{
   this.highCompatibility = false;
}

AnonymousSettings.DefaultCookieName = "anonSettings";

AnonymousSettings.prototype.LoadFromCookie = function(name)
{
   name = name || AnonymousSettings.DefaultCookieName;
   var cookieObject = readCookie(name);

   if(!cookieObject)
      return false;

   for(var key in cookieObject)
      if(cookieObject.hasOwnProperty(key))
         this[key] = cookieObject[key];

   return true;
};

AnonymousSettings.prototype.DefaultSave = function()
{
   writeCookie(AnonymousSettings.DefaultCookieName, this);
};

AnonymousSettings.prototype.DefaultLoad = function()
{
   if(!hasCookie(AnonymousSettings.DefaultCookieName))
      this.DefaultSave();

   return this.LoadFromCookie(AnonymousSettings.DefaultCookieName);
};

function setHighCompatibility(status)
{
   var settings = new AnonymousSettings();

   if(!settings.DefaultLoad())
   {
      alert("Settings system isn't working and we can't set High Compatibility mode. Report this bug!");
      return;
   }

   settings.highCompatibility = status ? true : false;
   settings.DefaultSave();
}

var MD5Library = (function() 
{
   // ********************************************************
   // * What follows is just some MD5 garbage I found online *
   // ********************************************************
   var md5cycle = function (x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];

      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17,  606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12,  1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7,  1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7,  1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22,  1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14,  643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9,  38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5,  568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20,  1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14,  1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16,  1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11,  1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4,  681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23,  76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16,  530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);

      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10,  1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6,  1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6,  1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21,  1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15,  718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
   };

   var cmn = function(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
   };

   var ff = function(a, b, c, d, x, s, t) {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t);
   };

   var gg = function(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t);
   };

   var hh = function(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
   };

   var ii = function(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | (~d)), a, b, x, s, t);
   };

   var md51 = function(s) {
      txt = '';
      var n = s.length,
      state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i=64; i<=s.length; i+=64) {
         md5cycle(state, md5blk(s.substring(i-64, i)));
      }
      s = s.substring(i-64);
      var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
      for (i=0; i<s.length; i++)
         tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
      tail[i>>2] |= 0x80 << ((i%4) << 3);
      if (i > 55) {
         md5cycle(state, tail);
         for (i=0; i<16; i++) tail[i] = 0;
      }
      tail[14] = n*8;
      md5cycle(state, tail);
      return state;
   };

   /* there needs to be support for Unicode here,
   * unless we pretend that we can redefine the MD-5
   * algorithm for multi-byte characters (perhaps
   * by adding every four 16-bit characters and
   * shortening the sum to 32 bits). Otherwise
   * I suggest performing MD-5 as if every character
   * was two bytes--e.g., 0040 0025 = @%--but then
   * how will an ordinary MD-5 sum be matched?
   * There is no way to standardize text to something
   * like UTF-8 before transformation; speed cost is
   * utterly prohibitive. The JavaScript standard
   * itself needs to look at this: it should start
   * providing access to strings as preformed UTF-8
   * 8-bit unsigned value arrays.
   */
   var md5blk = function(s) { /* I figured global was faster.   */
      var md5blks = [], i; /* Andy King said do it this way. */
      for (i=0; i<64; i+=4) {
         md5blks[i>>2] = s.charCodeAt(i) + 
            (s.charCodeAt(i+1) << 8) + 
            (s.charCodeAt(i+2) << 16) + 
            (s.charCodeAt(i+3) << 24);
      }
      return md5blks;
   };

   var hex_chr = '0123456789abcdef'.split('');

   var rhex = function(n)
   {
      var s='', j=0;
      for(; j<4; j++)
         s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + 
            hex_chr[(n >> (j * 8)) & 0x0F];
         return s;
   };

   var hex = function(x) {
      for (var i=0; i<x.length; i++)
         x[i] = rhex(x[i]);
      return x.join('');
   };

   /* this function is much faster,
   so if possible we use it. Some IEs
   are the only ones I know of that
   need the idiotic second function,
   generated by an if clause.  */

   var add32 = function(a, b) {
      return (a + b) & 0xFFFFFFFF;
   };

   var md5 = function(s) { 
      return hex(md51(s)); 
   };

   if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
      add32 = function(x, y) {
         var lsw = (x & 0xFFFF) + (y & 0xFFFF),
         msw = (x >> 16) + (y >> 16) + (lsw >> 16);
         return (msw << 16) | (lsw & 0xFFFF);
      };
   }

   return { "Hash" : md5 };

})();

(function(global) {
    'use strict';
    // existing version for noConflict()
    var _Base64 = global.Base64;
    var version = "2.1.9";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            buffer = require('buffer').Buffer;
        } catch (err) {}
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
         var cc;
        if (c.length < 2) {
            cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6)) + 
                  fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) + 
                  fromCharCode(0x80 | ((cc >>>  6) & 0x3f)) + 
                  fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            cc = 0x10000 + 
               (c.charCodeAt(0) - 0xD800) * 0x400 + 
               (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07)) + 
               fromCharCode(0x80 | ((cc >>> 12) & 0x3f)) + 
               fromCharCode(0x80 | ((cc >>>  6) & 0x3f)) + 
               fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer ? function (u) {
        return (u.constructor === buffer.constructor ? u : new buffer(u))
        .toString('base64');
    }
    : function (u) { return btoa(utob(u)); }
    ;
    var encode = function(u, urisafe) {
        return !urisafe ? 
            _encode(String(u)) : 
            _encode(String(u)).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true); };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800) + 
               fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer ? function(a) {
        return (a.constructor === buffer.constructor ? 
            a : new buffer(a, 'base64')).toString();
    }
    : function(a) { return btou(atob(a)); };
    var decode = function(a){
        return _decode(
            String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/'; })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this);
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe);
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true);
                }));
        };
    }
    // that's it!
    if (global.Meteor) {
       Base64 = global.Base64; // for normal export in Meteor.js
    }
})(this);
