import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import Modal from "react-modal";

// Custom styles for the modal
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    overflow: "auto",
    borderRadius: "0.5rem",
    padding: "0",
    maxHeight: "100vh",
    minWidth: "600px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: "100",
  },
};

const HelpButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    Modal.setAppElement("#App");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <button
        className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white text-puppy-purple px-3 py-2 text-sm font-semibold hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:ml-3 sm:mt-0 sm:w-auto"
        onClick={openModal}
      >
        Help
        <QuestionMarkCircleIcon className="h-5 w-5 ml-1" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Help"
        style={customStyles}
      >
        <div className="flex flex-col h-full">
          <div className="flex flex-row p-4 mx-1 border-b border-slate-200">
            <div className="grow text-center text-lg font-semibold">
              Instructions
            </div>
            <button onClick={closeModal}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-auto p-4 text-slate-700 text-sm">
            <h3 className="font-semibold">Query</h3>
            <ol className="list-decimal ml-4">
              <li>
                Start by running a Gremlin query from the left panel.{" "}
                <a
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.puppygraph.com/reference/gremlin-query-language"
                >
                  Learn Gremlin basics
                </a>
              </li>
              <li>
                View query results on the left panel and the graph on the right
                panel canvas.
              </li>
              <li>
                Run multiple queries to visualize all results in the merged
                canvas.
              </li>
              <li>
                Historical queries can be rerun, copy-paste and remove from the
                left panel.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Layout</h3>
            <ol className="list-decimal ml-4">
              <li>Select graph layout from the top right dropdown.</li>
              <li>
                <u>Radial layout</u>: nodes positioned from inner to outer
                circle based on path.
              </li>
              <li>
                <u>Vertical layout</u>: nodes positioned from left to right
                based on path.
              </li>
              <li>
                <u>Force layout</u>: edges simulated as attractive and repulsive
                forces between nodes.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Canvas</h3>
            <ol className="list-decimal ml-4">
              <li>
                <u>Drag</u> and move using the mouse.
              </li>
              <li>
                <u>Zoom</u> in and out using the mouse wheel.
              </li>
              <li>
                Hover over nodes to <u>focus</u> on them. Hover over endpoints
                and move to <u>focus</u> on edges.
              </li>
              <li>
                Click nodes and edges to <u>view properties</u>.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Legend</h3>
            <ol className="list-decimal ml-4">
              <li>View legend on the top right of the canvas.</li>
              <li>
                Click color box to <u>change node and edge colors</u>.
              </li>
              <li>
                With properties prefetch enabled: click color box to{" "}
                <u>update label format string</u>. Example:{" "}
                <pre className="font-mono">{"ID-{id} Name: {name}"}</pre>
              </li>
              <li>
                Click label text to{" "}
                <u>toggle node or edge visibility by label</u>.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Menu</h3>
            <ol className="list-decimal ml-4">
              <li>
                Right-click empty canvas space to <u>open context menu</u>.
              </li>
              <li>
                <u>Reset View</u>: move view to origin.
              </li>
              <li>
                <u>Refresh Layout</u>: rerun layout algorithm.
              </li>
              <li>
                <u>Full Screen</u>: toggle canvas to fullscreen.
              </li>
              <li>
                <u>Prefetch Props and Enable Search</u>: prefetch node and edge
                properties, enable search and custom labels.
              </li>
              <li>
                <u>Scale to Fit</u>: zoom canvas to fit content when possible.
              </li>
              <li>
                <u>Toggle Labels</u>: show/hide node and edge labels.
              </li>
              <li>
                <u>Toggle Grid</u>: show/hide canvas grid.
              </li>
              <li>
                <u>Prune Unconnected Nodes</u>: remove nodes without edges.
              </li>
              <li>
                <u>Export as Image</u>: export and download current canvas as an
                image.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Actions</h3>
            <ol className="list-decimal ml-4">
              <li>
                Right-click a node to <u>open actions menu</u>.
              </li>
              <li>
                <u>Center</u>: center view on the node.
              </li>
              <li>
                <u>Query & View Properties</u>: view node properties.
              </li>
              <li>
                <u>Expand with Edge Label</u>: run query to expand one hop from
                selected node.
              </li>
              <li>
                <u>Expand with All Edge Labels</u>: expand one hop from selected
                node without filters.
              </li>
              <li>
                <u>Remove Node</u>: remove selected node.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Search</h3>
            <ol className="list-decimal ml-4">
              <li>
                <u>Search</u> available after enabling properties prefetch in
                right-click menu.
              </li>
              <li>
                Prefetching may take time with many nodes or edges. Progress bar
                shown at the bottom.
              </li>
              <li>
                Type in search box at top left of canvas. Example:{" "}
                <pre className="font-mono">{"id=LAX"}</pre>
              </li>
              <li>Matched nodes and edges will be highlighted on canvas.</li>
              <li>
                If only one node matches, canvas view will center on that node.
              </li>
              <li>
                <u>Custom label format</u> available only when properties
                prefetch is enabled.
              </li>
            </ol>

            <h3 className="font-semibold mt-2">Browser Local Storage</h3>
            <ol className="list-decimal ml-4">
              <li>
                Browser local storage stores query history and user preferences
                (up to 5MiB for most browsers).
              </li>
              <li>
                Stored query history: <u>all queries</u> (without results to
                save space).
              </li>
              <li>
                Stored user preferences: <u>color selection</u> and{" "}
                <u>custom label format</u>.
              </li>
              <li>
                Stored user preferences: <u>node expansion query filter</u> for
                each node label.
              </li>
            </ol>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HelpButton;
