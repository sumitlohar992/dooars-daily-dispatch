export function HomeWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <img
        src="/watermark.png"
        alt=""
        className="h-full w-full object-cover object-center opacity-[0.8] "
      />
      <div className="from-background/70 via-background/40 to-background/80 absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}
