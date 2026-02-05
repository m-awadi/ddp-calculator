import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryPanel from '../components/HistoryPanel';

// Mock formatCurrency
vi.mock('../utils/formatters', () => ({
    formatCurrency: vi.fn((value) => `$${value.toLocaleString()}`),
}));

describe('HistoryPanel', () => {
    const mockHistory = [
        {
            id: 'test-1',
            name: 'First Quotation',
            savedAt: new Date().toISOString(),
            summary: { itemCount: 3, totalCBM: 5.5, ddpTotal: 15000, currency: 'USD' },
        },
        {
            id: 'test-2',
            name: 'Second Quotation',
            savedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            summary: { itemCount: 1, totalCBM: 2.0, ddpTotal: 5000, currency: 'USD' },
        },
    ];

    const defaultProps = {
        isOpen: true,
        onToggle: vi.fn(),
        history: mockHistory,
        onLoad: vi.fn(),
        onDelete: vi.fn(),
        onRename: vi.fn(),
        onClearAll: vi.fn(),
        onSave: vi.fn(),
        currentReportName: 'Current Report',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('should render panel when open', () => {
            render(<HistoryPanel {...defaultProps} />);

            expect(screen.getByText('Quotation History')).toBeInTheDocument();
            expect(screen.getByText('Save Current Quotation')).toBeInTheDocument();
        });

        test('should not render panel content when closed', () => {
            render(<HistoryPanel {...defaultProps} isOpen={false} />);

            expect(screen.queryByText('Quotation History')).not.toBeInTheDocument();
        });

        test('should render toggle button', () => {
            render(<HistoryPanel {...defaultProps} />);

            const toggleButton = screen.getByTitle(/close history/i);
            expect(toggleButton).toBeInTheDocument();
        });

        test('should render history items', () => {
            render(<HistoryPanel {...defaultProps} />);

            expect(screen.getByText('First Quotation')).toBeInTheDocument();
            expect(screen.getByText('Second Quotation')).toBeInTheDocument();
        });

        test('should display item summary info', () => {
            render(<HistoryPanel {...defaultProps} />);

            expect(screen.getByText('3 items')).toBeInTheDocument();
            expect(screen.getByText('5.50 CBM')).toBeInTheDocument();
            expect(screen.getByText('$15,000')).toBeInTheDocument();
        });

        test('should show empty state when no history', () => {
            render(<HistoryPanel {...defaultProps} history={[]} />);

            expect(screen.getByText('No saved quotations yet')).toBeInTheDocument();
        });

        test('should show count in footer', () => {
            render(<HistoryPanel {...defaultProps} />);

            expect(screen.getByText('2 saved quotations')).toBeInTheDocument();
        });
    });

    describe('toggle functionality', () => {
        test('should call onToggle when toggle button clicked', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            const toggleButton = screen.getByTitle(/close history/i);
            await user.click(toggleButton);

            expect(defaultProps.onToggle).toHaveBeenCalled();
        });
    });

    describe('save functionality', () => {
        test('should open save modal when save button clicked', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Save Current Quotation'));

            expect(screen.getByPlaceholderText(/enter a name/i)).toBeInTheDocument();
        });

        test('should pre-fill save modal with current report name', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Save Current Quotation'));

            const input = screen.getByPlaceholderText(/enter a name/i);
            expect(input.value).toBe('Current Report');
        });

        test('should call onSave with custom name', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Save Current Quotation'));

            const input = screen.getByPlaceholderText(/enter a name/i);
            await user.clear(input);
            await user.type(input, 'Custom Name');

            await user.click(screen.getByRole('button', { name: /^save$/i }));

            expect(defaultProps.onSave).toHaveBeenCalledWith('Custom Name');
        });

        test('should close save modal on cancel', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Save Current Quotation'));
            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(screen.queryByPlaceholderText(/enter a name/i)).not.toBeInTheDocument();
        });
    });

    describe('load functionality', () => {
        test('should call onLoad when restore button clicked', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            const restoreButtons = screen.getAllByText('Restore');
            await user.click(restoreButtons[0]);

            expect(defaultProps.onLoad).toHaveBeenCalledWith('test-1');
        });
    });

    describe('delete functionality', () => {
        test('should call onDelete when delete button clicked', async () => {
            const user = userEvent.setup();

            render(<HistoryPanel {...defaultProps} />);

            const deleteButtons = screen.getAllByTitle('Delete this quotation');
            await user.click(deleteButtons[0]);

            // HistoryPanel directly calls onDelete - confirm is handled by parent
            expect(defaultProps.onDelete).toHaveBeenCalledWith('test-1');
        });

        test('should call onDelete with correct id for second item', async () => {
            const user = userEvent.setup();

            render(<HistoryPanel {...defaultProps} />);

            const deleteButtons = screen.getAllByTitle('Delete this quotation');
            await user.click(deleteButtons[1]);

            expect(defaultProps.onDelete).toHaveBeenCalledWith('test-2');
        });
    });

    describe('rename functionality', () => {
        test('should enter edit mode when clicking on name', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('First Quotation'));

            expect(screen.getByDisplayValue('First Quotation')).toBeInTheDocument();
        });

        test('should call onRename when saving edit', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('First Quotation'));

            const input = screen.getByDisplayValue('First Quotation');
            await user.clear(input);
            await user.type(input, 'Renamed Quotation');

            // Find and click the Save button in the edit mode
            const saveButton = screen.getByRole('button', { name: /^save$/i });
            await user.click(saveButton);

            expect(defaultProps.onRename).toHaveBeenCalledWith('test-1', 'Renamed Quotation');
        });

        test('should cancel edit on escape key', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('First Quotation'));

            const input = screen.getByDisplayValue('First Quotation');
            await user.type(input, 'Changed');
            await user.keyboard('{Escape}');

            expect(screen.queryByDisplayValue('First QuotationChanged')).not.toBeInTheDocument();
            expect(screen.getByText('First Quotation')).toBeInTheDocument();
        });
    });

    describe('search functionality', () => {
        test('should filter history by search term', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search quotations...');
            await user.type(searchInput, 'First');

            expect(screen.getByText('First Quotation')).toBeInTheDocument();
            expect(screen.queryByText('Second Quotation')).not.toBeInTheDocument();
        });

        test('should show no results message when search has no matches', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search quotations...');
            await user.type(searchInput, 'nonexistent');

            expect(screen.getByText('No matching quotations found')).toBeInTheDocument();
        });

        test('should be case insensitive', async () => {
            const user = userEvent.setup();
            render(<HistoryPanel {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search quotations...');
            await user.type(searchInput, 'FIRST');

            expect(screen.getByText('First Quotation')).toBeInTheDocument();
        });
    });

    describe('clear all functionality', () => {
        test('should call onClearAll when confirmed', async () => {
            const user = userEvent.setup();
            window.confirm = vi.fn(() => true);

            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Clear All'));

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear all history?');
            expect(defaultProps.onClearAll).toHaveBeenCalled();
        });

        test('should not call onClearAll when cancelled', async () => {
            const user = userEvent.setup();
            window.confirm = vi.fn(() => false);

            render(<HistoryPanel {...defaultProps} />);

            await user.click(screen.getByText('Clear All'));

            expect(defaultProps.onClearAll).not.toHaveBeenCalled();
        });
    });

    describe('date formatting', () => {
        test('should show relative time for recent items', () => {
            const recentHistory = [
                {
                    id: 'recent',
                    name: 'Recent Item',
                    savedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
                    summary: { itemCount: 1, totalCBM: 1, ddpTotal: 100, currency: 'USD' },
                },
            ];

            render(<HistoryPanel {...defaultProps} history={recentHistory} />);

            expect(screen.getByText(/just now|ago/i)).toBeInTheDocument();
        });
    });
});
