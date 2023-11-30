import type { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'

import { CivilMemoryKV } from '..'
import { join } from 'node:path'

export interface CivilMemoryDiskKVOptions {
 rootDir: string
 fsPromises: {
  mkdir: typeof mkdir
  readFile: typeof readFile
  unlink: typeof unlink
  writeFile: typeof writeFile
 }
}

export function diskKV({
 rootDir,
 fsPromises,
}: CivilMemoryDiskKVOptions): CivilMemoryKV {
 let isInitialized = false
 async function diskPath(namespace: string, key: string) {
  const namespaceDirPath = join(rootDir, encodeURIComponent(namespace))
  await fsPromises.mkdir(namespaceDirPath, {
   recursive: true,
   // todo cache our knowledge that the directory
   // exists for performance enhancement here
  })
  isInitialized = true
  return join(rootDir, encodeURIComponent(namespace), encodeURIComponent(key))
 }

 return {
  async delete(key: string) {
   const namespace = key.split('#')[0]
   try {
    await fsPromises.unlink(await diskPath(namespace, key))
   } catch (e) {}
  },
  async get(key: string) {
   const namespace = key.split('#')[0]
   try {
    return (await fsPromises.readFile(await diskPath(namespace, key))).toString(
     'utf8'
    )
   } catch (e) {
    return null
   }
  },
  async set(key: string, value: string) {
   const namespace = key.split('#')[0]
   await fsPromises.writeFile(await diskPath(namespace, key), value, 'utf8')
  },
 }
}
