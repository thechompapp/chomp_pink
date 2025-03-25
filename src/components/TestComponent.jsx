import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-6 m-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold">Tailwind Test - Chomp Clean</h1>
      <p className="mt-3 text-lg">If you can see this with blue background and white text, Tailwind is working in Chomp Clean!</p>
      <button className="mt-4 bg-white text-blue-500 px-4 py-2 rounded-md hover:bg-blue-100">Test Button</button>
    </div>
  );
};

export default TestComponent;
