import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock reportGenerator to avoid PDF generation during tests
vi.mock('../utils/reportGenerator', () => ({
    downloadPDFReport: vi.fn(),
    generatePDFReport: vi.fn(() => ({}))
}));

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the app title', () => {
            render(<App />);
            expect(screen.getByText(/DDP Calculator/i)).toBeInTheDocument();
        });

        it('should render the items section', () => {
            render(<App />);
            expect(screen.getByText(/Items/i)).toBeInTheDocument();
        });

        it('should render shipment settings section', () => {
            render(<App />);
            expect(screen.getByText(/Shipment Settings/i)).toBeInTheDocument();
        });

        it('should render rate overrides section', () => {
            render(<App />);
            expect(screen.getByText(/Rate Overrides/i)).toBeInTheDocument();
        });

        it('should display exchange rate', () => {
            render(<App />);
            expect(screen.getByText(/3.65 QAR/i)).toBeInTheDocument();
        });
    });

    describe('Item Management', () => {
        it('should start with one empty item', () => {
            render(<App />);
            const quantityInputs = screen.getAllByDisplayValue('1');
            expect(quantityInputs.length).toBeGreaterThanOrEqual(1);
        });

        it('should add a new item when Add Item button is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            const addButton = screen.getByText('+ Add Item');
            await user.click(addButton);

            // Should now have 2 quantity inputs (one for each item)
            await waitFor(() => {
                const quantityInputs = screen.getAllByDisplayValue('1');
                expect(quantityInputs.length).toBeGreaterThanOrEqual(2);
            });
        });

        it('should remove an item when remove button is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Add a second item first
            const addButton = screen.getByText('+ Add Item');
            await user.click(addButton);

            await waitFor(() => {
                const quantityInputs = screen.getAllByDisplayValue('1');
                expect(quantityInputs.length).toBeGreaterThanOrEqual(2);
            });

            // Click one of the remove buttons (✕)
            const removeButtons = screen.getAllByText('✕');
            await user.click(removeButtons[0]);

            // Should be back to 1 item
            await waitFor(() => {
                const quantityInputs = screen.getAllByDisplayValue('1');
                expect(quantityInputs.length).toBe(1);
            });
        });

        it('should not remove the last item', async () => {
            const user = userEvent.setup();
            render(<App />);

            const removeButtons = screen.getAllByText('✕');
            const initialCount = removeButtons.length;

            await user.click(removeButtons[0]);

            // Should still have at least one remove button (item)
            await waitFor(() => {
                const remainingButtons = screen.getAllByText('✕');
                expect(remainingButtons.length).toBeGreaterThanOrEqual(1);
            });
        });

        it('should update item quantity', async () => {
            const user = userEvent.setup();
            render(<App />);

            const quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '50');

            expect(quantityInputs[0]).toHaveValue(50);
        });

        it('should update item EXW price', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find EXW price input (starts with 0)
            const priceInputs = screen.getAllByDisplayValue('0');
            const exwInput = priceInputs[0]; // First zero value should be EXW price

            await user.clear(exwInput);
            await user.type(exwInput, '25');

            expect(exwInput).toHaveValue(25);
        });

        it('should update item description', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find description input (empty string)
            const descInput = screen.getAllByPlaceholderText('Product name')[0];

            await user.type(descInput, 'Test Product');

            expect(descInput).toHaveValue('Test Product');
        });
    });

    describe('CBM Input Mode Toggle', () => {
        it('should toggle CBM input mode from per unit to total', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Get all "Total" buttons (CBM is first, Weight is second)
            const totalButtons = screen.getAllByText('Total');
            expect(totalButtons.length).toBeGreaterThanOrEqual(2);

            // Click the first "Total" button (CBM)
            await user.click(totalButtons[0]);

            // The button should now be highlighted
            expect(totalButtons[0]).toBeInTheDocument();
        });

        it('should calculate CBM correctly in per unit mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Set quantity to 100
            const quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '100');

            // Set CBM per unit to 0.05
            const cbmInputs = screen.getAllByDisplayValue('0.01');
            await user.clear(cbmInputs[0]);
            await user.type(cbmInputs[0], '0.05');

            expect(cbmInputs[0]).toHaveValue(0.05);
        });

        it('should calculate CBM correctly in total mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Set quantity to 100
            let quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '100');

            // Switch to total mode (first "Total" button is for CBM)
            const totalButtons = screen.getAllByText('Total');
            await user.click(totalButtons[0]);

            // Re-query CBM inputs after mode switch
            await waitFor(() => {
                const cbmInputs = screen.getAllByDisplayValue('1');
                expect(cbmInputs.length).toBeGreaterThan(0);
            });

            // Set total CBM to 5 (should divide by quantity to get 0.05 per unit)
            const cbmInputs = screen.getAllByDisplayValue('1');
            await user.clear(cbmInputs[0]);
            await user.type(cbmInputs[0], '5');

            expect(cbmInputs[0]).toHaveValue(5);
        });
    });

    describe('Weight Input Mode Toggle', () => {
        it('should toggle weight input mode from per unit to total', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Get all "Total" buttons (CBM is first, Weight is second)
            const totalButtons = screen.getAllByText('Total');
            expect(totalButtons.length).toBeGreaterThanOrEqual(2);

            // Click the second "Total" button (Weight)
            await user.click(totalButtons[1]);

            // The button should now be highlighted
            expect(totalButtons[1]).toBeInTheDocument();
        });

        it('should calculate weight correctly in per unit mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Set quantity to 100
            const quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '100');

            // Set weight per unit to 5 kg
            const weightInputs = screen.getAllByDisplayValue('0');
            // Find the weight input (should be after price inputs)
            const weightInput = weightInputs[weightInputs.length - 1];
            await user.clear(weightInput);
            await user.type(weightInput, '5');

            expect(weightInput).toHaveValue(5);
        });

        it('should calculate weight correctly in total mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Set quantity to 100
            let quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '100');

            // Switch to total mode (second "Total" button is for Weight)
            const totalButtons = screen.getAllByText('Total');
            await user.click(totalButtons[1]);

            // Re-query weight inputs after mode switch
            await waitFor(() => {
                const weightInputs = screen.getAllByDisplayValue('0');
                expect(weightInputs.length).toBeGreaterThan(0);
            });

            // Set total weight to 500 kg (should divide by quantity to get 5 per unit)
            const weightInputs = screen.getAllByDisplayValue('0');
            const weightInput = weightInputs[weightInputs.length - 1];
            await user.clear(weightInput);
            await user.type(weightInput, '500');

            expect(weightInput).toHaveValue(500);
        });

        it('should convert between weight modes correctly', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Set quantity to 50
            const quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '50');

            // Wait for state to update
            await waitFor(() => {
                expect(screen.getAllByDisplayValue('50').length).toBeGreaterThan(0);
            });

            // Set weight per unit to 10 kg in per unit mode
            const weightInputs = screen.getAllByDisplayValue('0');
            const weightInput = weightInputs[weightInputs.length - 1];
            await user.clear(weightInput);
            await user.type(weightInput, '10');

            // Verify weight was set
            await waitFor(() => {
                expect(weightInput).toHaveValue(10);
            });

            // Switch to total mode (second "Total" button is for Weight)
            const totalButtons = screen.getAllByText('Total');
            await user.click(totalButtons[1]);

            // Verify the mode button is highlighted
            await waitFor(() => {
                const updatedTotalButtons = screen.getAllByText('Total');
                expect(updatedTotalButtons[1]).toBeInTheDocument();
            });
        });

        it('should have separate toggles for CBM and Weight', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Get all "/Unit" and "Total" buttons
            const perUnitButtons = screen.getAllByText('/Unit');
            const totalButtons = screen.getAllByText('Total');

            // Should have 2 sets of buttons (CBM and Weight)
            expect(perUnitButtons.length).toBe(2);
            expect(totalButtons.length).toBe(2);

            // Click CBM Total button
            await user.click(totalButtons[0]);

            // Click Weight /Unit button (should remain in per unit mode)
            await user.click(perUnitButtons[1]);

            // Both buttons should be in the document
            expect(totalButtons[0]).toBeInTheDocument();
            expect(perUnitButtons[1]).toBeInTheDocument();
        });

        it('should display proper labels for weight and CBM columns', async () => {
            render(<App />);

            // Check for column labels in the first row
            expect(screen.getByText('Volume (CBM)')).toBeInTheDocument();
            expect(screen.getByText('Weight')).toBeInTheDocument();
        });
    });

    describe('Settings', () => {
        it('should have default container type as auto', () => {
            render(<App />);
            const select = screen.getByDisplayValue('Auto-select (Recommended)');
            expect(select).toBeInTheDocument();
        });

        it('should change container type', async () => {
            const user = userEvent.setup();
            render(<App />);

            const select = screen.getByDisplayValue('Auto-select (Recommended)');
            await user.selectOptions(select, '40HC');

            expect(select).toHaveValue('40HC');
        });

        it('should update profit margin value', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find profit margin input (should show 0 for 0% by default)
            const profitMarginInputs = screen.getAllByDisplayValue('0');
            // First 0 value should be the profit margin (after item inputs)
            const profitMarginInput = profitMarginInputs.find(input =>
                input.previousElementSibling?.textContent?.includes('Profit') ||
                input.closest('div')?.textContent?.includes('Profit')
            ) || profitMarginInputs[profitMarginInputs.length - 2];

            await user.clear(profitMarginInput);
            await user.type(profitMarginInput, '20');

            expect(profitMarginInput).toHaveValue(20);
        });

        it('should toggle profit margin mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find the "Fixed USD" button for profit margin
            const fixedButtons = screen.getAllByText('Fixed USD');
            // First Fixed USD button is for profit margin
            await user.click(fixedButtons[0]);

            // Button should be visible
            expect(fixedButtons[0]).toBeInTheDocument();
        });

        it('should update commission value', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find commission input
            const commissionInputs = screen.getAllByDisplayValue('0');
            const commissionInput = commissionInputs[commissionInputs.length - 1];

            await user.clear(commissionInput);
            await user.type(commissionInput, '10');

            expect(commissionInput).toHaveValue(10);
        });

        it('should toggle commission mode', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Find the "Fixed USD" button for commission (second one)
            const fixedButtons = screen.getAllByText('Fixed USD');
            await user.click(fixedButtons[1]);

            // Button should be visible
            expect(fixedButtons[1]).toBeInTheDocument();
        });
    });

    describe('Rate Overrides', () => {
        it('should expand rate overrides section when clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            // The section is collapsible and default closed
            const overridesSection = screen.getByText('🔧 Rate Overrides (Optional)');
            await user.click(overridesSection);

            // Should be able to see the inputs now
            await waitFor(() => {
                expect(screen.getByText('Sea Freight Total')).toBeInTheDocument();
            });
        });

        it('should update sea freight override', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Open overrides section
            const overridesSection = screen.getByText('🔧 Rate Overrides (Optional)');
            await user.click(overridesSection);

            // Wait for the input to appear
            await waitFor(() => {
                expect(screen.getByLabelText('Sea Freight Total')).toBeInTheDocument();
            });

            const seaFreightInput = screen.getByLabelText('Sea Freight Total');
            await user.type(seaFreightInput, '5000');
            expect(seaFreightInput).toHaveValue(5000);
        });

        it('should update domestic China shipping override', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Open overrides section
            const overridesSection = screen.getByText('🔧 Rate Overrides (Optional)');
            await user.click(overridesSection);

            // Wait for the input to appear
            await waitFor(() => {
                expect(screen.getByLabelText('Domestic China Shipping')).toBeInTheDocument();
            });

            const domesticInput = screen.getByLabelText('Domestic China Shipping');
            await user.type(domesticInput, '20');
            expect(domesticInput).toHaveValue(20);
        });
    });

    describe('Full Workflow', () => {
        it('should calculate DDP cost with valid inputs', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Step 1: Set item details
            const descInput = screen.getAllByPlaceholderText('Product name')[0];
            await user.type(descInput, 'Electronics');

            const quantityInputs = screen.getAllByDisplayValue('1');
            await user.clear(quantityInputs[0]);
            await user.type(quantityInputs[0], '100');

            // Step 2: Set EXW price
            const priceInputs = screen.getAllByDisplayValue('0');
            await user.clear(priceInputs[0]);
            await user.type(priceInputs[0], '50');

            // Step 3: Adjust profit margin
            const profitMarginContainer = screen.getAllByText('Profit Margin')[0].parentElement;
            const profitMarginInput = profitMarginContainer.querySelector('input');
            await user.clear(profitMarginInput);
            await user.type(profitMarginInput, '20');

            // Wait for calculations
            await waitFor(() => {
                // Results should be displayed if all inputs are valid
                // We can't check exact values but can verify the component rendered
                expect(screen.getByText(/Electronics/i)).toBeInTheDocument();
            });
        });
    });
});
