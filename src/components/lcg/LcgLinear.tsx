import { useState } from "react";
import "../../styles/lcgLinear.css";

type Row = {
    i: number;
    xi: number;
    op: string;
    result: number;
    r: number;
};

const HARD_CAP_ROWS = 8192;

function gcd(a: number, b: number): number {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a;
}
function isNonNegIntStr(s: string): boolean { return /^\d+$/.test(s); }
function toInt(s: string): number { return parseInt(s, 10); }
function isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n % 2 === 0) return n === 2;
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
    return true;
}

export default function LcgLinear() {
    const [seedStr, setSeedStr] = useState<string>("");
    const [kStr, setKStr] = useState<string>("");
    const [cStr, setCStr] = useState<string>("");
    const [pStr, setPStr] = useState<string>("");
    const [dStr, setDStr] = useState<string>("");
    const [a, setA] = useState<number | null>(null);
    const [g, setG] = useState<number | null>(null);
    const [m, setM] = useState<number | null>(null);
    const [c, setC] = useState<number | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [note, setNote] = useState<string>("");
    const [errors, setErrors] = useState<string[]>([]);

    function handleGenerate() {
        const errs: string[] = [];

        if (!seedStr.length || !isNonNegIntStr(seedStr))
            errs.push("Semilla (X₀) debe ser entero no negativo.");
        if (!kStr.length || !isNonNegIntStr(kStr))
            errs.push("k debe ser entero no negativo.");
        if (!cStr.length || !isNonNegIntStr(cStr))
            errs.push("c debe ser entero no negativo.");
        if (!pStr.length || !isNonNegIntStr(pStr) || toInt(pStr) <= 0)
            errs.push("p debe ser entero positivo (> 0).");
        if (!dStr.length || !isNonNegIntStr(dStr))
            errs.push("D (decimales) debe ser entero no negativo.");
        else if (toInt(dStr) > 12)
            errs.push("D máximo permitido: 12.");

        if (errs.length) { setErrors(errs); return; }

        const seed = toInt(seedStr);
        const k = toInt(kStr);
        const cIn = toInt(cStr);
        const p = toInt(pStr);
        const D = toInt(dStr);

        if (p > HARD_CAP_ROWS) {
            setErrors([`Para no colapsar la UI, usa p ≤ ${HARD_CAP_ROWS}.`]);
            return;
        }

        if (cIn < 2 || !isPrime(cIn)) {
            setErrors(["c debe ser primo y ≥ 2."]);
            return;
        }

        const g_ = Math.ceil(Math.log(p) / Math.LN2);
        const m_ = 2 ** g_;
        const a_ = 1 + 4 * k;

        if (gcd(cIn, m_) !== 1) {
            setErrors([`c debe ser coprimo con m (= ${m_}). Para m = 2^g, usa un primo impar (c ≠ 2).`]);
            return;
        }

        let x = ((seed % m_) + m_) % m_;

        const out: Row[] = [];
        const toGenerate = Math.min(p, HARD_CAP_ROWS) + 1; // p + 1 siempre
        for (let i = 1; i <= toGenerate; i++) {
            const op = `(${a_} * ${x} + ${cIn}) MOD(${m_})`;
            const xNext = (a_ * x + cIn) % m_;
            const r = (m_ > 1) ? xNext / (m_ - 1) : 0;
            out.push({ i, xi: x, op, result: xNext, r });
            x = xNext;
        }

        setErrors([]);
        setA(a_); setG(g_); setM(m_); setC(cIn);
        setRows(out);
        setNote(`D = ${D} decimales. Validado: X₀,k,p enteros (p>0); c primo≥2 y coprimo con m; g entero.`);
    }

    function handleClear() {
        setSeedStr(""); setKStr(""); setCStr(""); setPStr(""); setDStr("");
        setA(null); setG(null); setM(null); setC(null);
        setRows([]); setNote(""); setErrors([]);
    }

    const decimals = dStr && isNonNegIntStr(dStr) ? toInt(dStr) : 0;

    return (
        <div className="container">
            <h2 style={{ marginBottom: 10 }}>Algoritmo Lineal (LCG)</h2>

            <div className="inputs">
                <label>Semilla (X₀)
                    <input className="input" type="text" inputMode="numeric" value={seedStr}
                        onChange={e => setSeedStr(e.target.value)} />
                </label>
                <label>k
                    <input className="input" type="text" inputMode="numeric" value={kStr}
                        onChange={e => setKStr(e.target.value)} />
                </label>
                <label>c (primo ≥ 2)
                    <input className="input" type="text" inputMode="numeric" value={cStr}
                        onChange={e => setCStr(e.target.value)} />
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

            {(a !== null || m !== null) && rows.length > 0 && (
                <>
                    <div className="summary">
                        a: <strong>{a}</strong>; c: <strong>{c}</strong>
                        &nbsp;&nbsp; g: <strong>{g}</strong>; m: <strong>{m}</strong>
                    </div>

                    {note && <p style={{ color: "#8a6d1d", margin: "8px 0" }}>ℹ️ {note}</p>}

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Xᵢ</th>
                                    <th>Operación</th>
                                    <th>Resultado</th>
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
