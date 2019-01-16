import * as Database from 'better-sqlite3'
import { join } from 'path'
import { initDatabase, insertCard } from './sql'
import { writeFileSync, mkdirSync, rmdirSync, createWriteStream } from 'fs'
import * as archiver from 'archiver'
import * as tmp from 'tmp'

export class APKG {
  private db: any
  private deck: DeckConfig
  private dest: string
  private mediaFiles: Array<string>
  constructor(private config: DeckConfig) {
    const tmpobj = tmp.dirSync()
    this.dest = tmpobj.name
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
    const directory = join(__dirname, this.config.name)
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
  }
}
