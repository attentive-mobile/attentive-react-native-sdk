/**
 * @format
 */

import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import App from '../App'

test('renders correctly', async () => {
  // App schedules deferred SDK work via setTimeout on mount. Use fake timers so
  // those callbacks don't fire (and log) after the test finishes, then unmount to
  // run effect cleanup. This keeps the smoke test focused on the initial render.
  jest.useFakeTimers()

  let renderer!: ReactTestRenderer.ReactTestRenderer
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />)
  })

  await ReactTestRenderer.act(() => {
    renderer.unmount()
  })

  jest.useRealTimers()
})
