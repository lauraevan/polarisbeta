export function LiteHome() {
  return (
    <div className="relative flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
      <h1
        className="select-none text-center font-black tracking-tight"
        style={{
          fontSize: "clamp(64px, 14vw, 180px)",
          color: "#3aa0ff",
          textShadow:
            "0 0 30px rgba(58,160,255,0.55), 0 0 80px rgba(58,160,255,0.35), 0 0 140px rgba(58,160,255,0.25)",
          letterSpacing: "-0.02em",
        }}
      >
        T9 LITE
      </h1>
    </div>
  );
}
