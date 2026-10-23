// vitest helpers, Testing Library render/query/event utilities and the component under test.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripList from './TripList';

// Fixtures: a trip owned by user 1 (the current user) and one owned by user 99 (shared).
const ownedTrip = {
    id: 1,
    name: 'Lisbon with the crew',
    destination: 'Lisbon, Portugal',
    startDate: '2026-10-02',
    endDate: '2026-10-06',
    user: { id: 1 },
};
const sharedTrip = {
    id: 2,
    name: 'Kyoto in autumn',
    destination: 'Kyoto, Japan',
    startDate: '2026-11-10',
    endDate: '2026-11-18',
    user: { id: 99 },
};

// Tests for TripList.
describe('TripList', () => {
    // Empty list renders the empty state.
    it('shows an empty state when there are no trips', () => {
        render(<TripList trips={[]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('No trips yet.')).toBeInTheDocument();
    });

    // Owner badge when trip.user.id matches currentUserId.
    it('marks a trip owned by the current user as "Owner"', () => {
        render(<TripList trips={[ownedTrip]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });

    // Shared badge otherwise.
    it('marks a trip owned by someone else as "Shared"', () => {
        render(<TripList trips={[sharedTrip]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('Shared')).toBeInTheDocument();
        expect(screen.queryByText('Owner')).not.toBeInTheDocument();
    });

    // Clicking a row calls onViewDetails with the trip id.
    it('calls onViewDetails with the trip id when a row is clicked', async () => {
        const user = userEvent.setup();
        const onViewDetails = vi.fn();
        render(<TripList trips={[ownedTrip]} onViewDetails={onViewDetails} currentUserId={1} />);

        // How: the click lands on the trip name inside the row's <button> and bubbles up to its onClick, which calls
        // onViewDetails(trip.id).
        await user.click(screen.getByText('Lisbon with the crew'));

        expect(onViewDetails).toHaveBeenCalledWith(1);
    });
});
