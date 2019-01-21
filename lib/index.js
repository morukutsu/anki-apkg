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
var Database = require("better-sqlite3");
var path_1 = require("path");
var fs_1 = require("fs");
var archiver = require("archiver");
var tmp = require("tmp");
var streams = require("memory-streams");
var sql_1 = require("./sql");
var APKG = /** @class */ (function () {
    function APKG(config) {
        this.config = config;
        this.tmpobj = tmp.dirSync();
        this.dest = this.tmpobj.name;
        this.db = new Database(path_1.join(this.dest, 'collection.anki2'));
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
        var directory = this.dest;
        var archive = archiver('zip');
        var mediaObj = this.mediaFiles.reduce(function (obj, file, idx) {
            obj[idx] = file;
            return obj;
        }, {});
        fs_1.writeFileSync(path_1.join(this.dest, 'media'), JSON.stringify(mediaObj));
        archive.directory(directory, false);
        archive.pipe(fs_1.createWriteStream(path_1.join(destination, this.config.name + ".apkg")));
        archive.finalize();
        archive.on('finish', function (err) {
            // cleanup
            _this.db.close();
            _this.clean();
        });
    };
    APKG.prototype.saveToBuffer = function (callback) {
        var _this = this;
        var writer = new streams.WritableStream();
        var directory = this.dest;
        var archive = archiver('zip');
        var mediaObj = this.mediaFiles.reduce(function (obj, file, idx) {
            obj[idx] = file;
            return obj;
        }, {});
        fs_1.writeFileSync(path_1.join(this.dest, 'media'), JSON.stringify(mediaObj));
        archive.directory(directory, false);
        archive.pipe(writer);
        archive.finalize();
        archive.on('finish', function (err) {
            callback(writer.toBuffer());
            // cleanup
            _this.db.close();
            _this.clean();
        });
    };
    APKG.prototype.clean = function () {
        var _this = this;
        var directory = this.dest;
        fs_1.readdir(directory, function (err, files) {
            if (err)
                throw err;
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                fs_1.unlinkSync(path_1.join(directory, file));
            }
            _this.tmpobj.removeCallback();
        });
    };
    return APKG;
}());
exports.APKG = APKG;
