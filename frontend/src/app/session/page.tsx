"use client";

import TitleBar from "@/components/general/title-bar";
import DefaultDp from "@/components/svg/default-dp";
import DefaultPlayerDp from "@/components/svg/default-player-dp";
import { useAppStore } from "@/lib/store/app-store";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#FF5252",
  },
  mobile: {
    label: "Mobile",
    color: "#57BC76",
  },
} satisfies ChartConfig;

const SessionPage = () => {
  const { address } = useAppStore();
  return (
    <>
      <TitleBar title="Session" onClick={() => {}} />
      <div className="w-full flex justify-between items-center mb-[4.6225rem]">
        <div>
          <DefaultPlayerDp />
          <span className="text-[0.625rem] block leading-[150%] font-[600] w-[4rem] truncate">
            {address}
          </span>
        </div>
        <div>
          <DefaultDp />
          <span className="text-[0.625rem] block leading-[150%] font-[600] w-[4rem] truncate">
            {address}
          </span>
        </div>
      </div>
      <ChartContainer config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="desktop"
            type="monotone"
            stroke="#FF5252"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="mobile"
            type="monotone"
            stroke="#57BC76"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </>
  );
};

export default SessionPage;
