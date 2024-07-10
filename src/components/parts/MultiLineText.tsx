import React from 'react';

export const MultiLineText: React.FC<{
  text: string
}> = ({ text }) => (
  <>
    {text.split('\n').map((item, index) => (
      <React.Fragment key={index}>
        {item}<br />
      </React.Fragment>
    ))}
  </>
);
