import React from 'react';
import { useParams } from 'react-router-dom';

export const EntityDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Entity Details</h1>
      <p>Entity ID: {id}</p>
      <p>This page is under development.</p>
    </div>
  );
};
