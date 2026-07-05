import {
  DomEventsPlugin,
  DomRendererFactory2,
  EVENT_MANAGER_PLUGINS,
  EventManager,
  EventManagerPlugin,
  SharedStylesHost
} from "./chunk-QMEYW2W3.js";
import {
  CommonModule,
  PLATFORM_BROWSER_ID
} from "./chunk-YSGOOV3J.js";
import {
  withHttpTransferCache
} from "./chunk-53W22S4I.js";
import {
  DomAdapter,
  getDOM,
  parseCookieValue,
  setRootDomAdapter
} from "./chunk-BJJPQMX3.js";
import {
  APP_BOOTSTRAP_LISTENER,
  ApplicationModule,
  ApplicationRef,
  CACHE_ACTIVE,
  Console,
  DOCUMENT,
  ENVIRONMENT_INITIALIZER,
  ErrorHandler,
  INJECTOR_SCOPE,
  IS_ENABLED_BLOCKING_INITIAL_NAVIGATION,
  Inject,
  Injectable,
  InjectionToken,
  NgModule,
  NgZone,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
  RendererFactory2,
  RuntimeError,
  SHARED_STYLES_HOST,
  SecurityContext,
  Service,
  TESTABILITY,
  TESTABILITY_GETTER,
  Testability,
  TestabilityRegistry,
  USE_PENDING_TASKS,
  Version,
  XSS_SECURITY_URL,
  _global,
  _sanitizeHtml,
  _sanitizeUrl,
  allowSanitizationBypassAndThrow,
  bypassSanitizationTrustHtml,
  bypassSanitizationTrustResourceUrl,
  bypassSanitizationTrustScript,
  bypassSanitizationTrustStyle,
  bypassSanitizationTrustUrl,
  createPlatformFactory,
  formatRuntimeError,
  forwardRef,
  inject,
  internalCreateApplication,
  makeEnvironmentProviders,
  platformCore,
  provideStabilityDebugging,
  setClassMetadata,
  setDocument,
  unwrapSafeValue,
  withDomHydration,
  withEventReplay,
  withI18nSupport,
  withIncrementalHydration,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefineService,
  ɵɵinject
} from "./chunk-QPBNIBGL.js";
import {
  __async,
  __spreadValues
} from "./chunk-MF3QSHFX.js";

