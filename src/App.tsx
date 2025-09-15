import { useState } from "react";
import "./styles/lcgLinear.css"; // estilos compartidos

import LcgLinear from "./components/lcg/LcgLinear";
import LcgMultiplicative from "./components/lcg/LcgMultiplicative";

type Tab = "lineal" | "multiplicativo";

export default function App() {
  const [tab, setTab] = useState<Tab>("lineal");

  return (
    <div className="app-shell">
      <h1 className="app-title">Generadores Congruenciales</h1>

      <div className="tabs">
        <button
          className={`tab ${tab === "lineal" ? "active" : ""}`}
          onClick={() => setTab("lineal")}
        >
          Lineal (LCG)
        </button>
        <button
          className={`tab ${tab === "multiplicativo" ? "active" : ""}`}
          onClick={() => setTab("multiplicativo")}
        >
          Multiplicativo (LCG)
        </button>
      </div>

      <div className="tab-panel">
        {tab === "lineal" ? <LcgLinear /> : <LcgMultiplicative />}
      </div>
    </div>
  );
}
