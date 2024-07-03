import * as Y from 'yjs'
import { clone } from './util'

export function objectToY (obj: any) {  
  switch (typeof obj) {
    case 'string':
    case 'number':
    case 'boolean':
      return obj      
    case 'object':
      if (Array.isArray(obj)) {
        const y = new Y.Array()
        y.push(obj.map(objectToY))
        return y
      } else {
        if (obj === null) return null
        const props = {}
        const y = new Y.Map()
        Object.entries(obj).forEach(([key, value]) =>{
          y.set(key,objectToY(value))
        })
        return y
      }      
  }
}

/**
Recursively copy a value.

@param source - should be a JavaScript primitive, Array, or (plain old) Object.
@returns copy of source where every Array and Object have been recursively
         reconstructed from their constituent elements
*/
export function cloneYMaybe<T extends any>(source: T): T {
  if (!(source instanceof Y.AbstractType)) {
    return clone(source)
  }
  if (source instanceof Y.Array) {
    const length = (source as Array<any>).length
    const arrayTarget: any = new Array(length)
    for (let i = 0; i < length; i++) {
      arrayTarget[i] = cloneYMaybe(source.get(i))
    }
    return arrayTarget
  }
  if (source instanceof Y.Map) {
    const entries = Array.from(source.entries()) as [key: string, value: any][]
    return new Y.Map(entries) as T
  }
  console.log('cannot serialize type', source)
  throw new Error('cannot serialize type')
}

export function setOnYMaybe<T>(target: any, value: any, key: any) {
  const yValue = objectToY(value)
  if (target instanceof Y.Map) {
    target.set(key as string, yValue)
  } else if (target instanceof Y.Array) {
    target.insert(key || target.length, [yValue])
  } else {
    target[key] = value
  }
}
export function arrayPushYMaybe<T>(target: any, value: any) {
  if (target instanceof Y.Array) {
    target.push([value])
  } else {
    target.push(value)
  }
}

export function arraySpliceYMaybe<T>(target: any, index=0, deletions=0, insertions: T[] = []) {
  if (target instanceof Y.Array) {
    if (deletions) {
      target.delete(index, deletions)
    }
    if (insertions) {
      target.insert(index, insertions)
    }
  } else {
    target.splice(index, deletions, ...insertions)    
  }
}
export function mapRemoveYMaybe<T>(target: any, value: any, key: any) {
  if (target instanceof Y.Map) {
    target.set(key as string, value)
  } else if (target instanceof Y.Array) {
    target.insert(key || target.length, [value])
  } else {
    target[key] = value
  }
}