// node_modules/@angular/platform-browser/fesm2022/_browser-chunk.mjs
var BrowserDomAdapter = class _BrowserDomAdapter extends DomAdapter {
  supportsDOMEvents = true;
  static makeCurrent() {
    setRootDomAdapter(new _BrowserDomAdapter());
  }
  onAndCancel(el, evt, listener, options) {
    el.addEventListener(evt, listener, options);
    return () => {
      el.removeEventListener(evt, listener, options);
    };
  }
  dispatchEvent(el, evt) {
    el.dispatchEvent(evt);
  }
  remove(node) {
    node.remove();
  }
  createElement(tagName, doc) {
    doc = doc || this.getDefaultDocument();
    return doc.createElement(tagName);
  }
  createHtmlDocument() {
    return document.implementation.createHTMLDocument("fakeTitle");
  }
  getDefaultDocument() {
    return document;
  }
  isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  isShadowRoot(node) {
    return node instanceof DocumentFragment;
  }
  getGlobalEventTarget(doc, target) {
    if (target === "window") {
      return window;
    }
    if (target === "document") {
      return doc;
    }
    if (target === "body") {
      return doc.body;
    }
    return null;
  }
  getBaseHref(doc) {
    const href = getBaseElementHref();
    return href == null ? null : relativePath(href);
  }
  resetBaseElement() {
    baseElement = null;
  }
  getUserAgent() {
    return window.navigator.userAgent;
  }
  getCookie(name) {
    return parseCookieValue(document.cookie, name);
  }
};
var baseElement = null;
function getBaseElementHref() {
  baseElement = baseElement || document.head.querySelector("base");
  return baseElement ? baseElement.getAttribute("href") : null;
}
function relativePath(url) {
  return new URL(url, document.baseURI).pathname;
}
var BrowserGetTestability = class {
  addToWindow(registry) {
    _global["getAngularTestability"] = (elem, findInAncestors = true) => {
      const testability = registry.findTestabilityInTree(elem, findInAncestors);
      if (testability == null) {
        throw new RuntimeError(5103, (typeof ngDevMode === "undefined" || ngDevMode) && "Could not find testability for element.");
      }
      return testability;
    };
    _global["getAllAngularTestabilities"] = () => registry.getAllTestabilities();
    _global["getAllAngularRootElements"] = () => registry.getAllRootElements();
    const whenAllStable = (callback) => {
      const testabilities = _global["getAllAngularTestabilities"]();
      let count = testabilities.length;
      const decrement = function() {
        count--;
        if (count == 0) {
          callback();
        }
      };
      testabilities.forEach((testability) => {
        testability.whenStable(decrement);
      });
    };
    if (!_global["frameworkStabilizers"]) {
      _global["frameworkStabilizers"] = [];
    }
    _global["frameworkStabilizers"].push(whenAllStable);
  }
  findTestabilityInTree(registry, elem, findInAncestors) {
    if (elem == null) {
      return null;
    }
    const t = registry.getTestability(elem);
    if (t != null) {
      return t;
    } else if (!findInAncestors) {
      return null;
    }
    if (getDOM().isShadowRoot(elem)) {
      return this.findTestabilityInTree(registry, elem.host, true);
    }
    return this.findTestabilityInTree(registry, elem.parentElement, true);
  }
};
var MODIFIER_KEYS = ["alt", "control", "meta", "shift"];
var _keyMap = {
  "\b": "Backspace",
  "	": "Tab",
  "": "Delete",
  "\x1B": "Escape",
  "Del": "Delete",
  "Esc": "Escape",
  "Left": "ArrowLeft",
  "Right": "ArrowRight",
  "Up": "ArrowUp",
  "Down": "ArrowDown",
  "Menu": "ContextMenu",
  "Scroll": "ScrollLock",
  "Win": "OS"
};
var MODIFIER_KEY_GETTERS = {
  "alt": (event) => event.altKey,
  "control": (event) => event.ctrlKey,
  "meta": (event) => event.metaKey,
  "shift": (event) => event.shiftKey
};
var KeyEventsPlugin = class _KeyEventsPlugin extends EventManagerPlugin {
  constructor(doc) {
    super(doc);
  }
  supports(eventName) {
    return _KeyEventsPlugin.parseEventName(eventName) != null;
  }
  addEventListener(element, eventName, handler, options) {
    const parsedEvent = _KeyEventsPlugin.parseEventName(eventName);
    const outsideHandler = _KeyEventsPlugin.eventCallback(parsedEvent["fullKey"], handler, this.manager.getZone());
    return this.manager.getZone().runOutsideAngular(() => {
      return getDOM().onAndCancel(element, parsedEvent["domEventName"], outsideHandler, options);
    });
  }
  static parseEventName(eventName) {
    const parts = eventName.toLowerCase().split(".");
    const domEventName = parts.shift();
    if (parts.length === 0 || !(domEventName === "keydown" || domEventName === "keyup")) {
      return null;
    }
    const key = _KeyEventsPlugin._normalizeKey(parts.pop());
    let fullKey = "";
    let codeIX = parts.indexOf("code");
    if (codeIX > -1) {
      parts.splice(codeIX, 1);
      fullKey = "code.";
    }
    MODIFIER_KEYS.forEach((modifierName) => {
      const index = parts.indexOf(modifierName);
      if (index > -1) {
        parts.splice(index, 1);
        fullKey += modifierName + ".";
      }
    });
    fullKey += key;
    if (parts.length != 0 || key.length === 0) {
      return null;
    }
    const result = {};
    result["domEventName"] = domEventName;
    result["fullKey"] = fullKey;
    return result;
  }
  static matchEventFullKeyCode(event, fullKeyCode) {
    let keycode = _keyMap[event.key] || event.key;
    let key = "";
    if (fullKeyCode.indexOf("code.") > -1) {
      keycode = event.code;
      key = "code.";
    }
    if (keycode == null || !keycode) return false;
    keycode = keycode.toLowerCase();
    if (keycode === " ") {
      keycode = "space";
    } else if (keycode === ".") {
      keycode = "dot";
    }
    MODIFIER_KEYS.forEach((modifierName) => {
      if (modifierName !== keycode) {
        const modifierGetter = MODIFIER_KEY_GETTERS[modifierName];
        if (modifierGetter(event)) {
          key += modifierName + ".";
        }
      }
    });
    key += keycode;
    return key === fullKeyCode;
  }
  static eventCallback(fullKey, handler, zone) {
    return (event) => {
      if (_KeyEventsPlugin.matchEventFullKeyCode(event, fullKey)) {
        zone.runGuarded(() => handler(event));
      }
    };
  }
  static _normalizeKey(keyName) {
    return keyName === "esc" ? "escape" : keyName;
  }
  static ɵfac = function KeyEventsPlugin_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _KeyEventsPlugin)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _KeyEventsPlugin,
    factory: _KeyEventsPlugin.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyEventsPlugin, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
