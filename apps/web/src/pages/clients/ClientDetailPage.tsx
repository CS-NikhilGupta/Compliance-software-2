import React from 'react';
import { useParams } from 'react-router-dom';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Client Details</h1>
      <p>Client ID: {id}</p>
      <p>This page is under development.</p>
    </div>
  );
};
