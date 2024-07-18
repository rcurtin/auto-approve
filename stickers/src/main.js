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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var issueMessage, prMessage, client, context, isIssue, sender, issue, firstContribution, message, issueType, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    issueMessage = core.getInput('issue-message');
                    prMessage = core.getInput('pr-message');
                    if (!issueMessage && !prMessage) {
                        throw new Error('Action must have at least one of issue-message or pr-message set');
                    }
                    client = github.getOctokit(core.getInput('repo-token', { required: true }));
                    context = github.context;
                    isIssue = !!context.payload.issue;
                    if (!isIssue && !context.payload.pull_request) {
                        console.log('The event that triggered this action was not a pull request or issue, skipping.');
                        return [2 /*return*/];
                    }
                    // Do nothing if its not their first contribution
                    console.log('Checking if its the users first contribution');
                    if (!context.payload.sender) {
                        throw new Error('Internal error, no sender provided by GitHub');
                    }
                    sender = context.payload.sender.login;
                    issue = context.issue;
                    firstContribution = false;
                    if (!isIssue) return [3 /*break*/, 2];
                    return [4 /*yield*/, isFirstIssue(client, issue.owner, issue.repo, sender, issue.number)];
                case 1:
                    firstContribution = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, isFirstPull(client, issue.owner, issue.repo, sender, issue.number)];
                case 3:
                    firstContribution = _a.sent();
                    _a.label = 4;
                case 4:
                    if (!firstContribution) {
                        console.log('Not the users first contribution');
                        return [2 /*return*/];
                    }
                    message = isIssue ? issueMessage : prMessage;
                    if (!message) {
                        console.log('No message provided for this type of contribution');
                        return [2 /*return*/];
                    }
                    issueType = isIssue ? 'issue' : 'pull request';
                    // Add a comment to the appropriate place
                    console.log("Adding message: " + message + " to " + issueType + " " + issue.number);
                    if (!isIssue) return [3 /*break*/, 6];
                    return [4 /*yield*/, client.rest.issues.createComment({
                            owner: issue.owner,
                            repo: issue.repo,
                            issue_number: issue.number,
                            body: message
                        })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, client.rest.pulls.createReview({
                        owner: issue.owner,
                        repo: issue.repo,
                        pull_number: issue.number,
                        body: message,
                        event: 'COMMENT'
                    })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _a.sent();
                    core.setFailed(error_1.message);
                    return [2 /*return*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function isFirstIssue(client, owner, repo, sender, curIssueNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, status, issues, _i, issues_1, issue;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, client.rest.issues.listForRepo({
                        owner: owner,
                        repo: repo,
                        creator: sender,
                        state: 'all'
                    })];
                case 1:
                    _a = _b.sent(), status = _a.status, issues = _a.data;
                    if (status !== 200) {
                        throw new Error("Received unexpected API status code " + status);
                    }
                    if (issues.length === 0) {
                        return [2 /*return*/, true];
                    }
                    for (_i = 0, issues_1 = issues; _i < issues_1.length; _i++) {
                        issue = issues_1[_i];
                        if (issue.number < curIssueNumber && !issue.pull_request) {
                            return [2 /*return*/, false];
                        }
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
// No way to filter pulls by creator
function isFirstPull(client, owner, repo, sender, curPullNumber, page) {
    var _a;
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var _b, status, pulls, _i, pulls_1, pull, login;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Provide console output if we loop for a while.
                    console.log('Checking...');
                    return [4 /*yield*/, client.rest.pulls.list({
                            owner: owner,
                            repo: repo,
                            per_page: 100,
                            page: page,
                            state: 'all'
                        })];
                case 1:
                    _b = _c.sent(), status = _b.status, pulls = _b.data;
                    if (status !== 200) {
                        throw new Error("Received unexpected API status code " + status);
                    }
                    if (pulls.length === 0) {
                        return [2 /*return*/, true];
                    }
                    for (_i = 0, pulls_1 = pulls; _i < pulls_1.length; _i++) {
                        pull = pulls_1[_i];
                        login = (_a = pull.user) === null || _a === void 0 ? void 0 : _a.login;
                        if (login === sender && pull.number < curPullNumber && pull.merged === true) {
                            return [2 /*return*/, false];
                        }
                    }
                    return [4 /*yield*/, isFirstPull(client, owner, repo, sender, curPullNumber, page + 1)];
                case 2: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
run();
