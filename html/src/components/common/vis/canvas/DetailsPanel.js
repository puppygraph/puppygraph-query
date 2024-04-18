import React, { useEffect, useRef, useState } from "react";

export const DetailsPanel = ({ position, containerRef, children }) => {
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const dropdownRef = useRef();

  useEffect(() => {
    if (dropdownRef.current) {
      const { offsetWidth, offsetHeight } = dropdownRef.current;
      setContentSize({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  const calcPosition = (pos) => {
    const containerRect = containerRef.current.getBoundingClientRect();
    let { x, y } = pos;
    if (x + contentSize.width > containerRect.width) {
      x = containerRect.width - contentSize.width;
    }
    if (y + contentSize.height > containerRect.height) {
      y = containerRect.height - contentSize.height;
    }

    return { top: y, left: x };
  };

  const positionWithinBoundary = calcPosition(position);
  const dropdownStyle = {
    top: `${positionWithinBoundary.top}px`,
    left: `${positionWithinBoundary.left}px`,
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute bg-white max-w-xl border border-1 border-slate-200 opacity-90 p-3 rounded drop-shadow overflow-auto"
      style={dropdownStyle}
    >
      {children}
    </div>
  );
};

export const DetailsList = ({ content }) => {
  if (content instanceof Map) {
    content = Object.fromEntries(content);
  }

  const renderValue = (value) => {
    if (value instanceof Map) {
      value = Object.fromEntries(value);
    }
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return JSON.stringify(value);
  };

  return (
    <div className="grid grid-cols-[auto_auto] gap-1">
      {Object.entries(content).map(([key, value], i) => (
        <React.Fragment key={i}>
          <span className="text-sm text-left text-slate-600">
            {key}
          </span>
          <span className="text-sm text-left text-slate-800">
            {renderValue(value)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
