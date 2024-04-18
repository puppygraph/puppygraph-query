import colors from "material-colors";
import { useState } from "react";

const Legend = ({
  palette,
  edgePalette,
  info,
  setPalette,
  setEdgePalette,
  labelFormat,
  setLabelFormat,
  userConfigs,
  saveUserConfigs,
}) => {
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState(null);

  const choices = [...Object.keys(colors)];
  choices.length = 18;

  const handleColorClick = (key) => {
    setSelectedKey((selectedKey) => (selectedKey === null ? key : null));
    setSelectedEdgeKey(null);
  };

  const handleColorSelect = (index) => {
    const color = colors[choices[index]];
    if (userConfigs) {
      userConfigs[`colorIndex.label.${selectedKey}`] = index;
      saveUserConfigs && saveUserConfigs({ ...userConfigs });
    }
    setPalette((prevPalette) => {
      const newPalette = new Map(prevPalette);
      newPalette.set(selectedKey, color);
      return newPalette;
    });
    setSelectedKey(null);
  };

  const handleEdgeColorClick = (key) => {
    setSelectedEdgeKey((selectedKey) => (selectedKey === null ? key : null));
    setSelectedKey(null);
  };

  const handleEdgeColorSelect = (index) => {
    const color = colors[choices[index]];
    if (userConfigs) {
      userConfigs[`colorIndex.label.${selectedKey}`] = index;
      saveUserConfigs && saveUserConfigs({ ...userConfigs });
    }
    setEdgePalette((prevPalette) => {
      const newPalette = new Map(prevPalette);
      newPalette.set(selectedEdgeKey, color);
      return newPalette;
    });
    setSelectedEdgeKey(null);
  };

  const onEditLabelSubmit = () => {
    setSelectedKey(null);
    setSelectedEdgeKey(null);
  };

  const handleTextClick = (key) => {
    setPalette((prevPalette) => {
      const newPalette = new Map(prevPalette);
      const color = { ...prevPalette.get(key) };
      color[0] = !color[0];
      newPalette.set(key, color);
      return newPalette;
    });
  };

  const handleEdgeTextClick = (key) => {
    setEdgePalette((prevPalette) => {
      const newPalette = new Map(prevPalette);
      const color = { ...prevPalette.get(key) };
      color[0] = !color[0];
      newPalette.set(key, color);
      return newPalette;
    });
  };

  const items = [];
  if (palette && palette.size > 0) {
    for (let [key, value] of palette) {
      const hidden = !!value[0];
      if (value[500]) {
        value = value[500];
      }
      items.push(
        <div
          key={`v-${key}`}
          className="h-2 w-2 mr-4 rounded-sm cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => handleColorClick(key)}
        ></div>
      );
      items.push(
        <div
          key={`k-${key}`}
          className={
            "text-sm text-slate-600 cursor-pointer" +
            (hidden ? " line-through" : "")
          }
          onClick={() => handleTextClick(key)}
        >
          {key}
        </div>
      );
    }
  }
  if (edgePalette && edgePalette.size > 0) {
    if (items.length > 0) {
      items.push(
        <div key="separator" className="h-2 border-b mb-2 col-span-2"></div>
      );
    }
    for (let [key, value] of edgePalette) {
      if (key.startsWith("_path_")) {
        key = key.substring(6);
      }
      const hidden = !!value[0];
      if (value[500]) {
        value = value[500];
      }
      items.push(
        <div
          key={`v-${key}`}
          className="h-2 w-2 mr-4 rounded-sm cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => handleEdgeColorClick(key)}
        ></div>
      );
      items.push(
        <div
          key={`k-${key}`}
          className={
            "text-sm text-slate-600 cursor-pointer" +
            (hidden ? " line-through" : "")
          }
          onClick={() => handleEdgeTextClick(key)}
        >
          {key}
        </div>
      );
    }
  }
  if (items.length === 0) {
    return null;
  }
  if (info) {
    items.push(
      <div key="info-separator" className="h-2 border-b mb-2 col-span-2"></div>
    );
    items.push(
      <div
        key={`k-info`}
        className="text-sm text-slate-600 text-left col-span-2 break-normal"
      >
        {info}
      </div>
    );
  }
  return (
    <div className="absolute right-4 top-4 max-h-[80%] flex flex-col">
      <div className="rounded bg-white rounded-2xl border px-4 py-2 h-full overflow-auto grid grid-cols-[minmax(0px,_1rem)_auto] items-center drop-shadow">
        {items}
      </div>
      {selectedKey && (
        <div className="absolute top-0 right-[100%] w-[9rem] mr-2 bg-white border rounded p-2">
          <div className="grid gap-2 grid-cols-6">
            {choices.map((choice, index) => (
              <div
                key={`color-${choice}-${index}`}
                className="h-4 w-4 rounded-sm cursor-pointer"
                style={{ backgroundColor: colors[choice][500] }}
                onClick={() => handleColorSelect(index)}
              ></div>
            ))}
          </div>
          <EditLabelPanel
            labelKey={selectedKey}
            labelFormat={labelFormat}
            setLabelFormat={setLabelFormat}
            onSubmit={onEditLabelSubmit}
            userConfigs={userConfigs}
            saveUserConfigs={saveUserConfigs}
          />
        </div>
      )}
      {selectedEdgeKey && (
        <div className="absolute top-0 right-[100%] w-[9rem] mr-2 bg-white border rounded p-2">
          <div className="grid gap-2 grid-cols-6">
            {choices.map((choice, index) => (
              <div
                key={`edge-color-${choice}-${index}`}
                className="h-4 w-4 rounded-sm cursor-pointer"
                style={{ backgroundColor: colors[choice][500] }}
                onClick={() => handleEdgeColorSelect(index)}
              ></div>
            ))}
          </div>
          <EditLabelPanel
            labelKey={selectedEdgeKey}
            labelFormat={labelFormat}
            setLabelFormat={setLabelFormat}
            onSubmit={onEditLabelSubmit}
            userConfigs={userConfigs}
            saveUserConfigs={saveUserConfigs}
          />
        </div>
      )}
    </div>
  );
};

const EditLabelPanel = ({
  labelKey,
  labelFormat,
  setLabelFormat,
  onSubmit,
  userConfigs,
  saveUserConfigs,
}) => {
  if (!labelFormat || !setLabelFormat) {
    return;
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit && onSubmit();
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    const newLabelFormat = new Map(labelFormat);
    newLabelFormat.set(labelKey, value);
    setLabelFormat(newLabelFormat);
    if (userConfigs) {
      userConfigs[`format.label.${labelKey}`] = value;
      saveUserConfigs && saveUserConfigs({ ...userConfigs });
    }
  };

  const value =
    labelFormat.get(labelKey) ||
    (userConfigs && userConfigs[`format.label.${labelKey}`]) ||
    "";

  return (
    <div onKeyDown={handleKeyDown}>
      <input
        className="mt-2 block w-full text-sm rounded-md border-[1px] border-slate-500 py-1 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-puppy-dark sm:text-sm sm:leading-6"
        placeholder="label: e.g. {id}"
        value={value}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default Legend;
