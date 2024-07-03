import { Doc } from "yjs"
import { objectToY } from "./y-utils"

export function makeY (data: any) {
  const y = objectToY(data)
  const doc = new Doc()
  doc.getMap('test').set('item', y)
  return y
}