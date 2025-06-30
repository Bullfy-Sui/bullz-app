import { HornForm } from "@/routes/home";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import PlusMinusButton from "./plus-minus.button";

const BullHornBid = () => {
  const formContext = useFormContext<HornForm>();
  return (
    <div>
      <p className="text-center text-gray-300 font-[700] font-offbit text-[1.0625rem] leading-[100%] tracking-[0.04em] my-[1rem]">
        SET AN AMOUNT AND TIME TO START PLAYING. WE’LL FIND SOMEONE YOU CAN LOCK
        HORNS WITH.
      </p>

      <div className="space-y-[1rem]">
        <div className="flex items-center">
          <div className="bg-gray-850 h-[2.5rem] px-[0.75rem] flex items-center flex-1">
            <span className="text-gray-300 text-[1.0625rem] font-[700] font-offbit">
              SET AMOUNT
            </span>
          </div>
          <div className="flex items-center w-[10rem]">
            <PlusMinusButton type="negative" onClick={() => {}} />
            <FormField
              name="wager_amount"
              control={formContext.control}
              render={({ field }) => (
                <FormItem className="w-[5rem]">
                  <FormControl>
                    <Input
                      placeholder="1.00"
                      className="border-none text-center rounded-none w-full bg-gray-900 font-offbit font-[700] tracking-[0.04em] text-[1.0625rem] leading-[100%] uppercase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PlusMinusButton type="positive" onClick={() => {}} />
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-gray-850 h-[2.5rem] px-[0.75rem] flex items-center flex-1">
            <span className="text-gray-300 text-[1.0625rem] font-[700] font-offbit">
              SET TIME
            </span>
          </div>
          <div className="flex items-center w-[10rem]">
            <PlusMinusButton type="negative" onClick={() => {}} />
            <FormField
              name="time_limit"
              control={formContext.control}
              render={({ field }) => (
                <FormItem className="w-[5rem]">
                  <FormControl>
                    <Input
                      placeholder="60s"
                      // type="number"
                      className="border-none text-center rounded-none w-full bg-gray-900 font-offbit font-[700] tracking-[0.04em] text-[1.0625rem] leading-[100%]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PlusMinusButton type="positive" onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BullHornBid;