function bootstrapApplication(rootComponent, options, context) {
  return __async(this, null, function* () {
    const config = __spreadValues({
      rootComponent
    }, createProvidersConfig(options, context));
    if (false) {
      yield resolveJitResources();
    }
    return internalCreateApplication(config);
  });
}
function createApplication(options, context) {
  return __async(this, null, function* () {
    if (false) {
      yield resolveJitResources();
    }
    return internalCreateApplication(createProvidersConfig(options, context));
  });
}
function createProvidersConfig(options, context) {
  return {
    platformRef: context?.platformRef,
    appProviders: [...BROWSER_MODULE_PROVIDERS, ...options?.providers ?? []],
    platformProviders: INTERNAL_BROWSER_PLATFORM_PROVIDERS
  };
}
function provideProtractorTestingSupport(options = {}) {
  return [...TESTABILITY_PROVIDERS, options?.usePendingTasksForStability !== void 0 ? {
    provide: USE_PENDING_TASKS,
    useValue: options.usePendingTasksForStability ?? false
  } : []];
}
function initDomAdapter() {
  BrowserDomAdapter.makeCurrent();
}
function errorHandler() {
  return new ErrorHandler();
}
function _document() {
  setDocument(document);
  return document;
}
var INTERNAL_BROWSER_PLATFORM_PROVIDERS = [{
  provide: PLATFORM_ID,
  useValue: PLATFORM_BROWSER_ID
}, {
  provide: PLATFORM_INITIALIZER,
  useValue: initDomAdapter,
  multi: true
}, {
  provide: DOCUMENT,
  useFactory: _document
}];
var platformBrowser = createPlatformFactory(platformCore, "browser", INTERNAL_BROWSER_PLATFORM_PROVIDERS);
var BROWSER_MODULE_PROVIDERS_MARKER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "BrowserModule Providers Marker" : "");
var TESTABILITY_PROVIDERS = [{
  provide: TESTABILITY_GETTER,
  useClass: BrowserGetTestability
}, {
  provide: TESTABILITY,
  useClass: Testability,
  deps: [NgZone, TestabilityRegistry, TESTABILITY_GETTER]
}, {
  provide: Testability,
  useClass: Testability,
  deps: [NgZone, TestabilityRegistry, TESTABILITY_GETTER]
}];
var BROWSER_MODULE_PROVIDERS = [{
  provide: INJECTOR_SCOPE,
  useValue: "root"
}, {
  provide: ErrorHandler,
  useFactory: errorHandler
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: DomEventsPlugin,
  multi: true
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: KeyEventsPlugin,
  multi: true
}, DomRendererFactory2, {
  provide: SHARED_STYLES_HOST,
  useClass: SharedStylesHost
}, {
  provide: SharedStylesHost,
  useExisting: SHARED_STYLES_HOST
}, EventManager, {
  provide: RendererFactory2,
  useExisting: DomRendererFactory2
}, typeof ngDevMode === "undefined" || ngDevMode ? {
  provide: BROWSER_MODULE_PROVIDERS_MARKER,
  useValue: true
} : []];
var BrowserModule = class _BrowserModule {
  constructor() {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      const providersAlreadyPresent = inject(BROWSER_MODULE_PROVIDERS_MARKER, {
        optional: true,
        skipSelf: true
      });
      if (providersAlreadyPresent) {
        throw new RuntimeError(5100, `Providers from the \`BrowserModule\` have already been loaded. If you need access to common directives such as NgIf and NgFor, import the \`CommonModule\` instead.`);
      }
    }
  }
  static ɵfac = function BrowserModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrowserModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _BrowserModule,
    exports: [CommonModule, ApplicationModule]
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
    imports: [CommonModule, ApplicationModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserModule, [{
    type: NgModule,
    args: [{
      providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
      exports: [CommonModule, ApplicationModule]
    }]
  }], () => [], null);
})();

