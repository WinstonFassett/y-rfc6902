import {apply} from './patch'
import {Operation, TestOperation, isDestructive, Diff, VoidableDiff, diffAny} from './diff'
import { Doc } from 'yjs'
import { objectToY } from './y-utils'
import { YPointer } from './y-pointer'

export {Operation, TestOperation}
export type Patch = Operation[]

/**
Apply a 'application/json-patch+json'-type patch to an object.

`patch` *must* be an array of operations.

> Operation objects MUST have exactly one "op" member, whose value
> indicates the operation to perform.  Its value MUST be one of "add",
> "remove", "replace", "move", "copy", or "test"; other values are
> errors.

This method mutates the target object in-place.

@returns list of results, one for each operation: `null` indicated success,
         otherwise, the result will be an instance of one of the Error classes:
         MissingError, InvalidOperationError, or TestError.
*/
export function applyPatch(object: any, patch: Operation[], cloneValue?: boolean) {
  return patch.map(operation => apply(object, operation, cloneValue))
}

function wrapVoidableDiff(diff: VoidableDiff): Diff {
  function wrappedDiff(input: any, output: any, ptr: YPointer): Operation[] {
    const custom_patch = diff(input, output, ptr)
    // ensure an array is always returned
    return Array.isArray(custom_patch) ? custom_patch : diffAny(input, output, ptr, wrappedDiff)
  }
  return wrappedDiff
}

/**
Produce a 'application/json-patch+json'-type patch to get from one object to
another.

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

`diff` is called on each pair of comparable non-primitive nodes in the
`input`/`output` object trees, producing nested patches. Return `undefined`
to fall back to default behaviour.

Returns list of operations to perform on `input` to produce `output`.
*/
export function createPatch(input: any, output: any, diff?: VoidableDiff): Operation[] {
  const ptr = new YPointer()
  // a new Pointer gets a default path of [''] if not specified
  return (diff ? wrapVoidableDiff(diff) : diffAny)(input, output, ptr)
}

/**
Create a test operation based on `input`'s current evaluation of the JSON
Pointer `path`; if such a pointer cannot be resolved, returns undefined.
*/
function createYTest(input: any, path: string): TestOperation | undefined {
  const doc = new Doc()
  const y = objectToY(input)
  const testMap = doc.getMap('test')
  testMap.set('item', y)
  const yInput = y
  const endpoint = YPointer.fromJSON(path).evaluate(yInput)
  const value = endpoint.value && endpoint.value.toJSON ? endpoint.value.toJSON() : endpoint.value
  if (endpoint !== undefined) {
    return {op: 'test', path, value}
  }
}

/**
Produce an 'application/json-patch+json'-type list of tests, to verify that
existing values in an object are identical to the those captured at some
checkpoint (whenever this function is called).

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

Returns list of test operations.
*/

export function createYTests(input: any, patch: Operation[]): TestOperation[] {
  const tests = new Array<TestOperation>()
  patch.filter(isDestructive).forEach(operation => {
    const pathTest = createYTest(input, operation.path)
    if (pathTest) tests.push(pathTest)
    if ('from' in operation) {
      const fromTest = createYTest(input, operation.from)
      if (fromTest) tests.push(fromTest)
    }
  })
  return tests
}