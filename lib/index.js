import sqlite3 from 'sqlite3';
import { join } from 'path';
import { writeFileSync, createWriteStream, unlinkSync, readdir } from 'fs';
import * as archiver from 'archiver';
import * as tmp from 'tmp';
import * as streams from 'memory-streams';
import { initDatabase, insertCard } from './sql';
export class APKG {
    constructor(config) {
        this.config = config;
        this.tmpobj = tmp.dirSync();
        this.dest = this.tmpobj.name;
        this.db = new sqlite3.Database(join(this.dest, 'collection.anki2'));
        this.deck = Object.assign({}, config, { id: +new Date() });
        initDatabase(this.db, this.deck);
        this.mediaFiles = [];
    }
    addCard(card) {
        insertCard(this.db, this.deck, card);
    }
    addMedia(filename, data) {
        const index = this.mediaFiles.length;
        this.mediaFiles.push(filename);
        writeFileSync(join(this.dest, `${index}`), data);
    }
    save(destination) {
        const directory = this.dest;
        const archive = archiver('zip');
        const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
            obj[idx] = file;
            return obj;
        }, {});
        writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj));
        archive.directory(directory, false);
        archive.pipe(createWriteStream(join(destination, `${this.config.name}.apkg`)));
        archive.finalize();
        archive.on('finish', err => {
            this.db.close();
            this.clean();
        });
    }
    saveToBuffer(callback) {
        const writer = new streams.WritableStream();
        const directory = this.dest;
        const archive = archiver('zip');
        const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
            obj[idx] = file;
            return obj;
        }, {});
        writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj));
        archive.directory(directory, false);
        archive.pipe(writer);
        archive.finalize();
        archive.on('finish', err => {
            callback(writer.toBuffer());
            this.db.close();
            this.clean();
        });
    }
    clean() {
        const directory = this.dest;
        readdir(directory, (err, files) => {
            if (err)
                throw err;
            for (const file of files) {
                unlinkSync(join(directory, file));
            }
            this.tmpobj.removeCallback();
        });
    }
}
//# sourceMappingURL=index.js.map