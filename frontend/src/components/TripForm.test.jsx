import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripForm from './TripForm';
import { authFetch } from '../utils/authFetch';

vi.mock('../utils/authFetch', () => ({
    authFetch: vi.fn(),
}));

describe('TripForm', () => {
    beforeEach(() => {
        authFetch.mockReset();
    });

    it('disables submit until every field is filled', async () => {
        const user = userEvent.setup();
        render(<TripForm onTripAdded={vi.fn()} />);

        const submit = screen.getByRole('button', { name: /add trip/i });
        expect(submit).toBeDisabled();

        await user.type(screen.getByLabelText('Trip name'), 'Lisbon with the crew');
        await user.type(screen.getByLabelText('Destination'), 'Lisbon, Portugal');
        expect(submit).toBeDisabled();

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
