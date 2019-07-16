import { h, render } from "preact";
import { useRef, useEffect, useReducer, useState } from "preact/hooks";

import { useKeyPress } from "./hooks/useKeyPress";
import { Frame } from "./icons/Frame";
import { Component } from "./icons/Component";
import {
  useStoreReducer,
  filterItemsSelector,
  Item,
  modeSelector
} from "./hooks/useStoreReducer";

import "./figma-ui.min.css";

// send the selected item to Figma
const postItem = (item: Item | undefined) => {
  if (item) {
    parent.postMessage(
      {
        pluginMessage: { type: "select", id: item.id }
      },
      "*"
    );
  }
};

const App = () => {
  const [store, dispatch] = useStoreReducer();

  const downPressed = useKeyPress("ArrowDown");
  const upPressed = useKeyPress("ArrowUp");
  const enterPressed = useKeyPress("Enter");
  const ctrlPressed = useKeyPress("Control");
  const nPressed = useKeyPress("n");
  const pPressed = useKeyPress("p");

  const items = filterItemsSelector(store);

  useEffect(() => {
    if (downPressed || (ctrlPressed && nPressed)) {
      dispatch({ type: "NEXT" });
    }

    if (upPressed || (ctrlPressed && pPressed)) {
      dispatch({ type: "PREV" });
    }

    if (enterPressed) {
      const item = items[store.selected];
      postItem(item);
    }
  }, [downPressed, upPressed, enterPressed, ctrlPressed, nPressed, pPressed]);

  const input = useRef(null);
  useEffect(() => {
    input.current.focus();
  }, []);

  useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: { type: "FETCH_FRAMES" }
      },
      "*"
    );
    onmessage = event => {
      const message = event.data.pluginMessage;
      if (message) {
        if (message.type === "FRAME") {
          dispatch({ type: "SET_ITEMS", items: message.data });
          parent.postMessage(
            {
              pluginMessage: { type: "FETCH_COMPONENTS" }
            },
            "*"
          );
        }

        if (message.type === "COMPONENT") {
          dispatch({ type: "SET_ITEMS", items: message.data });
        }
      }
    };
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <input
        ref={input}
        className="input"
        style={{ marginBottom: 8 }}
        type="text"
        placeholder="Jump to a Frame in your current page"
        onInput={(e: any) =>
          dispatch({ type: "INPUT_SEARCH", value: e.target.value })
        }
      />
      {modeSelector(store) === "insert" && (
        <div className="type--12-pos">Insert Components</div>
      )}
      {store.loading ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="type--12-pos">loading...</div>
        </div>
      ) : (
        <div style={{ overflow: "auto" }}>
          {items.map((v, i) => {
            const style =
              store.selected === i
                ? { backgroundColor: "rgba(24, 160, 251, 0.3)" }
                : {};
            return (
              <div
                className="type--12-pos"
                style={{
                  ...style,
                  ...{ padding: 8, cursor: "pointer", display: "flex" }
                }}
                key={i}
                onMouseEnter={() => dispatch({ type: "GO_TO", index: i })}
                onClick={() => postItem(items[i])}
              >
                {v.type === "COMPONENT" ? <Component /> : <Frame />}
                <div style={{ margin: "0 8px" }}>{v.name}</div>
                <div style={{ color: "rgba(0, 0, 0, 0.3)" }}>{v.page}</div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="type--11-pos" style={{ padding: "0 8px" }}>
              No result found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

render(<App />, document.getElementById("app"));
