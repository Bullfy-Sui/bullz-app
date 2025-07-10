import SuiLogo from "@/components/svg/sui.logo";
import { IPlayer } from "../types";
import { useState, useEffect } from "react";

const Player = ({
  player,
  multiplier,
  onClick,
}: {
  player: IPlayer;
  multiplier: number;
  onClick: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const handleImageError = () => {
    console.log(`❌ Player image failed to load for ${player.name}:`, {
      imageUrl: player.imageUrl,
      name: player.name,
      token_price_id: player.token_price_id
    });
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    console.log(`✅ Player image loaded successfully for ${player.name}:`, player.imageUrl);
    setImageError(false);
    setImageLoading(false);
  };
  
  // Reset states when imageUrl changes
  useEffect(() => {
    if (player.imageUrl) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
  }, [player.imageUrl]);
  
  const showFallback = !player.imageUrl || imageError;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="border-[0.5px] mb-[-1.25rem] z-10 border-gray-300 w-[3.1875rem] text-center rounded-full font-offbit text-black font-[700] leading-[100%] tracking-[0.04em] bg-white p-[0.5rem] h-[1.75rem] flex items-center justify-center">
        {multiplier}x
      </div>
      <div
        className="w-[5.5rem] h-[5.5rem] rounded-full border-[4.4px] border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-gray-700"
        onClick={onClick}
      >
        {!showFallback && (
          <>
            <img 
              src={player.imageUrl} 
              alt={player.name}
              className="w-[88px] h-[88px] rounded-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
            {imageLoading && (
              <div className="w-[88px] h-[88px] rounded-full bg-gray-600 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
        {showFallback && (
          <div className="w-[88px] h-[88px] rounded-full bg-gray-600 flex items-center justify-center">
            <SuiLogo 
              width={60} 
              height={60} 
              className="rounded-full" 
            />
          </div>
        )}
      </div>

      <div className="w-full h-[1.9375rem] bg-white rounded-full flex items-center justify-center -mt-[1.5rem]">
        <span className="text-black w-full text-[1.375rem] font-[700] font-offbit leading-[100%] tracking-[0.04em] text-center">
          {player.name}
        </span>
      </div>
    </div>
  );
};

export default Player;
