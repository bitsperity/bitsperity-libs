/**
 * Tests für KeyDisplay Svelte Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import KeyDisplay from './KeyDisplay.svelte';

// Test data
const testPubkey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const testEventId = '4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65';
const expectedNpub = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';
const expectedNote = 'note1gdmvvhf0yv40h6dcs234h2j0dl5xvlzwdpr5nt6kt7vpsvlddfjs6sl8mv';

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve())
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

describe('KeyDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render pubkey correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        type: 'pubkey'
      });

      const element = getByRole('button');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('key-display', 'key-pubkey');
      expect(element).toHaveAttribute('data-hex', testPubkey);
      expect(element).toHaveAttribute('data-encoded', expectedNpub);
    });

    it('should render event ID correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testEventId,
        type: 'eventId'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-display', 'key-event');
      expect(element).toHaveAttribute('data-hex', testEventId);
      expect(element).toHaveAttribute('data-encoded', expectedNote);
    });

    it('should handle invalid keys', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: 'invalid-key'
      });

      const element = getByRole('text');
      expect(element).toHaveClass('key-invalid');
      expect(element).toHaveTextContent('Invalid Key');
    });
  });

  describe('Variants', () => {
    it('should render short variant correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        variant: 'short'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-short');
      
      const text = element.querySelector('.key-text');
      expect(text).toHaveTextContent('npub180cvv...fa459d');
    });

    it('should render compact variant correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        variant: 'compact'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-compact');
      
      const text = element.querySelector('.key-text');
      expect(text).toHaveTextContent('npub180c...');
    });

    it('should render full variant correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        variant: 'full'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-full');
      
      const text = element.querySelector('.key-text');
      expect(text).toHaveTextContent(expectedNpub);
    });

    it('should render icon variant correctly', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        variant: 'icon'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-icon');
      
      const text = element.querySelector('.key-text');
      expect(text).toHaveTextContent('👤');
    });
  });

  describe('Interactivity', () => {
    it('should be copyable by default', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      const element = getByRole('button');
      expect(element).toHaveClass('key-copyable');
      expect(element).toHaveAttribute('role', 'button');
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('should not be copyable when disabled', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        copyable: false
      });

      const element = getByRole('text');
      expect(element).not.toHaveClass('key-copyable');
      expect(element).toHaveAttribute('role', 'text');
      expect(element).toHaveAttribute('tabindex', '-1');
    });

    it('should copy to clipboard when clicked', async () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      const element = getByRole('button');
      await fireEvent.click(element);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedNpub);
    });

    it('should handle keyboard navigation', async () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      const element = getByRole('button');
      await fireEvent.keyDown(element, { key: 'Enter' });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedNpub);
    });
  });

  describe('Events', () => {
    it('should dispatch click event', async () => {
      const mockClickHandler = vi.fn();
      const { getByRole, component } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      component.$on('click', mockClickHandler);

      const element = getByRole('button');
      await fireEvent.click(element);

      expect(mockClickHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            hex: testPubkey,
            encoded: expectedNpub
          }
        })
      );
    });

    it('should dispatch copy event', async () => {
      const mockCopyHandler = vi.fn();
      const { getByRole, component } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      component.$on('copy', mockCopyHandler);

      const element = getByRole('button');
      await fireEvent.click(element);

      expect(mockCopyHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            hex: testPubkey,
            encoded: expectedNpub
          }
        })
      );
    });
  });

  describe('Label Display', () => {
    it('should show label when enabled', () => {
      const { getByText } = render(KeyDisplay, {
        hexKey: testPubkey,
        type: 'pubkey',
        showLabel: true
      });

      expect(getByText('Pubkey:')).toBeInTheDocument();
    });

    it('should show correct label for event ID', () => {
      const { getByText } = render(KeyDisplay, {
        hexKey: testEventId,
        type: 'eventId',
        showLabel: true
      });

      expect(getByText('Event ID:')).toBeInTheDocument();
    });

    it('should not show label by default', () => {
      const { queryByText } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      expect(queryByText('Pubkey:')).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        className: 'custom-style'
      });

      const element = getByRole('button');
      expect(element).toHaveClass('custom-style');
    });
  });

  describe('Copy Feedback', () => {
    it('should show copy icon', () => {
      const { container } = render(KeyDisplay, {
        hexKey: testPubkey,
        copyable: true
      });

      const copyIcon = container.querySelector('.copy-icon');
      expect(copyIcon).toBeInTheDocument();
      expect(copyIcon).toHaveTextContent('📋');
    });

    it('should not show copy icon when not copyable', () => {
      const { container } = render(KeyDisplay, {
        hexKey: testPubkey,
        copyable: false
      });

      const copyIcon = container.querySelector('.copy-icon');
      expect(copyIcon).not.toBeInTheDocument();
    });

    it('should show success feedback after copying', async () => {
      const { getByRole, container } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      const element = getByRole('button');
      await fireEvent.click(element);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 10));

      const copyIcon = container.querySelector('.copy-icon');
      expect(copyIcon).toHaveTextContent('✅');
      expect(copyIcon).toHaveClass('copied');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for copyable key', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        copyable: true
      });

      const element = getByRole('button');
      expect(element).toHaveAttribute('title', `Click to copy: ${expectedNpub}`);
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('should have proper ARIA attributes for non-copyable key', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey,
        copyable: false
      });

      const element = getByRole('text');
      expect(element).toHaveAttribute('title', expectedNpub);
      expect(element).toHaveAttribute('tabindex', '-1');
    });

    it('should have proper ARIA attributes for invalid key', () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: 'invalid'
      });

      const element = getByRole('text');
      expect(element).toHaveAttribute('title', 'Invalid key');
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard API failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard access denied'));

      const { getByRole } = render(KeyDisplay, {
        hexKey: testPubkey
      });

      const element = getByRole('button');
      await fireEvent.click(element);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should not attempt copy for invalid keys', async () => {
      const { getByRole } = render(KeyDisplay, {
        hexKey: 'invalid'
      });

      const element = getByRole('text');
      await fireEvent.click(element);

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });
  });
});