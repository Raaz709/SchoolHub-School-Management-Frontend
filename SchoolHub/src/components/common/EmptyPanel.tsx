type EmptyPanelProps = {
  message: string;
};

export function EmptyPanel({ message }: EmptyPanelProps) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-20 text-center">
      <p className="text-[13.5px] text-ink-500">{message}</p>
    </div>
  );
}