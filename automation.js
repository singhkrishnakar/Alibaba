"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var playwright_1 = require("playwright");
var fs = require("fs");
var path = require("path");
var BASE_URL = 'https://llmtoolkit-staging.innodata.com';
var EMAIL = 'pzr@innodata.com';
var PASSWORD = 'Password@2027';
var PROJECT_URL = '/project/prompt/356';
var screenshotCount = 1;
function takeScreenshot(page, name) {
    return __awaiter(this, void 0, void 0, function () {
        var dir, filename, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dir = 'screenshots';
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir);
                    filename = path.join(dir, "".concat(screenshotCount.toString().padStart(2, '0'), "_").concat(name, ".png"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, page.screenshot({ path: filename })];
                case 2:
                    _a.sent();
                    console.log("  \uD83D\uDCF8 ".concat(filename));
                    screenshotCount++;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.log("  \u26A0\uFE0F  Screenshot failed: ".concat(name));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Ultra-fast click with multiple strategies
function click(page_1, selector_1) {
    return __awaiter(this, arguments, void 0, function (page, selector, timeout) {
        var locators, _loop_1, _i, locators_1, sel, state_1, e_2;
        var _this = this;
        if (timeout === void 0) { timeout = 1500; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    locators = selector.split('||').map(function (s) { return s.trim(); });
                    _loop_1 = function (sel) {
                        var loc, count, e_3;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 5, , 6]);
                                    loc = page.locator(sel);
                                    return [4 /*yield*/, loc.count()];
                                case 1:
                                    count = _b.sent();
                                    if (!(count > 0)) return [3 /*break*/, 4];
                                    // Try to scroll and click
                                    return [4 /*yield*/, loc.first().scrollIntoViewIfNeeded({ timeout: 500 }).catch(function () { })];
                                case 2:
                                    // Try to scroll and click
                                    _b.sent();
                                    return [4 /*yield*/, loc.first().click({ timeout: timeout, force: false }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: 
                                                    // Fallback to JS click
                                                    return [4 /*yield*/, page.evaluate(function (s) {
                                                            var el = document.querySelector(s);
                                                            if (el)
                                                                el.click();
                                                        }, sel)];
                                                    case 1:
                                                        // Fallback to JS click
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })];
                                case 3:
                                    _b.sent();
                                    return [2 /*return*/, { value: true }];
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    e_3 = _b.sent();
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, locators_1 = locators;
                    _a.label = 1;
                case 1:
                    if (!(_i < locators_1.length)) return [3 /*break*/, 4];
                    sel = locators_1[_i];
                    return [5 /*yield**/, _loop_1(sel)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_2 = _a.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, false];
            }
        });
    });
}
// Ultra-fast fill
function fill(page_1, selector_1, text_1) {
    return __awaiter(this, arguments, void 0, function (page, selector, text, timeout) {
        var loc, e_4;
        if (timeout === void 0) { timeout = 1000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    loc = page.locator(selector);
                    return [4 /*yield*/, loc.count()];
                case 1:
                    if (!((_a.sent()) > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, loc.first().fill(text, { timeout: timeout })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3: return [3 /*break*/, 5];
                case 4:
                    e_4 = _a.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, false];
            }
        });
    });
}
function login(page) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔑 Logging in...');
                    startTime = Date.now();
                    // Navigate to login
                    return [4 /*yield*/, page.goto("".concat(BASE_URL, "/login"), { waitUntil: 'domcontentloaded', timeout: 8000 })];
                case 1:
                    // Navigate to login
                    _a.sent();
                    return [4 /*yield*/, takeScreenshot(page, 'login')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, fill(page, 'input[type="email"]||input[name="email"]||input[placeholder*="email"]', EMAIL, 1000)];
                case 3:
                    // Fill email - try multiple selectors fast
                    if (!(_a.sent())) {
                        throw new Error('Email input not found');
                    }
                    return [4 /*yield*/, fill(page, 'input[type="password"]', PASSWORD, 1000)];
                case 4:
                    // Fill password
                    if (!(_a.sent())) {
                        throw new Error('Password input not found');
                    }
                    return [4 /*yield*/, click(page, 'button[type="submit"]||button:has-text("Login")||button:has-text("Sign in")', 1500)];
                case 5:
                    // Submit - try multiple selectors
                    if (!(_a.sent())) {
                        throw new Error('Submit button not found');
                    }
                    // Wait for navigation
                    return [4 /*yield*/, page.waitForLoadState('domcontentloaded', { timeout: 6000 }).catch(function () { })];
                case 6:
                    // Wait for navigation
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, takeScreenshot(page, 'logged_in')];
                case 8:
                    _a.sent();
                    console.log("  \u2705 Logged in (".concat(Date.now() - startTime, "ms)"));
                    return [2 /*return*/];
            }
        });
    });
}
function navigateToProject(page) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📁 Navigating to project...');
                    startTime = Date.now();
                    return [4 /*yield*/, page.goto("".concat(BASE_URL).concat(PROJECT_URL), { waitUntil: 'domcontentloaded', timeout: 8000 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 2:
                    _a.sent(); // Brief wait for UI to render
                    return [4 /*yield*/, takeScreenshot(page, 'project_page')];
                case 3:
                    _a.sent();
                    console.log("  \u2705 Project loaded (".concat(Date.now() - startTime, "ms)"));
                    return [2 /*return*/];
            }
        });
    });
}
function launchWorkbench(page) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, menuFound, workbenchClicked, title, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Launching workbench...');
                    startTime = Date.now();
                    return [4 /*yield*/, click(page, 'button[aria-label*="More"]||button[aria-label*="menu"]||button.menu-button||button[data-testid*="menu"]||button:has-text("⋮")', 1000)];
                case 1:
                    menuFound = _a.sent();
                    if (!menuFound) return [3 /*break*/, 3];
                    return [4 /*yield*/, page.waitForTimeout(150)];
                case 2:
                    _a.sent(); // Wait for menu animation
                    _a.label = 3;
                case 3: return [4 /*yield*/, click(page, 'button:has-text("Launch Workbench")||a:has-text("Launch Workbench")||div:has-text("Launch Workbench")||[role="menuitem"]:has-text("Launch")', 1000)];
                case 4:
                    workbenchClicked = _a.sent();
                    if (!!workbenchClicked) return [3 /*break*/, 8];
                    return [4 /*yield*/, page.title()];
                case 5:
                    title = _a.sent();
                    url = page.url();
                    if (!(title.includes('Workbench') || url.includes('workbench'))) return [3 /*break*/, 7];
                    console.log("  \u2705 Already on workbench (".concat(Date.now() - startTime, "ms)"));
                    return [4 /*yield*/, takeScreenshot(page, 'workbench_launched')];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
                case 7: throw new Error('Could not launch workbench');
                case 8: 
                // Wait for workbench to load
                return [4 /*yield*/, page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(function () { })];
                case 9:
                    // Wait for workbench to load
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, takeScreenshot(page, 'workbench_launched')];
                case 11:
                    _a.sent();
                    console.log("  \u2705 Workbench launched (".concat(Date.now() - startTime, "ms)"));
                    return [2 /*return*/];
            }
        });
    });
}
function createPrompt(page) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, createClicked, submitClicked;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📝 Creating prompt...');
                    startTime = Date.now();
                    return [4 /*yield*/, click(page, 'button:has-text("Create")||button:has-text("New")||button:has-text("Add")||[role="button"]:has-text("Create")', 1500)];
                case 1:
                    createClicked = _a.sent();
                    if (!createClicked) return [3 /*break*/, 3];
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: 
                // Fill prompt type (try for essay option)
                return [4 /*yield*/, click(page, 'input[value="essay"]||input[type="radio"][value="essay"]', 1000)];
                case 4:
                    // Fill prompt type (try for essay option)
                    _a.sent();
                    // Fill prompt text
                    return [4 /*yield*/, fill(page, 'textarea||input[placeholder*="prompt"]', 'hi', 1000)];
                case 5:
                    // Fill prompt text
                    _a.sent();
                    // Fill education level
                    return [4 /*yield*/, click(page, 'select', 1000)];
                case 6:
                    // Fill education level
                    _a.sent();
                    return [4 /*yield*/, click(page, 'option:has-text("Undergraduate")', 800)];
                case 7:
                    _a.sent();
                    // Fill subject
                    return [4 /*yield*/, fill(page, 'input[placeholder*="subject" i]||input[placeholder*="topic"]', 'Organic Chemistry', 1000)];
                case 8:
                    // Fill subject
                    _a.sent();
                    return [4 /*yield*/, click(page, 'button:has-text("Submit")||button:has-text("Create")', 1500)];
                case 9:
                    submitClicked = _a.sent();
                    if (!submitClicked) return [3 /*break*/, 12];
                    return [4 /*yield*/, page.waitForLoadState('domcontentloaded', { timeout: 4000 }).catch(function () { })];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(200)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12: return [4 /*yield*/, takeScreenshot(page, 'prompt_created')];
                case 13:
                    _a.sent();
                    console.log("  \u2705 Prompt creation attempted (".concat(Date.now() - startTime, "ms)"));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, totalStart, page, totalDuration, error_1, totalDuration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    browser = null;
                    totalStart = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, 13, 16]);
                    console.log('\n⏱️  Starting FAST TypeScript automation...\n');
                    return [4 /*yield*/, playwright_1.chromium.launch({ headless: false })];
                case 2:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _a.sent();
                    // Set aggressive timeouts
                    page.setDefaultTimeout(2000);
                    page.setDefaultNavigationTimeout(8000);
                    return [4 /*yield*/, login(page)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, navigateToProject(page)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, launchWorkbench(page)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, createPrompt(page)];
                case 7:
                    _a.sent();
                    totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
                    console.log("\n\u2705 Automation completed in ".concat(totalDuration, "s\n"));
                    return [4 /*yield*/, takeScreenshot(page, 'final_state')];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 16];
                case 10:
                    error_1 = _a.sent();
                    totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
                    console.error("\n\u274C Error after ".concat(totalDuration, "s: ").concat(error_1, "\n"));
                    if (!browser) return [3 /*break*/, 12];
                    return [4 /*yield*/, browser.newPage().then(function (p) { return p.screenshot({ path: 'screenshots/error.png' }); }).catch(function () { })];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    process.exit(1);
                    return [3 /*break*/, 16];
                case 13:
                    if (!browser) return [3 /*break*/, 15];
                    return [4 /*yield*/, browser.close()];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15: return [7 /*endfinally*/];
                case 16: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
