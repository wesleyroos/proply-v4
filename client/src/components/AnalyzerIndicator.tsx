import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AnalyzerIndicator() {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger>
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">Data from analyzer engine</p>
      </TooltipContent>
    </Tooltip>
  );
}
