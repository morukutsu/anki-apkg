"use strict";
exports.__esModule = true;
// Reference:
// https://github.com/ankidroid/Anki-Android/wiki/Database-Structure
var sha1 = require("sha1");
function initDatabase(database, config) {
    var _a, _b;
    var current = config.id;
    var deckId = current;
    var modelId = deckId + 1;
    var fields = config.card.fields.map(function (field, ord) { return ({
        size: 20,
        name: field,
        media: [],
        rtl: false,
        ord: ord,
        font: 'Arial',
        sticky: false
    }); });
    var conf = {
        nextPos: 1,
        estTimes: true,
        activeDecks: [1],
        sortType: 'noteFld',
        timeLim: 0,
        sortBackwards: false,
        addToCur: true,
        curDeck: 1,
        newBury: true,
        newSpread: 0,
        dueCounts: true,
        curModel: modelId,
        collapseTime: 1200
    };
    var models = (_a = {},
        _a[modelId] = {
            vers: [],
            name: config.name,
            tags: [],
            did: deckId,
            usn: -1,
            req: [[0, 'all', [0]]],
            flds: fields,
            sortf: 0,
            latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
            tmpls: [
                {
                    afmt: config.card.template.answer,
                    name: config.name,
                    qfmt: config.card.template.question,
                    did: null,
                    ord: 0,
                    bafmt: '',
                    bqfmt: ''
                }
            ],
            latexPost: '\\end{document}',
            type: 0,
            id: modelId,
            css: config.card.styleText ||
                '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n',
            mod: +new Date()
        },
        _a);
    var decks = (_b = {},
        _b[deckId] = {
            mid: modelId,
            name: config.name,
            extendRev: 50,
            usn: -1,
            collapsed: false,
            newToday: [1362, 0],
            timeToday: [1362, 0],
            dyn: 0,
            extendNew: 10,
            conf: 1,
            revToday: [1362, 0],
            lrnToday: [1362, 0],
            id: deckId,
            mod: +new Date(),
            desc: ''
        },
        _b);
    var decksConfig = {};
    var sql = "\nBEGIN TRANSACTION;\nCREATE TABLE IF NOT EXISTS col (\n\tid\tinteger,\n\tcrt\tinteger NOT NULL,\n\tmod\tinteger NOT NULL,\n\tscm\tinteger NOT NULL,\n\tver\tinteger NOT NULL,\n\tdty\tinteger NOT NULL,\n\tusn\tinteger NOT NULL,\n\tls\tinteger NOT NULL,\n\tconf\ttext NOT NULL,\n\tmodels\ttext NOT NULL,\n\tdecks\ttext NOT NULL,\n\tdconf\ttext NOT NULL,\n\ttags\ttext NOT NULL,\n\tPRIMARY KEY(id)\n);\nINSERT INTO col VALUES (\n  1,\n  1401912000,\n  " + current + ",\n  " + current + ",\n  11,\n  0,\n  0,\n  0,\n  '" + JSON.stringify(conf) + "',\n  '" + JSON.stringify(models) + "',\n  '" + JSON.stringify(decks) + "',\n  '" + JSON.stringify(decksConfig) + "',\n  '{}'\n);\nCREATE TABLE IF NOT EXISTS cards (\n\tid\tinteger,\n\tnid\tinteger NOT NULL,\n\tdid\tinteger NOT NULL,\n\tord\tinteger NOT NULL,\n\tmod\tinteger NOT NULL,\n\tusn\tinteger NOT NULL,\n\ttype\tinteger NOT NULL,\n\tqueue\tinteger NOT NULL,\n\tdue\tinteger NOT NULL,\n\tivl\tinteger NOT NULL,\n\tfactor\tinteger NOT NULL,\n\treps\tinteger NOT NULL,\n\tlapses\tinteger NOT NULL,\n\tleft\tinteger NOT NULL,\n\todue\tinteger NOT NULL,\n\todid\tinteger NOT NULL,\n\tflags\tinteger NOT NULL,\n\tdata\ttext NOT NULL,\n\tPRIMARY KEY(id)\n);\nCREATE TABLE IF NOT EXISTS notes (\n\tid\tinteger,\n\tguid\ttext NOT NULL,\n\tmid\tinteger NOT NULL,\n\tmod\tinteger NOT NULL,\n\tusn\tinteger NOT NULL,\n\ttags\ttext NOT NULL,\n\tflds\ttext NOT NULL,\n\tsfld\tinteger NOT NULL,\n\tcsum\tinteger NOT NULL,\n\tflags\tinteger NOT NULL,\n\tdata\ttext NOT NULL,\n\tPRIMARY KEY(id)\n);\nCREATE TABLE IF NOT EXISTS graves (\n\tusn\tinteger NOT NULL,\n\toid\tinteger NOT NULL,\n\ttype\tinteger NOT NULL\n);\nCREATE TABLE IF NOT EXISTS revlog (\n\tid\tinteger,\n\tcid\tinteger NOT NULL,\n\tusn\tinteger NOT NULL,\n\tease\tinteger NOT NULL,\n\tivl\tinteger NOT NULL,\n\tlastIvl\tinteger NOT NULL,\n\tfactor\tinteger NOT NULL,\n\ttime\tinteger NOT NULL,\n\ttype\tinteger NOT NULL,\n\tPRIMARY KEY(id)\n);\nCREATE INDEX IF NOT EXISTS ix_revlog_usn ON revlog (\n\tusn\n);\nCREATE INDEX IF NOT EXISTS ix_revlog_cid ON revlog (\n\tcid\n);\nCREATE INDEX IF NOT EXISTS ix_notes_usn ON notes (\n\tusn\n);\nCREATE INDEX IF NOT EXISTS ix_notes_csum ON notes (\n\tcsum\n);\nCREATE INDEX IF NOT EXISTS ix_cards_usn ON cards (\n\tusn\n);\nCREATE INDEX IF NOT EXISTS ix_cards_sched ON cards (\n\tdid,\n\tqueue,\n\tdue\n);\nCREATE INDEX IF NOT EXISTS ix_cards_nid ON cards (\n\tnid\n);\nCOMMIT;\n";
    database.serialize(function () {
        database.exec(sql, function (err) {
            if (err) {
                console.log("database.exec(sql", err);
            }
        });
    });
}
exports.initDatabase = initDatabase;
function insertCard(database, deck, card) {
    var cardId = card.id;
    var noteId = cardId + 1;
    var modelId = deck.id + 1;
    var fieldsContent = card.content.join('\u001F');
    var sortField = card.content[0];
    database.serialize(function () {
        var SQL_CARD = "INSERT INTO cards (id,nid,did,ord,mod,usn,type,queue,due,ivl,factor,reps,lapses,left,odue,odid,flags,data) VALUES (?,  ?,  ?,  0,  ?,  -1,  0,  0,  86400,0,0,0,0,0,0,0,0,'')";
        database.run(SQL_CARD, [cardId, noteId, deck.id, 0], function (err) {
            if (err) {
                console.log("database.run(SQL_CARD", err);
            }
        });
        var SQL_NOTE = "INSERT INTO notes (id,guid,mid,mod,usn,tags,flds,sfld,csum,flags,data) VALUES (?,  ?,  ?,  ?,  -1,  '',  ?,  ?,  ?,  0,  '');";
        database
            .run(SQL_NOTE, [noteId,
            "" + cardId,
            modelId,
            0,
            fieldsContent,
            sortField,
            parseInt(sha1(sortField).substr(0, 8), 16)], function (err) {
            if (err) {
                console.log("database.run(SQL_NOTE", err);
            }
        });
    });
}
exports.insertCard = insertCard;
