import InferencePanel from "./InferencePanel";

type InferencePanelWrapperProps = {
  data: any;
  symbol: string;
  timeframe: string;
};

export default function InferencePanelWrapper({
  data,
  symbol,
  timeframe,
}: InferencePanelWrapperProps) {
  if (!data) return null;

  return (
    <div className="absolute right-4 bottom-4 z-50 w-72">
      <InferencePanel engineData={data} symbol={symbol} timeframe={timeframe} />
    </div>
  );
}
