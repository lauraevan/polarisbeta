export function LiteHome() {
  return (
    <div className="relative flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
      <h1
        className="select-none text-center font-black tracking-tight"
        style={{
          fontSize: "clamp(56px, 13vw, 170px)",
          backgroundImage:
            "linear-gradient(135deg, #ffb347 0%, #ff7a59 40%, #ff4d8d 75%, #c84bd8 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 60px rgba(255,122,89,0.35), 0 0 120px rgba(255,77,141,0.25)",
          letterSpacing: "-0.02em",
        }}
      >
        POLARIS LITE
      </h1>
    </div>
  );
}
