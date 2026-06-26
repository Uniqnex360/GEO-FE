import { useState } from "react";

type Log = {
  color: string;
  message: string;
};

export default function AISandbox() {

  const [productName, setProductName] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLogs([]);
    setResult("");
    setLoading(true);

    const response = await fetch("http://localhost:8000/api/v1/ai_sandbox/generate/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: productName,
      }),
    });

    if (!response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const event = JSON.parse(line);

        if (event.type === "status") {
          setLogs((prev) => [...prev, event]);
        }

        if (event.type === "result") {
          setResult(event.content);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>GEO Generator</h2>

      <input
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="Product name"
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
        }}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <hr />

      <h3>Status</h3>

      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            color: log.color,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading && index === logs.length - 1 ? "⏳" : "✔"} {log.message}
        </div>
      ))}

      {result && (
        <>
          <hr />
          <h3>AI Response</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 6,
            }}
          >
            {result}
          </pre>
        </>
      )}
    </div>
  );
}
