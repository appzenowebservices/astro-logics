import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
const path = window.location.pathname.replace(/\/+$/, "");

const fail = (label) => (err) => {
  root.render(
    <div style={{ color: "#fb7185", padding: 24, fontFamily: "monospace" }}>
      Failed to load {label}: {String(err?.message ?? err)}
    </div>
  );
};

// Four routes, each code-split so a page only pays for its own layers:
//   /            → Remotion showcase landing page
//   /simulation  → the Mithuna console (three.js world + agents)
//   /ar-feature  → camera passthrough AR experience
//   /world       → standalone 3D view: voxel street + sprite character
if (path === "/ar-feature") {
  import("../ar/ArFeatureApp.jsx")
    .then(({ ArFeatureApp }) => root.render(<ArFeatureApp />))
    .catch(fail("AR feature"));
} else if (path === "/world") {
  import("../world3d/WorldPage.jsx")
    .then(({ WorldPage }) => root.render(<WorldPage />))
    .catch(fail("the world view"));
} else if (path === "/simulation") {
  import("./App.jsx")
    .then(({ default: App }) => root.render(<App />))
    .catch(fail("the console"));
} else {
  import("../landing/LandingPage.jsx")
    .then(({ LandingPage }) => root.render(<LandingPage />))
    .catch(fail("the landing page"));
}