// node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs
var Meta = class _Meta {
  _doc;
  _dom;
  constructor(_doc) {
    this._doc = _doc;
    this._dom = getDOM();
  }
  addTag(tag, forceCreation = false) {
    if (!tag) return null;
    return this._getOrCreateElement(tag, forceCreation);
  }
  addTags(tags, forceCreation = false) {
    if (!tags) return [];
    return tags.reduce((result, tag) => {
      if (tag) {
        result.push(this._getOrCreateElement(tag, forceCreation));
      }
      return result;
    }, []);
  }
  getTag(attrSelector) {
    if (!attrSelector) return null;
    const meta = this._doc.querySelector(`meta[${attrSelector}]`);
    return meta?.nodeName.toLowerCase() === "meta" ? meta : null;
  }
  getTags(attrSelector) {
    if (!attrSelector) return [];
    const list = this._doc.querySelectorAll(`meta[${attrSelector}]`);
    return list ? [].slice.call(list).filter((elem) => elem.nodeName.toLowerCase() === "meta") : [];
  }
  updateTag(tag, selector) {
    if (!tag) return null;
    selector = selector || this._parseSelector(tag);
    const meta = this.getTag(selector);
    if (meta) {
      return this._setMetaElementAttributes(tag, meta);
    }
    return this._getOrCreateElement(tag, true);
  }
  removeTag(attrSelector) {
    this.removeTagElement(this.getTag(attrSelector));
  }
  removeTagElement(meta) {
    if (meta) {
      this._dom.remove(meta);
    }
  }
  _getOrCreateElement(meta, forceCreation = false) {
    if (!forceCreation) {
      const selector = this._parseSelector(meta);
      const elem = this.getTags(selector).filter((elem2) => this._containsAttributes(meta, elem2))[0];
      if (elem !== void 0) return elem;
    }
    const element = this._dom.createElement("meta");
    this._setMetaElementAttributes(meta, element);
    const head = this._doc.getElementsByTagName("head")[0];
    head.appendChild(element);
    return element;
  }
  _setMetaElementAttributes(tag, el) {
    Object.keys(tag).forEach((prop) => el.setAttribute(this._getMetaKeyMap(prop), tag[prop]));
    return el;
  }
  _parseSelector(tag) {
    const attr = tag.name ? "name" : "property";
    return `${attr}=${this._escapeSelectorValue(String(tag[attr]))}`;
  }
  _escapeSelectorValue(value) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  _containsAttributes(tag, elem) {
    return Object.keys(tag).every((key) => elem.getAttribute(this._getMetaKeyMap(key)) === tag[key]);
  }
  _getMetaKeyMap(prop) {
    return META_KEYS_MAP[prop] || prop;
  }
  static ɵfac = function Meta_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Meta)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _Meta,
    factory: _Meta.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Meta, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var META_KEYS_MAP = {
  httpEquiv: "http-equiv"
};
var Title = class _Title {
  _doc;
  constructor(_doc) {
    this._doc = _doc;
  }
  getTitle() {
    return this._doc.title;
  }
  setTitle(newTitle) {
    this._doc.title = newTitle || "";
  }
  static ɵfac = function Title_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Title)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _Title,
    factory: _Title.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Title, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
