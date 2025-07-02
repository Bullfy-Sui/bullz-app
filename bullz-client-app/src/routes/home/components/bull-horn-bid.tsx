import { HornForm } from "@/routes/home";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext, useWatch } from "react-hook-form";
import PlusMinusButton from "./plus-minus.button";

const BullHornBid = () => {
  const formContext = useFormContext<HornForm>();
  
  // Predefined options
  const bidAmounts = [1, 3, 5]; // SUI amounts
  const timeFrames = [1, 5, 15]; // Minutes
  
  // Watch current values
  const currentBidAmount = useWatch({
    control: formContext.control,
    name: "wager_amount",
  });
  
  const currentTimeLimit = useWatch({
    control: formContext.control,
    name: "time_limit",
  });
  
  // Helper functions to cycle through options
  const cycleBidAmount = (direction: 'up' | 'down') => {
    const currentIndex = bidAmounts.indexOf(currentBidAmount);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = currentIndex < bidAmounts.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : bidAmounts.length - 1;
    }
    
    formContext.setValue("wager_amount", bidAmounts[newIndex]);
  };
  
  const cycleTimeFrame = (direction: 'up' | 'down') => {
    // Convert current time limit from seconds to minutes for comparison
    const currentTimeInMinutes = Math.round(currentTimeLimit / 60);
    const currentIndex = timeFrames.indexOf(currentTimeInMinutes);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = currentIndex < timeFrames.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : timeFrames.length - 1;
    }
    
    // Convert back to seconds for storage
    formContext.setValue("time_limit", timeFrames[newIndex] * 60);
  };

  return (
    <div>
      <p className="text-center text-gray-300 font-[700] font-offbit text-[1.0625rem] leading-[100%] tracking-[0.04em] my-[1rem]">
        SET AN AMOUNT AND TIME TO START PLAYING. WE'LL FIND SOMEONE YOU CAN LOCK
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
            <PlusMinusButton 
              type="negative" 
              onClick={() => cycleBidAmount('down')} 
            />
            <div className="w-[5rem] h-[2.5rem] bg-gray-900 flex items-center justify-center">
              <span className="font-offbit font-[700] tracking-[0.04em] text-[1.0625rem] leading-[100%] text-white">
                {currentBidAmount} SUI
              </span>
            </div>
            <PlusMinusButton 
              type="positive" 
              onClick={() => cycleBidAmount('up')} 
            />
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-gray-850 h-[2.5rem] px-[0.75rem] flex items-center flex-1">
            <span className="text-gray-300 text-[1.0625rem] font-[700] font-offbit">
              SET TIME
            </span>
          </div>
          <div className="flex items-center w-[10rem]">
            <PlusMinusButton 
              type="negative" 
              onClick={() => cycleTimeFrame('down')} 
            />
            <div className="w-[5rem] h-[2.5rem] bg-gray-900 flex items-center justify-center">
              <span className="font-offbit font-[700] tracking-[0.04em] text-[1.0625rem] leading-[100%] text-white">
                {Math.round(currentTimeLimit / 60)}m
              </span>
            </div>
            <PlusMinusButton 
              type="positive" 
              onClick={() => cycleTimeFrame('up')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BullHornBid;
