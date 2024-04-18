import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { useContext, useEffect, useState } from 'react';
import { StatusContext } from '../../StatusContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SystemStatusButton = () => {
  const { status, refreshStatus } = useContext(StatusContext);
  const [ systemStatus, setSystemStatus ] = useState("await");
  const [ message, setMessage ] = useState("");

  useEffect(() => {
    if (!status) {
      return;
    }
    if (!status.GremlinServer) {
      setSystemStatus("offline");
      setMessage("Gremlin endpoint not set");
      return;
    }
    if (status.GremlinHealthy === "Error") {
      setSystemStatus("offline");
      setMessage("Gremlin server error");
      return;
    }
    if (status.GremlinHealthy === "Empty") {
      setSystemStatus("await");
      setMessage("Gremlin returns no vertices");
      return;
    }
    setSystemStatus("online");
    setMessage(status.GremlinServer);
  }, [status]);

  const getStatusColor = (status) => {
    if (status === "online") return "bg-green-100 text-green-800";
    else if (status === "await") return "bg-yellow-100 text-yellow-800";
    else return "bg-red-100 text-red-800";
  };

  const getStatusIcon = (status) => {
    if (status === "online") {
      return (
        <ArrowUpIcon
          className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
          aria-hidden="true"
        />
      );
    } else if (status === "await") {
      return (
        <EllipsisHorizontalIcon
          className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-yellow-500"
          aria-hidden="true"
        />
      );
    } else {
      return (
        <ArrowDownIcon
          className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500"
          aria-hidden="true"
        />
      );
    }
  };

  return (
    <div
      role="button"
      className={classNames(
        getStatusColor(systemStatus),
        "inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium mt-0 cursor-pointer",
      )}
      onClick={refreshStatus}
    >
      {getStatusIcon(systemStatus)}{message}
    </div>
  );
};

export default SystemStatusButton;