import { XMarkIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useRef, useState } from "react";

const ContextMenu = ({
  containerRef,
  position,
  items,
  onItemClick,
  onClose,
}) => {
  const [showSubMenu, setShowSubMenu] = useState("");

  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const menuRef = useRef(null);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const menu = menuRef.current;
    if (container && menu) {
      const containerRect = container.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + menuRect.width > containerRect.width) {
        adjustedX = containerRect.width - menuRect.width;
      }

      if (position.y + menuRect.height > containerRect.height) {
        adjustedY = containerRect.height - menuRect.height;
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [position, menuRef, containerRef]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  const handleSubMenuToggle = (item) => {
    setShowSubMenu(item.name);
    setTimeout(() => handleResize(), 1);
  };

  const onSubMenuSubmit = (value) => {
    const item = {
      name: showSubMenu,
      value: value,
    };
    onItemClick(item);
    setShowSubMenu("");
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute rounded-lg bg-white border border-1 border-slate-200 py-2 shadow-lg z-10"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map(
        (item, index) =>
          item.name && (
            <div
              key={index}
              className="px-4 py-1 cursor-pointer hover:bg-purple-100 text-left text-sm text-slate-600"
              onClick={() => {
                if (item.hasSubMenu) {
                  handleSubMenuToggle(item);
                } else {
                  onItemClick(item);
                  onClose();
                }
              }}
            >
              {item.label}
              {showSubMenu === item.name && item.hasSubMenu && (
                <ExpandSubMenu
                  config={item.subMenuConfigs}
                  onSubmit={onSubMenuSubmit}
                />
              )}
            </div>
          )
      )}
    </div>
  );
};

const ExpandSubMenu = ({ config, onSubmit }) => {
  const preset = config.preset;

  const [selectedEdgeLabel, setSelectedEdgeLabel] = useState(() => {
    const preset = config.preset;
    if (!preset) {
      return "";
    } else if (preset.edgeLabel === "") {
      return "";
    } else if (config.edgeLabels.includes(preset.edgeLabel)) {
      return preset.edgeLabel;
    } else {
      return "custom";
    }
  });
  const [customEdgeLabel, setCustomEdgeLabel] = useState(() => {
    const preset = config.preset;
    if (!preset) {
      return "";
    } else if (preset.edgeLabel === "") {
      return "";
    } else if (config.edgeLabels.includes(preset.edgeLabel)) {
      return "";
    } else {
      return preset.edgeLabel;
    }
  });
  const [direction, setDirection] = useState(preset?.direction || "out");
  const [limit, setLimit] = useState(preset?.limit || 0);
  const [filters, setFilters] = useState(preset?.filters || []);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [filterProp, setFilterProp] = useState("");
  const [filterOp, setFilterOp] = useState("eq");
  const [filterValue, setFilterValue] = useState("");

  const handleEdgeLabelChange = (e) => {
    setSelectedEdgeLabel(e.target.value);
    setCustomEdgeLabel("");
  };
  const handleCustomEdgeLabelChange = (e) => {
    setCustomEdgeLabel(e.target.value);
    setSelectedEdgeLabel("custom");
  };
  const handleDirectionChange = (e) => {
    setDirection(e.target.value);
  };
  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
  };
  const handleFilterPropChange = (e) => {
    setFilterProp(e.target.value);
  };
  const handleFilterOpChange = (e) => {
    setFilterOp(e.target.value);
  };
  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
  };
  const addFilter = (e) => {
    if (filterProp && filterOp && filterValue) {
      const filter = {
        prop: filterProp,
        op: filterOp,
        value: filterValue,
      };
      setFilters([...filters, filter]);
      setShowAddFilter(false);
    }
  };
  const removeFilter = (index) => {
    setFilters((filters) => {
      filters.splice(index, 1);
      return [...filters];
    });
  };
  const submitExpand = () => {
    const value = {
      edgeLabel:
        selectedEdgeLabel === "custom" ? customEdgeLabel : selectedEdgeLabel,
      direction: direction,
      limit: limit,
      filters: filters,
    };
    onSubmit(value);
  };

  const formatOp = (op) => {
    switch (op) {
      case "eq":
        return "=";
      case "gt":
        return ">";
      case "gte":
        return ">=";
      case "lt":
        return "<";
      case "lte":
        return "<=";
      case "neq":
        return "!=";
      default:
        return "";
    }
  };

  return (
    <div
      className="bg-white p-2 cursor-default"
      onClick={(event) => event.preventDefault()}
    >
      <div className="font-semibold text-sm mt-2">Edge label</div>
      <select
        value={selectedEdgeLabel}
        onChange={handleEdgeLabelChange}
        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
      >
        <option value="">all</option>
        {config.edgeLabels.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="custom">Custom</option>
      </select>
      {selectedEdgeLabel === "custom" && (
        <input
          type="text"
          value={customEdgeLabel}
          onChange={handleCustomEdgeLabelChange}
          placeholder="Enter a custom value"
          className="w-full mt-2 border border-slate-300 rounded-md px-2 py-1 text-sm"
        />
      )}

      <div className="font-semibold text-sm mt-2">Direction</div>
      <select
        value={direction}
        onChange={handleDirectionChange}
        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
      >
        <option value="out">out</option>
        <option value="in">in</option>
        <option value="both">both</option>
      </select>

      <div className="font-semibold text-sm mt-2">Filters</div>
      {filters.length === 0 && <div>No filters</div>}
      {filters.map((filter, index) => (
        <div key={"filter-" + index} className="flex flex-row w-full mt-1">
          <div className="grow">
            <span className="font-semibold mr-2">{filter.prop}</span>
            <span className="mr-2">{formatOp(filter.op)}</span>
            <span className="">{filter.value}</span>
          </div>
          <button
            className="cursor-pointer"
            onClick={() => removeFilter(index)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      {showAddFilter ? (
        <>
          <input
            type="text"
            value={filterProp}
            onChange={handleFilterPropChange}
            placeholder="Property name"
            className="w-full mt-2 border border-slate-300 rounded-md px-2 py-1 text-sm"
          />
          <select
            value={filterOp}
            onChange={handleFilterOpChange}
            className="w-full mt-2 border border-slate-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="eq">=</option>
            <option value="gt">{">"}</option>
            <option value="gte">{">="}</option>
            <option value="lt">{"<"}</option>
            <option value="lte">{"<="}</option>
            <option value="neq">!=</option>
          </select>
          <input
            type="text"
            value={filterValue}
            onChange={handleFilterValueChange}
            placeholder="Value"
            className="w-full mt-2 border border-slate-300 rounded-md px-2 py-1 text-sm"
          />
          <button
            onClick={addFilter}
            className="mt-2 bg-white text-puppy-purple border border-puppy-purple py-1 px-3 rounded-md hover:bg-purple-50 hover:shadow text-sm"
          >
            Add
          </button>
        </>
      ) : (
        <button
          onClick={() => setShowAddFilter(true)}
          className="mt-2 bg-white text-puppy-purple border border-puppy-purple py-1 px-3 rounded-md hover:bg-purple-50 hover:shadow text-sm"
        >
          Add a filter
        </button>
      )}

      <div className="font-semibold text-sm mt-2">Limit (0 - no limit)</div>
      <input
        type="number"
        value={limit}
        onChange={handleLimitChange}
        placeholder="Query limit"
        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
      />

      <div>
        <button
          onClick={submitExpand}
          className="mt-2 bg-puppy-purple text-white py-1 px-3 rounded-md hover:bg-puppy-dark hover:shadow text-sm"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ContextMenu;
