import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TiptapEditor } from '../TiptapEditor'

describe('TiptapEditor - Visual Indicators for Tagged Text', () => {
  beforeEach(() => {
    // Clear any existing dynamic styles
    const existingStyles = document.head.querySelectorAll('style[data-tag-styles]')
    existingStyles.forEach(style => style.remove())
  })

  it('should display visual indicators for previously tagged text', () => {
    // Content with pre-existing tagged text
    const contentWithTags = `
      <p>This is regular text.</p>
      <p>This text has a <span class="my-tag" 
                              data-tag="tag-123" 
                              style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6; border-left: 3px solid #3B82F6; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;" 
                              title="Tagged: Important Note">tagged section</span> in it.</p>
      <p>Another paragraph with <span class="my-tag" 
                                     data-tag="tag-456" 
                                     style="background-color: #EF444425; border-bottom: 2px solid #EF4444; border-left: 3px solid #EF4444; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;" 
                                     title="Tagged: Critical Info">another tag</span>.</p>
    `

    render(<TiptapEditor content={contentWithTags} />)

    // Check that tagged elements exist
    const taggedElements = screen.getAllByTitle(/Tagged:/)
    expect(taggedElements).toHaveLength(2)

    // Verify first tagged element has visual indicators
    const firstTaggedElement = screen.getByTitle('Tagged: Important Note')
    expect(firstTaggedElement).toBeInTheDocument()
    expect(firstTaggedElement).toHaveClass('my-tag')
    expect(firstTaggedElement).toHaveAttribute('data-tag', 'tag-123')
    
    // Check visual styling properties for indentation/highlighting
    const computedStyle = window.getComputedStyle(firstTaggedElement)
    expect(firstTaggedElement).toHaveStyle({
      'border-left': '3px solid rgb(59, 130, 246)', // Blue border for indentation
      'border-bottom': '2px solid rgb(59, 130, 246)', // Blue underline
      'padding': '2px 4px', // Padding for visual separation
      'border-radius': '4px', // Rounded corners
      'cursor': 'pointer', // Interactive cursor
      'transition': 'all 0.2s ease' // Smooth transitions
    })
    
    // Check background color separately to allow for minor rgba precision differences
    const backgroundColor = computedStyle.backgroundColor
    expect(backgroundColor).toMatch(/rgba\(59,\s*130,\s*246,\s*0\.14[0-9]\)/)

    // Verify second tagged element has different visual indicators
    const secondTaggedElement = screen.getByTitle('Tagged: Critical Info')
    expect(secondTaggedElement).toBeInTheDocument()
    expect(secondTaggedElement).toHaveClass('my-tag')
    expect(secondTaggedElement).toHaveAttribute('data-tag', 'tag-456')
    
    // Check different color scheme for second tag
    expect(secondTaggedElement).toHaveStyle({
      'border-left': '3px solid rgb(239, 68, 68)', // Red border for indentation
      'border-bottom': '2px solid rgb(239, 68, 68)', // Red underline
    })
    
    // Check red background color with flexibility for precision
    const secondBackgroundColor = window.getComputedStyle(secondTaggedElement).backgroundColor
    expect(secondBackgroundColor).toMatch(/rgba\(239,\s*68,\s*68,\s*0\.14[0-9]\)/)

    // Verify that non-tagged text doesn't have visual indicators
    const regularText = screen.getByText('This is regular text.')
    expect(regularText).not.toHaveClass('my-tag')
    expect(regularText).not.toHaveAttribute('data-tag')
  })

  it('should apply pulse animation when tag highlighting is toggled', () => {
    const contentWithTags = `
      <p>Text with <span class="my-tag" 
                          data-tag="pulse-tag" 
                          style="background-color: #10B98125; border-bottom: 2px solid #10B981; border-left: 3px solid #10B981; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;" 
                          title="Tagged: Pulse Test">animated tag</span>.</p>
    `

    render(<TiptapEditor content={contentWithTags} />)

    const taggedElement = screen.getByTitle('Tagged: Pulse Test')
    expect(taggedElement).toBeInTheDocument()

    // Check if dynamic CSS animation styles are injected when highlighting is active
    // This tests the pulse animation functionality
    const styleElements = document.head.querySelectorAll('style')
    const hasPulseAnimation = Array.from(styleElements).some(style => 
      style.textContent?.includes('@keyframes pulse') || 
      style.textContent?.includes('animation:') ||
      style.textContent?.includes('pulse-tag')
    )

    // This will initially fail because the pulse animation is not implemented
    // The implementation should inject CSS keyframes and apply animation to highlighted tags
    expect(hasPulseAnimation).toBe(true)
  })
})