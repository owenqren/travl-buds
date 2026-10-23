// vitest helpers, Testing Library render/query/event utilities, the component under test and authFetch (mocked below).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripForm from './TripForm';
import { authFetch } from '../utils/authFetch';

// Replace authFetch so no real network call happens; tests assert on the mock.
// How: vi.mock is hoisted above the imports, so TripForm receives the mocked authFetch; mockResolvedValue controls what
// each test's request returns.
vi.mock('../utils/authFetch', () => ({
    authFetch: vi.fn(),
}));

// Tests for TripForm.
describe('TripForm', () => {
    // Reset the authFetch mock before each test.
    beforeEach(() => {
        authFetch.mockReset();
    });

    // Submit stays disabled until name, destination and both dates are filled.
    it('disables submit until every field is filled', async () => {
        const user = userEvent.setup();
        render(<TripForm onTripAdded={vi.fn()} />);

        const submit = screen.getByRole('button', { name: /add trip/i });
        expect(submit).toBeDisabled();

        await user.type(screen.getByLabelText('Trip name'), 'Lisbon with the crew');
        await user.type(screen.getByLabelText('Destination'), 'Lisbon, Portugal');
        expect(submit).toBeDisabled();

        // How: date inputs cannot be typed into reliably, so the test sets their value directly with fireEvent.change,
        // while text inputs use userEvent.type to simulate keystrokes.
        fireEvent.change(screen.getByLabelText('Start'), { target: { value: '2026-10-02' } });
        fireEvent.change(screen.getByLabelText('End'), { target: { value: '2026-10-06' } });
        expect(submit).toBeEnabled();
    });

    // Regression test: the date inputs call handleSubmit directly on Enter,
    // bypassing the submit button's disabled state (see App history).
    it('does not submit on Enter in a date field while the form is incomplete', () => {
        render(<TripForm onTripAdded={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Start'), { target: { value: '2026-10-02' } });
        fireEvent.keyDown(screen.getByLabelText('Start'), { key: 'Enter' });

        expect(authFetch).not.toHaveBeenCalled();
    });

    // Happy path: posts the trip body to /api/trips, calls onTripAdded with the response and clears the form.
    it('submits the trip and resets the form on success', async () => {
        const user = userEvent.setup();
        const onTripAdded = vi.fn();
        authFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1, name: 'Lisbon with the crew' }),
        });

        render(<TripForm onTripAdded={onTripAdded} />);

        await user.type(screen.getByLabelText('Trip name'), 'Lisbon with the crew');
        await user.type(screen.getByLabelText('Destination'), 'Lisbon, Portugal');
        fireEvent.change(screen.getByLabelText('Start'), { target: { value: '2026-10-02' } });
        fireEvent.change(screen.getByLabelText('End'), { target: { value: '2026-10-06' } });

        await user.click(screen.getByRole('button', { name: /add trip/i }));

        expect(authFetch).toHaveBeenCalledWith('/api/trips', expect.objectContaining({ method: 'POST' }));
        // How: mock.calls[0][1] is the options object passed to authFetch; its body is a JSON string, which is parsed so
        // the exact payload can be compared.
        expect(JSON.parse(authFetch.mock.calls[0][1].body)).toEqual({
            name: 'Lisbon with the crew',
            destination: 'Lisbon, Portugal',
            startDate: '2026-10-02',
            endDate: '2026-10-06',
        });
        expect(onTripAdded).toHaveBeenCalledWith({ id: 1, name: 'Lisbon with the crew' });
        expect(screen.getByLabelText('Trip name')).toHaveValue('');
    });
});
