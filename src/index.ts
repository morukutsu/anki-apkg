import * as sqlite3 from 'sqlite3'
import { join } from 'path'
import {
    writeFileSync,
    mkdirSync,
    rmdirSync,
    createWriteStream,
    unlinkSync,
    readdirSync
} from 'fs'
import * as archiver from 'archiver'
import * as tmp from 'tmp'
import * as streams from 'memory-streams'

import { initDatabase, insertCard } from './sql'

export class APKG {
    private db: any
    private deck: DeckConfig
    private dest: string
    private mediaFiles: Array<string>
    private tmpobj: any

    constructor(private config: DeckConfig) {
        this.tmpobj = tmp.dirSync({ unsafeCleanup: true })
        this.dest = this.tmpobj.name

        this.db = new sqlite3.Database(join(this.dest, 'collection.anki2'),
            sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
            (err) => {
                if (err) {
                    console.log(err)
                }
            })

        this.db.serialize()

        this.deck = {
            ...config,
            id: +new Date()
        }

        initDatabase(this.db, this.deck)
        this.mediaFiles = []
    }

    addCard(card: Card) {
        insertCard(this.db, this.deck, card)
    }

    addMedia(filename: string, data: Buffer) {
        const index = this.mediaFiles.length
        this.mediaFiles.push(filename)
        writeFileSync(join(this.dest, `${index}`), data)
    }

    save(destination: string) {
        this.db.close(() => {
            const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
                obj[idx] = file
                return obj
            }, {})

            writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj))

            const archive = archiver('zip')
            archive.directory(this.dest, false)
            archive.pipe(
                createWriteStream(join(destination, `${this.config.name}.apkg`))
            )
            archive.finalize()

            archive.on('finish', () => {
                this.clean()
            })
        })
    }

    saveToBuffer(callback: Function) {
        this.db.close(() => {
            const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
                obj[idx] = file
                return obj
            }, {})

            writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj))

            const archive = archiver('zip')
            const writer = new streams.WritableStream()
            archive.directory(this.dest, false)
            archive.pipe(writer)
            archive.finalize()

            archive.on('finish', () => {
                callback(writer.toBuffer())
            })

            archive.on('end', () => {
                this.clean()
            })
        })
    }

    clean() {
        this.tmpobj.removeCallback()
    }
}
