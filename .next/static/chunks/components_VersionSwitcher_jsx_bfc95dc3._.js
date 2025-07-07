(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/components/VersionSwitcher.jsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const VersionSwitcher = ({ versions = [], defaultVersion, placeholder = 'Select a version' })=>{
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const current = pathname?.split('/')[1];
    const [selectedVersion, setSelectedVersion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(current ?? defaultVersion);
    const [filteredVersions, setFilteredVersions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(versions);
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Detectar versión desde la URL actual
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VersionSwitcher.useEffect": ()=>{
            if (!pathname) return;
            const current = pathname.split('/')[1];
            if (versions.includes(current)) {
                setSelectedVersion(current);
            }
        }
    }["VersionSwitcher.useEffect"], [
        pathname,
        versions
    ]);
    const handleInputChange = (e)=>{
        const value = e.target.value;
        setSelectedVersion(value);
        setFilteredVersions(versions.filter((v)=>v.toLowerCase().includes(value.toLowerCase())));
        setIsOpen(true);
    };
    const handleOptionClick = (version)=>{
        setSelectedVersion(version);
        setIsOpen(false);
        const newPath = `/${version}`;
        window.location.href = newPath;
    };
    const handleFocus = ()=>{
        setFilteredVersions(versions);
        setIsOpen(true);
    };
    const handleBlur = ()=>{
        setTimeout(()=>setIsOpen(false), 100) // Para permitir click antes de cerrar
        ;
    };
    const click = (e)=>{
        e.preventDefault();
        e.stopPropagation();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative inline-block ",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: inputRef,
                type: "text",
                onChange: handleInputChange,
                onFocus: handleFocus,
                onBlur: handleBlur,
                onClick: click,
                placeholder: placeholder,
                className: " px-4 py-1 bg-zinc-900/40 text-white border border-zinc-200 rounded-full",
                children: selectedVersion || defaultVersion
            }, void 0, false, {
                fileName: "[project]/components/VersionSwitcher.jsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            isOpen && filteredVersions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "absolute z-10 mt-1 w-20 bg-zinc-900  rounded-md text-white shadow-lg  overflow-y-auto",
                children: filteredVersions.map((version)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        onMouseDown: ()=>handleOptionClick(version),
                        className: `px-4 w-full py-2 hover:bg-zinc-800 border border-zinc-300/30 rounded-md cursor-pointer ${version === selectedVersion ? 'bg-zinc-700 !text-blue-100 font-bold' : ''}`,
                        children: version
                    }, version, false, {
                        fileName: "[project]/components/VersionSwitcher.jsx",
                        lineNumber: 72,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/VersionSwitcher.jsx",
                lineNumber: 70,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/VersionSwitcher.jsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
};
_s(VersionSwitcher, "R4n86/CHGJUFfyi3BO2z1zrG/Do=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = VersionSwitcher;
const __TURBOPACK__default__export__ = VersionSwitcher;
var _c;
__turbopack_context__.k.register(_c, "VersionSwitcher");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=components_VersionSwitcher_jsx_bfc95dc3._.js.map