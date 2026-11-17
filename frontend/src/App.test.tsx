import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the public LIMS homepage', async () => {
  render(<App />);
  const links = await screen.findAllByText('Create account');
  expect(links[0]).toBeInTheDocument();
});
