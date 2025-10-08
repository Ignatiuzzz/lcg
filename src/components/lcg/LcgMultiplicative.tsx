import { useState } from "react";
import "../../styles/lcgLinear.css";

type Row = {
    i: number;
    xi: number;
    op: string;
    result: number; // X_{i+1}
    r: number;      // r_i = X_i/(m-1)
};

const HARD_CAP_ROWS = 8192;

function isNonNegIntStr(s: string): boolean { return /^\d+$/.test(s); }
function toInt(s: string): number { return parseInt(s, 10); }

type AOpt = "3+8k" | "5+8k";

export default function LcgMultiplicative() {
    const [seedStr, setSeedStr] = useState<string>("");
    const [kStr, setKStr] = useState<string>("");
    const [aOpt, setAOpt] = useState<AOpt>("3+8k");
    const [pStr, setPStr] = useState<string>("");
    const [dStr, setDStr] = useState<string>("");

    const [a, setA] = useState<number | null>(null);
    const [g, setG] = useState<number | null>(null);
    const [m, setM] = useState<number | null>(null);
    const [N, setN] = useState<number | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [cycleTruncated, setCycleTruncated] = useState<boolean>(false);

    function handleGenerate() {
        const errs: string[] = [];

        if (!seedStr.length || !isNonNegIntStr(seedStr)) errs.push("Semilla (X₀) debe ser entero no negativo.");
        if (!kStr.length || !isNonNegIntStr(kStr)) errs.push("k debe ser entero no negativo.");
        if (!pStr.length || !isNonNegIntStr(pStr) || toInt(pStr) <= 0)
            errs.push("p debe ser entero positivo (> 0).");
        if (!dStr.length || !isNonNegIntStr(dStr))
            errs.push("D (decimales) debe ser entero no negativo.");
        else if (toInt(dStr) > 12)
            errs.push("D máximo permitido: 12.");

        if (errs.length) { setErrors(errs); return; }

        const X0 = toInt(seedStr);
        const k = toInt(kStr);
        const p = toInt(pStr);

        if (p > HARD_CAP_ROWS) { setErrors([`Usa p ≤ ${HARD_CAP_ROWS}.`]); return; }
        if (X0 <= 0 || X0 % 2 === 0) { setErrors(["La semilla X₀ debe ser impar y mayor que 0"]); return; }

        // Elegimos g en función de p, pero AHORA completamos hasta N+1 para ver el cierre del ciclo.
        const g_ = Math.ceil(Math.log2(p)) + 2;  // => N = 2^(g-2) >= p
        const m_ = 2 ** g_;
        const a_ = (aOpt === "3+8k") ? (3 + 8 * k) : (5 + 8 * k);
        const N_ = 2 ** (g_ - 2);                // período máximo

        let x = ((X0 % m_) + m_) % m_;
        const xStart = x;

        // Ahora generamos hasta cerrar el primer ciclo: toGenerate = max(p, N) + 1
        // (capado por HARD_CAP_ROWS). Así garantizamos que X_{N+1} = X_0 se vea en la tabla.
        const desired = Math.min(p, HARD_CAP_ROWS);
        let toGenerate = Math.max(desired, N_) + 1;
        let truncated = false;
        if (toGenerate > HARD_CAP_ROWS) {
            toGenerate = HARD_CAP_ROWS;
            truncated = true;
        }

        const out: Row[] = [];
        for (let i = 1; i <= toGenerate; i++) {
            const op = `(${a_} * ${x}) MOD(${m_})`;
            const xNext = (a_ * x) % m_;
            const r = (m_ > 1) ? x / (m_ - 1) : 0; // r_i = X_i/(m-1)
            out.push({ i, xi: x, op, result: xNext, r });
            x = xNext;
        }

        // Info al usuario
        setCycleTruncated(truncated);
        setErrors([]);
        setA(a_); setG(g_); setM(m_); setN(N_);
        setRows(out);
    }

    function handleClear() {
        setSeedStr(""); setKStr(""); setPStr(""); setDStr("");
        setA(null); setG(null); setM(null); setN(null);
        setRows([]); setErrors([]); setCycleTruncated(false);
    }

    const decimals = dStr && isNonNegIntStr(dStr) ? toInt(dStr) : 0;

    return (
        <div className="container">
            <h2 style={{ marginBottom: 10 }}>Algoritmo Congruencial Multiplicativo</h2>

            <div className="inputs">
                <label>Semilla (X₀) impar &gt; 0
                    <input className="input" type="text" inputMode="numeric" value={seedStr}
                        onChange={e => setSeedStr(e.target.value)} />
                </label>

                <label>c (fijo)
                    <input className="input" type="text" value="0" readOnly />
                </label>

                <label>k
                    <input className="input" type="text" inputMode="numeric" value={kStr}
                        onChange={e => setKStr(e.target.value)} />
                </label>

                <label>Opción de a
                    <select
                        className="input"
                        value={aOpt}
                        onChange={e => setAOpt(e.target.value as AOpt)}
                    >
                        <option value="3+8k">a = 3 + 8k</option>
                        <option value="5+8k">a = 5 + 8k</option>
                    </select>
                </label>

                <label>p (cantidad a generar)
                    <input className="input" type="text" inputMode="numeric" value={pStr}
                        onChange={e => setPStr(e.target.value)} />
                </label>

                <label>D (decimales)
                    <input className="input" type="text" inputMode="numeric" value={dStr}
                        onChange={e => setDStr(e.target.value)} />
                </label>
            </div>

            <div className="actions">
                <button onClick={handleGenerate} className="btn btn-primary">Generar</button>
                <button onClick={handleClear} className="btn btn-danger">Limpiar</button>
            </div>

            {errors.length > 0 && <div className="error">{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>}

            {rows.length > 0 && a !== null && g !== null && m !== null && N !== null && (
                <>
                    <div className="summary">
                        a: <strong>{a}</strong>
                        &nbsp;&nbsp; g: <strong>{g}</strong>
                        &nbsp;&nbsp; m: <strong>{m}</strong>
                        &nbsp;&nbsp; N (período máx): <strong>{N}</strong>
                    </div>
                    <div style={{ marginTop: 6 }}>
                        <span className="badge">Se pidió p = {toInt(pStr)}</span>
                        <span className="badge">Se completa hasta cerrar ciclo: N + 1 = {N + 1}</span>
                        <span className="badge">D = {decimals} decimales</span>
                        {cycleTruncated && (
                            <span className="badge" style={{ background: "#b33" }}>
                                Ciclo truncado por límite de {HARD_CAP_ROWS} filas
                            </span>
                        )}
                    </div>

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Xᵢ</th>
                                    <th>Operación</th>
                                    <th>Resultado (Xᵢ₊₁)</th>
                                    <th>rᵢ = Xᵢ/(m−1)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.i}>
                                        <td>{r.i}</td>
                                        <td>{r.xi}</td>
                                        <td style={{ fontFamily: "monospace" }}>{r.op}</td>
                                        <td>{r.result}</td>
                                        <td>{r.r.toFixed(decimals)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