function exportNgVar(name, value) {
  if (typeof COMPILED === "undefined" || !COMPILED) {
    const ng = _global["ng"] = _global["ng"] || {};
    ng[name] = value;
  }
}
var ChangeDetectionPerfRecord = class {
  msPerTick;
  numTicks;
  constructor(msPerTick, numTicks) {
    this.msPerTick = msPerTick;
    this.numTicks = numTicks;
  }
};
var AngularProfiler = class {
  appRef;
  constructor(ref) {
    this.appRef = ref.injector.get(ApplicationRef);
  }
  timeChangeDetection(config) {
    const record = config && config["record"];
    const profileName = "Change Detection";
    if (record && "profile" in console && typeof console.profile === "function") {
      console.profile(profileName);
    }
    const start = performance.now();
    let numTicks = 0;
    while (numTicks < 5 || performance.now() - start < 500) {
      this.appRef.tick();
      numTicks++;
    }
    const end = performance.now();
    if (record && "profileEnd" in console && typeof console.profileEnd === "function") {
      console.profileEnd(profileName);
    }
    const msPerTick = (end - start) / numTicks;
    console.log(`ran ${numTicks} change detection cycles`);
    console.log(`${msPerTick.toFixed(2)} ms per check`);
    return new ChangeDetectionPerfRecord(msPerTick, numTicks);
  }
};
var PROFILER_GLOBAL_NAME = "profiler";
function enableDebugTools(ref) {
  exportNgVar(PROFILER_GLOBAL_NAME, new AngularProfiler(ref));
  return ref;
}
function disableDebugTools() {
  exportNgVar(PROFILER_GLOBAL_NAME, null);
}
var By = class {
  static all() {
    return () => true;
  }
  static css(selector) {
    return (debugElement) => {
      return debugElement.nativeElement != null ? elementMatches(debugElement.nativeElement, selector) : false;
    };
  }
  static directive(type) {
    return (debugNode) => debugNode.providerTokens.indexOf(type) !== -1;
  }
};
function elementMatches(n, selector) {
  if (getDOM().isElementNode(n)) {
    return n.matches && n.matches(selector) || n.msMatchesSelector && n.msMatchesSelector(selector) || n.webkitMatchesSelector && n.webkitMatchesSelector(selector);
  }
  return false;
}
var HydrationFeatureKind;
(function(HydrationFeatureKind2) {
  HydrationFeatureKind2[HydrationFeatureKind2["NoHttpTransferCache"] = 0] = "NoHttpTransferCache";
  HydrationFeatureKind2[HydrationFeatureKind2["HttpTransferCacheOptions"] = 1] = "HttpTransferCacheOptions";
  HydrationFeatureKind2[HydrationFeatureKind2["I18nSupport"] = 2] = "I18nSupport";
  HydrationFeatureKind2[HydrationFeatureKind2["EventReplay"] = 3] = "EventReplay";
  HydrationFeatureKind2[HydrationFeatureKind2["IncrementalHydration"] = 4] = "IncrementalHydration";
  HydrationFeatureKind2[HydrationFeatureKind2["NoIncrementalHydration"] = 5] = "NoIncrementalHydration";
})(HydrationFeatureKind || (HydrationFeatureKind = {}));
function hydrationFeature(ɵkind, ɵproviders = [], ɵoptions = {}) {
  return {
    ɵkind,
    ɵproviders
  };
}
function withNoHttpTransferCache() {
  return hydrationFeature(HydrationFeatureKind.NoHttpTransferCache);
}
function withHttpTransferCacheOptions(options) {
  return hydrationFeature(HydrationFeatureKind.HttpTransferCacheOptions, withHttpTransferCache(options));
}
function withI18nSupport2() {
  return hydrationFeature(HydrationFeatureKind.I18nSupport, withI18nSupport());
}
function withEventReplay2() {
  return hydrationFeature(HydrationFeatureKind.EventReplay, withEventReplay());
}
function withIncrementalHydration2() {
  return hydrationFeature(HydrationFeatureKind.IncrementalHydration, withIncrementalHydration());
}
function withNoIncrementalHydration() {
  return hydrationFeature(HydrationFeatureKind.NoIncrementalHydration);
}
function provideEnabledBlockingInitialNavigationDetector() {
  return [{
    provide: ENVIRONMENT_INITIALIZER,
    useValue: () => {
      const isEnabledBlockingInitialNavigation = inject(IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, {
        optional: true
      });
      if (isEnabledBlockingInitialNavigation) {
        const console2 = inject(Console);
        const message = formatRuntimeError(5001, "Configuration error: found both hydration and enabledBlocking initial navigation in the same application, which is a contradiction.");
        console2.warn(message);
      }
    },
    multi: true
  }];
}
function provideClientHydration(...features) {
  const providers = [];
  const featuresKind = /* @__PURE__ */ new Set();
  for (const {
    ɵproviders,
    ɵkind
  } of features) {
    featuresKind.add(ɵkind);
    if (ɵproviders.length) {
      providers.push(ɵproviders);
    }
  }
  const hasHttpTransferCacheOptions = featuresKind.has(HydrationFeatureKind.HttpTransferCacheOptions);
  if (typeof ngDevMode !== "undefined" && ngDevMode) {
    if (featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) && hasHttpTransferCacheOptions) {
      throw new RuntimeError(5001, "Configuration error: found both withHttpTransferCacheOptions() and withNoHttpTransferCache() in the same call to provideClientHydration(), which is a contradiction.");
    }
    if (featuresKind.has(HydrationFeatureKind.IncrementalHydration) && featuresKind.has(HydrationFeatureKind.NoIncrementalHydration)) {
      throw new RuntimeError(5001, "Configuration error: found both withIncrementalHydration() and withNoIncrementalHydration() in the same call to provideClientHydration(), which is a contradiction.");
    }
  }
  return makeEnvironmentProviders([typeof ngDevMode !== "undefined" && ngDevMode ? provideEnabledBlockingInitialNavigationDetector() : [], typeof ngDevMode !== "undefined" && ngDevMode ? provideStabilityDebugging() : [], withDomHydration(), featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) || hasHttpTransferCacheOptions ? [] : withHttpTransferCache({}), featuresKind.has(HydrationFeatureKind.NoIncrementalHydration) ? [] : withIncrementalHydration(), providers, {
    provide: CACHE_ACTIVE,
    useValue: {
      isActive: true
    }
  }, {
    provide: APP_BOOTSTRAP_LISTENER,
    multi: true,
    useFactory: () => {
      const appRef = inject(ApplicationRef);
      const cacheState = inject(CACHE_ACTIVE);
      return () => {
        appRef.whenStable().then(() => {
          cacheState.isActive = false;
        });
      };
    }
  }]);
}
var DomSanitizer = class _DomSanitizer {
  static ɵfac = function DomSanitizer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomSanitizer)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _DomSanitizer,
    factory: function DomSanitizer_Factory(__ngFactoryType__) {
      let __ngConditionalFactory__ = null;
      if (__ngFactoryType__) {
        __ngConditionalFactory__ = new (__ngFactoryType__ || _DomSanitizer)();
      } else {
        __ngConditionalFactory__ = ɵɵinject(DomSanitizerImpl);
      }
      return __ngConditionalFactory__;
    },
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizer, [{
    type: Injectable,
    args: [{
      providedIn: "root",
      useExisting: forwardRef(() => DomSanitizerImpl)
    }]
  }], null, null);
})();
var DomSanitizerImpl = class _DomSanitizerImpl extends DomSanitizer {
  _doc = inject(DOCUMENT);
  sanitize(ctx, value) {
    if (value == null) return null;
    switch (ctx) {
      case SecurityContext.NONE:
        return value;
      case SecurityContext.HTML:
        if (allowSanitizationBypassAndThrow(value, "HTML")) {
          return unwrapSafeValue(value);
        }
        return _sanitizeHtml(this._doc, String(value)).toString();
      case SecurityContext.STYLE:
        if (allowSanitizationBypassAndThrow(value, "Style")) {
          return unwrapSafeValue(value);
        }
        return value;
      case SecurityContext.SCRIPT:
        if (allowSanitizationBypassAndThrow(value, "Script")) {
          return unwrapSafeValue(value);
        }
        throw new RuntimeError(5200, (typeof ngDevMode === "undefined" || ngDevMode) && "unsafe value used in a script context");
      case SecurityContext.URL:
        if (allowSanitizationBypassAndThrow(value, "URL")) {
          return unwrapSafeValue(value);
        }
        return _sanitizeUrl(String(value));
      case SecurityContext.RESOURCE_URL:
        if (allowSanitizationBypassAndThrow(value, "ResourceURL")) {
          return unwrapSafeValue(value);
        }
        throw new RuntimeError(5201, (typeof ngDevMode === "undefined" || ngDevMode) && `unsafe value used in a resource URL context (see ${XSS_SECURITY_URL})`);
      default:
        throw new RuntimeError(5202, (typeof ngDevMode === "undefined" || ngDevMode) && `Unexpected SecurityContext ${ctx} (see ${XSS_SECURITY_URL})`);
    }
  }
  bypassSecurityTrustHtml(value) {
    return bypassSanitizationTrustHtml(value);
  }
  bypassSecurityTrustStyle(value) {
    return bypassSanitizationTrustStyle(value);
  }
  bypassSecurityTrustScript(value) {
    return bypassSanitizationTrustScript(value);
  }
  bypassSecurityTrustUrl(value) {
    return bypassSanitizationTrustUrl(value);
  }
  bypassSecurityTrustResourceUrl(value) {
    return bypassSanitizationTrustResourceUrl(value);
  }
  static ɵfac = function DomSanitizerImpl_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomSanitizerImpl)();
  };
  static ɵprov = ɵɵdefineService({
    token: _DomSanitizerImpl,
    factory: _DomSanitizerImpl.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizerImpl, [{
    type: Service
  }], null, null);
})();
var VERSION = new Version("22.0.5");

export {
  BrowserDomAdapter,
  BrowserGetTestability,
  KeyEventsPlugin,
  bootstrapApplication,
  createApplication,
  provideProtractorTestingSupport,
  platformBrowser,
  BrowserModule,
  Meta,
  Title,
  enableDebugTools,
  disableDebugTools,
  By,
  HydrationFeatureKind,
  withNoHttpTransferCache,
  withHttpTransferCacheOptions,
  withI18nSupport2 as withI18nSupport,
  withEventReplay2 as withEventReplay,
  withIncrementalHydration2 as withIncrementalHydration,
  withNoIncrementalHydration,
  provideClientHydration,
  DomSanitizer,
  DomSanitizerImpl,
  VERSION
};
//# sourceMappingURL=chunk-LQN6Z67F.js.map
