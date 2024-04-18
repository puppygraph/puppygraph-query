import { useEffect, useState } from "react";

const ProgressBar = ({ enabled, done, total }) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    if (total !== 0) {
      setPercentage((done / total) * 100);
    }
  }, [done, total]);

  if (!enabled || total === 0) {
    return;
  }
  if (done === 0) {
    return (
      <div
        key={"start"}
        className="absolute bottom-0 w-full h-1 bg-gray-200 opacity-90"
      >
        <div className="h-full w-full animate-pulse bg-puppy-purple">
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white"></span>
        </div>
      </div>
    );
  } else if (done < total) {
    return (
      <div
        key={"progress"}
        className="absolute bottom-0 w-full h-3 bg-gray-200 opacity-90"
      >
        <div
          className="h-full bg-puppy-purple transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
            {done} / {total}
          </span>
        </div>
      </div>
    );
  } else {
    return (
      <div
        key={"done"}
        className="absolute bottom-0 w-full h-1 bg-gray-200 opacity-90"
      >
        <div className="h-full w-full bg-green-500">
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white"></span>
        </div>
      </div>
    );
  }
};

export default ProgressBar;
