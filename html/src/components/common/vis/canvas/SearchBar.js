import React, { useState, useRef, useEffect } from "react";

const SearchBar = ({ loading, itemMap, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  useEffect(() => {
    // Generate suggestions based on the current search term
    const [property, propertyValue] = searchTerm.split("=");
    const filteredSuggestions = Array.from(itemMap.values())
      .flatMap((item) => {
        const { id, label, properties: otherProps } = item;
        const primitiveProps = otherProps
          .entries()
          .filter(
            ([key, value]) =>
              typeof key === "string" && typeof value !== "object"
          );

        const propertySuggestions = [
          { property: "id", value: id },
          { property: "label", value: label },
          ...primitiveProps.map(([key, value]) => ({ property: key, value })),
        ];

        if (propertyValue === undefined) {
          // Suggest only property names if property is not provided
          return propertySuggestions
            .map(({ property }) => `${property}=`)
            .filter((prop) => prop.startsWith(property));
        } else {
          return propertySuggestions
            .filter(
              ({ property: prop, value: val }) =>
                prop === property && val.toString().startsWith(propertyValue)
            )
            .map(({ value: val }) => `${property}=${val}`);
        }
      })
      .sort((a, b) => {
        if (a.startsWith("id=") ^ b.startsWith("id=")) {
          if (a.startsWith("id=")) return -1;
          if (b.startsWith("id=")) return 1;
        }
        if (a.startsWith("label=") ^ b.startsWith("label=")) {
          if (a.startsWith("label=")) return -1;
          if (b.startsWith("label=")) return 1;
        }
        return a.localeCompare(b);
      })
      .filter(
        (suggestion, index, self) =>
          index === 0 || self[index - 1] !== suggestion
      ) // Remove duplicates
      .slice(0, 10);
    setSuggestions(filteredSuggestions);
    setSelectedSuggestionIndex(-1);
  }, [searchTerm, itemMap]);

  const doSearch = (term) => {
    const [property, propertyValue] = term.split("=");
    const matchedIds = [];
    if (propertyValue) {
      Array.from(itemMap.values()).forEach((item) => {
        const { id, label, properties: props } = item;
        props.set("id", id);
        props.set("label", label);
        if (props.get(property) === propertyValue) {
          matchedIds.push(id);
        }
      });
    }
    onSearch && onSearch(matchedIds);
  };

  const handleSuggestionClick = (suggestion) => {
    doSearch(suggestion);
    setSearchTerm(suggestion);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex === suggestions.length - 1 ? 0 : prevIndex + 1
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      let term = searchTerm;
      if (selectedSuggestionIndex !== -1) {
        term = suggestions[selectedSuggestionIndex];
      }
      doSearch(term);
      setSearchTerm(term);
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    if (selectedSuggestionIndex !== -1) {
      inputRef.current.value = suggestions[selectedSuggestionIndex];
    }
  }, [selectedSuggestionIndex, suggestions]);

  return (
    <div className="absolute top-4 left-4 group">
      <input
        className="block w-[8rem] lg:w-[16rem] rounded-md border-[1px] border-puppy-purple py-1.5 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-puppy-dark sm:text-sm sm:leading-6"
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={
          loading ? "Prefetching properties..." : "Input to search properties"
        }
        ref={inputRef}
      />
      {suggestions.length > 0 && (
        <ul className="hidden text-left bg-white mt-1 py-1 shadow rounded group-focus-within:block">
          {suggestions.map((suggestion, index) => (
            <li
              role="button"
              tabindex={0}
              className={
                "cursor-pointer text-sm px-4 py-1 hover:bg-slate-50" +
                (index === selectedSuggestionIndex ? " bg-slate-100" : "")
              }
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
