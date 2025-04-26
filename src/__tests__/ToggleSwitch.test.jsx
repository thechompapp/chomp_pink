/* src/__tests__/ToggleSwitch.test.jsx */
import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from '@/components/UI/ToggleSwitch';

const mockOnChange = jest.fn();

const defaultProps = {
  options: [
    { value: 'lists', label: 'Lists' },
    { value: 'restaurants', label: 'Restaurants' },
    { value: 'dishes', label: 'Dishes' },
  ],
  selected: 'lists',
  onChange: mockOnChange,
};

describe('ToggleSwitch', () => {
  it('renders all options', () => {
    render(<ToggleSwitch {...defaultProps} />);
    expect(screen.getByText('Lists')).toBeInTheDocument();
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('Dishes')).toBeInTheDocument();
  });

  it('highlights selected option', () => {
    render(<ToggleSwitch {...defaultProps} />);
    const selectedButton = screen.getByText('Lists');
    expect(selectedButton).toHaveClass('bg-[#A78B71]');
  });

  it('calls onChange when an option is clicked', () => {
    render(<ToggleSwitch {...defaultProps} />);
    const restaurantsButton = screen.getByText('Restaurants');
    fireEvent.click(restaurantsButton);
    expect(mockOnChange).toHaveBeenCalledWith('restaurants');
  });
});