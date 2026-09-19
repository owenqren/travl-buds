import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripList from './TripList';

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

describe('TripList', () => {
    it('shows an empty state when there are no trips', () => {
        render(<TripList trips={[]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('No trips yet.')).toBeInTheDocument();
    });

    it('marks a trip owned by the current user as "Owner"', () => {
        render(<TripList trips={[ownedTrip]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });

    it('marks a trip owned by someone else as "Shared"', () => {
        render(<TripList trips={[sharedTrip]} onViewDetails={vi.fn()} currentUserId={1} />);

        expect(screen.getByText('Shared')).toBeInTheDocument();
        expect(screen.queryByText('Owner')).not.toBeInTheDocument();
    });

    it('calls onViewDetails with the trip id when a row is clicked', async () => {
        const user = userEvent.setup();
        const onViewDetails = vi.fn();
        render(<TripList trips={[ownedTrip]} onViewDetails={onViewDetails} currentUserId={1} />);

        await user.click(screen.getByText('Lisbon with the crew'));

        expect(onViewDetails).toHaveBeenCalledWith(1);
    });
});
