import * as Database from 'better-sqlite3'
import { join } from 'path'
import {
  writeFileSync,
  mkdirSync,
  rmdirSync,
  createWriteStream,
  unlinkSync,
  readdir
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
    this.tmpobj = tmp.dirSync()
    this.dest = this.tmpobj.name
    this.db = new Database(join(this.dest, 'collection.anki2'))
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
    const directory = this.dest
    const archive = archiver('zip')
    const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
      obj[idx] = file
      return obj
    }, {})

    writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj))

    archive.directory(directory, false)
    archive.pipe(
      createWriteStream(join(destination, `${this.config.name}.apkg`))
    )
    archive.finalize()

    archive.on('finish', err => {
      // cleanup
      this.db.close()
      this.clean()
    })
  }

  saveToBuffer(callback: Function) {
    const writer = new streams.WritableStream()
    const directory = this.dest
    const archive = archiver('zip')
    const mediaObj = this.mediaFiles.reduce((obj, file, idx) => {
      obj[idx] = file
      return obj
    }, {})

    writeFileSync(join(this.dest, 'media'), JSON.stringify(mediaObj))

    archive.directory(directory, false)
    archive.pipe(writer)
    archive.finalize()

    archive.on('finish', err => {
      callback(writer.toBuffer())

      // cleanup
      this.db.close()
      this.clean()
    })
  }

  clean() {
    const directory = this.dest

    readdir(directory, (err, files) => {
      if (err) throw err

      for (const file of files) {
        unlinkSync(join(directory, file))
      }

      this.tmpobj.removeCallback()
    })
  }
}
