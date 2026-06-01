import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useAppContext } from './AppContext'

function Inspector() {
  const ctx = useAppContext()
  return (
    <>
      <span data-testid="era">{ctx.selectedEra}</span>
      <span data-testid="map">{ctx.selectedMap}</span>
      <span data-testid="triggered">{String(ctx.mapResetTriggered)}</span>
      <span data-testid="filter">{ctx.filters.category ?? 'null'}</span>
      <button onClick={() => ctx.setEra('primordial')}>set-era</button>
      <button onClick={() => ctx.setFilter('characters')}>set-filter</button>
      <button onClick={() => ctx.clearMapResetTrigger()}>clear-trigger</button>
    </>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}

describe('AppContext', () => {
  it('initializes selectedEra with the first era by order', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    expect(screen.getByTestId('era').textContent).toBe('primordial')
  })

  it('initializes selectedMap with the default map of the first era', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    expect(screen.getByTestId('map').textContent).toBe('omniverse')
  })

  it('initializes mapResetTriggered as false', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    expect(screen.getByTestId('triggered').textContent).toBe('false')
  })

  it('setEra updates selectedEra', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    act(() => { screen.getByText('set-era').click() })
    expect(screen.getByTestId('era').textContent).toBe('primordial')
  })

  it('setFilter updates the category filter', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    act(() => { screen.getByText('set-filter').click() })
    expect(screen.getByTestId('filter').textContent).toBe('characters')
  })

  it('clearMapResetTrigger resets the flag to false', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    act(() => { screen.getByText('clear-trigger').click() })
    expect(screen.getByTestId('triggered').textContent).toBe('false')
  })

  it('throws when useAppContext is used outside AppProvider', () => {
    const original = console.error
    console.error = () => {}
    expect(() => render(<Inspector />)).toThrow('useAppContext must be used inside AppProvider')
    console.error = original
  })
})
