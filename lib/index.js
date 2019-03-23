"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var sqlite3 = require("sqlite3");
var path_1 = require("path");
var fs_1 = require("fs");
var archiver = require("archiver");
var tmp = require("tmp");
var streams = require("memory-streams");
var sql_1 = require("./sql");
var APKG = /** @class */ (function () {
    function APKG(config) {
        this.config = config;
        this.tmpobj = tmp.dirSync({ unsafeCleanup: true });
        this.dest = this.tmpobj.name;
        this.db = new sqlite3.Database(path_1.join(this.dest, 'collection.anki2'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
            if (err) {
                console.log(err);
            }
        });
        this.db.serialize();
        this.deck = __assign({}, config, { id: +new Date() });
        sql_1.initDatabase(this.db, this.deck);
        this.mediaFiles = [];
    }
    APKG.prototype.addCard = function (card) {
        sql_1.insertCard(this.db, this.deck, card);
    };
    APKG.prototype.addMedia = function (filename, data) {
        var index = this.mediaFiles.length;
        this.mediaFiles.push(filename);
        fs_1.writeFileSync(path_1.join(this.dest, "" + index), data);
    };
    APKG.prototype.save = function (destination) {
        var _this = this;
        this.db.close(function () {
            var mediaObj = _this.mediaFiles.reduce(function (obj, file, idx) {
                obj[idx] = file;
                return obj;
            }, {});
            fs_1.writeFileSync(path_1.join(_this.dest, 'media'), JSON.stringify(mediaObj));
            var archive = archiver('zip');
            archive.directory(_this.dest, false);
            archive.pipe(fs_1.createWriteStream(path_1.join(destination, _this.config.name + ".apkg")));
            archive.finalize();
            archive.on('finish', function () {
                _this.clean();
            });
        });
    };
    APKG.prototype.saveToBuffer = function (callback) {
        var _this = this;
        this.db.close(function () {
            var mediaObj = _this.mediaFiles.reduce(function (obj, file, idx) {
                obj[idx] = file;
                return obj;
            }, {});
            fs_1.writeFileSync(path_1.join(_this.dest, 'media'), JSON.stringify(mediaObj));
            var archive = archiver('zip');
            var writer = new streams.WritableStream();
            archive.directory(_this.dest, false);
            archive.pipe(writer);
            archive.finalize();
            archive.on('finish', function () {
                callback(writer.toBuffer());
            });
            archive.on('end', function () {
                _this.clean();
            });
        });
    };
    APKG.prototype.clean = function () {
        this.tmpobj.removeCallback();
    };
    return APKG;
}());
exports.APKG = APKG;
