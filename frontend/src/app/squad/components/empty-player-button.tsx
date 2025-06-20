import PlusIcon from "@/components/icons/plus.icon";

interface Props {
  onClick: (pos: number) => void;
  multiplier: number;
  pos: number;
}

const EmptyPlayerButton = (props: Props) => {
  return (
    <div className="flex flex-col-reverse items-center justify-center ">
      <div
        key={props.pos}
        style={{
          boxShadow:
            "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset, 0px 12px 20px 0px #00000066",
        }}
        className="w-[5.5rem] h-[5.5rem] rounded-full bg-white cursor-pointer border-[4.4px] border-gray-100 flex items-center justify-center "
        onClick={() => props.onClick && props.onClick(props.pos)}
      >
        <PlusIcon color="#474766" />
      </div>

      <div className="border-[0.5px] mb-[-1.25rem] border-modal-desc w-[3.1875rem] text-center rounded-full offbit-font text-black font-[700] leading-[100%] tracking-[0.04em] bg-white p-[0.5rem] h-[1.75rem] flex items-center justify-center">
        {props.multiplier}x
      </div>
    </div>
  );
};

export default EmptyPlayerButton;
