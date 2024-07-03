import test from 'ava'
import { Doc } from 'yjs'

import {YPointer} from '../y-pointer'
import { objectToY } from '../y-utils'

const exampleData = {bool: false, arr: [10, 20, 30], obj: {a: 'A', b: 'B'}}
const example = () => {
  const y = objectToY(exampleData)
  const doc = new Doc()
  doc.getMap('test').set('item', y)
  return y
}
test('YPointer#get bool', t => {
  t.deepEqual(YPointer.fromJSON('/bool').get(example()), false, 'should get bool value')
})
test('YPointer#get array', t => {
  t.deepEqual(YPointer.fromJSON('/arr/1').get(example()), 20, 'should get array value')
})
test('YPointer#get object', t => {
  t.deepEqual(YPointer.fromJSON('/obj/b').get(example()), 'B', 'should get object value')
})

test('YPointer#set bool', t => {
  const input = {bool: true}
  YPointer.fromJSON('/bool').set(input, false)
  t.deepEqual(input.bool, false, 'should set bool value in-place')
})

test('YPointer#set array middle', t => {
  const input: any = {arr: ['10', '20', '30']}
  YPointer.fromJSON('/arr/1').set(input, 0)
  t.deepEqual(input.arr[1], 0, 'should set array value in-place')
})

test('YPointer#set array beyond', t => {
  const input: any = {arr: ['10', '20', '30']}
  YPointer.fromJSON('/arr/3').set(input, 40)
  t.deepEqual(input.arr[3], 40, 'should set array value in-place')
})

test('YPointer#set object existing', t => {
  const input = {obj: {a: 'A', b: 'B'}}
  YPointer.fromJSON('/obj/b').set(input, 'BBB')
  t.deepEqual(input.obj.b, 'BBB', 'should set object value in-place')
})

test('YPointer#set object new', t => {
  const input: any = {obj: {a: 'A', b: 'B'}}
  YPointer.fromJSON('/obj/c').set(input, 'C')
  t.deepEqual(input.obj.c, 'C', 'should add object value in-place')
})
