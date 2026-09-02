import React from 'react';
import { FlavorList } from '../components/flavors/FlavorList';

export const FlavorsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <FlavorList />
    </div>
  );
};
